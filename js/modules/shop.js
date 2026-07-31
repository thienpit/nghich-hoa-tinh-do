// ===== SHOP =====
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
      div.onmouseover = (e) => showTooltip(e, item.desc);
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
      div.onmouseover = (e) => showTooltip(e, item.desc);
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
