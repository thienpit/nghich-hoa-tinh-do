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
    div.onmouseover=(e)=>showTooltip(e,
      '<div><b>'+a.emoji+' '+a.name+'</b></div>'+
      '<div style="color:#8899b0">'+a.desc+'</div>'+
      (unlocked?'':'<div style="color:#d87a7a">🔒 Cần '+REALMS[Math.min(a.minRealm,MAX_REALM)].name+'</div>')+
      '<div>⚔️ EXP: '+a.expBase+' · 💎 '+a.stoneBase+'/con</div>'+
      '<div>📦 Rơi đồ: '+Math.round(a.lootChance*100)+'%</div>'+
      '<div>🐉 Boss: '+a.bossName+' (HP '+a.bossHp+')</div>'
    );
    div.onmouseout=hideTooltip;
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

    // Path hunt bonus (Ma = x2 EXP & stones)
    const path=getCultivationPath();
    if(path && path.huntBonus && path.huntBonus!==1) exp=Math.round(exp*path.huntBonus);

    // Skill bonus
    const sk=getEquippedSkill();
    const skReady=sk && now>(G.skillCooldowns[sk.id]||0);
    if(sk && sk.bonusExp && skReady)
      exp=Math.round(exp*(1+sk.bonusExp));
    else if(sk && sk.bonusAll && skReady)
      exp=Math.round(exp*(1+sk.bonusAll));

    // Diminishing returns
    const dim=Math.pow(0.9, G.huntCountThisHour);
    exp=Math.round(exp*dim);
    if(exp<1) exp=1;

    let stone=area.stoneBase;
    // Path hunt bonus applies to stones too (Ma = x2)
    if(path && path.huntBonus && path.huntBonus!==1) stone=Math.round(stone*path.huntBonus);
    if(sk && sk.bonusStone && skReady)
      stone=Math.round(stone*(1+sk.bonusStone));
    else if(sk && sk.bonusAll && skReady)
      stone=Math.round(stone*(1+sk.bonusAll));

    // Passive stone bonus
    if(hasPassive('passiveStone')) stone=Math.round(stone*1.15);
    // Equipment stone bonus (Giáp)
    const eqStone=getEquipmentBonus('stoneBonus');
    if(eqStone>0) stone=Math.round(stone*(1+eqStone));
    if(stone<1) stone=1;

    let petBonus=0;
    if(G.petLevel>0) petBonus=Math.round(exp*0.2);

    G.totalHunts++;
    G.huntCountThisHour++;
    G.spiritStones+=stone;

    // Loot
    let lootChance=area.lootChance;
    if(sk && sk.bonusLoot && skReady) lootChance*=2;
    else if(sk && sk.bonusAll && skReady) lootChance*=3;
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

    addBattleLog(`⚔️ Săn ${area.name}! +${exp} EXP +${stone}💎${lootMsg}`+(petBonus?` 🐉+${petBonus}`:''),'win');
    addExp(exp+petBonus);

    // Skill cooldown (per-skill)
    if(sk && (sk.bonusExp||sk.bonusStone||sk.bonusLoot||sk.bonusAll) && skReady)
      G.skillCooldowns[sk.id] = now + sk.cd*1000;

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
    // Path boss bonus (Ma = x3 damage)
    const path=getCultivationPath();
    if(path && path.bossBonus && path.bossBonus!==1) dmg=Math.round(dmg*path.bossBonus);
    if(hasPassive('passiveBoss')) dmg=Math.round(dmg*1.15);
    // Equipment boss damage bonus (Phụ Trang)
    const eqBoss=getEquipmentBonus('bossDmgBonus');
    if(eqBoss>0) dmg=Math.round(dmg*(1+eqBoss));
    const sk=getEquippedSkill();
    const skReady=sk && now>(G.skillCooldowns[sk.id]||0);
    if(sk && sk.bonusAll && skReady){
      dmg=Math.round(dmg*3);
      G.skillCooldowns[sk.id]=now+sk.cd*1000;
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
      addBattleLog(`🏆🎉 ĐÁNH BẠI ${boss.name}! Nhận +${expReward} EXP +${stoneReward}💎 +${jadeReward}🔮!`, 'boss');
      addExp(expReward);
    }else{
      const hpPct=Math.round(boss.hp/boss.maxHp*100);
      addBattleLog(`⚔️ Đánh ${boss.name}: -${dmg} HP (còn ${hpPct}%)!`, 'dmg');
    }
    updateUI();
  }catch(e){
    console.error('fightBoss error:',e);
  }
}

// ===== TOOLTIP ATTACHMENTS (static DOM elements) =====
const _attachCombatTips = () => {
try{
  const attachTip=(sel,getHtml)=>{
    const el=document.querySelector(sel);
    if(!el) return;
    el.onmouseover=(e)=>showTooltip(e,getHtml());
    el.onmouseout=hideTooltip;
  };
  // Boss area
  attachTip('#bossContent',()=>{
    const boss=getCurrentBoss();
    const a=getCurrentArea();
    if(!boss) return '<div><b>✅ Đã đánh bại!</b></div><div style="color:#8899b0">Boss của khu '+a.name+' đã bị tiêu diệt. Chọn khu vực khác để thử thách mới.</div>';
    const hpPct=Math.round(boss.hp/boss.maxHp*100);
    return '<div><b>🐉 '+boss.name+'</b></div>'+
      '<div style="color:#8899b0">Thủ lĩnh khu '+a.name+' — cảnh giới '+REALMS[Math.min(a.minRealm,MAX_REALM)].name+'</div>'+
      '<div>❤️ HP: '+boss.hp+'/'+boss.maxHp+' ('+hpPct+'%)</div>'+
      '<div>⚔️ Phần thưởng: +'+boss.exp+' EXP · +'+boss.stone+'💎 · 🔮 ngẫu nhiên</div>';
  });
  // Hunt button
  attachTip('button[onclick="huntMonster()"]',()=>'<div><b>⚔️ Săn yêu thú</b></div><div style="color:#8899b0">Săn yêu thú ở khu vực đã chọn (+EXP +Linh Thạch)</div><div>📦 Có thể rơi vật phẩm hoặc linh dược</div><div style="color:#7a5a5a">⚠️ Hiệu suất giảm dần khi săn nhiều trong 1 giờ</div>');
}catch(e){ console.error('combat tooltip attach error:',e); }
};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', _attachCombatTips);
else _attachCombatTips();
