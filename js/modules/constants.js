// ===== CONSTANTS =====
const REALMS = [
  { name: 'Luyện Khí',   exp: [100,112,125,140,157,176,197,221,248,277] },
  { name: 'Trúc Cơ',     exp: [122,137,153,171,192,215,241,270,302,338] },
  { name: 'Kết Đan',     exp: [149,167,187,209,234,262,294,329,369,413] },
  { name: 'Nguyên Anh',  exp: [182,203,228,255,286,320,358,401,450,504] },
  { name: 'Hóa Thần',    exp: [222,248,278,311,349,390,437,490,549,614] },
  { name: 'Luyện Hư',    exp: [270,303,339,380,425,476,533,597,669,749] },
  { name: 'Hợp Thể',     exp: [330,369,414,463,519,581,651,729,816,914] },
  { name: 'Đại Thừa',    exp: [402,451,505,565,633,709,794,889,996,1116] }
];
const MAX_REALM = REALMS.length - 1;
const MAX_TIER = 9;  // 0-indexed, so tiers 0-9 = 10 tiers

const PILL_TYPES = [
  { id:'tuKhi', name:'Tụ Khí Đan', desc:'+50 EXP', expVal:50, herbCost:3, minRealm:0, successRate:0.85, color:'#4a8ab5' },
  { id:'tuNguyen', name:'Tụ Nguyên Đan', desc:'+200 EXP', expVal:200, herbCost:8, minRealm:1, successRate:0.75, color:'#7a5ab5' },
  { id:'ngungThan', name:'Ngưng Thần Đan', desc:'+500 EXP', expVal:500, herbCost:15, minRealm:2, successRate:0.65, color:'#b55a8a' }
];

const PET_EXP_PER_LEVEL = lvl => 80 * Math.pow(1.2, lvl);
const PET_NAMES = ['🥚 Trứng','🐣 Rồng Con','🐉 Linh Xà','🦅 Hỏa Phượng','🐢 Huyền Vũ','🐲 Thần Long'];

// ===== ADVENTURE AREAS =====
const AREAS = [
  { id:'outskirts', name:'Vùng Ngoại Ô', emoji:'🌿', minRealm:0, desc:'Yêu thú yếu, an toàn', expBase:20, stoneBase:2, lootChance:0.05, bossHp:50, bossName:'Sơn Tinh', bossExp:200, bossStone:20 },
  { id:'bamboo', name:'Rừng Trúc', emoji:'🎋', minRealm:1, desc:'Linh khí nhẹ, thú trung cấp', expBase:35, stoneBase:4, lootChance:0.08, bossHp:120, bossName:'Trúc Yêu', bossExp:500, bossStone:50 },
  { id:'waterfall', name:'Thác Linh Khê', emoji:'💧', minRealm:2, desc:'Linh thủy tràn đầy', expBase:55, stoneBase:7, lootChance:0.10, bossHp:250, bossName:'Giao Long', bossExp:1000, bossStone:100 },
  { id:'volcano', name:'Hỏa Diệm Sơn', emoji:'🌋', minRealm:3, desc:'Lửa địa ngục tu luyện', expBase:80, stoneBase:11, lootChance:0.12, bossHp:500, bossName:'Hỏa Kỳ Lân', bossExp:2000, bossStone:200 },
  { id:'abyss', name:'Vực Sâu U Minh', emoji:'💀', minRealm:4, desc:'Tà khí ngập trời', expBase:110, stoneBase:16, lootChance:0.15, bossHp:1000, bossName:'Ma Đế', bossExp:4000, bossStone:400 },
  { id:'celestial', name:'Thiên Phong Điện', emoji:'⛩️', minRealm:5, desc:'Tiên khí trên chín tầng mây', expBase:150, stoneBase:22, lootChance:0.18, bossHp:2000, bossName:'Lôi Công', bossExp:8000, bossStone:800 },
  { id:'void', name:'Hư Không Cảnh', emoji:'🌀', minRealm:6, desc:'Biên giới thực hư', expBase:200, stoneBase:30, lootChance:0.20, bossHp:4000, bossName:'Hư Không Chi Chủ', bossExp:15000, bossStone:1500 },
  { id:'heaven', name:'Tiên Giới Nhất Trú', emoji:'☯️', minRealm:7, desc:'Cửa ải cuối cùng', expBase:280, stoneBase:45, lootChance:0.25, bossHp:8000, bossName:'Thiên Đạo', bossExp:30000, bossStone:3000 }
];

// ===== SKILLS =====
const ACTIVE_SKILLS = [
  { id:'fireBall', name:'🔥 Hỏa Cầu Thuật', desc:'Đốt cháy linh lực, +50% EXP săn', cd:15, bonusExp:0.5, minRealm:0, cost:50, stoneCost:50 },
  { id:'iceSpike', name:'❄️ Băng Kích', desc:'Đóng băng yêu thú, +100% Linh Thạch', cd:20, bonusStone:1.0, minRealm:1, cost:80, stoneCost:120 },
  { id:'windSlash', name:'🌪️ Phong Nhận', desc:'Chém nhanh như gió, +80% EXP', cd:18, bonusExp:0.8, minRealm:2, cost:120, stoneCost:250 },
  { id:'thunderStrike', name:'⚡ Thiên Lôi Dẫn', desc:'Lôi đình giáng thế, gấp đôi loot', cd:30, bonusLoot:1.0, minRealm:3, cost:200, stoneCost:500 },
  { id:'shadowStep', name:'🌑 Ám Ảnh Bộ', desc:'EXP +150%, mỗi 3 săn miễn phí', cd:45, bonusExp:1.5, minRealm:4, cost:350, stoneCost:1000 },
  { id:'divineJudgment', name:'✨ Thần Phạt', desc:'Tất cả hiệu ứng x3 trong 1 lần', cd:60, bonusAll:2.0, minRealm:6, cost:500, stoneCost:2000 }
];

const PASSIVE_SKILLS = [
  { id:'passiveCult', name:'☯ Tâm Pháp Cơ Bản', desc:'+10% EXP tu luyện', bonus:0.1, minRealm:0, cost:30, stoneCost:30 },
  { id:'passiveAlch', name:'🔥 Đan Đạo Sơ Giải', desc:'+8% tỉ lệ luyện đan', bonus:0.08, minRealm:1, cost:50, stoneCost:100 },
  { id:'passiveStone', name:'💎 Tụ Tài Thuật', desc:'+15% Linh Thạch từ săn', bonus:0.15, minRealm:2, cost:80, stoneCost:200 },
  { id:'passivePet', name:'🐉 Linh Thú Thân Cận', desc:'+20% EXP linh thú', bonus:0.20, minRealm:3, cost:120, stoneCost:400 },
  { id:'passiveBoss', name:'⚔️ Chiến Ý', desc:'+15% sát thương boss', bonus:0.15, minRealm:5, cost:200, stoneCost:1000 }
];

// ===== LOOT ITEMS =====
const LOOT_ITEMS = [
  { id:'thuongCo', name:'Thương Cổ Linh Vật', type:'material', desc:'Tài liệu quý hiếm' },
  { id:'longHuyet', name:'Long Huyết', type:'material', desc:'Tăng 100 EXP khi dùng', expVal:100 }
];

// ===== SHOP ITEMS =====
const SHOP_ITEMS = [
  { id:'herbs3', name:'🌿 Linh Dược ×3', desc:'3 linh dược', cost:8, currency:'stone', effect:()=>{ G.herbs+=3; } },
  { id:'herbs10', name:'🌿 Linh Dược ×10', desc:'10 linh dược', cost:25, currency:'stone', effect:()=>{ G.herbs+=10; } },
  { id:'tuKhiPill', name:'💊 Tụ Khí Đan ×1', desc:'+50 EXP', cost:20, currency:'stone', effect:()=>{ G.pills.tuKhi=(G.pills.tuKhi||0)+1; } },
  { id:'tuNguyenPill', name:'💊 Tụ Nguyên Đan ×1', desc:'+200 EXP', cost:80, currency:'stone', effect:()=>{ G.pills.tuNguyen=(G.pills.tuNguyen||0)+1; } },
  { id:'expScroll100', name:'📜 Linh Phù EXP', desc:'+100 EXP ngay', cost:30, currency:'stone', effect:()=>{ addExp(100); } },
  { id:'expScroll300', name:'📜 Thần Phù EXP', desc:'+300 EXP ngay', cost:80, currency:'stone', effect:()=>{ addExp(300); } },
  { id:'petFood3', name:'🍖 Thức Ăn ×3', desc:'Cho linh thú ăn', cost:12, currency:'stone', effect:()=>{ let f=20+Math.floor(Math.random()*20); if(hasPassive('passivePet')) f=Math.round(f*1.2); G.petExp+=f*3; checkPetLevelUp(); } },
];

const JADE_SHOP_ITEMS = [
  { id:'jadeTuNguyen', name:'💊 Tụ Nguyên Đan ×3', desc:'3 đan luyện khí', cost:3, currency:'jade', effect:()=>{ G.pills.tuNguyen=(G.pills.tuNguyen||0)+3; } },
  { id:'jadeNgungThan', name:'💊 Ngưng Thần Đan ×2', desc:'2 đan hóa thần', cost:5, currency:'jade', effect:()=>{ G.pills.ngungThan=(G.pills.ngungThan||0)+2; } },
  { id:'jadeExp500', name:'✨ Ngộ Đạo Đan', desc:'+500 EXP ngay', cost:10, currency:'jade', effect:()=>{ addExp(500); } },
  { id:'jadeRootBoost', name:'🌟 Linh Căn Phù (30p)', desc:'+0.2 hệ số linh căn 30 phút', cost:15, currency:'jade', effect:()=>{ G.rootBoostUntil=Math.max(G.rootBoostUntil||0,Date.now()+1800000); addAnnounce('🌟 Linh căn tăng 30 phút!','success'); } },
];
