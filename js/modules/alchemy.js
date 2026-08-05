// ===== HERBS & PILLS =====
function gatherHerbs(){
  const now=Date.now();
  const elapsed=(now - G.lastHerbGather)/1000;
  if(elapsed<10){
    addAnnounce(`⏳ Còn ${Math.ceil(10-elapsed)}s`,'warning');
    return;
  }
  const gained=1+Math.floor(Math.random()*4);
  G.herbs+=gained;
  G.lastHerbGather=now;
  addAnnounce(`🌿 +${gained} linh dược`,'success');
  updateUI();
}

function craftPill(id){
  const pill=PILL_TYPES.find(p=>p.id===id);
  if(!pill) return;
  if(G.realm<pill.minRealm){
    addAnnounce(`❌ Cần ${REALMS[pill.minRealm].name}`,'warning');
    return;
  }
  if(G.herbs<pill.herbCost){
    addAnnounce(`❌ Cần ${pill.herbCost} dược`,'warning');
    return;
  }
  G.herbs-=pill.herbCost;
  const rate=Math.min(0.95, pill.successRate + (G.caveLevel-1)*0.03);
  if(Math.random()<rate){
    G.pills[pill.id]=(G.pills[pill.id]||0)+1;
    addAnnounce(`🔥 Luyện 1 ${pill.name}!`,'success');
  }else{
    addAnnounce(`💨 Luyện ${pill.name} thất bại`,'warning');
  }
  updateUI();
}

function usePill(id){
  const pill=PILL_TYPES.find(p=>p.id===id);
  if(!pill || (G.pills[pill.id]||0)<=0) return;
  G.pills[pill.id]--;
  addAnnounce(`💊 +${pill.expVal} EXP`,'success');
  addExp(pill.expVal);
  if(Math.random()<0.04){
    const b=20+Math.floor(Math.random()*80);
    addAnnounce(`✨ Ngộ đạo +${b} EXP!`,'event');
    addExp(b);
  }
  updateUI();
}

function useItem(id){
  const item=LOOT_ITEMS.find(i=>i.id===id);
  if(!item || (G.inventory[id]||0)<=0) return;
  if(item.expVal){
    G.inventory[id]--;
    addExp(item.expVal);
    addAnnounce(`📦 Dùng ${item.name} +${item.expVal} EXP!`,'success');
  }
  updateUI();
}

// ===== TOOLTIP ATTACHMENTS =====
function attachGridTooltips(){
  try{
    if(typeof showTooltip!=='function') return;
    // Pill cards (Luyện đan grid)
    const pg=document.getElementById('pillGrid');
    if(pg){
      pg.querySelectorAll('.item-card').forEach(d=>{
        const p=PILL_TYPES.find(x=>x.name===d.querySelector('.item-name').textContent);
        if(!p) return;
        const rate=Math.min(0.95, p.successRate + (G.caveLevel-1)*0.03);
        d.onmouseover=(e)=>showTooltip(e,
          '<div><b style="color:'+p.color+'">'+p.name+'</b></div>'+
          '<div style="color:#8899b0">'+p.desc+'</div>'+
          '<div>💊 Giá trị: +'+p.expVal+' EXP</div>'+
          '<div>🌿 Chi phí: '+p.herbCost+' linh dược</div>'+
          '<div>🔥 Tỉ lệ thành công: '+Math.round(rate*100)+'%</div>'+
          (G.realm<p.minRealm?'<div style="color:#d87a7a">🔒 Cần '+REALMS[p.minRealm].name+'</div>':'')
        );
        d.onmouseout=hideTooltip;
      });
    }
    // Inventory items (Kho đồ grid)
    const ig=document.getElementById('inventoryGrid');
    if(ig){
      ig.querySelectorAll('.item-card').forEach(d=>{
        const nameEl=d.querySelector('.item-name');
        if(!nameEl) return;
        if(nameEl.textContent==='Trống') return;
        const item=LOOT_ITEMS.find(x=>x.name===nameEl.textContent);
        if(!item) return;
        d.onmouseover=(e)=>showTooltip(e,
          '<div><b style="color:#7ad8a0">'+item.name+'</b></div>'+
          '<div style="color:#8899b0">'+item.desc+'</div>'+
          (item.expVal?'<div>💊 Dùng được: +'+item.expVal+' EXP</div>':'<div style="color:#5a6a80">Vật liệu — dùng để giao dịch</div>')
        );
        d.onmouseout=hideTooltip;
      });
    }
  }catch(e){ console.error('alchemy tooltip attach error:',e); }
}

// Re-attach after every re-render (updateUI rebuilds these grids)
try{
  const _attachAlchemy=()=>{
    attachGridTooltips();
    const gatherBtn=document.querySelector('button[onclick="gatherHerbs()"]');
    if(gatherBtn){
      gatherBtn.onmouseover=(e)=>showTooltip(e,'<div><b>🌿 Hái linh dược</b></div><div style="color:#8899b0">Hái linh dược về luyện đan (tối đa theo động phủ)</div><div>🎲 Nhận 1-4 linh dược mỗi lần, hồi chiêu 10 giây</div>');
      gatherBtn.onmouseout=hideTooltip;
    }
    const pillGrid=document.getElementById('pillGrid');
    const invGrid=document.getElementById('inventoryGrid');
    if(pillGrid && invGrid && typeof MutationObserver==='function'){
      const obs=new MutationObserver(()=>attachGridTooltips());
      obs.observe(pillGrid,{childList:true});
      obs.observe(invGrid,{childList:true});
    }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',_attachAlchemy);
  else _attachAlchemy();
}catch(e){ console.error('alchemy tooltip init error:',e); }
