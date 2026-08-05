// ===== SHOP =====

// Helper to build rich shop item tooltip HTML
function buildShopTooltip(item, currencyLabel) {
  const icon = item.name.split(' ')[0];
  const name = item.name;
  
  let html = '<div class="tt-header"><div class="tt-icon">' + icon + '</div><div class="tt-title">' + name + '</div></div>';
  html += '<div class="tt-desc">' + item.desc + '</div>';
  
  html += '<div class="tt-stats">';
  
  // Cost row
  if (item.currency === 'jade') {
    html += '<div class="tt-row"><span class="tt-label">🔮 Giá</span><span class="tt-value jade">' + item.cost + ' ' + currencyLabel + '</span></div>';
  } else {
    html += '<div class="tt-row"><span class="tt-label">💎 Giá</span><span class="tt-value jade-green">' + item.cost + ' ' + currencyLabel + '</span></div>';
  }
  
  // Effect for pills
  if (item.expVal) {
    html += '<div class="tt-row"><span class="tt-label">⚡ Hiệu quả</span><span class="tt-value gold">+' + item.expVal + ' EXP</span></div>';
  }
  if (item.effect && item.id && item.id.includes('pill')) {
    html += '<div class="tt-row"><span class="tt-label">💊 Loại</span><span class="tt-value">Đan dược</span></div>';
  }
  
  html += '</div>';
  
  return html;
}

function renderShop(){
  try{
    // Stone shop
    const sgrid=document.getElementById('shopGrid');
    if(!sgrid) return;
    sgrid.innerHTML='';
    SHOP_ITEMS.forEach(item=>{
      const canAfford=item.currency==='stone'?G.spiritStones>=item.cost:G.jade>=item.cost;
      const div=document.createElement('div');
      div.className='shop-card';
      div.onmouseover = (e) => showTooltipAt(e, buildShopTooltip(item, 'Linh Thạch'), 'tooltip-item');
      div.onmouseout = hideTooltip;
      div.innerHTML=`<div class="shop-icon">${item.name.split(' ')[0]}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
        <div class="shop-price">💎 ${item.cost}</div>
        <button class="btn btn-sm btn-shop-buy ${canAfford?'btn-shop':'btn-outline'}" onclick="buyShopItem('${item.id}')" ${canAfford?'':'disabled'}
          style="padding:4px 10px;font-size:11px;margin-top:3px;width:100%">Mua</button>`;
      sgrid.appendChild(div);
    });

    // Jade shop
    const jgrid=document.getElementById('jadeShopGrid');
    if(!jgrid) return;
    jgrid.innerHTML='';
    JADE_SHOP_ITEMS.forEach(item=>{
      const canAfford=item.currency==='jade'?G.jade>=item.cost:G.spiritStones>=item.cost;
      const div=document.createElement('div');
      div.className='shop-card';
      div.onmouseover = (e) => showTooltipAt(e, buildShopTooltip(item, 'Tiên Ngọc'), 'tooltip-item');
      div.onmouseout = hideTooltip;
      div.innerHTML=`<div class="shop-icon">${item.name.split(' ')[0]}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
        <div class="shop-price shop-price-jade">🔮 ${item.cost}</div>
        <button class="btn btn-sm btn-shop-buy ${canAfford?'btn-jade':'btn-outline'}" onclick="buyShopItem('${item.id}')" ${canAfford?'':'disabled'}
          style="padding:4px 10px;font-size:11px;margin-top:3px;width:100%">Mua</button>`;
      jgrid.appendChild(div);
    });
  }catch(e){
    console.error('renderShop error:',e);
  }
}

function buyShopItem(id){
  try{
    // Check stone shop
    const stoneItem=SHOP_ITEMS.find(i=>i.id===id);
    if(stoneItem){
      if(stoneItem.currency==='stone'){
        if(G.spiritStones<stoneItem.cost){
          addAnnounce(`❌ Cần ${stoneItem.cost}💎 (bạn có ${G.spiritStones}💎)`,'warning');
          return;
        }
        G.spiritStones-=stoneItem.cost;
      }else{
        if(G.jade<stoneItem.cost){
          addAnnounce(`❌ Cần ${stoneItem.cost}🔮 (bạn có ${G.jade}🔮)`,'warning');
          return;
        }
        G.jade-=stoneItem.cost;
      }
      stoneItem.effect();
      addAnnounce(`🛒 Mua ${stoneItem.name} thành công!`,'success');
      updateUI();
      return;
    }

    // Check jade shop
    const jadeItem=JADE_SHOP_ITEMS.find(i=>i.id===id);
    if(jadeItem){
      if(jadeItem.currency==='jade'){
        if(G.jade<jadeItem.cost){
          addAnnounce(`❌ Cần ${jadeItem.cost}🔮 (bạn có ${G.jade}🔮)`,'warning');
          return;
        }
        G.jade-=jadeItem.cost;
      }else{
        if(G.spiritStones<jadeItem.cost){
          addAnnounce(`❌ Cần ${jadeItem.cost}💎 (bạn có ${G.spiritStones}💎)`,'warning');
          return;
        }
        G.spiritStones-=jadeItem.cost;
      }
      jadeItem.effect();
      addAnnounce(`🛒 Mua ${jadeItem.name} thành công!`,'success');
      updateUI();
      return;
    }

    addAnnounce('❌ Không tìm thấy vật phẩm!','warning');
  }catch(e){
    console.error('buyShopItem error:',e);
  }
}
