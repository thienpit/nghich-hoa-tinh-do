// ===== TRIBULATION =====
let _tribCooldownUntil = 0;

function checkTribulationStatus(){
  try{
    const sec=document.getElementById('tribulationSection');
    const floatBtn=document.getElementById('floatingBreakthrough');
    
    if(!sec || !floatBtn || !G) return;

    const now=Date.now();
    const onCooldown = now < _tribCooldownUntil;
    const isAtTribTier = (G.tier === 8) || (G.tier === 9 && G.realm < MAX_REALM);

    if(isAtTribTier && !onCooldown){
      if(G.realm >= MAX_REALM && G.tier >= MAX_TIER){
        sec.style.display='none';
        floatBtn.style.display='none';
        document.getElementById('rebirthSection').style.display='block';
        return;
      }
      sec.style.display='block';
      floatBtn.style.display='block';
      if(G.tier === 8) renderSmallTrib();
      else renderGreatTrib();
    } else {
      if(onCooldown && isAtTribTier){
        sec.style.display='block';
        floatBtn.style.display='none';
        const rem=Math.ceil((_tribCooldownUntil-now)/1000);
        document.getElementById('tribulationType').innerHTML=`⏳ Cooldown — còn ${rem}s`;
        document.getElementById('tribulationChance').textContent='0';
        document.getElementById('tribulationChanceBar').style.width='0%';
        document.getElementById('tribulationDetail').textContent='Thất bại quá nhiều, cần hồi phục!';
      } else {
        sec.style.display='none';
        floatBtn.style.display='none';
      }
    }
  }catch(e){ console.error('checkTribulationStatus error:',e); }
}

function getSmallTribChance(){
  let pills = G.pillsUsedForTrib_Small || 0;
  return Math.min(0.95, 0.70 - G.realm*0.05 + pills*0.03);
}

function getGreatTribChance(){
  let pills = G.pillsUsedForTrib_Great || 0;
  return Math.min(0.95, 0.40 - G.realm*0.05 + pills*0.05 + G.caveLevel*0.01);
}

function renderSmallTrib(){
  const c=getSmallTribChance();
  document.getElementById('tribulationType').innerHTML='⚡ <strong>Tiểu Kiếp</strong> — T9 → T10';
  document.getElementById('tribulationChance').textContent=Math.round(c*100);
  document.getElementById('tribulationChanceBar').style.width=(c*100)+'%';
  document.getElementById('tribulationDetail').textContent=`Cơ sở ${Math.round((0.70-G.realm*0.05)*100)}% + ${G.pillsUsedForTrib_Small||0} Đan đã dùng ×3%`;
}

function renderGreatTrib(){
  const c=getGreatTribChance();
  const nextName=G.realm<MAX_REALM?REALMS[G.realm+1].name:'???';
  document.getElementById('tribulationType').innerHTML='💀 <strong>Đại Kiếp</strong> → '+nextName;
  document.getElementById('tribulationChance').textContent=Math.round(c*100);
  document.getElementById('tribulationChanceBar').style.width=(c*100)+'%';
  document.getElementById('tribulationDetail').textContent=`Cơ sở ${Math.round((0.40-G.realm*0.05)*100)}% + ${G.pillsUsedForTrib_Great||0} Đan đã dùng ×5%`;
}

function attemptTribulation(){
  try{
    if(Date.now() < _tribCooldownUntil){
      addAnnounce('⏳ Đang hồi phục sau thất bại!','warning');
      return;
    }

    if(G.tier === 8){
      const c=getSmallTribChance();
      if(Math.random() < c){
        addAnnounce('🎉 Tiểu Kiếp thành công!','success');
        G.tier = 9;
        G.pillsUsedForTrib_Small = 0; // Reset
        updateUI();
      }else{
        G.exp = 0;
        G.tier = Math.max(0, G.tier - 1);
        G.pillsUsedForTrib_Small = 0; // Reset
        _tribCooldownUntil = Date.now() + 10000;
        addAnnounce('💥 Tiểu Kiếp thất bại! EXP về 0, rớt cấp!','danger');
        updateUI();
      }
    }else if(G.tier === 9 && G.realm < MAX_REALM){
      const c=getGreatTribChance();
      if(Math.random() < c){
        G.realm++; G.tier=0; G.exp=0; G.pillsUsedForTrib_Great = 0;
        addAnnounce('🎉🎉 Đại Kiếp thành công!','event');
        updateUI();
      }else{
        G.exp = 0;
        G.tier = Math.max(0, G.tier - 1);
        G.pillsUsedForTrib_Great = 0; // Reset
        _tribCooldownUntil = Date.now() + 15000;
        addAnnounce('💀 Đại Kiếp thất bại! EXP về 0, rớt cấp!','danger');
        updateUI();
      }
    }
    checkTribulationStatus();
  }catch(e){ console.error(e); }
}

function usePillForTribulation(){
  if(G.tier === 8){
    if((G.pills.tuKhi||0)>0) { G.pills.tuKhi--; G.pillsUsedForTrib_Small=(G.pillsUsedForTrib_Small||0)+1; addAnnounce('💊 Dùng Tụ Khí Đan','info'); }
    else if((G.pills.tuNguyen||0)>0) { G.pills.tuNguyen--; G.pillsUsedForTrib_Small=(G.pillsUsedForTrib_Small||0)+1; addAnnounce('💊 Dùng Tụ Nguyên Đan','info'); }
    else { addAnnounce('❌ Không có Tụ Khí/Nguyên Đan!','warning'); return; }
    renderSmallTrib();
  }else if(G.tier === 9){
    if((G.pills.tuNguyen||0)>0) { G.pills.tuNguyen--; G.pillsUsedForTrib_Great=(G.pillsUsedForTrib_Great||0)+1; addAnnounce('💊 Dùng Tụ Nguyên Đan','info'); }
    else if((G.pills.ngungThan||0)>0) { G.pills.ngungThan--; G.pillsUsedForTrib_Great=(G.pillsUsedForTrib_Great||0)+1; addAnnounce('💊 Dùng Ngưng Thần Đan','info'); }
    else { addAnnounce('❌ Không có Tụ Nguyên/Ngưng Thần Đan!','warning'); return; }
    renderGreatTrib();
  }
  saveGame();
}

// ===== TOOLTIP ATTACHMENTS =====
try{
  const _attachTribTips=()=>{
    if(typeof showTooltip!=='function') return;
    const tribBox=document.getElementById('tribulationContent');
    if(tribBox){
      tribBox.onmouseover=(e)=>{
        const now=Date.now();
        const onCooldown=now < _tribCooldownUntil;
        let html='';
        if(G.tier===8){
          const c=getSmallTribChance();
          html='<div><b>⚡ Tiểu Kiếp</b> — T9 → T10</div>'+
            '<div style="color:#8899b0">Vượt qua để lên cảnh giới mới</div>'+
            '<div>🎯 Tỉ lệ thành công: '+Math.round(c*100)+'%</div>'+
            '<div>💊 Đan đã dùng: '+(G.pillsUsedForTrib_Small||0)+' × +3% mỗi đan</div>';
        }else if(G.tier===9){
          const c=getGreatTribChance();
          const nextName=G.realm<MAX_REALM?REALMS[G.realm+1].name:'???';
          html='<div><b>💀 Đại Kiếp</b> → '+nextName+'</div>'+
            '<div style="color:#8899b0">Kiếp nạn lớn nhất, vượt qua để đột phá cảnh giới</div>'+
            '<div>🎯 Tỉ lệ thành công: '+Math.round(c*100)+'%</div>'+
            '<div>💊 Đan đã dùng: '+(G.pillsUsedForTrib_Great||0)+' × +5% mỗi đan</div>';
        }else{
          html='<div><b>⏳ Đang hồi phục</b></div><div style="color:#8899b0">Thất bại quá nhiều, chờ hết cooldown để thử lại</div>';
        }
        if(onCooldown) html+='<div style="color:#d87a7a">⏳ Đang hồi phục sau thất bại</div>';
        showTooltip(e, html);
      };
      tribBox.onmouseout=hideTooltip;
    }
    // Đột Phá button
    const breakBtn=document.querySelector('button[onclick="attemptTribulation()"]');
    if(breakBtn){
      breakBtn.onmouseover=(e)=>showTooltip(e,'<div><b>⚡ Đột Phá</b></div><div style="color:#8899b0">Vượt qua kiếp nạn để tăng cảnh giới (thất bại sẽ tụt tầng)</div><div>💥 Thất bại: EXP về 0, tụt 1 tầng, hồi chiêu 10-15 giây</div>');
      breakBtn.onmouseout=hideTooltip;
    }
    // Dùng đan button
    const pillBtn=document.querySelector('button[onclick="usePillForTribulation()"]');
    if(pillBtn){
      pillBtn.onmouseover=(e)=>showTooltip(e,'<div><b>💊 Dùng đan</b></div><div style="color:#8899b0">Dùng đan tăng % thành công</div><div>Tiểu Kiếp: +3% mỗi Tụ Khí/Nguyên Đan · Đại Kiếp: +5% mỗi Tụ Nguyên/Ngưng Thần Đan</div>');
      pillBtn.onmouseout=hideTooltip;
    }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',_attachTribTips);
  else _attachTribTips();
}catch(e){ console.error('tribulation tooltip attach error:',e); }
