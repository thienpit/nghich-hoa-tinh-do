// ===== SKILLS =====
function getEquippedSkill(){
  if(!G.equippedActiveSkill) return null;
  return ACTIVE_SKILLS.find(s=>s.id===G.equippedActiveSkill)||null;
}

function hasPassive(id){ return G.learnedSkills.includes(id); }

function skillCooldownRemaining(id){
  if(!id) return 0;
  const cd=G.skillCooldowns[id];
  if(!cd) return 0;
  return Math.max(0, Math.ceil((cd-Date.now())/1000));
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

// Helper to build rich skill tooltip HTML
function buildSkillTooltip(s, opts) {
  const { owned, equipped, unlocked, onCd, cdLeft } = opts;
  const icon = s.name.split(' ')[0];
  const name = s.name;
  
  let html = '<div class="tt-header"><div class="tt-icon">' + icon + '</div><div class="tt-title">' + name + '</div></div>';
  
  // Subtitle based on type
  const isPassive = s.cd === undefined || s.cd === 0;
  if (isPassive) {
    html += '<div class="tt-subtitle passive">Kỹ năng bị động</div>';
  } else {
    html += '<div class="tt-subtitle active">Kỹ năng chủ động</div>';
  }
  
  html += '<div class="tt-desc">' + s.desc + '</div>';
  
  html += '<div class="tt-stats">';
  
  // Cooldown row (only for active skills)
  if (!isPassive && s.cd) {
    html += '<div class="tt-row"><span class="tt-label">⏱ Hồi chiêu</span><span class="tt-value cyan">' + s.cd + 's</span></div>';
  }
  
  // Bonus effects
  if (s.huntExpBonus) {
    html += '<div class="tt-row"><span class="tt-label">⚡ Hiệu ứng</span><span class="tt-value gold">+' + (s.huntExpBonus * 100) + '% EXP săn</span></div>';
  }
  if (s.idleBonus) {
    html += '<div class="tt-row"><span class="tt-label">⚡ Hiệu ứng</span><span class="tt-value gold">+' + (s.idleBonus * 100) + '% EXP idle</span></div>';
  }
  if (s.tribBonus) {
    html += '<div class="tt-row"><span class="tt-label">⚡ Hiệu ứng</span><span class="tt-value gold">+' + (s.tribBonus * 100) + '% đột phá</span></div>';
  }
  if (s.expMult) {
    html += '<div class="tt-row"><span class="tt-label">⚡ Hiệu ứng</span><span class="tt-value gold">×' + s.expMult + ' EXP tu luyện</span></div>';
  }
  if (s.stoneMult) {
    html += '<div class="tt-row"><span class="tt-label">⚡ Hiệu ứng</span><span class="tt-value gold">×' + s.stoneMult + ' Linh Thạch</span></div>';
  }
  if (s.lootMult) {
    html += '<div class="tt-row"><span class="tt-label">⚡ Hiệu ứng</span><span class="tt-value gold">×' + s.lootMult + ' rơi đồ</span></div>';
  }
  
  // Cost
  if (s.stoneCost) {
    html += '<div class="tt-row"><span class="tt-label">💎 Giá</span><span class="tt-value jade-green">' + s.stoneCost + ' Linh Thạch</span></div>';
  }
  
  // Required realm
  if (s.minRealm && !unlocked) {
    html += '<div class="tt-row"><span class="tt-label">🔒 Cần cảnh giới</span><span class="tt-value">' + REALMS[s.minRealm].name + '</span></div>';
  }
  
  html += '</div>';
  
  // Status tag
  if (!unlocked) {
    html += '<div class="tt-divider"></div><div class="tt-tag locked">🔒 Chưa mở khóa</div>';
  } else if (!owned) {
    html += '<div class="tt-divider"></div><div class="tt-tag can-equip">📜 Có thể học</div>';
  } else if (equipped && onCd) {
    html += '<div class="tt-divider"></div><div class="tt-tag cooldown">⏳ Hồi chiêu ' + cdLeft + 's</div>';
  } else if (equipped) {
    html += '<div class="tt-divider"></div><div class="tt-tag equipped">✅ Đã trang bị</div>';
  } else if (owned && !isPassive) {
    html += '<div class="tt-divider"></div><div class="tt-tag can-equip">🔧 Có thể trang bị</div>';
  } else if (owned && isPassive) {
    html += '<div class="tt-divider"></div><div class="tt-tag equipped">✅ Đã học</div>';
  }
  
  return html;
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
      const onCd=equipped && (G.skillCooldowns[s.id]||0)>now;
      const cdLeft=skillCooldownRemaining(s.id);
      const div=document.createElement('div');
      div.className='skill-card'+(equipped?' equipped':'');
      div.style.opacity=unlocked?'1':'0.35';
      div.onmouseover=(e)=>showTooltipAt(e, buildSkillTooltip(s, {owned, equipped, unlocked, onCd, cdLeft}), 'tooltip-skill');
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
        btnHtml=`<button class="btn btn-sm btn-warning" disabled>⏳ Hồi ${skillCooldownRemaining(s.id)}s</button>`;
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
      div.onmouseover=(e)=>showTooltipAt(e, buildSkillTooltip(s, {owned, equipped: owned, unlocked, onCd: false, cdLeft: 0}), 'tooltip-skill');
      div.onmouseout=hideTooltip;

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
