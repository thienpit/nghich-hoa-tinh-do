// ===== TRIBULATION (Fixed: robust try-catch, debug logging) =====
let _tribCooldownUntil = 0; // cooldown timestamp after failure

function checkTribulationStatus(){
  try{
    const sec=document.getElementById('tribulationSection');
    const floatBtn=document.getElementById('floatingBreakthrough');
    const debugEl=document.getElementById('tribFallbackDebug');

    if(!sec || !floatBtn){
      console.warn('⚠️ Tribulation UI elements missing');
      return;
    }

    if(!G){
      sec.style.display='none';
      floatBtn.style.display='none';
      return;
    }

    // Check cooldown
    const now=Date.now();
    const onCooldown = now < _tribCooldownUntil;

    const isAtTribTier = (G.tier === 8) || (G.tier === 9 && G.realm < MAX_REALM);

    if(isAtTribTier && !onCooldown){
      // Check if already at max realm with tier 10 — that's rebirth, not tribulation
      if(G.realm >= MAX_REALM && G.tier >= MAX_TIER){
        sec.style.display='none';
        floatBtn.style.display='none';
        document.getElementById('rebirthSection').style.display='block';
        console.log('♾️ Rebirth available');
        return;
      }

      sec.style.display='block';
      floatBtn.style.display='block';

      if(G.tier === 8){
        renderSmallTrib();
        console.log('⚡ Small Tribulation shown (Tier 9→10)');
      } else {
        renderGreatTrib();
        console.log('💀 Great Tribulation shown (T10→next realm)');
      }

      // Debug info
      if(debugEl){
        debugEl.style.display='block';
        debugEl.textContent=`🔍 Debug: realm=${G.realm} (${REALMS[G.realm].name}), tier=${G.tier}, areaRealm=${G.realm>=MAX_REALM?'MAX':'ok'}`;
      }
    } else {
      if(onCooldown && isAtTribTier){
        // Show tribulation section but with cooldown message
        sec.style.display='block';
        floatBtn.style.display='none';
        const rem=Math.ceil((_tribCooldownUntil-now)/1000);
        document.getElementById('tribulationType').innerHTML=`⏳ Cooldown — còn ${rem}s`;
        document.getElementById('tribulationChance').textContent='0';
        document.getElementById('tribulationChanceBar').style.width='0%';
        document.getElementById('tribulationDetail').textContent='Thất bại quá nhiều, cần hồi phục!';
        if(debugEl) debugEl.style.display='none';
      } else {
        sec.style.display='none';
        floatBtn.style.display='none';
        if(debugEl) debugEl.style.display='none';
      }
    }
  }catch(e){
    console.error('checkTribulationStatus error:',e);
  }
}

function scrollToTribulation(){
  const sec=document.getElementById('tribulationSection');
  if(sec) sec.scrollIntoView({behavior:'smooth'});
}

// Logic: Higher realm = higher pill req
function getSmallTribChance(){
  // T8 -> T9 Small trib: Needs Tụ Khí Đan (or higher)
  let pills = (G.pills.tuKhi||0) + (G.pills.tuNguyen||0)*2 + (G.pills.ngungThan||0)*4;
  return Math.min(0.95, 0.70 - G.realm*0.05 + pills*0.02);
}

function getGreatTribChance(){
  // T9 -> NextRealm Great trib: Needs Tụ Nguyên Đan (or higher)
  let pills = (G.pills.tuNguyen||0) + (G.pills.ngungThan||0)*2;
  return Math.min(0.95, 0.40 - G.realm*0.05 + pills*0.03 + G.caveLevel*0.01);
}

function renderSmallTrib(){
  const c=getSmallTribChance();
  document.getElementById('tribulationType').innerHTML='⚡ <strong>Tiểu Kiếp</strong> — T9 → T10';
  document.getElementById('tribulationChance').textContent=Math.round(c*100);
  document.getElementById('tribulationChanceBar').style.width=(c*100)+'%';
  document.getElementById('tribulationDetail').textContent=`Cơ sở ${Math.round((0.70-G.realm*0.05)*100)}% + Đan dược`;
}

function renderGreatTrib(){
  const c=getGreatTribChance();
  const nextName=G.realm<MAX_REALM?REALMS[G.realm+1].name:'???';
  document.getElementById('tribulationType').innerHTML='💀 <strong>Đại Kiếp</strong> → '+nextName;
  document.getElementById('tribulationChance').textContent=Math.round(c*100);
  document.getElementById('tribulationChanceBar').style.width=(c*100)+'%';
  document.getElementById('tribulationDetail').textContent=`Cơ sở ${Math.round((0.40-G.realm*0.05)*100)}% + Đan dược`;
}

function attemptTribulation(){
  try{
    // Cooldown check
    if(Date.now() < _tribCooldownUntil){
      const rem=Math.ceil((_tribCooldownUntil-Date.now())/1000);
      addAnnounce(`⏳ Cooldown! Đợi ${rem}s nữa`,'warning');
      return;
    }

    if(G.tier === 8){
      // Small trib T8→T9
      const c=getSmallTribChance();
      if(Math.random() < c){
        addAnnounce(`🎉 Tiểu Kiếp thành công! ${REALMS[G.realm].name} Tầng 9!`,'success');
        G.tier = 9;
        updateUI();
        checkTribulationStatus();
      }else{
        // FAIL: EXP về 0 + Rớt 1 tier (T8 → T7, min T0)
        G.exp = 0;
        const oldTier = G.tier;
        G.tier = Math.max(0, G.tier - 1);
        addAnnounce(`💥 Tiểu Kiếp thất bại! EXP về 0, rớt về Tầng ${G.tier+1}! Phải cày lại từ đầu!`,'danger');
        addBattleLog(`💥 Tiểu Kiếp thất bại! ${REALMS[G.realm].name} T${oldTier+1} → T${G.tier+1}`, 'dmg');
        _tribCooldownUntil = Date.now() + 10000; // 10s cooldown
        updateUI();
        checkTribulationStatus();
      }
    }else if(G.tier === 9 && G.realm < MAX_REALM){
      // Great trib T9→T10 (advance to next realm)
      const c=getGreatTribChance();
      if(Math.random() < c){
        const enlightenment = Math.min(500, 30 + G.realm*40);
        G.realm++;
        G.tier=0;
        G.exp=0;
        G.savedRealmExp=0;
        G.totalRealmExp=0;
        addAnnounce(`🎉🎉 Đại Kiếp thành công! Phi thăng ${REALMS[G.realm].name}! +${enlightenment} EXP Ngộ Đạo!`,'event');
        addBattleLog(`🎉🎉 Đại Kiếp thành công! Phi thăng ${REALMS[G.realm].name}!`, 'boss');
        addExp(enlightenment);
        updateUI();
        checkTribulationStatus();
        G.huntCountThisHour=0;
      }else{
        // FAIL: EXP về 0 + Rớt từ T9 về T8
        G.exp = 0;
        const oldTier = G.tier;
        G.tier = Math.max(0, G.tier - 1); // T9 → T8
        G.daoTam = Math.max(0, G.daoTam-10);
        addAnnounce(`💀 Đại Kiếp thất bại! EXP về 0, rớt từ Tầng ${oldTier+1} về Tầng ${G.tier+1}! Phải cày lại!`,'danger');
        addBattleLog(`💀 Đại Kiếp thất bại! ${REALMS[G.realm].name} T${oldTier+1} → T${G.tier+1}`, 'dmg');
        _tribCooldownUntil = Date.now() + 15000; // 15s cooldown
        updateUI();
        checkTribulationStatus();
      }
    }else{
      addAnnounce('❌ Không thể đột phá lúc này!','warning');
    }
  }catch(e){
    console.error('attemptTribulation error:',e);
    addAnnounce('❌ Lỗi khi đột phá!','danger');
  }
}

function usePillForTribulation(){
  // T8 Small Trib: Needs Tụ Khí / Tụ Nguyên / Ngưng Thần
  if(G.tier === 8){
    if((G.pills.ngungThan||0)>0) { G.pills.ngungThan--; addAnnounce('💊 Dùng Ngưng Thần Đan','info'); }
    else if((G.pills.tuNguyen||0)>0) { G.pills.tuNguyen--; addAnnounce('💊 Dùng Tụ Nguyên Đan','info'); }
    else if((G.pills.tuKhi||0)>0) { G.pills.tuKhi--; addAnnounce('💊 Dùng Tụ Khí Đan','info'); }
    else { addAnnounce('❌ Không có đan phù hợp!','warning'); return; }
    renderSmallTrib();
    saveGame();
  }
  // T9 Great Trib: Needs Tụ Nguyên / Ngưng Thần
  else if(G.tier === 9){
    if((G.pills.ngungThan||0)>0) { G.pills.ngungThan--; addAnnounce('💊 Dùng Ngưng Thần Đan','info'); }
    else if((G.pills.tuNguyen||0)>0) { G.pills.tuNguyen--; addAnnounce('💊 Dùng Tụ Nguyên Đan','info'); }
    else { addAnnounce('❌ Không có đan phù hợp! (Cần Tụ Nguyên trở lên)','warning'); return; }
    renderGreatTrib();
    saveGame();
  } else {
    addAnnounce('❌ Không thể dùng đan lúc này!','warning');
  }
}
