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
