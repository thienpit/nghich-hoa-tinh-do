// ===== SKILLS =====
function getEquippedSkill(){
  if(!G.equippedActiveSkill) return null;
  return ACTIVE_SKILLS.find(s=>s.id===G.equippedActiveSkill)||null;
}

function hasPassive(id){ return G.learnedSkills.includes(id); }

function skillCooldownRemaining(){
  if(!G.skillCooldown) return 0;
  return Math.max(0, Math.ceil((G.skillCooldown-Date.now())/1000));
}

function learnSkill(skill){
  const cost=skill.stoneCost||0;
  if(G.learnedSkills.includes(skill.id)) return;
  if(G.spiritStones < cost){
    addAnnounce(`❌ Cần ${cost}💎 để học (bạn có ${G.spiritStones}💎). Hãy đi săn yêu thú!`,'warning');
    return;
  }
  G.spiritStones-=cost;
  G.learnedSkills.push(skill.id);
  addAnnounce(`📜 Học thành công ${skill.name}!`,'success');
  updateUI();
}

function equipSkill(skillId){
  if(!G.learnedSkills.includes(skillId)) return;
  G.equippedActiveSkill = (G.equippedActiveSkill === skillId) ? null : skillId;
  if(G.equippedActiveSkill)
    addAnnounce(`⚔️ Trang bị ${ACTIVE_SKILLS.find(s=>s.id===skillId).name}!`,'info');
  updateUI();
}

function renderSkills(){
  try{
    // Active skills
    const grid=document.getElementById('skillGrid');
    if(!grid) return;
    grid.innerHTML='';
    const now=Date.now();

    ACTIVE_SKILLS.forEach(s=>{
      const owned=G.learnedSkills.includes(s.id);
      const equipped=G.equippedActiveSkill===s.id;
      const unlocked=G.realm>=s.minRealm;
      const onCd=equipped && G.skillCooldown>now;
            const div=document.createElement('div');
            div.className='skill-card'+(equipped?' equipped':'');
            div.style.opacity=unlocked?'1':'0.35';
            div.onmouseover=(e)=>showTooltip(e,s.name+': '+s.desc+' | CD: '+s.cd+'s'+(s.stoneCost?' | Giá: '+s.stoneCost+'💎':''));
            div.onmouseout=hideTooltip;

            let btnHtml;
      if(!owned){
        if(!unlocked){
          btnHtml=`<button class="btn btn-sm btn-outline" disabled>🔒 Cần ${REALMS[s.minRealm].name}</button>`;
        }else{
          const canAfford=G.spiritStones>=s.stoneCost;
          btnHtml=`<button class="btn btn-sm ${canAfford?'btn-primary':'btn-outline'}" onclick="learnSkill(ACTIVE_SKILLS.find(x=>x.id==='${s.id}'))"
            ${canAfford?'':'disabled'}>📜 Học (${s.stoneCost}💎)${canAfford?'':`<span class="insufficient"> — có ${G.spiritStones}💎</span>`}</button>`;
        }
      }else if(equipped && onCd){
        btnHtml=`<button class="btn btn-sm btn-warning" disabled>⏳ Hồi ${skillCooldownRemaining()}s</button>`;
      }else{
        btnHtml=`<button class="btn btn-sm ${equipped?'btn-success':'btn-outline'}" onclick="equipSkill('${s.id}')">${equipped?'✅ Đã trang bị':'🔧 Trang bị'}</button>`;
      }

      div.innerHTML=`<div class="skill-name">${s.name}</div>
        <div class="skill-desc">${s.desc}</div>
        <div class="skill-cd">⏱ CD: ${s.cd}s</div>
        ${btnHtml}`;
      grid.appendChild(div);
    });

    // Passive skills
    const pgrid=document.getElementById('passiveSkillGrid');
    if(!pgrid) return;
    pgrid.innerHTML='';

    PASSIVE_SKILLS.forEach(s=>{
      const owned=G.learnedSkills.includes(s.id);
      const unlocked=G.realm>=s.minRealm;
      const div=document.createElement('div');
      div.className='skill-card'+(owned?' equipped':'');
      div.style.opacity=unlocked?'1':'0.35';

      let btnHtml;
      if(!owned){
        if(!unlocked){
          btnHtml=`<button class="btn btn-sm btn-outline" disabled>🔒 Cần ${REALMS[s.minRealm].name}</button>`;
        }else{
          const canAfford=G.spiritStones>=s.stoneCost;
          btnHtml=`<button class="btn btn-sm ${canAfford?'btn-success':'btn-outline'}" onclick="learnSkill(PASSIVE_SKILLS.find(x=>x.id==='${s.id}'))"
            ${canAfford?'':'disabled'}>📜 Học (${s.stoneCost}💎)${canAfford?'':`<span class="insufficient"> — có ${G.spiritStones}💎</span>`}</button>`;
        }
      }else{
        btnHtml=`<span style="font-size:11px;color:#7ad8a0">✅ Đã học</span>`;
      }

      div.innerHTML=`<div class="skill-name">${s.name}</div>
        <div class="skill-desc">${s.desc}</div>
        ${btnHtml}`;
      pgrid.appendChild(div);
    });
  }catch(e){
    console.error('renderSkills error:',e);
  }
}
