// ===== TRIBULATION (Fixed: robust try-catch, debug logging) =====
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

    const isAtTribTier = (G.tier === 8) || (G.tier === 9 && G.realm < MAX_REALM);

    if(isAtTribTier){
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
      sec.style.display='none';
      floatBtn.style.display='none';
      if(debugEl) debugEl.style.display='none';
    }
  }catch(e){
    console.error('checkTribulationStatus error:',e);
  }
}

function scrollToTribulation(){
  const sec=document.getElementById('tribulationSection');
  if(sec) sec.scrollIntoView({behavior:'smooth'});
}

function getSmallTribChance(){
  return Math.min(0.95, 0.75 + (G.pills.tuKhi||0)*0.03);
}

function getGreatTribChance(){
  return Math.min(0.95, 0.50 + (G.pills.tuNguyen||0)*0.05 + G.caveLevel*0.01);
}

function renderSmallTrib(){
  const c=getSmallTribChance();
  document.getElementById('tribulationType').innerHTML='⚡ <strong>Tiểu Kiếp</strong> — T9 → T10';
  document.getElementById('tribulationChance').textContent=Math.round(c*100);
  document.getElementById('tribulationChanceBar').style.width=(c*100)+'%';
  document.getElementById('tribulationDetail').textContent=`Cơ sở 75% + ${G.pills.tuKhi||0} Tụ Khí Đan ×3%`;
}

function renderGreatTrib(){
  const c=getGreatTribChance();
  const nextName=G.realm<MAX_REALM?REALMS[G.realm+1].name:'???';
  document.getElementById('tribulationType').innerHTML='💀 <strong>Đại Kiếp</strong> → '+nextName;
  document.getElementById('tribulationChance').textContent=Math.round(c*100);
  document.getElementById('tribulationChanceBar').style.width=(c*100)+'%';
  document.getElementById('tribulationDetail').textContent=`Cơ sở 50% + ${G.pills.tuNguyen||0} Đan×5% + Động Phủ Cấp ${G.caveLevel}×1%`;
}

function attemptTribulation(){
  try{
    if(G.tier === 8){
      // Small trib T9→T10
      const c=getSmallTribChance();
      if(Math.random() < c){
        addAnnounce(`🎉 Tiểu Kiếp thành công! ${REALMS[G.realm].name} Tầng 10!`,'success');
        G.tier = 9;
        updateUI();
        checkTribulationStatus();
      }else{
        const loss=getExpNeeded(G.realm, G.tier) * (0.1+Math.random()*0.05);
        G.exp = Math.max(0, G.exp - loss);
        addAnnounce(`💥 Tiểu Kiếp thất bại! Mất ${Math.round(loss)} EXP`,'danger');
        updateUI();
      }
    }else if(G.tier === 9 && G.realm < MAX_REALM){
      // Great trib T10→next realm
      const c=getGreatTribChance();
      if(Math.random() < c){
        const enlightenment = Math.min(500, 30 + G.realm*40);
        G.realm++;
        G.tier=0;
        G.exp=0;
        G.savedRealmExp=0;
        G.totalRealmExp=0;
        addAnnounce(`🎉🎉 Đại Kiếp thành công! Phi thăng ${REALMS[G.realm].name}! +${enlightenment} EXP Ngộ Đạo!`,'event');
        addExp(enlightenment);
        updateUI();
        checkTribulationStatus();
        G.huntCountThisHour=0;
      }else{
        const loss = (G.totalRealmExp||G.exp) * (0.3+Math.random()*0.2);
        G.exp = Math.max(0, G.exp - loss);
        G.totalRealmExp = Math.max(0, (G.totalRealmExp||0) - loss);
        G.daoTam = Math.max(0, G.daoTam-10);
        addAnnounce(`💀 Đại Kiếp thất bại! Mất ${Math.round(loss)} EXP!`,'danger');
        updateUI();
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
  if(G.tier===8 && (G.pills.tuKhi||0)>0){
    G.pills.tuKhi--;
    addAnnounce('💊 Dùng Tụ Khí Đan +3%','info');
    renderSmallTrib();
    saveGame();
  }else if(G.tier===9 && (G.pills.tuNguyen||0)>0){
    G.pills.tuNguyen--;
    addAnnounce('💊 Dùng Tụ Nguyên Đan +5%','info');
    renderGreatTrib();
    saveGame();
  }else{
    addAnnounce('❌ Không có đan phù hợp! Ghé Đan Dược hoặc Cửa Hàng để mua.','warning');
  }
}
