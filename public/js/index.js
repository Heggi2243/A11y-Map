// ============================================
// index.js - 商店列表頁面
// ============================================

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// ========== State Management ========== //

const DEFAULT_USER_SETTINGS = {
  wheelchairSize: 'small', //預設中小型輪椅
  maxDistanceMin: 30,
  needsFriendlyEnvironment: false,
  needsAccessibleRestroom: false,
};

const state = {
  userSettings: { ...DEFAULT_USER_SETTINGS },
  searchQuery: '',
  selectedCategory: '全部',
  allShops: [],
  isLoading: true,
};

// ========== 載入商店資料 ========== //

async function loadShopsFromFirestore() {
  try {
    console.log('📥 開始載入商店資料...');
    state.isLoading = true;
    
    // 暫時移除 status 篩選
    const snapshot = await db.collection('stores')
      .orderBy('visitDate', 'desc')
      .get();
    
    state.allShops = [];
    
    snapshot.forEach(doc => {
      const shop = {
        id: doc.id,
        ...doc.data(),
        // 補充計算欄位
        categoryArray: Array.isArray(doc.data().category) ? doc.data().category : [doc.data().category],
        priceLevel: calculatePriceLevel(doc.data().avgCost),
        rating: calculateRating(doc.data()),
        doorWidthCm: parseDoorWidth(doc.data().doorWidthCm),
        distanceMin: 5,
        imageUrl: doc.data().store_cover?.[0] || `https://picsum.photos/800/600?random=${doc.id}`,
      };
      
      
      state.allShops.push(shop);
      console.log(shop);
    });

    
    console.log(`✅ 載入完成，共 ${state.allShops.length} 筆商店資料`);
    state.isLoading = false;
    
  } catch (error) {
    console.error('❌ 載入商店資料失敗:', error);
    state.isLoading = false;
    alert('載入資料失敗，請重新整理頁面');
  }
}

// ========== 輔助函式 ========== //

function calculatePriceLevel(avgCost) {
  if (!avgCost) return 2;
  const cost = parseInt(avgCost);
  if (cost < 300) return 1;
  if (cost < 500) return 2;
  if (cost < 800) return 3;
  if (cost < 1200) return 4;
  return 5;
}

function calculateRating(data) {
  const ratings = [
    parseFloat(data.convenience) || 0,
    parseFloat(data.food) || 0,
    parseFloat(data.service) || 0,
  ].filter(r => r > 0);
  
  if (ratings.length === 0) return 3;
  
  const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return Math.round(avg * 2) / 2;
}

function parseDoorWidth(doorWidthStr) {
  if (!doorWidthStr) return 80;
  if (doorWidthStr.includes('90cm以上')) return 95;
  if (doorWidthStr.includes('80~90cm')) return 85;
  if (doorWidthStr.includes('70-80cm')) return 75;
  const match = doorWidthStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 80;
}

// ========== 篩選&搜尋功能 ========== //

function getFilteredShops() {
  return state.allShops.filter(shop => {
    // 搜尋匹配
    const matchesSearch = shop.name.includes(state.searchQuery) || 
                         shop.address.includes(state.searchQuery) ;
    
    const matchesCategory = state.selectedCategory === '全部' || 
                           shop.categoryArray.includes(state.selectedCategory);
    
                           // 門寬匹配（根據輪椅尺寸）
    const fitsDoor = state.userSettings.wheelchairSize === 'small' 
      ? true  // 小型輪椅：所有門都可以通過
      : shop.doorWidthCm >= 75;  // 大型輪椅：只能通過 75cm 以上的門
    
    // 距離匹配
    const matchesDistance = shop.distanceMin <= state.userSettings.maxDistanceMin;
  
    
    // 環境友善匹配(便利度 >= 4)
    const matchesFriendly = !state.userSettings.needsFriendlyEnvironment || 
                           (shop.convenience && shop.convenience >= 4);
    
    // 無障礙廁所匹配
    const matchesRestroom = !state.userSettings.needsAccessibleRestroom || 
                           (shop.restroom && shop.restroom.includes('無障礙'));

    return matchesSearch && matchesCategory && fitsDoor && matchesDistance && 
            matchesFriendly && matchesRestroom;
  });
}

// 重置
function resetFilters() {
  state.userSettings = { ...DEFAULT_USER_SETTINGS };
  state.searchQuery = '';
  state.selectedCategory = '全部';
  document.getElementById('search-input').value = '';
   updateCategoryTabs(); //更新Category
  renderShopList();
}

function applyFilters() {
  // 讀取輪椅尺寸選項
  const sizeRadios = document.querySelectorAll('input[name="wheelchair-size"]');
  sizeRadios.forEach(radio => {
    if (radio.checked) {
      state.userSettings.wheelchairSize = radio.value;
    }
  });

  const toggles = document.querySelectorAll('.filter-toggle');
  toggles.forEach(t => {
    if(t.dataset.id === 'friendly') state.userSettings.needsFriendlyEnvironment = t.checked;
    if(t.dataset.id === 'restroomReq') state.userSettings.needsAccessibleRestroom = t.checked;
  });

  document.getElementById('filter-badge').classList.remove('hidden');
  renderShopList();
}

/**
 * 更新類別按鈕的視覺狀態
 */
function updateCategoryTabs() {
  const tabs = document.querySelectorAll('.category-tab');
  
  tabs.forEach(tab => {
    const category = tab.dataset.category;
    
    if (category === state.selectedCategory) {
      // 選中狀態
      tab.classList.remove('bg-white', 'border-2', 'border-retro-blue/10', 'text-retro-blue');
      tab.classList.add('bg-retro-blue', 'text-white');
      tab.setAttribute('aria-pressed', 'true');
    } else {
      // 未選中狀態
      tab.classList.remove('bg-retro-blue', 'text-white');
      tab.classList.add('bg-white', 'border-2', 'border-retro-blue/10', 'text-retro-blue');
      tab.setAttribute('aria-pressed', 'false');
    }
  });
}

/**
 * 切換類別
 */
function switchCategory(category) {
  state.selectedCategory = category;
  updateCategoryTabs();
  renderShopList();
}

// ========== 渲染 ========== //

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

  // 更新狀態顯示
  const sizeText = state.userSettings.wheelchairSize === 'small' ? '中小型' : '中大型';
  document.getElementById('status-width').textContent = `輪椅: ${sizeText}`;
  document.getElementById('status-dist').textContent = `距離 < ${state.userSettings.maxDistanceMin}分`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-20">
        <p class="text-retro-blue/50 font-bold text-lg font-display">哎呀!找不到符合條件的地點</p>
        <button id="reset-btn" class="mt-6 px-6 py-3 bg-retro-yellow text-retro-blue font-display rounded-xl border-2 border-retro-blue shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] transition-all">重置所有篩選</button>
      </div>`;
    
    document.getElementById('reset-btn')?.addEventListener('click', resetFilters);
    return;
  }

  filtered.forEach(shop => {
    const fitsDoor = state.userSettings.wheelchairSize === 'small' 
      ? true  // 小型輪椅所有門都可以
      : shop.doorWidthCm >= 75;
      
    const restroomOK = !state.userSettings.needsAccessibleRestroom || 
                      (shop.restroom && shop.restroom.includes('無障礙'));
    const isCompatible = fitsDoor && restroomOK;

    // 坡道徽章
    const rampBadge = !shop.ramp || shop.ramp.includes('無坡道') || shop.ramp.includes('順行') ? 
      renderBadge('good', '無坡道') : 
      (shop.ramp.includes('陡峭') ? 
        renderBadge('warning', '坡道陡') : 
        renderBadge('good', '坡道平緩'));
    
    // 廁所徽章
    const restroomBadge = shop.restroom?.includes('無障礙') ? 
      renderBadge('good', '無障礙廁所') : 
      renderBadge('warning', shop.restroom?.split(' ')[0] || '未提供');
    
    // 門寬徽章，用回範圍標示比較無疑義
    const doorBadge = renderBadge(fitsDoor ? 'good' : 'bad', `門寬 ${shop.doorWidthCm -5}~${shop.doorWidthCm +5}cm`);
    
    // 動線圖示
    const footprints = renderFootprintsHtml(shop.circulation, 16);

    // 卡片 HTML
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
              <span>${Array.isArray(shop.category) ? shop.category.join(', ') : shop.category}</span>
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
                內部空間：${shop.circulation || '未提供'}
              </div>
            </div>
            <span class="text-retro-blue group-hover:translate-x-1 transition-transform">查看詳情 →</span>
          </div>
        </div>
      </a>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
  });
  
  lucide.createIcons();
}

function renderFilterPanel() {
  const content = document.getElementById('filter-content');

  content.innerHTML = `
    <section class="bg-white p-5 rounded-3xl border-2 border-retro-blue/10 shadow-sm">
      <label class="flex items-center text-lg font-black text-retro-blue mb-2">
        <i data-lucide="ruler" class="mr-2" size="20"></i> 輪椅尺寸
      </label>
      <p class="text-xs font-bold text-retro-blue/50 mb-5">選擇您的輪椅尺寸，系統將自動過濾不適合的店家。</p>
      
      <div class="space-y-3">
        <label class="flex items-center cursor-pointer p-4 border-2 rounded-2xl transition-all ${state.userSettings.wheelchairSize === 'small' ? 'border-retro-blue bg-retro-blue/5' : 'border-retro-blue/10 bg-white hover:border-retro-blue/30'}">
          <input type="radio" name="wheelchair-size" value="small" ${state.userSettings.wheelchairSize === 'small' ? 'checked' : ''} class="mr-3 w-5 h-5 accent-retro-blue">
          <div>
            <span class="font-bold text-retro-blue">中小型輪椅</span>
            <span class="text-xs text-retro-blue/50 ml-2">(低於 75 公分)</span>
          </div>
        </label>
        
        <label class="flex items-center cursor-pointer p-4 border-2 rounded-2xl transition-all ${state.userSettings.wheelchairSize === 'large' ? 'border-retro-blue bg-retro-blue/5' : 'border-retro-blue/10 bg-white hover:border-retro-blue/30'}">
          <input type="radio" name="wheelchair-size" value="large" ${state.userSettings.wheelchairSize === 'large' ? 'checked' : ''} class="mr-3 w-5 h-5 accent-retro-blue">
          <div>
            <span class="font-bold text-retro-blue">中大型輪椅</span>
            <span class="text-xs text-retro-blue/50 ml-2">(75 公分或以上)</span>
          </div>
        </label>
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
      ${renderToggle('環境友善', 'heart', state.userSettings.needsFriendlyEnvironment, 'friendly', '便利度 4 星以上，不需要太多協助')}
      ${renderToggle('需要無障礙廁所', 'accessibility', state.userSettings.needsAccessibleRestroom, 'restroomReq')}
    </section>
  `;
  
  lucide.createIcons();
  attachFilterListeners();
}

function renderToggle(label, icon, checked, id, description = '') {

  const bgClass = checked ? 'bg-retro-blue border-retro-blue' : 'bg-slate-100 border-slate-300';
  
  const descriptionHtml = description ? 
    `<p class="text-xs text-retro-blue/50 font-bold mt-1">${description}</p>` : '';

  return `
    <label class="flex items-center justify-between cursor-pointer p-4 border-2 border-retro-blue/10 rounded-2xl bg-white hover:border-retro-blue/30 transition-all shadow-sm">
      <div class="flex items-start flex-1">
        <i data-lucide="${icon}" class="mr-3 mt-0.5 text-retro-blue" size="20"></i>
        <div class="flex-1">
          <span class="text-sm font-bold text-retro-blue block">${label}</span>
          ${descriptionHtml}
        </div>
      </div>
      <div class="w-12 h-7 rounded-full p-1 transition-colors border-2 ${bgClass} ml-3 flex-shrink-0">
        <div class="w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${checked ? 'translate-x-5' : ''}"></div>
      </div>
      <input type="checkbox" class="hidden filter-toggle" data-id="${id}" ${checked ? 'checked' : ''}>
    </label>
  `;
}

// ========== UI 工具函式 ========== //

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

// ========== 點擊類事件監聽 ========== //

function attachFilterListeners() {
  // 距離滑桿(記得改)
  document.getElementById('filter-dist').addEventListener('input', e => {
    document.getElementById('disp-dist').textContent = e.target.value + ' 分內';
  });
   const toggleLabels = document.querySelectorAll('label:has(.filter-toggle)');
  
  toggleLabels.forEach(label => {
    label.addEventListener('click', (e) => {
      const checkbox = label.querySelector('.filter-toggle');
      const toggleSwitch = label.querySelector('.w-12.h-7 > div');
      const toggleBg = label.querySelector('.w-12.h-7');
      
      // 切換checkbox狀態
      checkbox.checked = !checkbox.checked;
      
      // 即時更新視覺效果
      if (checkbox.checked) {
        toggleSwitch.classList.add('translate-x-5');
        toggleBg.classList.remove('bg-slate-100', 'border-slate-300');
        toggleBg.classList.add('bg-retro-blue', 'border-retro-blue');
      } else {
        toggleSwitch.classList.remove('translate-x-5');
        toggleBg.classList.remove('bg-retro-blue', 'border-retro-blue');
        toggleBg.classList.add('bg-slate-100', 'border-slate-300');
      }
      
      e.preventDefault();
    });
  });
  
}

// 初始事件監聽
function initEventListeners() {
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderShopList();
  });

   // ========= 類別按鈕事件 ========== //
  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      switchCategory(category);
    });
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

// ========== 初始化 ========== //

async function init() {
  console.log('接收到初始化命令');
  
  renderShopList();
  await loadShopsFromFirestore();
  renderShopList();
  initEventListeners();
  lucide.createIcons();
  
  console.log('準備好了');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}