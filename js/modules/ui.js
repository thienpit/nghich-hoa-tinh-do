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

    // Realm
    document.getElementById('realmName').textContent=REALMS[G.realm].name+(G.rebirthCount>0?` (${G.rebirthCount}× CS)`:'');
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
    const root=getSpiritRoot();
    document.getElementById('spiritRoot').textContent=`${root.name}×${root.mult.toFixed(1)}${G.rootBoostUntil>Date.now()?' 🌟':''}`;
    document.getElementById('clickExp').textContent=getCultivateExpPerClick();
    document.getElementById('idleRateLabel').textContent=Math.round(getIdleExpPerSecond()*60);

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
    document.getElementById('huntExpDisplay').textContent=area.expBase;
    document.getElementById('huntStoneDisplay').textContent=area.stoneBase;
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
    if(boss){
      document.getElementById('bossContent').style.display='block';
      document.getElementById('bossName').textContent=boss.name;
      const hpPct=Math.round(boss.hp/boss.maxHp*100);
      document.getElementById('bossHpBar').style.width=hpPct+'%';
      document.getElementById('bossHpCurrent').textContent=`${boss.hp}/${boss.maxHp}`;
      const cdElapsed=Date.now()-G.lastBossFight;
      const bossCd=cdElapsed<5000?Math.ceil((5000-cdElapsed)/1000):0;
      document.getElementById('bossCooldown').textContent=bossCd>0?`${bossCd}s`:'✅ Sẵn sàng';
    }else{
      document.getElementById('bossContent').style.display='block';
      document.getElementById('bossName').textContent='✅ Đã đánh bại!';
      document.getElementById('bossHpBar').style.width='0%';
      document.getElementById('bossHpCurrent').textContent='0/0';
    }

    // Skills
    renderSkills();

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

// ===== START GAME =====
init();
