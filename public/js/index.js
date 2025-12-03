// ============================================
// index.js - 整合 Firestore stores 資料
// ============================================

/**
 * 1. user訪問index.html
   ↓
2. init() 初始化
   ↓
3. renderShopList() → 顯示"載入中...""
   ↓
4. loadShopsFromFirestore() → 從Firestore提取資料
   ↓
5. 資料填入state.allShops
   ↓
6. renderShopList() → 渲染商店資訊
   ↓
7. user看到商店列表
 */



// --- Firebase 初始化 ---
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// --- 1. 使用者設定 ---

const DEFAULT_USER_SETTINGS = {
  wheelchairWidthCm: 70,
  maxDistanceMin: 30,
  allowedCategories: ['餐飲', '景點', '購物', '住宿'],
  needsAccessibleParking: false,
  needsElevator: false,
  needsAccessibleRestroom: false,
};

// --- 2. State Management ---

const state = {
  userSettings: { ...DEFAULT_USER_SETTINGS },
  searchQuery: '',
  selectedShopId: null,
  allShops: [],
  isLoading: true,
};

// --- 3. Utility Functions ---

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
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
  return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${bgClass} ${textClass} ${borderClass} mr-1 mb-1 shadow-sm">${iconHtml}${escapeHtml(text)}</span>`;
}

function renderFootprintsHtml(circulation, size = 16) {
  let count = 1;
  if (circulation === '寬敞') count = 3;
  else if (circulation === '普通') count = 2;
  else if (circulation === '略顯壅擠') count = 1;
  
  let html = '';
  for(let i=0; i<count; i++) {
    const margin = i > 0 ? '-ml-1.5' : '';
    html += `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block ${margin}">
       <g transform="translate(5, 2)">
          <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 2.25-6 6.04-6 .26-.01.52-.01.78 0 2.76.18 4.96 2.57 5.02 5.6.03 2.5-1.03 3.5-1.03 5.62V16h-6.81z" />
       </g>
    </svg>`;
  }
  return `<div class="flex items-center text-retro-blue" title="${circulation}">${html}</div>`;
}

// --- 4. Firestore 資料載入 ---

/**
 * 從Firestore取得資料
 */
async function loadShopsFromFirestore() {
  try {
    console.log('📥 開始載入商店資料...');
    state.isLoading = true;
    
    const snapshot = await db.collection('stores')
      .orderBy('到訪日期', 'desc')
      .get();
    
    state.allShops = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      const shop = {
        id: doc.id,
        name: data.店家名稱 || '未命名店家',
        category: Array.isArray(data.類別) ? data.類別.join(', ') : data.類別 || '其他',
        categoryArray: Array.isArray(data.類別) ? data.類別 : [data.類別],
        priceLevel: calculatePriceLevel(data.一人平均消費),
        avgCost: data.一人平均消費 ? `${data.一人平均消費}元` : '未提供',
        description: data.心得 || '暫無描述',
        address: data.店家地址 || '地址未提供',
        imageUrl: Array.isArray(data.store_cover) && data.store_cover.length > 0 
          ? data.store_cover[0] 
          : 'https://picsum.photos/800/600?random=' + doc.id,
        images: {
          cover: data.store_cover || [],
          entrance: data.entrance_photo || [],
          interior: data.interior_photo || [],
        },
        distanceMin: 5,
        rating: calculateRating(data),
        visitDate: data.到訪日期 || null,
        
        specs: {
          ramp: data.出入口坡道 || '未提供',
          steps: Array.isArray(data.階梯狀況) ? data.階梯狀況.join(', ') : data.階梯狀況 || '未提供',
          restroom: data.廁所 || '未提供',
          restroomFloor: data.廁所位在幾樓 || null,
          circulation: data.內部動線 || '未提供',
          doorWidthCm: parseDoorWidth(data.門寬),
          hasAccessibleParking: !!data.最近無障礙車位,
          hasElevator: false,
          assistance: Array.isArray(data.協助需求) ? data.協助需求.join(', ') : data.協助需求 || '未提供',
          assistanceOther: data.其他協助需求補充 || null,
        },
        
        transport: {
          nearestParking: data.最近無障礙車位 || '未提供',
          nearestTransit: buildTransitInfo(data),
          mrtElevatorExit: data.捷運補充說明 || '未提供',
          busInfo: data.公車補充說明 || null,
          recommendedRoute: data.推薦無障礙路線 || '未提供',
          mapUrl: data.地圖網址 || null,
        },
        
        ratings: {
          circulation: parseFloat(data.動線和便利度評分) || 0,
          food: parseFloat(data.食物評分) || 0,
          service: parseFloat(data.服務評分) || 0,
        },
        
        tags: generateTags(data),
        reviews: [],
      };
      
      state.allShops.push(shop);
    });
    
    console.log(`✅ 載入完成，共 ${state.allShops.length} 筆商店資料`);
    state.isLoading = false;
    
  } catch (error) {
    console.error('❌ 載入商店資料失敗:', error);
    state.isLoading = false;
    alert('載入資料失敗，請重新整理頁面');
  }
}

// ========== 輔助函式：資料轉換 ========== //

/**
 * 計算價格等級 (1-5)
 */
function calculatePriceLevel(avgCost) {
  if (!avgCost) return 2;
  const cost = parseInt(avgCost);
  if (cost < 300) return 1;
  if (cost < 500) return 2;
  if (cost < 800) return 3;
  if (cost <= 1200) return 4;
  return 5;
}

/**
 * 計算綜合評分
 */
function calculateRating(data) {
  const ratings = [
    parseFloat(data.動線和便利度評分) || 0,
    parseFloat(data.食物評分) || 0,
    parseFloat(data.服務評分) || 0,
  ].filter(r => r > 0);
  
  if (ratings.length === 0) return 3;
  
  const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return Math.round(avg * 2) / 2;
}

/**
 * 解析門寬 (從字串提取數字)
 */
function parseDoorWidth(doorWidthStr) {
  if (!doorWidthStr) return 80;
  
  // 從 "寬敞(90cm以上)" 提取數字
  if (doorWidthStr.includes('90cm以上')) return 95;
  if (doorWidthStr.includes('80~90cm')) return 85;
  if (doorWidthStr.includes('70-80cm')) return 75;
  
  const match = doorWidthStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 80;
}

/**
 * 建立交通資訊
 */
function buildTransitInfo(data) {
  const transits = [];
  
  if (data.公車 && Array.isArray(data.公車)) {
    if (data.公車.includes('捷運') && data.捷運補充說明) {
      transits.push(`捷運: ${data.捷運補充說明}`);
    }
    if (data.公車.includes('公車') && data.公車補充說明) {
      transits.push(`公車: ${data.公車補充說明}`);
    }
  }
  
  return transits.length > 0 ? transits.join(' / ') : '未提供';
}

/**
 * 生成標籤
 */
function generateTags(data) {
  const tags = [];
  
  // 根據坡道狀況
  if (data.出入口坡道 === '有坡道 (平緩)' || data.出入口坡道 === '無坡道 (順行)') {
    tags.push('坡道友善');
  }
  if (data.出入口坡道 === '有坡道 (陡峭)') tags.push('坡道較陡');
  
  // 根據廁所
  if (data.廁所 && data.廁所.includes('無障礙')) tags.push('無障礙廁所');
  
  // 根據門寬
  const doorWidth = parseDoorWidth(data.門寬);
  if (doorWidth >= 90) tags.push('門寬寬敞');
  
  // 根據動線
  if (data.內部動線 === '寬敞') tags.push('動線寬敞');
  
  // 根據協助需求
  if (Array.isArray(data.協助需求) && data.協助需求.includes('無須協助')) {
    tags.push('完全無障礙');
  }
  
  return tags;
}

// --- 5. 篩選資料 --

/**
 * 篩選符合條件的商店
 */
function getFilteredShops() {
  return state.allShops.filter(shop => {
    const matchesSearch = shop.name.includes(state.searchQuery) || 
                         shop.address.includes(state.searchQuery) || 
                         shop.category.includes(state.searchQuery);
    
    const matchesCategory = state.userSettings.allowedCategories.some(cat => 
      shop.categoryArray.includes(cat)
    );
    
    const fitsDoor = shop.specs.doorWidthCm >= state.userSettings.wheelchairWidthCm;
    const matchesDistance = shop.distanceMin <= state.userSettings.maxDistanceMin;
    const matchesParking = !state.userSettings.needsAccessibleParking || shop.specs.hasAccessibleParking;
    const matchesElevator = !state.userSettings.needsElevator || shop.specs.hasElevator;
    const matchesRestroomReq = !state.userSettings.needsAccessibleRestroom || shop.specs.restroom.includes('無障礙');

    return matchesSearch && matchesCategory && fitsDoor && matchesDistance && 
           matchesParking && matchesElevator && matchesRestroomReq;
  });
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
  const typedWidth = parseInt(document.getElementById('input-width').value);
  state.userSettings.wheelchairWidthCm = isNaN(typedWidth) ? 
    parseInt(document.getElementById('filter-width').value) : typedWidth;
  
  state.userSettings.maxDistanceMin = parseInt(document.getElementById('filter-dist').value);

  const toggles = document.querySelectorAll('.filter-toggle');
  toggles.forEach(t => {
    if(t.dataset.id === 'parking') state.userSettings.needsAccessibleParking = t.checked;
    if(t.dataset.id === 'elevator') state.userSettings.needsElevator = t.checked;
    if(t.dataset.id === 'restroomReq') state.userSettings.needsAccessibleRestroom = t.checked;
  });

  document.getElementById('filter-badge').classList.remove('hidden');
}


/**
 * 6. 渲染列表
 */
function renderShopList() {
  const container = document.getElementById('shop-list-container');
  
  if (state.isLoading) {
    container.innerHTML = `
      <div class="text-center py-20">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-retro-blue border-t-transparent mx-auto mb-4"></div>
        <p class="text-retro-blue font-bold text-lg">載入中...</p>
      </div>`;
    return;
  }
  
  container.innerHTML = '';
  const filtered = getFilteredShops();

  document.getElementById('recommend-title').textContent = `為您推薦 (${filtered.length})`;
  document.getElementById('status-width').textContent = `輪椅: ${state.userSettings.wheelchairWidthCm}cm`;
  document.getElementById('status-dist').textContent = `距離 < ${state.userSettings.maxDistanceMin}分`;

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

  filtered.forEach(shop => {
    const fitsDoor = shop.specs.doorWidthCm >= state.userSettings.wheelchairWidthCm;
    const restroomOK = !state.userSettings.needsAccessibleRestroom || shop.specs.restroom.includes('無障礙');
    const isCompatible = fitsDoor && restroomOK;

    // 坡道徽章
    const rampBadge = shop.specs.ramp === '無坡道' ? 
      renderBadge('good', '無坡道') : 
      (shop.specs.ramp === '有坡道 (陡峭)' ? 
        renderBadge('warning', '坡道陡') : 
        renderBadge('good', '坡道平緩'));
    
    // 廁所徽章
    const restroomBadge = shop.specs.restroom.includes('無障礙') ? 
      renderBadge('good', '無障礙廁所') : 
      renderBadge('warning', shop.specs.restroom.split(' ')[0]);
    
    const doorBadge = renderBadge(fitsDoor ? 'good' : 'bad', `門寬 ${shop.specs.doorWidthCm}cm`);
    const footprints = renderFootprintsHtml(shop.specs.circulation, 16);

    // ======== 修改為<a>，可在分頁開啟 ========== //
    const html = `
      <a href="store.html?id=${shop.id}" target="_blank" rel="noopener noreferrer" class="shop-card group bg-white rounded-3xl border-2 border-retro-blue/10 overflow-hidden flex flex-col md:flex-row relative transition-all duration-300 hover:shadow-xl hover:shadow-retro-blue/10 hover:border-retro-blue/30 hover:-translate-y-1 cursor-pointer block ${!isCompatible ? 'opacity-75 grayscale-[0.5]' : ''}">
        <div class="h-48 md:h-auto md:w-48 flex-shrink-0 relative overflow-hidden">
          <img src="${shop.imageUrl}" alt="${escapeHtml(shop.name)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://picsum.photos/800/600?random=${shop.id}'">
          ${!isCompatible ? '<div class="absolute inset-0 bg-retro-blue/80 flex items-center justify-center pointer-events-none backdrop-blur-sm"><span class="text-white font-display font-bold border-2 border-white px-4 py-2 rounded-xl transform -rotate-3">不符合需求</span></div>' : ''}
        </div>
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-xl font-display font-bold text-retro-blue leading-tight pr-8">${escapeHtml(shop.name)}</h3>
              <div class="flex items-center bg-retro-yellow px-2 py-1 rounded-lg text-sm font-black text-retro-blue shadow-[2px_2px_0px_0px_rgba(30,58,138,0.2)] flex-shrink-0 transform rotate-1">
                <i data-lucide="star" size="14" class="fill-retro-blue text-retro-blue mr-1" stroke-width="3"></i>
                ${shop.rating}
              </div>
            </div>
            <div class="flex items-center text-retro-blue text-sm font-bold mb-4">
              <span>${shop.category}</span>
              <span class="flex text-xs text-white tracking-tight ml-2 bg-retro-blue/10 px-2 py-0.5 rounded-md">${renderPriceLevel(shop.priceLevel)}</span>
              <span class="mx-2 text-retro-blue/20">•</span>
              <i data-lucide="map-pin" size="16" class="mr-1 text-retro-blue"></i>
              <span>${shop.distanceMin} min</span>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
              ${rampBadge} ${restroomBadge} ${doorBadge}
            </div>
          </div>
          <div class="pt-4 border-t-2 border-retro-blue/5 flex items-center justify-between text-xs font-bold text-retro-blue/50">
            <div class="flex gap-4">
              <div class="flex items-center text-retro-blue">
                <div class="mr-2">${footprints}</div> 
                ${shop.specs.circulation}
              </div>
              <div class="flex items-center text-retro-blue"><i data-lucide="accessibility" size="16" class="mr-1" stroke="#1e3a8a" stroke-width="2.5"></i> ${shop.specs.restroom.includes('無障礙') ? 'OK' : 'NO'}</div>
            </div>
            <span class="text-retro-blue group-hover:translate-x-1 transition-transform">查看詳情 →</span>
          </div>
        </div>
      </a>
    `;
    // ============================================================== //
    container.insertAdjacentHTML('beforeend', html);
  });
  
  lucide.createIcons();
}


/**
 * 渲染篩選面板
 */
function renderFilterPanel() {
  const content = document.getElementById('filter-content');

  content.innerHTML = `
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

    <section>
      <label class="flex items-center text-base font-black text-retro-blue mb-4"><i data-lucide="map-pin" class="mr-2 text-retro-blue/50" size="18"></i> 距離</label>
      <div class="flex items-center space-x-4 bg-white p-4 rounded-2xl border-2 border-retro-blue/5">
        <span class="text-xs text-retro-blue/40 font-bold">1分</span>
        <input type="range" min="1" max="60" value="${state.userSettings.maxDistanceMin}" id="filter-dist" class="flex-1 h-3 bg-retro-blue/10 rounded-full appearance-none cursor-pointer accent-retro-blue">
        <span class="text-sm font-black text-retro-blue w-14 text-right" id="disp-dist">${state.userSettings.maxDistanceMin} 分內</span>
      </div>
    </section>

    <section class="space-y-4">
      ${renderToggle('需要無障礙停車位', 'truck', 'blue', state.userSettings.needsAccessibleParking, 'parking')}
      ${renderToggle('需要電梯 (若非一樓)', 'arrow-up-circle', 'orange', state.userSettings.needsElevator, 'elevator')}
      ${renderToggle('需要無障礙廁所', 'accessibility', 'teal', state.userSettings.needsAccessibleRestroom, 'restroomReq')}
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

// --- 7. Event Handlers Setup ---

/**
 * 初始化所有事件監聽器
 */
function initEventListeners() {
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderShopList();
  });

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

  document.getElementById('apply-filters-btn').addEventListener('click', () => {
    applyFilters();
    modal.classList.add('hidden');
    renderShopList();
  });

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

// --- 8. Application Initialization ---

/**
 * 應用程式初始化
 */
async function init() {
  console.log('🚀 應用程式啟動');
  
  renderShopList();
  await loadShopsFromFirestore();
  renderShopList();
  initEventListeners();
  lucide.createIcons();
  
  console.log('✅ 應用程式準備就緒');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}