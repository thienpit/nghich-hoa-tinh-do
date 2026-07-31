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
  addAnnounce(`♾️♾️ CHUYỂN SINH LẦN ${G.rebirthCount}! Linh căn mạnh hơn!`,'event');
  updateUI();
  document.getElementById('rebirthSection').style.display='none';
  saveGame();
}
