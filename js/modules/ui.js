// ===== BATTLE LOG =====
function addBattleLog(text, type='info') {
  try {
    const c = document.getElementById('battleLogContent');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'battle-log-entry bl-' + type;
    const t = new Date().toLocaleTimeString();
    el.innerHTML = `<span class="bl-time">[${t}]</span> <span class="bl-text">${text}</span>`;
    c.prepend(el);
    while (c.children.length > 50) c.removeChild(c.lastChild);
  } catch (e) {
    console.error('addBattleLog error:', e);
  }
}

// ===== ANNOUNCEMENTS =====
const MAX_ANNOUNCE=6;

function addAnnounce(text,type='info'){
  try{
    showToast(text,type);
    const c=document.getElementById('announcements');
    if(!c) return;
    const el=document.createElement('div');
    el.className='announce';
    const t=new Date().toLocaleTimeString();
    const icons={success:'✅',danger:'💥',warning:'⚠️',event:'✨',info:'📌'};
    el.innerHTML=`<span class="time">[${t}]</span> ${icons[type]||'📌'} ${text}`;
    c.prepend(el);
    while(c.children.length>MAX_ANNOUNCE) c.removeChild(c.lastChild);
  }catch(e){
    console.error('addAnnounce error:',e);
  }
}

function showToast(text,type='info'){
  try{
    const c=document.getElementById('toastContainer');
    if(!c) return;
    const el=document.createElement('div');
    el.className='toast toast-'+type;
    el.textContent=text;
    c.appendChild(el);
    setTimeout(()=>{
      el.style.opacity='0';
      el.style.transition='opacity 0.3s';
      setTimeout(()=>el.remove(),300);
    },2500);
  }catch(e){}
}

// ===== UI UPDATE =====
function updateUI(){
  try{
    if(!G) return;

    // Header currency
    document.getElementById('spiritStones').textContent=G.spiritStones;
    document.getElementById('jade').textContent=G.jade;

    // Cultivation path display (header + realm badge)
    const path=getCultivationPath();
    const headerPath=document.getElementById('headerPathDisplay');
    if(headerPath) headerPath.textContent=`${path.icon} ${path.name}`;
    const pathBadge=document.getElementById('pathBadge');
    if(pathBadge){
      pathBadge.textContent=`${path.icon} ${path.name}`;
      pathBadge.className='path-badge'+(path.id==='ma'?' path-ma':(path.id==='tien'?' path-tien':''));
    }

    // Realm
    document.getElementById('realmName').textContent=getRealmLabel()+(G.rebirthCount>0?` (${G.rebirthCount}× CS)`:'');
    document.getElementById('tierDisplay').textContent=G.tier+1;

    // EXP — show overflow indicator when capped at T9/T10
    const needed=getExpNeeded(G.realm, G.tier);
    let pct=0;
    if(needed>0 && needed!==Infinity){
      pct=Math.min(100, (G.exp/needed)*100);
    }
    document.getElementById('expCurrent').textContent=Math.floor(G.exp);
    document.getElementById('expNeeded').textContent=(needed===Infinity?'∞':needed);
    document.getElementById('expBar').style.width=pct+'%';
    document.getElementById('expBarPct').textContent=Math.round(pct)+'%';

    // Overflow EXP display (when at tier 8+ and EXP > needed)
    const overflowEl=document.getElementById('overflowExp');
    if(overflowEl){
      if((G.tier===8||G.tier===9) && G.exp>needed && needed>0){
        const overflow=G.exp-needed;
        overflowEl.style.display='block';
        overflowEl.textContent=`📦 EXP dự trữ: +${Math.floor(overflow)} (vượt quá mức cần cho đột phá)`;
      }else{
        overflowEl.style.display='none';
      }
    }

    // Cultivate info
    const isMa=G.cultivationPath==='ma';
    const root=getSpiritRoot();
    document.getElementById('spiritRoot').textContent=`${root.name}×${root.mult.toFixed(1)}${G.rootBoostUntil>Date.now()?' 🌟':''}`;
    const clickExpEl=document.getElementById('clickExp');
    if(clickExpEl) clickExpEl.textContent=getCultivateExpPerClick();
    document.getElementById('idleRateLabel').textContent=Math.round(getIdleExpPerSecond()*60);

    // Ma path: block cultivation UI — red warning, disabled button, hide auto toggle
    const maWarn=document.getElementById('maPathWarning');
    if(maWarn) maWarn.style.display=isMa?'block':'none';
    const cultBtn=document.getElementById('cultivateBtn');
    if(cultBtn){
      const sub=cultBtn.querySelector('.sub');
      if(isMa){
        cultBtn.classList.add('disabled');
        cultBtn.setAttribute('disabled','disabled');
        if(sub) sub.style.display='none';
      }else{
        cultBtn.classList.remove('disabled');
        cultBtn.removeAttribute('disabled');
        if(sub) sub.style.display='';
      }
    }
    const autoWrap=document.getElementById('autoToggleWrap');
    if(autoWrap) autoWrap.style.display=isMa?'none':'flex';
    if(isMa && G.autoCultivate) G.autoCultivate=false;

    // Auto toggle
    document.getElementById('autoToggle').classList.toggle('active',G.autoCultivate);

    // Herbs & cooldown
    document.getElementById('herbCount').textContent=G.herbs;
    const hElapsed=(Date.now()-G.lastHerbGather)/1000;
    const hCd=document.getElementById('herbCooldownDisplay');
    if(hCd){
      if(hElapsed<10) hCd.textContent=`⏱ Còn ${Math.ceil(10-hElapsed)}s`;
      else hCd.textContent='✅ Sẵn sàng!';
    }

    // Adventure areas
    renderAreas();
    const area=getCurrentArea();
    document.getElementById('areaNameSelected').textContent=area.name;
    document.getElementById('areaEmoji').textContent=area.emoji;
    document.getElementById('areaDescription').textContent=area.desc;
    // Update path selector buttons active state
    document.querySelectorAll('.path-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.path === G.cultivationPath);
    });
    // Show path-boosted hunt rewards in UI (Ma = x2)
    document.getElementById('huntExpDisplay').textContent=Math.round(area.expBase*path.huntBonus);
    document.getElementById('huntStoneDisplay').textContent=Math.round(area.stoneBase*path.huntBonus);
    document.getElementById('huntLootDisplay').textContent=Math.round(area.lootChance*100)+'%';
    const eff=Math.pow(0.9, G.huntCountThisHour)*100;
    const dimEl=document.getElementById('huntDiminish');
    if(dimEl){
      dimEl.textContent=G.huntCountThisHour>0
        ?`⚠️ Hiệu suất: ${Math.round(eff)}% (săn ${G.huntCountThisHour} con giờ qua)`
        :'';
    }
    document.getElementById('totalHunts').textContent=G.totalHunts||0;

    // Boss
    const boss=getCurrentBoss();
    const bossEl=document.getElementById('bossContent');
    if(boss){
      bossEl.style.display='block';
      document.getElementById('bossName').textContent=boss.name;
      const hpPct=Math.round(boss.hp/boss.maxHp*100);
      document.getElementById('bossHpBar').style.width=hpPct+'%';
      document.getElementById('bossHpCurrent').textContent=`${boss.hp}/${boss.maxHp}`;
      const cdElapsed=Date.now()-G.lastBossFight;
      const bossCd=cdElapsed<5000?Math.ceil((5000-cdElapsed)/1000):0;
      document.getElementById('bossCooldown').textContent=bossCd>0?`${bossCd}s`:'✅ Sẵn sàng';
      bossEl.classList.toggle('ready',bossCd===0);
    }else{
      bossEl.style.display='block';
      document.getElementById('bossName').textContent='✅ Đã đánh bại!';
      document.getElementById('bossHpBar').style.width='0%';
      document.getElementById('bossHpCurrent').textContent='0/0';
      bossEl.classList.remove('ready');
    }

    // Skills
    renderSkills();
    renderQuests();
    renderEquipment();

    // Pills
    renderPillGrid();
    renderInventory();
    renderPillInventory();

    // Cave
    document.getElementById('caveLevel').textContent=G.caveLevel;
    const iBonus=(G.caveLevel-1)*5, aBonus=(G.caveLevel-1)*3;
    document.getElementById('caveBonus').textContent=`+${iBonus}% EXP idle · +${aBonus}% luyện đan`;
    document.getElementById('caveUpgradeBtn').textContent=`⬆ Nâng cấp (${3+G.caveLevel*2}💎)`;

    // Pet
    if(G.petLevel>0){
      const idx=Math.min(G.petLevel, PET_NAMES.length-1);
      document.getElementById('petEmoji').textContent=PET_NAMES[idx].split(' ')[0];
      document.getElementById('petName').textContent=PET_NAMES[idx].split(' ').slice(1).join(' ');
      const pn=PET_EXP_PER_LEVEL(G.petLevel);
      const pp=Math.min(100, (G.petExp/pn)*100);
      document.getElementById('petLevelDisplay').textContent=`Cấp ${G.petLevel} — ${Math.floor(G.petExp)}/${Math.round(pn)} EXP`;
      document.getElementById('petExpBar').style.width=pp+'%';
    }else{
      const pn=PET_EXP_PER_LEVEL(0);
      const pp=Math.min(100, (G.petExp/pn)*100);
      document.getElementById('petLevelDisplay').textContent=`🥚 Trứng — ${Math.floor(G.petExp)}/${Math.round(pn)} EXP`;
      document.getElementById('petExpBar').style.width=pp+'%';
    }

    // Rebirth
    if(G.realm===MAX_REALM && G.tier===MAX_TIER){
      document.getElementById('rebirthSection').style.display='block';
      document.getElementById('rebirthBonus').textContent=Math.min(60, 10+G.rebirthCount*10)+'%';
      document.getElementById('rebirthCount').textContent=G.rebirthCount;
    }

    // Shop
    renderShop();

    // Tribulation (always check — ensures visibility on every update)
    checkTribulationStatus();

    // Playtime
    const ps=Math.floor((Date.now()-G.startTime)/1000);
    document.getElementById('playTime').textContent=
      String(Math.floor(ps/3600)).padStart(2,'0')+':'+
      String(Math.floor((ps%3600)/60)).padStart(2,'0')+':'+
      String(ps%60).padStart(2,'0');

  }catch(e){
    console.error('updateUI error:',e);
  }
}

// ===== RENDER HELPERS =====
function renderPillGrid(){
  const g=document.getElementById('pillGrid');
  if(!g) return;
  g.innerHTML='';
  PILL_TYPES.forEach(p=>{
    const ok=G.realm>=p.minRealm;
    const d=document.createElement('div');
    d.className='item-card';
    d.style.opacity=ok?'1':'0.35';
    d.innerHTML=`<div class="item-name" style="color:${p.color}">${p.name}</div>
      <div class="item-desc">${p.desc}</div>
      <div class="item-count">🌿 ${p.herbCost} dược</div>
      <button class="btn btn-sm btn-primary" style="margin-top:4px;width:100%"
        onclick="craftPill('${p.id}')" ${ok&&G.herbs>=p.herbCost?'':'disabled'}>🔥 Luyện</button>`;
    g.appendChild(d);
  });
}

function renderInventory(){
  const g=document.getElementById('inventoryGrid');
  if(!g) return;
  g.innerHTML='';
  let hasItems=false;
  Object.keys(G.inventory).forEach(id=>{
    const q=G.inventory[id];
    if(!q) return;
    hasItems=true;
    const item=LOOT_ITEMS.find(i=>i.id===id);
    if(!item) return;
    const d=document.createElement('div');
    d.className='item-card';
    d.innerHTML=`<div class="item-name" style="color:#7ad8a0">${item.name}</div>
      <div class="item-count">×${q}</div>
      ${item.expVal?`<button class="btn btn-sm btn-success" style="margin-top:4px;width:100%" onclick="useItem('${id}')">+${item.expVal} EXP</button>`:''}`;
    g.appendChild(d);
  });
  if(!hasItems){
    g.innerHTML=`<div class="item-card" style="grid-column:span 4"><div class="item-name" style="color:#6a7a90">Trống</div></div>`;
  }
}

function renderPillInventory(){
  const d=document.getElementById('inventoryPills');
  if(!d) return;
  d.innerHTML='';
  PILL_TYPES.forEach(p=>{
    const c=G.pills[p.id]||0;
    const el=document.createElement('div');
    el.className='item-card';
    el.innerHTML=`<div class="item-name" style="color:${p.color}">${p.name}</div>
      <div class="item-count">💊 ×${c}</div>
      <button class="btn btn-sm btn-success" style="margin-top:4px;width:100%" onclick="usePill('${p.id}')" ${c>0?'':'disabled'}>+${p.expVal} EXP</button>`;
    d.appendChild(el);
  });
}

// ===== QUESTS =====
function renderQuests(){
  const g=document.getElementById('questGrid');
  if(!g) return;
  g.innerHTML='';
  (G.quests||[]).forEach(q=>{
    const done=q.check(G);
    const div=document.createElement('div');
    div.className='quest-card'+(done?' quest-done':'')+(q.claimed?' quest-claimed':'');
    div.innerHTML=`<div class="quest-info">
      <div class="quest-name">${q.name}</div>
      <div class="quest-desc">${q.desc}</div>
      <div class="quest-reward">🔮 +${q.reward.jade} Tiên Ngọc</div>
    </div>
    <div>${q.claimed?'✅ Đã nhận':(done?`<button class="btn btn-sm btn-gold" onclick="claimQuest('${q.id}')">Nhận</button>`:'⏳ Chưa đạt')}</div>`;
    g.appendChild(div);
  });
}

function claimQuest(id){
  const q=G.quests.find(x=>x.id===id);
  if(!q||q.claimed) return;
  if(!q.check(G)) return;
  q.claimed=true;
  G.jade+=q.reward.jade;
  showToast(`✅ Nhận ${q.reward.jade} 🔮 từ "${q.name}"!`,'success');
  updateUI();
}

// ===== EQUIPMENT =====
function renderEquipment(){
  const slotsEl=document.getElementById('equipSlots');
  const itemsEl=document.getElementById('equipItems');
  if(!slotsEl) return;
  slotsEl.innerHTML='';
  EQUIPMENT_SLOTS.forEach(slot=>{
    const equipped=G.equipped[slot.id];
    const item=equipped?EQUIPMENT_ITEMS.find(i=>i.id===equipped):null;
    const div=document.createElement('div');
    div.className='equip-slot'+(item?'':' empty');
    div.innerHTML=`<div class="equip-icon">${slot.icon}</div>
      <div class="equip-name">${item?item.name:slot.name}</div>
      ${item?`<div class="equip-stat">${item.desc}</div>`:'<div class="equip-stat" style="color:#5a6a80">Trống</div>'}`;
    div.onclick=()=>showEquipMenu(slot.id);
    slotsEl.appendChild(div);
  });
}

let _equipMenuOpen=false;
function showEquipMenu(slotId){
  if(_equipMenuOpen) return;
  _equipMenuOpen=true;
  const itemsEl=document.getElementById('equipItems');
  if(!itemsEl){ _equipMenuOpen=false; return; }
  itemsEl.innerHTML='';
  const slot=EQUIPMENT_SLOTS.find(s=>s.id===slotId);
  const available=EQUIPMENT_ITEMS.filter(i=>i.slot===slotId);
  const closeBtn=document.createElement('div');
  closeBtn.style.cssText='text-align:center;margin:8px 0';
  closeBtn.innerHTML=`<button class="btn btn-sm btn-outline" onclick="document.getElementById('equipItems').innerHTML='';_equipMenuOpen=false;">✕ Đóng</button>`;
  itemsEl.appendChild(closeBtn);
  available.forEach(item=>{
    const owned=G.ownedEquipment.includes(item.id);
    const isEquipped=G.equipped[slotId]===item.id;
    const div=document.createElement('div');
    div.className='shop-card';
    div.innerHTML=`<div class="shop-name">${item.name}</div>
      <div class="shop-desc">${item.desc}</div>
      <div class="shop-price shop-price-jade">🔮 ${item.cost}</div>
      <div style="display:flex;gap:4px;margin-top:4px">
        ${isEquipped?`<button class="btn btn-sm btn-outline" disabled>Đang mặc</button>`
          :owned?`<button class="btn btn-sm btn-jade" onclick="equipItem('${item.id}','${slotId}')">Mặc</button>`
          :`<button class="btn btn-sm btn-primary" onclick="buyEquip('${item.id}')" ${G.jade>=item.cost?'':'disabled'}>Mua</button>`}
      </div>`;
    itemsEl.appendChild(div);
  });
}

function equipItem(itemId, slotId){
  if(!G.ownedEquipment.includes(itemId)) return;
  G.equipped[slotId]=itemId;
  _equipMenuOpen=false;
  document.getElementById('equipItems').innerHTML='';
  showToast(`✅ Đã trang bị ${EQUIPMENT_ITEMS.find(i=>i.id===itemId).name}`,'success');
  updateUI();
}

function buyEquip(itemId){
  const item=EQUIPMENT_ITEMS.find(i=>i.id===itemId);
  if(!item||G.jade<item.cost) return;
  if(G.ownedEquipment.includes(itemId)) return;
  G.jade-=item.cost;
  G.ownedEquipment.push(itemId);
  equipItem(itemId, item.slot);
}

// ===== TABS =====
(function(){
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click',function(){
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      this.classList.add('active');
      const panel=document.getElementById('panel-'+this.dataset.tab);
      if(panel) panel.classList.add('active');
    });
  });
})();

// ===== GAME LOOP =====
function gameLoop(){
  try{
    if(!G) return;
    processIdle();
    updateUI();
  }catch(e){
    console.error('gameLoop error:',e);
  }
}

// ===== DETECT VERCEL =====
function detectVercel(){
  const isVercel = window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('vercel.com') ||
    !window.location.hostname.includes('localhost');
  if(isVercel){
    const notice=document.getElementById('vercelNotice');
    if(notice){
      notice.style.display='inline';
      notice.textContent='🌐 Dữ liệu lưu trên trình duyệt (offline)';
    }
    const box=document.getElementById('vercelNoticeBox');
    if(box) box.style.display='block';
  }
}

// ===== INIT =====
function init(){
  try{
    console.log('☯ Nghịch Hỏa Tinh Đồ — Initializing...');

    if(!loadGame()){
      G=defaultState();
      console.log('🆕 New game created');
      // Force path selection for new users
      setTimeout(showPathSelection, 500);
    }

    G.lastIdleCalc=Date.now();
    G.savedRealmExp=calcRealmTotalExp();
    G.totalRealmExp=calcRealmTotalExp();

    updateUI();
    checkTribulationStatus();

    // Game loop every 2s
    setInterval(gameLoop, 2000);

    // Auto-save every 15s
    setInterval(saveGame, 15000);

    // Spacebar shortcut
    document.addEventListener('keydown',e=>{
      if(e.code==='Space' && !e.repeat){
        e.preventDefault();
        const tag=document.activeElement.tagName;
        if(tag!=='INPUT' && tag!=='TEXTAREA' && tag!=='BUTTON') cultivate();
      }
    });

    addAnnounce('☯ Nghịch Hỏa Tinh Đồ khởi động! Chúc Tông chủ tu tiên thuận lợi.','event');

    // Hint
    setTimeout(()=>{
      const info=document.querySelector('.cultivate-info');
      if(info && info.parentElement){
        const h=document.createElement('div');
        h.style.cssText='font-size:10px;color:#4a5a6a;margin-top:2px;text-align:center';
        h.textContent='💡 Space = tu luyện nhanh | 🛒 Mua đồ ở tab Động Phủ';
        info.parentElement.appendChild(h);
      }
    },500);

    detectVercel();

    console.log('✅ Game ready. Realm:',REALMS[G.realm].name,'Tier:',G.tier+1,'EXP:',G.exp);
  }catch(e){
    console.error('init error:',e);
    // Fallback on error
    if(!G) G=defaultState();
  }
}

// ===== TOOLTIP SYSTEM =====
function showTooltip(e, html) {
  const tip = document.getElementById('tooltip');
  if(!tip || !html) return;
  tip.innerHTML = html;
  tip.className = 'tooltip';
  tip.style.display = 'block';
  // Position: right side if space, else left side
  const tooltipWidth = 260;
  const cursorX = e.clientX;
  const cursorY = e.clientY;
  let left, top;
  if(cursorX + tooltipWidth + 20 > window.innerWidth) {
    // Not enough space on right, place to left
    left = cursorX - tooltipWidth - 20;
  } else {
    left = cursorX + 12;
  }
  top = cursorY - 40;
  if(top < 8) top = 8;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}

function showTooltipAt(e, html, className) {
  const tip = document.getElementById('tooltip');
  if(!tip || !html) return;
  tip.innerHTML = html;
  // Reset to base class, then add optional class
  tip.className = 'tooltip' + (className ? ' ' + className : '');
  tip.style.display = 'block';
  // Position: right side if space, else left side
  const tooltipWidth = 260;
  const cursorX = e.clientX;
  const cursorY = e.clientY;
  let left, top;
  if(cursorX + tooltipWidth + 20 > window.innerWidth) {
    // Not enough space on right, place to left
    left = cursorX - tooltipWidth - 20;
  } else {
    left = cursorX + 12;
  }
  top = cursorY - 40;
  if(top < 8) top = 8;
  tip.style.left = left + 'px';
  tip.style.top = top + 'px';
}

function hideTooltip() {
  const tip = document.getElementById('tooltip');
  if(tip) {
    tip.style.display = 'none';
    tip.className = 'tooltip';
  }
}

document.addEventListener('mousemove', function(e) {
  const tip = document.getElementById('tooltip');
  if(tip && tip.style.display === 'block') {
    const tooltipWidth = 260;
    const cursorX = e.clientX;
    const cursorY = e.clientY;
    let left, top;
    if(cursorX + tooltipWidth + 20 > window.innerWidth) {
      left = cursorX - tooltipWidth - 20;
    } else {
      left = cursorX + 12;
    }
    top = cursorY - 40;
    if(top < 8) top = 8;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
});

// ===== START GAME =====
init();
