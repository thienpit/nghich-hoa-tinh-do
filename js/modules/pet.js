// ===== CAVE =====
function upgradeCave(){
  const cost=3+G.caveLevel*2;
  if(G.spiritStones<cost){
    addAnnounce(`❌ Cần ${cost}💎 (bạn có ${G.spiritStones}💎)`,'warning');
    return;
  }
  G.spiritStones-=cost;
  G.caveLevel++;
  addAnnounce(`🏠 Động phủ Cấp ${G.caveLevel}! EXP idle +${(G.caveLevel-1)*5}%`,'success');
  updateUI();
}

// ===== PET =====
function feedPet(){
  if(G.herbs<5){
    addAnnounce('❌ Cần 5 dược. Mua ở Cửa Hàng hoặc hái dược.','warning');
    return;
  }
  G.herbs-=5;
  let feedExp=20+Math.floor(Math.random()*20);
  if(hasPassive('passivePet')) feedExp=Math.round(feedExp*1.2);
  G.petExp+=feedExp;
  if(G.petLevel===0 && G.petExp>=PET_EXP_PER_LEVEL(0)){
    G.petExp=0;
    G.petLevel=1;
    addAnnounce('🐣 Trứng nở! Chào linh thú!','success');
  }
  checkPetLevelUp();
  updateUI();
}

function checkPetLevelUp(){
  while(G.petLevel>0 && G.petExp>=PET_EXP_PER_LEVEL(G.petLevel)){
    G.petExp-=PET_EXP_PER_LEVEL(G.petLevel);
    G.petLevel++;
    addAnnounce(`🐉 Linh thú Cấp ${G.petLevel}! ${PET_NAMES[Math.min(G.petLevel,PET_NAMES.length-1)]}`,'success');
  }
}

// ===== REBIRTH =====
function attemptRebirth(){
  if(G.realm<MAX_REALM || G.tier<MAX_TIER){
    addAnnounce('❌ Cần Đại Thừa T10','warning');
    return;
  }
  G.rebirthCount++;
  G.realm=0; G.tier=0; G.exp=0;
  G.herbs=20;
  G.pills={tuKhi:0,tuNguyen:0,ngungThan:0};
  G.totalHunts=0; G.totalExpEarned=0; G.totalRealmExp=0;
  G.spiritStones=10; G.caveLevel=1; G.petLevel=0; G.petExp=0; G.daoTam=100;
  G.inventory={}; G.bossDefeated=[]; G.bossHp={};
  G.learnedSkills=[]; G.equippedActiveSkill=null;
  G.autoCultivate=false;
  // Reset done — now let the player choose their cultivation path
  showPathSelection();
}

// ===== PATH SELECTION (on rebirth) =====
function showPathSelection(){
  // Remove any existing modal
  const old=document.querySelector('.path-modal-overlay');
  if(old) old.remove();

  const overlay=document.createElement('div');
  overlay.className='path-modal-overlay';

  const bonusText=p=>{
    const parts=[];
    if(p.cultBonus>0) parts.push(`🧘 Tu luyện +${Math.round((p.cultBonus-1)*100)}%`);
    else parts.push('🧘 Không tu luyện được');
    if(p.huntBonus>1) parts.push(`⚔️ Săn ×${p.huntBonus} EXP/💎`);
    if(p.bossBonus>1) parts.push(`🐉 Boss ×${p.bossBonus} sát thương`);
    return parts.join(' · ');
  };

  const options=CULTIVATION_PATHS.map(p=>{
    const isMa=p.id==='ma';
    return `<div class="path-option ${p.id==='tien'?'path-tien':''} ${isMa?'path-ma':''}" onclick="selectPath('${p.id}')">
      <div class="path-icon">${p.icon}</div>
      <div class="path-name">${p.name}</div>
      <div class="path-desc">${p.desc}</div>
      <div class="path-bonus">${bonusText(p)}</div>
    </div>`;
  }).join('');

  overlay.innerHTML=`<div class="path-modal">
    <div class="path-modal-title">♾️ Chọn con đường tu luyện</div>
    <div class="path-modal-sub">Lần chuyển sinh ${G.rebirthCount} — con đường quyết định lối chơi của bạn</div>
    <div class="path-options">${options}</div>
    <div style="font-size:10px;color:#5a6a80;text-align:center;margin-top:10px">💡 Có thể đổi con đường ở lần chuyển sinh tiếp theo</div>
  </div>`;

  document.body.appendChild(overlay);
}

function selectPath(pathId){
  const path=CULTIVATION_PATHS.find(p=>p.id===pathId);
  if(!path) return;
  G.cultivationPath=path.id;
  // Close modal
  const overlay=document.querySelector('.path-modal-overlay');
  if(overlay) overlay.remove();
  addAnnounce(`♾️♾️ CHUYỂN SINH LẦN ${G.rebirthCount}! Chọn con đường ${path.icon} ${path.name}! Linh căn mạnh hơn!`,'event');
  updateUI();
  document.getElementById('rebirthSection').style.display='none';
  saveGame();
}
