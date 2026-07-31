// ===== ADVENTURE AREAS =====
function renderAreas(){
  const grid=document.getElementById('areaGrid');
  if(!grid) return;
  grid.innerHTML='';
  AREAS.forEach((a,i)=>{
    const unlocked=G.realm>=a.minRealm || i<=G.currentArea;
    const active=i===G.currentArea;
    const div=document.createElement('div');
    div.className='area-card'+(active?' active':'')+(unlocked?'':' locked');
    div.innerHTML=`<div class="area-name">${a.emoji} ${a.name}</div>
      <div class="area-info">${a.desc} • Cần ${REALMS[Math.min(a.minRealm,MAX_REALM)].name}</div>`;
    if(unlocked) div.onclick=()=>{ G.currentArea=i; updateUI(); };
    grid.appendChild(div);
  });
}

function getCurrentArea(){ return AREAS[Math.min(G.currentArea, AREAS.length-1)]; }

// ===== HUNTING =====
function huntMonster(){
  try{
    const now=Date.now();
    if(now - G.huntHourTimestamp > 3600000){
      G.huntCountThisHour=0;
      G.huntHourTimestamp=now;
    }

    const area=getCurrentArea();
    let exp=area.expBase;

    // Skill bonus
    const sk=getEquippedSkill();
    if(sk && sk.bonusExp && now>G.skillCooldown)
      exp=Math.round(exp*(1+sk.bonusExp));
    else if(sk && sk.bonusAll && now>G.skillCooldown)
      exp=Math.round(exp*(1+sk.bonusAll));

    // Diminishing returns
    const dim=Math.pow(0.9, G.huntCountThisHour);
    exp=Math.round(exp*dim);
    if(exp<1) exp=1;

    let stone=area.stoneBase;
    if(sk && sk.bonusStone && now>G.skillCooldown)
      stone=Math.round(stone*(1+sk.bonusStone));
    else if(sk && sk.bonusAll && now>G.skillCooldown)
      stone=Math.round(stone*(1+sk.bonusAll));

    // Passive stone bonus
    if(hasPassive('passiveStone')) stone=Math.round(stone*1.15);
    if(stone<1) stone=1;

    let petBonus=0;
    if(G.petLevel>0) petBonus=Math.round(exp*0.2);

    G.totalHunts++;
    G.huntCountThisHour++;
    G.spiritStones+=stone;

    // Loot
    let lootChance=area.lootChance;
    if(sk && sk.bonusLoot && now>G.skillCooldown) lootChance*=2;
    else if(sk && sk.bonusAll && now>G.skillCooldown) lootChance*=3;
    let lootMsg='';
    if(Math.random()<lootChance){
      const item=LOOT_ITEMS[Math.floor(Math.random()*LOOT_ITEMS.length)];
      G.inventory[item.id]=(G.inventory[item.id]||0)+1;
      lootMsg=` 📦 +1 ${item.name}`;
    }

    // Herb find
    if(Math.random()<0.08){
      const h=1+Math.floor(Math.random()*3);
      G.herbs+=h;
      lootMsg+=` 🌿+${h} dược`;
    }

    addAnnounce(`⚔️ Săn ${area.name}! +${exp} EXP +${stone}💎${lootMsg}`+(petBonus?` 🐉+${petBonus}`:''),'info');
    addExp(exp+petBonus);

    // Skill cooldown
    if(sk && (sk.bonusExp||sk.bonusStone||sk.bonusLoot||sk.bonusAll) && now>G.skillCooldown)
      G.skillCooldown = now + sk.cd*1000;

    updateUI();
  }catch(e){
    console.error('huntMonster error:',e);
  }
}

// ===== BOSS =====
function getCurrentBoss(){
  const a=getCurrentArea();
  if(G.bossDefeated.includes(G.currentArea)) return null;
  return {
    name:a.bossName,
    maxHp:a.bossHp,
    hp:G.bossHp[G.currentArea] || a.bossHp,
    exp:a.bossExp,
    stone:a.bossStone
  };
}

function fightBoss(){
  try{
    const now=Date.now();
    if(now - G.lastBossFight < 5000){
      addAnnounce('⏳ Đợi 5s giữa các lần đánh boss!','warning');
      return;
    }

    const boss=getCurrentBoss();
    if(!boss){
      addAnnounce('✅ Boss đã bị đánh bại ở khu này!','success');
      return;
    }
    if(boss.hp<=0){
      addAnnounce('✅ Boss đã chết!','success');
      return;
    }

    G.lastBossFight=now;

    let dmg=10+G.realm*5;
    if(hasPassive('passiveBoss')) dmg=Math.round(dmg*1.15);
    const sk=getEquippedSkill();
    if(sk && sk.bonusAll && now>G.skillCooldown){
      dmg=Math.round(dmg*3);
      G.skillCooldown=now+sk.cd*1000;
    }

    boss.hp -= dmg;
    G.bossHp[G.currentArea] = Math.max(0, boss.hp);

    if(boss.hp <= 0){
      // Won!
      const expReward=boss.exp, stoneReward=boss.stone;
      G.spiritStones+=stoneReward;
      G.bossDefeated.push(G.currentArea);
      const jadeReward=1+Math.floor(Math.random()*5);
      G.jade+=jadeReward;
      addAnnounce(`🏆🎉 ĐÁNH BẠI ${boss.name}! Nhận +${expReward} EXP +${stoneReward}💎 +${jadeReward}🔮!`,'event');
      addExp(expReward);
    }else{
      const hpPct=Math.round(boss.hp/boss.maxHp*100);
      addAnnounce(`⚔️ Đánh ${boss.name}: -${dmg} HP (còn ${hpPct}%)!`,'danger');
    }
    updateUI();
  }catch(e){
    console.error('fightBoss error:',e);
  }
}
