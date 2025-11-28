// --- 1. Types & Constants (Model 層) ---

const RampStatus = {
  HAS_RAMP_GOOD: '有坡道 (平緩)',
  HAS_RAMP_STEEP: '有坡道 (陡峭)',
  NO_RAMP: '無坡道',
};

const StepStatus = {
  NONE: '平坦無階梯',
  SMALL: '微小門檻 (需翹輪椅)',
  HIGH: '有台階 (需搬運)',
};

const RestroomStatus = {
  ACCESSIBLE: '設有無障礙廁所',
  STANDARD_LEVEL: '一般廁所 (同層)',
  UPSTAIRS: '廁所位於其他樓層',
  NONE: '無廁所',
};

const CirculationStatus = {
  SPACIOUS: '寬敞',
  AVERAGE: '普通',
  CROWDED: '擁擠',
};

const AssistanceLevel = {
  NONE: '完全不需要',
  DOOR: '需協助開門',
  SEATING: '需協助移位',
};

const MOCK_SHOPS = [
  {
    id: '1',
    name: '友善時光咖啡 (Friendly Time Cafe)',
    category: '餐飲',
    priceLevel: 2,
    avgCost: '150-300元',
    description: '位於公園旁的靜謐咖啡廳,店內全平坦設計,非常適合輪椅使用者聚會。',
    address: '台北市大安區和平東路二段118巷',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    distanceMin: 5,
    rating: 5,
    specs: {
      ramp: RampStatus.HAS_RAMP_GOOD,
      steps: StepStatus.NONE,
      restroom: RestroomStatus.ACCESSIBLE,
      circulation: CirculationStatus.SPACIOUS,
      doorWidthCm: 95,
      hasAccessibleParking: true,
      hasElevator: false,
      assistance: AssistanceLevel.NONE,
    },
    transport: {
      nearestParking: '大安森林公園地下停車場 (300m)',
      nearestTransit: '捷運科技大樓站 (步行5分)',
      mrtElevatorExit: '科技大樓站 唯一的出口有電梯',
      recommendedRoute: '沿復興南路直行,路面平整,無須繞路。',
    },
    tags: ['出入口寬敞', '廁所五星級', '輪椅充電座'],
    reviews: [
      { id: 'r1', user: 'Alex', rating: 5, comment: '這是我去過最棒的無障礙咖啡廳,廁所很大,電動輪椅迴轉沒問題。', tags: ['廁所讚'], date: '2023-10-01' },
      { id: 'r2', user: 'Sarah', rating: 4, comment: '動線很好,但週末人有點多。', tags: ['寬敞'], date: '2023-10-15' }
    ]
  },
  {
    id: '2',
    name: '老街古早味麵館',
    category: '餐飲',
    priceLevel: 1,
    avgCost: '80-150元',
    description: '傳承三代的美味麵食,雖然是老房子但經過無障礙改裝。',
    address: '台北市萬華區剝皮寮旁',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    distanceMin: 10,
    rating: 3.5,
    specs: {
      ramp: RampStatus.HAS_RAMP_STEEP,
      steps: StepStatus.SMALL,
      restroom: RestroomStatus.STANDARD_LEVEL,
      circulation: CirculationStatus.AVERAGE,
      doorWidthCm: 80,
      hasAccessibleParking: false,
      hasElevator: false,
      assistance: AssistanceLevel.DOOR,
    },
    transport: {
      nearestParking: '龍山寺地下停車場 (500m)',
      nearestTransit: '捷運龍山寺站 (步行10分)',
      mrtElevatorExit: '出口1',
      recommendedRoute: '建議走廣州街,避開人行道不平處。',
    },
    tags: ['坡道較陡', '無專用廁所', '食物好吃'],
    reviews: [
      { id: 'r3', user: 'John', rating: 3, comment: '門口有一個小檻,需要稍微翹一下輪椅。坡道有點陡,手推如果不夠力要請人幫忙。', tags: ['坡道陡'], date: '2023-09-20' }
    ]
  },
  {
    id: '3',
    name: '雲端景觀餐廳',
    category: '餐飲',
    priceLevel: 4,
    avgCost: '1200-2000元',
    description: '位於高樓層的景觀餐廳,視野極佳。',
    address: '台北市信義區松高路',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    distanceMin: 2,
    rating: 4.5,
    specs: {
      ramp: RampStatus.HAS_RAMP_GOOD,
      steps: StepStatus.NONE,
      restroom: RestroomStatus.ACCESSIBLE,
      circulation: CirculationStatus.SPACIOUS,
      doorWidthCm: 100,
      hasAccessibleParking: true,
      hasElevator: true,
      assistance: AssistanceLevel.NONE,
    },
    transport: {
      nearestParking: '百貨地下停車場 B3',
      nearestTransit: '捷運市政府站',
      mrtElevatorExit: '出口2 (連通百貨)',
      recommendedRoute: '直接從捷運連通道進入百貨電梯上樓。',
    },
    tags: ['百貨共構', '完全平坦', '電梯直達'],
    reviews: [
      { id: 'r4', user: 'Emily', rating: 5, comment: '真的很方便,完全不用淋雨。', tags: ['交通便利'], date: '2023-11-05' }
    ]
  },
  {
    id: '4',
    name: '巷弄文青選物店',
    category: '購物',
    priceLevel: 2,
    avgCost: '300-800元',
    description: '隱藏在巷弄裡的小店,很多特色小物。',
    address: '台北市中山區赤峰街',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    distanceMin: 8,
    rating: 2,
    specs: {
      ramp: RampStatus.NO_RAMP,
      steps: StepStatus.HIGH,
      restroom: RestroomStatus.NONE,
      circulation: CirculationStatus.CROWDED,
      doorWidthCm: 65,
      hasAccessibleParking: false,
      hasElevator: false,
      assistance: AssistanceLevel.SEATING,
    },
    transport: {
      nearestParking: '建成公園停車場',
      nearestTransit: '捷運中山站',
      mrtElevatorExit: '出口4',
      recommendedRoute: '巷子很窄,車多要注意安全。',
    },
    tags: ['輪椅難入', '階梯高', '空間窄'],
    reviews: [
      { id: 'r5', user: 'Mike', rating: 1, comment: '門寬只有65公分,我的電動輪椅完全進不去,只能在門口看。', tags: ['進不去'], date: '2023-08-12' }
    ]
  }
];

const DEFAULT_USER_SETTINGS = {
  wheelchairWidthCm: 70,
  maxDistanceMin: 30,
  allowedRampStatuses: Object.values(RampStatus),
  allowedStepStatuses: Object.values(StepStatus),
  allowedRestroomStatuses: Object.values(RestroomStatus),
  allowedCirculationStatuses: Object.values(CirculationStatus),
  allowedAssistanceLevels: Object.values(AssistanceLevel),
  needsAccessibleParking: false,
  needsElevator: false,
  needsAccessibleRestroom: false,
};

// --- 2. State Management ---

const state = {
  userSettings: { ...DEFAULT_USER_SETTINGS },
  favorites: JSON.parse(localStorage.getItem('accessMapFavorites') || '[]'),
  searchQuery: '',
  selectedShopId: null,
};

// --- 3. Utility Functions ---

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPriceLevel(level) {
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += `<span class="${i < level ? 'text-retro-blue font-black' : 'text-retro-blue/20 font-bold'}">$</span>`;
  }
  return html;
}

function renderBadge(type, text, icon = true) {
  let bgClass, textClass, borderClass, iconName;
  switch (type) {
    case 'good':
      bgClass = 'bg-brand-100'; textClass = 'text-brand-900'; borderClass = 'border-brand-200'; iconName = 'check-circle'; break;
    case 'warning':
      bgClass = 'bg-retro-yellow/20'; textClass = 'text-yellow-800'; borderClass = 'border-retro-yellow/50'; iconName = 'alert-triangle'; break;
    case 'bad':
      bgClass = 'bg-red-100'; textClass = 'text-red-900'; borderClass = 'border-red-200'; iconName = 'x-circle'; break;
    default:
      bgClass = 'bg-slate-100'; textClass = 'text-slate-700'; borderClass = 'border-slate-200'; iconName = 'info'; break;
  }
  
  const iconHtml = icon ? `<i data-lucide="${iconName}" size="14" class="mr-1.5 inline-block align-text-bottom" stroke-width="3"></i>` : '';
  return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${bgClass} ${textClass} ${borderClass} mr-1 mb-1 shadow-sm">${iconHtml}${text}</span>`;
}

function renderFootprintsHtml(status, size = 16) {
  let count = 1;
  if (status === CirculationStatus.SPACIOUS) count = 3;
  else if (status === CirculationStatus.AVERAGE) count = 2;
  
  let html = '';
  for(let i=0; i<count; i++) {
    const margin = i > 0 ? '-ml-1.5' : '';
    html += `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${margin}">
       <g transform="translate(5, 2)">
          <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 2.25-6 6.04-6 .26-.01.52-.01.78 0 2.76.18 4.96 2.57 5.02 5.6.03 2.5-1.03 3.5-1.03 5.62V16h-6.81z" />
       </g>
    </svg>`;
  }
  return `<div class="flex items-center text-retro-blue" title="${status}">${html}</div>`;
}

// --- 4. Business Logic (Controller Functions) ---

/**
 * 篩選符合條件的商店
 */
function getFilteredShops() {
  return MOCK_SHOPS.filter(shop => {
    const matchesSearch = shop.name.includes(state.searchQuery) || 
                         shop.address.includes(state.searchQuery) || 
                         shop.category.includes(state.searchQuery);
    const fitsDoor = shop.specs.doorWidthCm >= state.userSettings.wheelchairWidthCm;
    const matchesDistance = shop.distanceMin <= state.userSettings.maxDistanceMin;
    const matchesRamp = state.userSettings.allowedRampStatuses.includes(shop.specs.ramp);
    const matchesSteps = state.userSettings.allowedStepStatuses.includes(shop.specs.steps);
    const matchesRestroom = state.userSettings.allowedRestroomStatuses.includes(shop.specs.restroom);
    const matchesCirculation = state.userSettings.allowedCirculationStatuses.includes(shop.specs.circulation);
    const matchesAssistance = state.userSettings.allowedAssistanceLevels.includes(shop.specs.assistance);
    const matchesParking = !state.userSettings.needsAccessibleParking || shop.specs.hasAccessibleParking;
    const matchesElevator = !state.userSettings.needsElevator || shop.specs.hasElevator;
    const matchesRestroomReq = !state.userSettings.needsAccessibleRestroom || shop.specs.restroom === RestroomStatus.ACCESSIBLE;

    return matchesSearch && fitsDoor && matchesDistance && matchesRamp && 
           matchesSteps && matchesRestroom && matchesCirculation && 
           matchesAssistance && matchesParking && matchesElevator && matchesRestroomReq;
  });
}

/**
 * 切換收藏狀態
 */
function toggleFavorite(id) {
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter(fid => fid !== id);
  } else {
    state.favorites.push(id);
  }
  localStorage.setItem('accessMapFavorites', JSON.stringify(state.favorites));
}

/**
 * 重置所有篩選條件
 */
function resetFilters() {
  state.userSettings = { ...DEFAULT_USER_SETTINGS };
  state.searchQuery = '';
  document.getElementById('search-input').value = '';
}

/**
 * 應用篩選設定
 */
function applyFilters() {
  // 讀取輪椅寬度
  const typedWidth = parseInt(document.getElementById('input-width').value);
  state.userSettings.wheelchairWidthCm = isNaN(typedWidth) ? 
    parseInt(document.getElementById('filter-width').value) : typedWidth;
  
  // 讀取距離
  state.userSettings.maxDistanceMin = parseInt(document.getElementById('filter-dist').value);
  
  // 讀取核選框
  const checkboxes = document.querySelectorAll('.filter-check');
  const newRamps = [];
  const newRestrooms = [];
  
  checkboxes.forEach(cb => {
    if(cb.checked) {
      if(cb.dataset.cat === 'ramp') newRamps.push(cb.dataset.val);
      if(cb.dataset.cat === 'restroom') newRestrooms.push(cb.dataset.val);
    }
  });
  
  if(newRamps.length) state.userSettings.allowedRampStatuses = newRamps;
  if(newRestrooms.length) state.userSettings.allowedRestroomStatuses = newRestrooms;

  // 讀取切換開關
  const toggles = document.querySelectorAll('.filter-toggle');
  toggles.forEach(t => {
    if(t.dataset.id === 'parking') state.userSettings.needsAccessibleParking = t.checked;
    if(t.dataset.id === 'elevator') state.userSettings.needsElevator = t.checked;
    if(t.dataset.id === 'restroomReq') state.userSettings.needsAccessibleRestroom = t.checked;
  });

  // 顯示篩選徽章
  document.getElementById('filter-badge').classList.remove('hidden');
}

// --- 5. View Rendering Functions ---

/**
 * 渲染商店列表
 */
function renderShopList() {
  const container = document.getElementById('shop-list-container');
  container.innerHTML = '';
  
  const filtered = getFilteredShops();

  // 更新標題資訊
  document.getElementById('recommend-title').textContent = `為您推薦 (${filtered.length})`;
  document.getElementById('status-width').textContent = `輪椅: ${state.userSettings.wheelchairWidthCm}cm`;
  document.getElementById('status-dist').textContent = `距離 < ${state.userSettings.maxDistanceMin}分`;

  // 無結果處理
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-20">
        <p class="text-retro-blue/50 font-bold text-lg font-display">哎呀!找不到符合條件的地點</p>
        <button id="reset-btn" class="mt-6 px-6 py-3 bg-retro-yellow text-retro-blue font-display rounded-xl border-2 border-retro-blue shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] transition-all">重置所有篩選</button>
      </div>`;
    
    document.getElementById('reset-btn')?.addEventListener('click', () => {
      resetFilters();
      renderShopList();
    });
    return;
  }

  // 渲染每個商店卡片
  filtered.forEach(shop => {
    const isFav = state.favorites.includes(shop.id);
    const fitsDoor = shop.specs.doorWidthCm >= state.userSettings.wheelchairWidthCm;
    const restroomOK = !state.userSettings.needsAccessibleRestroom || 
                       shop.specs.restroom === RestroomStatus.ACCESSIBLE;
    const isCompatible = fitsDoor && restroomOK;

    const rampBadge = shop.specs.ramp === RampStatus.NO_RAMP ? 
      renderBadge('bad', '無坡道') : 
      (shop.specs.ramp === RampStatus.HAS_RAMP_STEEP ? 
        renderBadge('warning', '坡道陡') : 
        renderBadge('good', '坡道平緩'));
    
    const restroomBadge = shop.specs.restroom === RestroomStatus.ACCESSIBLE ? 
      renderBadge('good', '無障礙廁所') : 
      renderBadge('warning', '一般廁所');
    
    const doorBadge = renderBadge(fitsDoor ? 'good' : 'bad', `門寬 ${shop.specs.doorWidthCm}cm`);
    const footprints = renderFootprintsHtml(shop.specs.circulation, 16);

    const html = `
      <div class="shop-card group bg-white rounded-3xl border-2 border-retro-blue/10 overflow-hidden flex flex-col md:flex-row relative transition-all duration-300 hover:shadow-xl hover:shadow-retro-blue/10 hover:border-retro-blue/30 hover:-translate-y-1 cursor-pointer ${!isCompatible ? 'opacity-75 grayscale-[0.5]' : ''}" data-id="${shop.id}">
        <div class="h-48 md:h-auto md:w-48 flex-shrink-0 relative overflow-hidden">
          <img src="${shop.imageUrl}" alt="${shop.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
          <button class="fav-btn absolute top-3 right-3 p-2.5 rounded-full bg-white shadow-lg border-2 border-retro-blue/10 hover:border-retro-blue transition-all hover:scale-110 active:scale-95 z-10" data-id="${shop.id}">
            <i data-lucide="heart" size="20" class="${isFav ? 'fill-red-500 text-red-500' : 'text-slate-300'}" stroke-width="3"></i>
          </button>
          ${!isCompatible ? '<div class="absolute inset-0 bg-retro-blue/80 flex items-center justify-center pointer-events-none backdrop-blur-sm"><span class="text-white font-display font-bold border-2 border-white px-4 py-2 rounded-xl transform -rotate-3">不符合需求</span></div>' : ''}
        </div>
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-xl font-display font-bold text-retro-blue leading-tight pr-8">${shop.name}</h3>
              <div class="flex items-center bg-retro-yellow px-2 py-1 rounded-lg text-sm font-black text-retro-blue shadow-[2px_2px_0px_0px_rgba(30,58,138,0.2)] flex-shrink-0 transform rotate-1">
                <i data-lucide="star" size="14" class="fill-retro-blue text-retro-blue mr-1" stroke-width="3"></i>
                ${shop.rating}
              </div>
            </div>
            <div class="flex items-center text-retro-blue/60 text-sm font-bold mb-4">
              <span>${shop.category}</span>
              <span class="flex text-xs tracking-tight ml-2 bg-retro-blue/5 px-2 py-0.5 rounded-md">${renderPriceLevel(shop.priceLevel)}</span>
              <span class="mx-2 text-retro-blue/20">•</span>
              <i data-lucide="map-pin" size="16" class="mr-1 text-retro-blue/50"></i>
              <span>${shop.distanceMin} min</span>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
              ${rampBadge} ${restroomBadge} ${doorBadge}
            </div>
          </div>
          <div class="pt-4 border-t-2 border-retro-blue/5 flex items-center justify-between text-xs font-bold text-retro-blue/50">
            <div class="flex gap-4">
              <div class="flex items-center">
                <div class="mr-2">${footprints}</div> 
                ${shop.specs.circulation}
              </div>
              <div class="flex items-center"><i data-lucide="bath" size="16" class="mr-1" stroke-width="2.5"></i> ${shop.specs.restroom === RestroomStatus.ACCESSIBLE ? 'OK' : 'NO'}</div>
            </div>
            <span class="text-retro-blue group-hover:translate-x-1 transition-transform">查看詳情 →</span>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
  });
  
  // 重新初始化圖標
  lucide.createIcons();

  // 綁定事件監聽器
  attachShopCardListeners();
}

/**
 * 綁定商店卡片事件
 */
function attachShopCardListeners() {
  document.querySelectorAll('.shop-card').forEach(el => {
    el.addEventListener('click', (e) => {
      if(!e.target.closest('.fav-btn')) {
        openDetail(el.dataset.id);
      }
    });
  });
  
  document.querySelectorAll('.fav-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(el.dataset.id);
      renderShopList(); // 重新渲染以更新愛心圖標
    });
  });
}

/**
 * 打開商店詳情頁
 */
function openDetail(id) {
  state.selectedShopId = id;
  const shop = MOCK_SHOPS.find(s => s.id === id);
  if(!shop) return;
  
  const isFav = state.favorites.includes(shop.id);
  const warningList = [];
  
  if (shop.specs.doorWidthCm < state.userSettings.wheelchairWidthCm) {
    warningList.push(`門寬不足 (店: ${shop.specs.doorWidthCm}cm < 您: ${state.userSettings.wheelchairWidthCm}cm)`);
  }
  if (state.userSettings.needsAccessibleRestroom && shop.specs.restroom !== '設有無障礙廁所') {
    warningList.push('無專用無障礙廁所');
  }
  if (shop.specs.ramp === RampStatus.NO_RAMP) {
    warningList.push('入口無坡道');
  }

  let alertHtml = '';
  if (warningList.length > 0) {
    alertHtml = `
      <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-5 shadow-sm transform rotate-[-1deg]">
        <h3 class="font-display font-bold text-red-800 flex items-center mb-2 text-lg">
          <i data-lucide="accessibility" size="24" class="mr-2" stroke-width="2.5"></i> 注意:可能存在障礙
        </h3>
        <ul class="list-disc list-inside text-sm font-bold text-red-700 space-y-1 ml-2">
          ${warningList.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>`;
  } else {
    alertHtml = `
      <div class="bg-brand-50 border-2 border-brand-200 rounded-2xl p-5 shadow-sm transform rotate-1 flex items-center">
        <div class="p-3 bg-brand-100 rounded-full mr-4 border border-brand-200">
          <i data-lucide="star" class="text-brand-600 fill-brand-600" size="24"></i>
        </div>
        <div>
          <h3 class="font-display font-bold text-brand-800 text-lg">暢行無阻!</h3>
          <p class="text-sm font-bold text-brand-700">這地點對您的設備非常友善。</p>
        </div>
      </div>`;
  }

  const tagsHtml = shop.tags.map(t => 
    `<span class="px-4 py-1.5 bg-white text-retro-blue text-sm font-bold rounded-xl border-2 border-retro-blue/10 shadow-sm">#${t}</span>`
  ).join('');
  
  const reviewsHtml = shop.reviews.map(r => `
    <div class="bg-white p-4 rounded-2xl border-2 border-retro-blue/5">
      <div class="flex justify-between items-center mb-2">
        <span class="font-bold text-retro-blue text-lg">${r.user}</span>
        <div class="flex items-center bg-retro-yellow/20 px-2 py-1 rounded-lg">
          <i data-lucide="star" size="14" class="fill-retro-yellow text-yellow-600 mr-1"></i>
          <span class="text-sm font-bold text-yellow-800">${r.rating}</span>
        </div>
      </div>
      <p class="text-retro-blue/80 font-medium">${r.comment}</p>
      <div class="mt-3 flex gap-2">
        ${r.tags.map(t => `<span class="text-xs font-bold text-retro-blue/40 bg-retro-blue/5 px-2 py-1 rounded-md">#${t}</span>`).join('')}
      </div>
    </div>
  `).join('');

  const detailHtml = `
    <div class="relative h-72 w-full rounded-b-[3rem] overflow-hidden shadow-xl shadow-retro-blue/10">
      <img src="${shop.imageUrl}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-retro-blue/90 via-retro-blue/30 to-transparent"></div>
      <button id="back-btn" class="absolute top-6 left-6 bg-white p-3 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all z-20">
        <i data-lucide="arrow-left" size="24" class="text-retro-blue" stroke-width="3"></i>
      </button>
      <button id="detail-fav-btn" class="absolute top-6 right-6 bg-white p-3 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all z-20">
        <i data-lucide="heart" size="24" class="${isFav ? 'fill-red-500 text-red-500' : 'text-slate-300'}" stroke-width="3"></i>
      </button>
      <div class="absolute bottom-8 left-6 right-6 text-white">
        <h1 class="text-3xl font-display font-black leading-none mb-2 drop-shadow-md">${shop.name}</h1>
        <p class="text-white/90 text-sm font-bold flex items-center gap-3">
          <span class="bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">${shop.category}</span>
          <span>${shop.address}</span>
        </p>
      </div>
    </div>

    <div class="max-w-3xl mx-auto p-4 -mt-8 relative z-10 space-y-6">
      ${alertHtml}

      <!-- Photo Gallery Banner -->
      <div class="mt-4">
        <span class="text-xs font-black text-retro-blue/50 uppercase block mb-2 px-1">店家實景與餐點</span>
        <div class="flex space-x-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          <img src="https://picsum.photos/400/300?random=${shop.id}10" class="h-32 w-48 object-cover rounded-2xl border-2 border-retro-blue/10 shadow-sm flex-shrink-0">
          <img src="https://picsum.photos/400/300?random=${shop.id}11" class="h-32 w-48 object-cover rounded-2xl border-2 border-retro-blue/10 shadow-sm flex-shrink-0">
          <img src="https://picsum.photos/400/300?random=${shop.id}12" class="h-32 w-48 object-cover rounded-2xl border-2 border-retro-blue/10 shadow-sm flex-shrink-0">
          <img src="https://picsum.photos/400/300?random=${shop.id}13" class="h-32 w-48 object-cover rounded-2xl border-2 border-retro-blue/10 shadow-sm flex-shrink-0">
        </div>
      </div>
      
      <div class="flex items-stretch justify-between bg-white rounded-3xl border-2 border-retro-blue/10 shadow-lg shadow-retro-blue/5 overflow-hidden">
        <div class="flex flex-col items-center justify-center bg-retro-blue/5 p-6 border-r-2 border-retro-blue/10 w-1/3">
          <span class="text-xs text-retro-blue/60 uppercase tracking-wide font-black mb-1">便利度</span>
          <div class="flex items-end">
            <span class="text-4xl font-display font-black text-retro-blue leading-none">${shop.rating}</span>
          </div>
        </div>
        <div class="flex flex-col justify-center flex-1 p-6">
          <span class="text-xs text-retro-blue/60 uppercase tracking-wide font-black mb-1">平均消費</span>
          <div class="flex items-center justify-between">
            <span class="text-retro-blue font-bold text-lg">${shop.avgCost}</span>
            <div class="flex items-center text-xl">${renderPriceLevel(shop.priceLevel)}</div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">${tagsHtml}</div>

      <div class="mt-4">
        <button class="w-full flex items-center justify-center py-4 bg-retro-blue text-white rounded-2xl font-display font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-1 hover:shadow-none transition-all border-2 border-retro-blue">
          <i data-lucide="navigation" size="20" class="mr-2" stroke-width="2.5"></i> 導航前往
        </button>
      </div>

      <div class="space-y-8">
        <section>
          <h2 class="text-2xl font-display font-black text-retro-blue mb-4 flex items-center"><i data-lucide="accessibility" class="mr-3" size="28"></i> 空間與設施</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${renderDetailItem('出入口坡道', shop.specs.ramp, 'arrow-up-circle')}
            ${renderDetailItem('階梯狀況', shop.specs.steps, 'accessibility')}
            ${renderDetailItem('門寬', shop.specs.doorWidthCm + ' cm', 'door-open')}
            ${renderDetailItem('廁所', shop.specs.restroom, 'users')}
            ${renderDetailItem('內部動線', shop.specs.circulation, renderFootprintsHtml(shop.specs.circulation, 20))}
            ${renderDetailItem('協助需求', shop.specs.assistance, 'help-circle')}
          </div>
        </section>
        <section>
          <h2 class="text-2xl font-display font-black text-retro-blue mb-4 flex items-center"><i data-lucide="truck" class="mr-3" size="28"></i> 交通指引</h2>
          <div class="bg-white rounded-3xl p-6 border-2 border-retro-blue/10 shadow-sm space-y-6">
            <div><span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">最近無障礙車位</span><p class="text-retro-blue font-bold text-lg">${shop.transport.nearestParking}</p></div>
            <hr class="border-retro-blue/10"/>
            <div>
              <span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">捷運 / 公車</span>
              <p class="text-retro-blue font-bold text-lg">${shop.transport.nearestTransit}</p>
              <div class="mt-2 inline-block bg-brand-100 text-brand-800 text-xs font-bold px-3 py-1 rounded-full border border-brand-200">電梯出口: ${shop.transport.mrtElevatorExit}</div>
            </div>
            <hr class="border-retro-blue/10"/>
            <div><span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">推薦無障礙路線</span><p class="text-retro-blue font-medium leading-relaxed">${shop.transport.recommendedRoute}</p></div>
          </div>
        </section>
        <section>
          <h2 class="text-2xl font-display font-black text-retro-blue mb-4">使用者評論</h2>
          <div class="space-y-4">${reviewsHtml}</div>
        </section>
      </div>
    </div>
  `;

  const detailContainer = document.getElementById('detail-view');
  detailContainer.innerHTML = detailHtml;
  document.getElementById('list-view').classList.add('hidden');
  detailContainer.classList.remove('hidden');
  window.scrollTo(0,0);
  lucide.createIcons();

  // 綁定詳情頁事件
  attachDetailListeners(id);
}

/**
 * 綁定詳情頁事件監聽器
 */
function attachDetailListeners(id) {
  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('list-view').classList.remove('hidden');
    renderShopList();
  });
  
  document.getElementById('detail-fav-btn').addEventListener('click', () => {
    toggleFavorite(id);
    openDetail(id); // 重新渲染詳情頁
  });
}

/**
 * 渲染詳情項目
 */
function renderDetailItem(label, value, iconOrHtml) {
  const iconContent = iconOrHtml.startsWith('<') 
    ? iconOrHtml 
    : `<i data-lucide="${iconOrHtml}" size="20"></i>`;

  return `
    <div class="flex items-center p-4 bg-white border-2 border-retro-blue/10 rounded-2xl shadow-sm hover:border-retro-blue/30 transition-colors">
      <div class="text-retro-blue/40 mr-4 bg-retro-blue/5 p-2 rounded-xl flex items-center justify-center min-w-[2.5rem]">${iconContent}</div>
      <div>
        <span class="block text-xs font-bold text-retro-blue/40 mb-0.5">${label}</span>
        <span class="block text-base font-bold text-retro-blue">${value}</span>
      </div>
    </div>`;
}

/**
 * 渲染篩選面板
 */
function renderFilterPanel() {
  const content = document.getElementById('filter-content');
  
  const createCheckbox = (label, checked, category, value) => `
    <label class="flex items-center space-x-3 cursor-pointer p-2 hover:bg-retro-blue/5 rounded-lg transition-colors">
      <div class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${checked ? 'bg-retro-blue border-retro-blue' : 'border-retro-blue/20'}">
        ${checked ? '<i data-lucide="check" size="16" class="text-white" stroke-width="4"></i>' : ''}
      </div>
      <input type="checkbox" class="hidden filter-check" data-cat="${category}" data-val="${value}" ${checked ? 'checked' : ''}>
      <span class="text-sm font-bold text-retro-blue/80">${label}</span>
    </label>`;

  content.innerHTML = `
    <!-- Wheelchair Width -->
    <section class="bg-white p-5 rounded-3xl border-2 border-retro-blue/10 shadow-sm">
      <label class="flex items-center text-lg font-black text-retro-blue mb-2"><i data-lucide="ruler" class="mr-2" size="20"></i> 輪椅尺寸相容模式</label>
      <p class="text-xs font-bold text-retro-blue/50 mb-5">輸入您的輪椅總寬度,系統將自動過濾窄門店家。</p>
      <div class="flex items-center space-x-4">
        <input type="range" min="50" max="120" value="${state.userSettings.wheelchairWidthCm}" id="filter-width" class="flex-1 h-4 bg-retro-blue/10 rounded-full appearance-none cursor-pointer accent-retro-blue">
        <div class="flex flex-col items-center min-w-[5rem] bg-retro-blue px-2 py-1 rounded-xl shadow-sm relative">
          <input type="number" id="input-width" min="50" max="120" value="${state.userSettings.wheelchairWidthCm}" 
                 class="w-full bg-transparent text-xl font-black text-white text-center focus:outline-none appearance-none font-display leading-none p-0 m-0 border-b-2 border-transparent focus:border-retro-yellow transition-colors">
          <span class="text-[10px] text-retro-yellow font-black mt-1">CM</span>
        </div>
      </div>
    </section>
    
    <hr class="border-retro-blue/10 border-dashed border-t-2" />

    <!-- Distance -->
    <section>
      <label class="flex items-center text-base font-black text-retro-blue mb-4"><i data-lucide="map-pin" class="mr-2 text-retro-blue/50" size="18"></i> 距離 (步行分鐘)</label>
      <div class="flex items-center space-x-4 bg-white p-4 rounded-2xl border-2 border-retro-blue/5">
        <span class="text-xs text-retro-blue/40 font-bold">1分</span>
        <input type="range" min="1" max="30" value="${state.userSettings.maxDistanceMin}" id="filter-dist" class="flex-1 h-3 bg-retro-blue/10 rounded-full appearance-none cursor-pointer accent-retro-blue">
        <span class="text-sm font-black text-retro-blue w-14 text-right" id="disp-dist">${state.userSettings.maxDistanceMin} 分內</span>
      </div>
    </section>

    <!-- Status Checks -->
    <section>
      <label class="text-base font-black text-retro-blue mb-3 block">出入口坡道</label>
      <div class="space-y-2">
        ${Object.values(RampStatus).map(s => createCheckbox(s, state.userSettings.allowedRampStatuses.includes(s), 'ramp', s)).join('')}
      </div>
    </section>

    <section>
      <label class="text-base font-black text-retro-blue mb-3 block">廁所狀況</label>
      <div class="space-y-2">
        ${Object.values(RestroomStatus).map(s => createCheckbox(s, state.userSettings.allowedRestroomStatuses.includes(s), 'restroom', s)).join('')}
      </div>
    </section>

    <!-- Toggles -->
    <section class="space-y-4">
      ${renderToggle('需要無障礙停車位', 'truck', 'blue', state.userSettings.needsAccessibleParking, 'parking')}
      ${renderToggle('需要電梯 (若非一樓)', 'arrow-up-circle', 'orange', state.userSettings.needsElevator, 'elevator')}
      ${renderToggle('需要無障礙廁所', 'bath', 'teal', state.userSettings.needsAccessibleRestroom, 'restroomReq')}
    </section>
  `;
  
  lucide.createIcons();
  attachFilterListeners();
}

/**
 * 綁定篩選器事件監聽器
 */
function attachFilterListeners() {
  const widthSlider = document.getElementById('filter-width');
  const widthInput = document.getElementById('input-width');
  
  widthSlider.addEventListener('input', e => {
    widthInput.value = e.target.value;
  });
  
  widthInput.addEventListener('input', e => {
    let val = parseInt(e.target.value);
    if(val >= 50 && val <= 120) {
      widthSlider.value = val;
    }
  });

  document.getElementById('filter-dist').addEventListener('input', e => {
    document.getElementById('disp-dist').textContent = e.target.value + ' 分內';
  });
}

/**
 * 渲染切換開關
 */
function renderToggle(label, icon, color, checked, id) {
  const bgClass = checked ? 
    (color === 'blue' ? 'bg-blue-500 border-blue-500' : 
     color === 'orange' ? 'bg-orange-500 border-orange-500' : 
     'bg-teal-500 border-teal-500') : 
    'bg-slate-100 border-slate-300';
  
  const textClass = color === 'blue' ? 'text-blue-500' : 
                   color === 'orange' ? 'text-orange-500' : 
                   'text-teal-500';

  return `
    <label class="flex items-center justify-between cursor-pointer p-4 border-2 border-retro-blue/10 rounded-2xl bg-white hover:border-retro-blue/30 transition-all shadow-sm">
      <div class="flex items-center">
        <i data-lucide="${icon}" class="mr-3 ${textClass}" size="20"></i>
        <span class="text-sm font-bold text-retro-blue">${label}</span>
      </div>
      <div class="w-12 h-7 rounded-full p-1 transition-colors border-2 ${bgClass}">
        <div class="w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-5' : ''}"></div>
      </div>
      <input type="checkbox" class="hidden filter-toggle" data-id="${id}" ${checked ? 'checked' : ''}>
    </label>
  `;
}

// --- 6. Event Handlers Setup ---

/**
 * 初始化所有事件監聽器
 */
function initEventListeners() {
  // 搜尋輸入
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderShopList();
  });

  // 篩選面板開關
  const modal = document.getElementById('filter-modal');
  document.getElementById('filter-btn').addEventListener('click', () => {
    renderFilterPanel();
    modal.classList.remove('hidden');
  });
  
  document.getElementById('close-filter').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  
  document.getElementById('filter-backdrop').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // 應用篩選按鈕
  document.getElementById('apply-filters-btn').addEventListener('click', () => {
    applyFilters();
    modal.classList.add('hidden');
    renderShopList();
  });

  // Footer 切換
  const footerToggleBtn = document.getElementById('footer-toggle-btn');
  const footerLabel = document.getElementById('footer-label');
  const footerLinks = document.getElementById('footer-links');
  const footerChevron = document.getElementById('footer-chevron');
  
  let isFooterExpanded = false;

  function toggleFooter() {
    isFooterExpanded = !isFooterExpanded;
    if (isFooterExpanded) {
      footerLinks.style.maxHeight = footerLinks.scrollHeight + "px";
      footerChevron.style.transform = "rotate(180deg)";
    } else {
      footerLinks.style.maxHeight = "0px";
      footerChevron.style.transform = "rotate(0deg)";
    }
  }

  if (footerToggleBtn && footerLabel) {
    footerToggleBtn.addEventListener('click', toggleFooter);
    footerLabel.addEventListener('click', toggleFooter);
  }
}

// --- 7. Application Initialization ---

/**
 * 應用程式初始化
 */
function init() {
  renderShopList();
  initEventListeners();
  lucide.createIcons();
}

// 當 DOM 載入完成後啟動應用程式
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}