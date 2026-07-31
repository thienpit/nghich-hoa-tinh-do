// ===== GAME STATE =====
let G = null;
let _debugTrib = false;  // debugging flag

function defaultState() {
  return {
    realm:0, tier:0, exp:0,
    spiritStones:5,   // Linh Thạch (tiền tệ chính)
    jade:0,           // Tiên Ngọc (cao cấp)
    herbs:10,
    pills:{ tuKhi:0, tuNguyen:0, ngungThan:0 },
    pillsUsedForTrib_Small:0,
    pillsUsedForTrib_Great:0,
    inventory:{},      // item id -> quantity
    totalHunts:0,
    huntCountThisHour:0,
    huntHourTimestamp:Date.now(),
    currentArea:0,
    caveLevel:1,
    petLevel:0, petExp:0,
    totalExpEarned:0,
    rebirthCount:0,
    lastIdleCalc:Date.now(),
    lastHerbGather:Date.now(),
    startTime:Date.now(),
    autoCultivate:false,
    cultivationPath:null,
    daoTam:100,
    savedRealmExp:0,
    totalRealmExp:0,
    // Skills
    learnedSkills:[],
    equippedActiveSkill:null,
    skillCooldowns:{},
    // Bosses
    bossDefeated:[],    // area index array
    bossHp:{},          // area index -> current HP
    lastBossFight:0,    // timestamp
    // Achievements (simple)
    achievements:[],
    // Equipment
    equipped:{ weapon:null, armor:null, accessory:null },
    ownedEquipment:[],
    // Quests
    quests: JSON.parse(JSON.stringify(QUESTS)),
    // Shop extras
    rootBoostUntil:0,   // timestamp for temporary root boost
  };
}

// ===== SAVE/LOAD =====
function saveGame() {
  if(!G) return;
  G.lastSave=Date.now();
  try{
    localStorage.setItem('nghichHoaTinhDo',JSON.stringify(G));
    document.getElementById('saveStatus').textContent='✅ Đã lưu';
    document.getElementById('saveIndicator').textContent='⏺ '+new Date().toLocaleTimeString();
  }catch(e){ console.warn('Save failed:',e); }
}

function loadGame(){
  try{
    const raw=localStorage.getItem('nghichHoaTinhDo');
    if(raw){
      const parsed=JSON.parse(raw);
      G=Object.assign(defaultState(),parsed);
      // Ensure new fields exist
      if(G.rootBoostUntil===undefined) G.rootBoostUntil=0;
      // Backward compat: old saves used a single shared skillCooldown -> migrate to per-skill cooldowns
      if(!G.skillCooldowns || typeof G.skillCooldowns!=='object') G.skillCooldowns={};
      if(typeof G.skillCooldown==='number' && G.skillCooldown>0){
        const sk=getEquippedSkill();
        if(sk) G.skillCooldowns[sk.id]=G.skillCooldown;
        G.skillCooldown=0;
      }
      // Backward compat: old saves default to Tu Đạo (dao) path
      if(!G.cultivationPath || !CULTIVATION_PATHS.find(p=>p.id===G.cultivationPath)) G.cultivationPath='dao';
      // Backward compat: equipment & quests
      if(!G.equipped || typeof G.equipped!=='object') G.equipped={ weapon:null, armor:null, accessory:null };
      if(!Array.isArray(G.ownedEquipment)) G.ownedEquipment=[];
      // Restore quest functions (since JSON.parse kills them)
      if (Array.isArray(G.quests)) {
        G.quests.forEach((q, i) => {
          if (QUESTS[i]) q.check = QUESTS[i].check;
        });
      }
      console.log('✅ Loaded save. Realm:',REALMS[G.realm].name,'Tier:',G.tier+1,'EXP:',G.exp);
      return true;
    }
  }catch(e){
    console.error('Load error:',e);
  }
  return false;
}

// ===== EXP HELPERS =====
function getRealmLabel(){
  const path=getCultivationPath();
  const base=REALMS[G.realm].name;
  if(G.cultivationPath==='ma') return `💀 ${base} (Ma Đạo)`; // path-specific label
  if(G.cultivationPath==='tien') return `✨ ${base} (Tiên Đạo)`;
  return `☯️ ${base} (Chính Đạo)`;
}

function switchCultivationPath(newPathId) {
  if(G.cultivationPath === newPathId) return;
  const path = CULTIVATION_PATHS.find(p=>p.id===newPathId);
  if(!path) return;
  
  // Ma path logic switch: check for auto-cultivate
  if(newPathId === 'ma') G.autoCultivate = false;
  
  G.cultivationPath = newPathId;
  addAnnounce(`🔄 Chuyển sang con đường ${path.icon} ${path.name}!`,'event');
  updateUI();
  saveGame();
}

// ===== CULTIVATION PATH HELPERS =====
function getCultivationPath(){
  if(!G || !G.cultivationPath || !CULTIVATION_PATHS.find(p=>p.id===G.cultivationPath)) return CULTIVATION_PATHS[0];
  return CULTIVATION_PATHS.find(p=>p.id===G.cultivationPath);
}

function getExpNeeded(realm,tier){
  if(realm<0||realm>MAX_REALM||tier<0||tier>MAX_TIER) return Infinity;
  return REALMS[realm].exp[tier];
}

function calcRealmTotalExp(){
  let t=0;
  for(let i=0;i<G.tier;i++) t+=getExpNeeded(G.realm,i);
  return t+G.exp;
}

function getSpiritRoot(){
  const roots=[
    {name:'Phế',mult:0.8},
    {name:'Hạ phẩm',mult:0.9},
    {name:'Trung phẩm',mult:1.0},
    {name:'Thượng phẩm',mult:1.2},
    {name:'Cực phẩm',mult:1.4},
    {name:'Thiên linh căn',mult:1.6}
  ];
  let idx=Math.min(roots.length-1,G.rebirthCount);
  // Temporary boost
  if(G.rootBoostUntil && Date.now()<G.rootBoostUntil) idx=Math.min(roots.length-1,idx+1);
  return roots[idx];
}

function getIdleExpPerSecond(){
  const base=5*0.65, r=getSpiritRoot(), c=1+(G.caveLevel-1)*0.05, rm=1+G.realm*0.05;
  return base * r.mult * c * rm;
}

// ===== EQUIPMENT HELPERS =====
function getEquipmentBonus(statName){
  if(!G || !G.equipped) return 0;
  let total=0;
  Object.keys(G.equipped).forEach(slot=>{
    const itemId=G.equipped[slot];
    if(!itemId) return;
    const item=EQUIPMENT_ITEMS.find(i=>i.id===itemId);
    if(item && item.stats && item.stats[statName]) total+=item.stats[statName];
  });
  return total;
}

function buyEquipment(itemId){
  const item=EQUIPMENT_ITEMS.find(i=>i.id===itemId);
  if(!item) return;
  if(G.ownedEquipment.includes(itemId)) return;
  if(G.jade<item.cost){
    addAnnounce(`❌ Cần ${item.cost}🔮 Tiên Ngọc để mua ${item.name}!`,'warning');
    return;
  }
  G.jade-=item.cost;
  G.ownedEquipment.push(itemId);
  addAnnounce(`🛒 Mua thành công ${item.name}!`,'success');
  updateUI();
  saveGame();
}

function equipItem(itemId){
  const item=EQUIPMENT_ITEMS.find(i=>i.id===itemId);
  if(!item || !G.ownedEquipment.includes(itemId)) return;
  const wasEquipped=G.equipped[item.slot]===itemId;
  G.equipped[item.slot]=wasEquipped?null:itemId;
  addAnnounce(wasEquipped?`📦 Tháo ${item.name}!`:`⚔️ Trang bị ${item.name}!`,'info');
  updateUI();
  saveGame();
}
