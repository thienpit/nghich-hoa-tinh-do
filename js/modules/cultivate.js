// ===== ADD EXP (Fixed: ensure tribulation check fires) =====
function addExp(amount){
  try{
    if(!G || amount<=0) return;
    G.exp+=amount;
    G.totalExpEarned+=amount;
    G.totalRealmExp+=amount;

    let adv=false;
    // Auto-advance only through Tiers 1-8 (indices 0-7).
    // Tier 9 (index 8) and Tier 10 (index 9) require tribulation.
    while(G.tier < MAX_TIER - 1){  // tier < 8
      const n=getExpNeeded(G.realm, G.tier);
      if(G.exp >= n){
        G.exp -= n;
        G.tier++;
        adv=true;
        addAnnounce(`⬆ ${REALMS[G.realm].name} Tầng ${G.tier+1}!`,'success');
      } else {
        break;
      }
    }

    updateUI();

    // Always check tribulation status, not just on adv
    // This ensures the tribulation section shows even on reload or when
    // player is already at tier 8/9 and accumulating overflow EXP
    checkTribulationStatus();

    if(adv){
      console.log('⚡ Advanced to tier',G.tier+1,'(index',G.tier+')');
    }
  }catch(e){
    console.error('addExp error:',e);
  }
}

// ===== CULTIVATE =====
// EXP per click (defined here so it can use equipment bonuses)
function getCultivateExpPerClick(){
  const base=5, r=getSpiritRoot(), c=1+(G.caveLevel-1)*0.05, fluct=0.9+Math.random()*0.2;
  let exp=base * r.mult * c * fluct;
  // Path cultivation bonus (Tiên +10%, Ma = 0 — blocked anyway)
  const path=getCultivationPath();
  if(path) exp=exp*(path.cultBonus||0);
  // Equipment bonus (Pháp Bảo EXP)
  const eqBonus=getEquipmentBonus('clickExpBonus');
  if(eqBonus>0) exp=exp*(1+eqBonus);
  return Math.round(exp);
}

let lastCultivateTime=0;
function cultivate(){
  if(!G || Date.now()-lastCultivateTime<300) return;
  lastCultivateTime=Date.now();

  try{
    // Ma path cannot cultivate — only absorb sinh khí from combat
    if(G.cultivationPath==='ma'){
      showToast('❌ Ma tu giả không thể ngồi thi luyện! Hãy đi săn hấp thụ sinh khí!','danger');
      return;
    }

    let exp=getCultivateExpPerClick();

    // Active skill bonus
    const sk=getEquippedSkill();
    if(sk && sk.bonusExp && Date.now()>(G.skillCooldowns[sk.id]||0))
      exp=Math.round(exp*(1+sk.bonusExp));

    // Random enlightenment
    if(Math.random()<0.08){
      exp=Math.round(exp*1.5);
      addAnnounce(`✨ Đốn ngộ! +${exp} EXP!`,'event');
    }

    addExp(exp);

    // Ripple effect
    const btn=document.getElementById('cultivateBtn');
    if(btn){
      const rip=document.createElement('span');
      rip.className='ripple';
      const s=Math.max(btn.offsetWidth,btn.offsetHeight);
      rip.style.cssText=`width:${s}px;height:${s}px;left:${btn.offsetWidth/2-s/2}px;top:${btn.offsetHeight/2-s/2}px`;
      btn.appendChild(rip);
      setTimeout(()=>rip.remove(),600);
    }
    showFloat(exp);
  }catch(e){
    console.error('cultivate error:',e);
  }
}

function showFloat(exp){
  const btn=document.getElementById('cultivateBtn');
  if(!btn) return;
  const el=document.createElement('div');
  el.textContent='+'+exp+' EXP';
  el.style.cssText='position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:13px;font-weight:700;color:#6ac0e0;pointer-events:none;animation:floatUp 1s ease-out;text-shadow:0 0 10px rgba(74,138,181,0.5)';
  btn.appendChild(el);
  setTimeout(()=>el.remove(),1000);
}

// ===== AUTO/IDLE =====
function toggleAuto(){
  // Ma path cannot auto-cultivate (no cultivation at all)
  if(G.cultivationPath==='ma'){
    showToast('❌ Ma tu giả không thể tự động tu luyện! Hãy đi săn!','danger');
    return;
  }
  G.autoCultivate=!G.autoCultivate;
  document.getElementById('autoToggle').classList.toggle('active',G.autoCultivate);
  const btn=document.getElementById('cultivateBtn');
  if(btn) btn.classList.toggle('auto-active',G.autoCultivate);
  saveGame();
}

function processIdle(){
  if(!G) return;
  try{
    const now=Date.now();
    const elapsed=(now - G.lastIdleCalc) / 1000;
    if(elapsed<1) return;
    G.lastIdleCalc=now;

    // Ma path: no idle cultivation — must hunt to absorb sinh khí
    if(G.cultivationPath==='ma'){
      // Herb auto gather still works
      const hElapsed=(now - G.lastHerbGather) / 1000;
      if(hElapsed>=30){
        const cycles=Math.floor(hElapsed/30);
        for(let i=0; i<Math.min(cycles,20); i++){
          G.herbs+=1+Math.floor(Math.random()*3);
        }
        G.lastHerbGather += cycles*30000;
      }
      // Pet idle EXP still works
      if(G.petLevel>0){
        G.petExp += 0.05 * G.petLevel * (elapsed/60);
        checkPetLevelUp();
      }
      updateUI();
      return;
    }

    // Idle EXP (60-70% of active)
    const rate=getIdleExpPerSecond();
    let idleExp=rate*elapsed;
    const maxIdle=rate*28800; // 8-hour cap
    if(idleExp>maxIdle) idleExp=maxIdle;
    if(idleExp>30) addAnnounce(`⏳ Linh khí tụ đến! +${Math.round(idleExp)} EXP`,'info');
    if(idleExp>0) addExp(Math.round(idleExp));

    // Auto cultivate (bonus on top of idle)
    if(G.autoCultivate){
      const auto=rate*elapsed*1.2;
      addExp(Math.round(auto));
    }

    // Herb auto gather (every 30s)
    const hElapsed=(now - G.lastHerbGather) / 1000;
    if(hElapsed>=30){
      const cycles=Math.floor(hElapsed/30);
      for(let i=0; i<Math.min(cycles,20); i++){
        G.herbs+=1+Math.floor(Math.random()*3);
      }
      G.lastHerbGather += cycles*30000;
    }

    // Pet idle EXP
    if(G.petLevel>0){
      G.petExp += 0.05 * G.petLevel * (elapsed/60);
      checkPetLevelUp();
    }

    updateUI();
  }catch(e){
    console.error('processIdle error:',e);
  }
}
