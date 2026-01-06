// ============================================
// index.js - 商店列表頁面
// ============================================

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const analytics = firebase.analytics(); 

// 管理員UID (懸浮按鈕用)
const adminUIDs = [
  "TKJqrWGdmoPtaZuDmSLOUtTAzqK2",
  "bwYPuwjyX9VTDSVYw5THhFW7xAg2",
];

// ========== State Management ========== //

const DEFAULT_USER_SETTINGS = {
  wheelchairSize: 'small', //預設中小型輪椅
  maxDistanceMeters: 2000,
  needsFriendlyEnvironment: false,
  needsA11yWC: false,
  nearbyMode: false, // 找附近模式
};

const state = {
  userSettings: { ...DEFAULT_USER_SETTINGS },
  searchQuery: '',
  selectedCategory: '全部',
  allShops: [],
  isLoading: true,
  userLocation: null, // 使用者位置 { lat, lng }
  locationPermission: null, // 'granted', 'denied', null
  locationTimestamp: null, // 記錄定位時間
  pendingNearbyMode: false, // 找附近模式按鈕UI預設OFF
};

const LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取定位

// ========== 管理員功能 ========== //

/**
 * 顯示管理員懸浮按鈕
 */
function showAdminButton() {

  // 檢查按鈕是否已存在
  if (document.getElementById('admin-float-btn')) return;
  
  const adminBtn = document.createElement('a');
  adminBtn.id = 'admin-float-btn';
  adminBtn.href = 'storePage.html';
  adminBtn.className = 'fixed bottom-6 right-6 z-50 bg-retro-blue text-white p-4 rounded-full hover:bg-retro-blue/90 hover:translate-y-[-2px] transition-all duration-200 border-2 border-retro-blue';
  adminBtn.setAttribute('aria-label', '商店管理');
  adminBtn.innerHTML = `<i data-lucide="arrow-big-left-dash" size="24"></i>`;
  
  document.body.appendChild(adminBtn);
  
  // 初始化 Lucide 圖示
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * 檢查當前使用者是否為管理員
 */
function checkAdminStatus() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user && adminUIDs.includes(user.uid)) {
      // console.log('管理員身分確認:', user.uid);
      showAdminButton();
    }
  });
}


// ========== 地理位置功能 ========== //

/**
 * 檢查快取的位置是否還有效
 */
function isLocationCacheValid() {
  const savedTimestamp = localStorage.getItem('locationTimestamp');
  if (!savedTimestamp) return false;
  
  const age = Date.now() - parseInt(savedTimestamp);
  return age < LOCATION_CACHE_DURATION;
}

/**
 * 儲存位置到localStorage
 */
function saveLocationToStorage(location) {
  const timestamp = Date.now();
  localStorage.setItem('userLocation', JSON.stringify(location));
  localStorage.setItem('locationTimestamp', timestamp.toString());
  state.userLocation = location;
  state.locationTimestamp = timestamp;
}

/**
 * 從 localStorage 讀取位置
 */
function loadLocationFromStorage() {
  const savedLocation = localStorage.getItem('userLocation');
  const savedTimestamp = localStorage.getItem('locationTimestamp');
  
  if (savedLocation && savedTimestamp) {
    return {
      location: JSON.parse(savedLocation),
      timestamp: parseInt(savedTimestamp)
    };
  }
  return null;
}

/**
 * 請求使用者定位(靜默讀取更新)
 */
async function requestUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('瀏覽器不支援定位功能'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (!isInTaiwan(lat, lng)) {
          reject(new Error('此服務僅限台灣地區使用'));
          return;
        }
        
        resolve({ lat, lng });
      },
      (error) => {
        let message = '無法取得位置';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '拒絕了定位請求';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '位置資訊無法取得';
            break;
          case error.TIMEOUT:
            message = '定位請求逾時';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // 不使用快取，總是取得新位置
      }
    );
  });
}

/**
 * 背景靜默更新位置
 */
async function updateLocationInBackground() {
  
  // 只有在已授權的情況下才靜默更新
  if (state.locationPermission !== 'granted') {
    return;
  }

  try {

    state.locationPermission = 'updating';
    renderShopList();
    
    const location = await requestUserLocation();
    
    // 檢查位置是否有顯著變化（移動超過100公尺才更新）
    if (state.userLocation) {
      const distance = calculateDistance(
        state.userLocation.lat,
        state.userLocation.lng,
        location.lat,
        location.lng
      );
      
      if (distance < 100) {
        // 移動距離太小，不更新
        return;
      }
    }

    state.locationPermission = 'granted';

    // 儲存新位置
    saveLocationToStorage(location);
    
    // 重新計算距離
    updateShopsDistance();
    
    // 重新渲染
    renderShopList();
    
    console.log('位置已更新:', location);
    
  } catch (error) {
    console.log('背景定位更新失敗（不影響使用）:', error.message);
    state.locationPermission = 'granted';
  }
}

/**
 * 處理允許定位
 */
async function handleAllowLocation() {
  
  hideLocationPermissionModal();

  state.locationPermission = 'loading'; // 新增載入狀態
  renderShopList(); // 立即重新渲染，顯示「抓取定位中...」
  
  try {
    const location = await requestUserLocation();
    
    state.locationPermission = 'granted';
    localStorage.setItem('locationPermission', 'granted');
    
    // 儲存位置和時間戳
    saveLocationToStorage(location);
    
    // 計算所有商店的距離
    updateShopsDistance();

    // 如果是從篩選面板觸發的，啟用找附近模式
    if (state.pendingNearbyMode) {
      state.userSettings.nearbyMode = true;
      state.pendingNearbyMode = false; // 重置標記
      
      // 重新渲染篩選面板(如果篩選面板有開啟)
      const filterModal = document.getElementById('filter-modal');
      if (filterModal && !filterModal.classList.contains('hidden')) {
        renderFilterPanel();
      }
    }
    
    // 重新渲染
    renderShopList();
    
  } catch (error) {
    alert(error.message || '定位失敗，將顯示所有店家');
    
    state.locationPermission = 'denied';
    localStorage.setItem('locationPermission', 'denied');
    
    renderShopList();
  }
}


/**
 * 計算兩點之間的距離（公尺）使用 Haversine 公式
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球半徑（公尺）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 回傳公尺
}

/**
 * 檢查座標是否在台灣範圍內
 */
function isInTaiwan(lat, lng) {
  // 台灣本島範圍(約略)
  return lat >= 21.9 && lat <= 25.3 && lng >= 120.0 && lng <= 122.0;
}



/**
 * 顯示定位權限Modal(首次使用需要)
 */
function showLocationPermissionModal() {
  const modal = document.getElementById('location-permission-modal');
  modal.classList.remove('hidden');
  lucide.createIcons();
}

/**
 * 隱藏定位權限 Modal
 */
function hideLocationPermissionModal() {
  const modal = document.getElementById('location-permission-modal');
  modal.classList.add('hidden');
}

/**
 * 更新所有商店的距離資訊
 */
function updateShopsDistance() {
  if (!state.userLocation) {
    // 沒有定位，設定預設距離
    state.allShops.forEach(shop => {
      shop.distanceMeters = 1000; // 預設1公里
    });
    // console.log('無定位資訊，所有店家使用預設顯示');
    return;
  }
  
  state.allShops.forEach(shop => {
    if (shop.latitude && shop.longitude) {
      // 有座標：計算實際距離
      shop.distanceMeters = Math.round(
        calculateDistance(
          state.userLocation.lat,
          state.userLocation.lng,
          shop.latitude,
          shop.longitude
        )
      );
    } else {
      // 沒有座標：設為預設距離
      shop.distanceMeters = 1500; // 設為1.5公里，稍微大一點但不會被過濾
      // console.warn(`⚠️ 店家 ${shop.name} 沒有座標資訊`);
    }
  });
  
  // 依距離排序
  state.allShops.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// ========== 載入商店資料 ========== //

async function loadShopsFromFirestore() {
  try {
    // console.log('📥 開始載入商店資料...');
    state.isLoading = true;
    
    // 暫時移除 status 篩選
    const snapshot = await db.collection('stores')
      .orderBy('visitDate', 'desc')
      .get();
    
    state.allShops = [];
    
    snapshot.forEach(doc => {
      const data = doc.data(); //先取得Data，避免無定位服務甚麼都看不到

      // 過濾掉草稿
      if (data.draft === 1) {
        return;
      }

      const shop = {
        id: doc.id,
        ...doc.data(),
        // 補充計算欄位
        categoryArray: Array.isArray(doc.data().category) ? doc.data().category : [doc.data().category],
        priceLevel: calculatePriceLevel(doc.data().avgCost),
        rating: calculateRating(doc.data()),
        doorWidthCm: parseDoorWidth(doc.data().doorWidthCm),
        distanceMeters: 1000, // 預設距離
        imageUrl: doc.data().store_cover?.[0] || `https://picsum.photos/800/600?random=${doc.id}`,
        //從Firestore讀取經緯度
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };
      
      state.allShops.push(shop);
      // console.log(shop);
    });

     // 更新距離
    updateShopsDistance();
    
    // console.log(`✅ 載入完成，共 ${state.allShops.length} 筆商店資料`);
    state.isLoading = false;
    
  } catch (error) {
    // console.error('❌ 載入商店資料失敗:', error);
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

/**
 * 格式化距離顯示
 */
function formatDistance(meters, useColor = false) {
  const distanceText = meters < 1000 
    ? `${meters} m` 
    : `${(meters / 1000).toFixed(1)} km`;
  
  if (useColor) {
    const colorClass = state.userSettings.nearbyMode ? 'text-retro-blue' : 'text-retro-blue/40';
    return `<span class="${colorClass} font-black">${distanceText}</span>`;
  }
  
  return distanceText;
}

/**
 * 檢查是否有啟用任何篩選條件
 */
function hasActiveFilters() {
  return (
    state.userSettings.wheelchairSize !== DEFAULT_USER_SETTINGS.wheelchairSize ||
    state.userSettings.nearbyModeEnabled !== DEFAULT_USER_SETTINGS.nearbyModeEnabled ||
    state.userSettings.needsFriendlyEnvironment !== DEFAULT_USER_SETTINGS.needsFriendlyEnvironment ||
    state.userSettings.needsAccessibleRestroom !== DEFAULT_USER_SETTINGS.needsAccessibleRestroom
  );
}

/**
 * 更新黃點點顯示狀態
 */
function updateFilterBadge() {
  const badge = document.getElementById('filter-badge');
  if (hasActiveFilters()) {
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ========== 篩選&搜尋功能 ========== //

function getFilteredShops() {
  let filtered = state.allShops.filter(shop => {
    // 搜尋匹配(支援異體字)
    const normalizedQuery = normalizeText(state.searchQuery);
    const normalizedName = normalizeText(shop.name);
    const normalizedAddress = normalizeText(shop.address);

    const matchesSearch = normalizedName.includes(normalizedQuery) || 
                         normalizedAddress.includes(normalizedQuery);
    
    const matchesCategory = state.selectedCategory === '全部' || 
                           shop.categoryArray.includes(state.selectedCategory);
    
    // 門寬匹配(根據輪椅尺寸)
    const fitsDoor = state.userSettings.wheelchairSize === 'small' 
      ? true  // 小型輪椅：所有門都可以通過
      : shop.doorWidthCm >= 75;  // 大型輪椅：只能通過 75cm 以上的門

    let matchesDistance = true;
    if (state.userSettings.nearbyMode && state.locationPermission === 'granted' && state.userLocation) {
      // 只有在「找附近模式啟用」&&「有定位」時才篩選距離
      matchesDistance = shop.distanceMeters <= state.userSettings.maxDistanceMeters;
    }
    // 否則不篩選距離
    
    // 環境友善匹配(便利度 >= 4)
    const matchesFriendly = !state.userSettings.needsFriendlyEnvironment || 
                           (shop.convenience && shop.convenience >= 4);
    
    // 無障礙廁所匹配
    const matchesRestroom = !state.userSettings.needsA11yWC || 
                           (shop.restroom && shop.restroom.includes('無障礙'));

    return matchesSearch && matchesCategory && fitsDoor && matchesDistance && 
            matchesFriendly && matchesRestroom;
  });
  
  // 沒有定位：顯示所有符合條件的店家
  return filtered;

}

// 重置
function resetFilters() {
  state.userSettings = { ...DEFAULT_USER_SETTINGS };
  state.searchQuery = '';
  state.selectedCategory = '全部';
  document.getElementById('search-input').value = '';
  updateFilterBadge(); // 黃點點
  updateCategoryTabs(); // 更新Category
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
  
  // 讀取滑桿
  const distSlider = document.getElementById('filter-dist');
  if (distSlider) {
    state.userSettings.maxDistanceMeters = parseInt(distSlider.value);
  }

  const toggles = document.querySelectorAll('.filter-toggle');
  toggles.forEach(t => {
    if (t.dataset.id === 'nearbyMode') state.userSettings.nearbyMode = t.checked;
    if(t.dataset.id === 'friendly') state.userSettings.needsFriendlyEnvironment = t.checked;
    if(t.dataset.id === 'restroomReq') state.userSettings.needsA11yWC = t.checked;
  });

  // 黃點點
  updateFilterBadge();

  // document.getElementById('filter-badge').classList.remove('hidden');
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
      tab.classList.add('bg-retro-blue', 'text-white', 'shadow-md');
      tab.setAttribute('aria-pressed', 'true');
    } else {
      // 未選中狀態
      tab.classList.remove('bg-retro-blue', 'text-white', 'shadow-md');
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

  // 只有在使用者主動設定距離篩選時才顯示距離限制
  if (state.userSettings.nearbyMode && state.locationPermission === 'granted') {
    document.getElementById('status-dist').textContent = `距離 < ${formatDistance(state.userSettings.maxDistanceMeters)}`;
  } else {
    document.getElementById('status-dist').textContent = state.locationPermission === 'granted' ? '顯示所有店家' : '無定位資訊';
  }


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
      
    const restroomOK = !state.userSettings.needsA11yWC || 
                      (shop.restroom && shop.restroom.includes('無障礙'));
    const isCompatible = fitsDoor && restroomOK;

    // 坡道徽章
    const rampBadge = !shop.ramp || shop.ramp.includes('無坡道') || shop.ramp.includes('順行') ? 
      renderBadge('good', '無坡道') : 
      (shop.ramp.includes('陡峭') ? 
        renderBadge('bad', '坡道陡') : 
        renderBadge('good', '坡道平緩'));
    
    // 廁所徽章
    const restroomBadge = shop.restroom?.includes('無障礙') ? 
      renderBadge('good', '無障礙廁所') : 
      renderBadge('warning', shop.restroom?.split(' ')[0] || '未提供');
    
    // 門寬徽章，用範圍標示比較無疑義
    const doorBadge = shop.doorWidthCm === 75 ? 
      renderBadge('warning', `門寬 ${shop.doorWidthCm -5}~${shop.doorWidthCm +5}cm`) :
      renderBadge('good', `門寬 ${shop.doorWidthCm -5}~${shop.doorWidthCm +5}cm`) ;


    // ========== 修改：距離顯示 ========== 
    let distanceDisplay;
    if (state.locationPermission === 'loading') {
      // 定位中的狀態
      distanceDisplay = '抓取定位中...';
    } else if (state.locationPermission === 'granted' && state.userLocation) {
      // 已定位成功
      distanceDisplay = formatDistance(shop.distanceMeters);
    } else {
      // 未啟用定位
      distanceDisplay = '需啟用定位功能';
    }

    // 卡片 HTML
    const html = `
      <a href="store.html?id=${shop.id}" target="_blank" rel="noopener noreferrer" class="border-default shop-card group bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row relative transition-all duration-300 hover:shadow-xl hover:shadow-retro-blue/10 hover:-translate-y-1 cursor-pointer block ${!isCompatible ? 'opacity-75 grayscale-[0.5]' : ''}">
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
              <span>${distanceDisplay !== undefined ? distanceDisplay : '無定位資訊'}</span>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
              ${rampBadge} ${restroomBadge} ${doorBadge}
            </div>
          </div>
          <div class="pt-4 border-t-2 border-retro-blue/5 flex items-center justify-between text-xs font-bold text-retro-blue/50">
            <div class="flex gap-4">
              <div class="flex items-center text-retro-blue">
                <i data-lucide="container" size="16" class="mr-1 text-retro-blue"></i>
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
        <label class="flex items-center cursor-pointer p-4 border-2 rounded-2xl transition-all border-retro-blue/10 bg-retro-blue/5 }">
          <input type="radio" name="wheelchair-size" value="small" ${state.userSettings.wheelchairSize === 'small' ? 'checked' : ''} class="mr-3 w-5 h-5 accent-retro-blue">
          <div>
            <span class="font-bold text-retro-blue">中小型輪椅</span>
            <span class="text-xs text-retro-blue/50 ml-2">(低於 75 公分)</span>
          </div>
        </label>
        
        <label class="flex items-center cursor-pointer p-4 border-2 rounded-2xl transition-all border-retro-blue/10 bg-retro-blue/5 }">
          <input type="radio" name="wheelchair-size" value="large" ${state.userSettings.wheelchairSize === 'large' ? 'checked' : ''} class="mr-3 w-5 h-5 accent-retro-blue">
          <div>
            <span class="font-bold text-retro-blue">中大型輪椅</span>
            <span class="text-xs text-retro-blue/50 ml-2">(75 公分或以上)</span>
          </div>
        </label>
      </div>
    </section>
    
    <hr class="border-retro-blue/10 border-dashed border-t-2" />
    
    <section class="p-4 border-2 border-retro-blue/10 rounded-2xl bg-white hover:border-retro-blue/30 transition-all shadow-sm }">
      <label class="flex items-center justify-between cursor-pointer" id="nearby-mode-label">
        <div class="flex items-start flex-1">
          <i data-lucide="map-pin" class="mr-3 mt-0.5 text-retro-blue" size="20"></i>
          <div class="flex-1">
            <span class="text-sm font-bold text-retro-blue block">找附近模式</span>
            <p class="text-xs text-retro-blue/50 font-bold mt-1">只顯示指定距離內的店家（需啟用定位）</p>
          </div>
        </div>
        <div class="w-12 h-7 rounded-full p-1 transition-colors border-2 ${state.userSettings.nearbyMode ? 'bg-retro-blue border-retro-blue' : 'bg-slate-100 border-slate-300'} ml-3 flex-shrink-0">
          <div class="w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${state.userSettings.nearbyMode ? 'translate-x-5' : ''}"></div>
        </div>
        <input type="checkbox" class="hidden filter-toggle" data-id="nearbyMode" ${state.userSettings.nearbyMode ? 'checked' : ''}>
      </label>
      
      <div id="distance-slider-section" class="mt-4 pt-4 border-t border-retro-blue/10 ${state.userSettings.nearbyMode ? '' : 'pointer-events-none'}">
        <div class="flex items-center space-x-4">
          <span class="text-xs text-retro-blue/40 font-bold">300m</span>
          <input type="range" min="300" max="3000" step="300" value="${state.userSettings.maxDistanceMeters}" id="filter-dist" class="flex-1 h-3 bg-retro-blue/10 rounded-full appearance-none cursor-pointer ${state.userSettings.nearbyMode ? 'accent-retro-blue' : 'accent-slate-300'}" ${state.userSettings.nearbyMode ? '' : 'disabled'}>
          <span class="text-sm w-20 text-right ${state.userSettings.nearbyMode ? 'text-retro-blue font-black' : 'text-retro-blue/40 font-bold'}" id="disp-dist">${formatDistance(state.userSettings.maxDistanceMeters)}</span>
          </div>
      </div>
    </section>

    <hr class="border-retro-blue/10 border-dashed border-t-2" />

    <section class="space-y-4">
      ${renderToggle('環境友善', 'heart', state.userSettings.needsFriendlyEnvironment, 'friendly', '便利度 4 星以上，不需要太多協助')}
      ${renderToggle('需要無障礙廁所', 'accessibility', state.userSettings.needsA11yWC, 'restroomReq')}
    </section>

    <section class="mt-6">
      <button id="clear-filters-btn" class="w-full py-3 px-4 bg-white text-retro-blue font-display font-bold border-2 border-retro-blue/20 rounded-2xl hover:bg-retro-blue/5 transition-all flex items-center justify-center">
        <i data-lucide="rotate-ccw" class="mr-2" size="18"></i>
        清除所有篩選條件
      </button>
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

/**
 * 異體字統一(用於搜尋比對)
 */
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/臺/g, '台')  // 統一將「臺」轉為「台」
    .toLowerCase();         // 轉小寫
}


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


// ========== 點擊類事件監聽 ========== //

function attachFilterListeners() {
  // 距離滑桿
  const distSlider = document.getElementById('filter-dist');
  const dispDist = document.getElementById('disp-dist');

  if (distSlider && dispDist) {
    distSlider.addEventListener('input', e => {
      dispDist.textContent = formatDistance(parseInt(e.target.value));
    });
  }

   const toggleLabels = document.querySelectorAll('label:has(.filter-toggle)');
  
  toggleLabels.forEach(label => {
    label.addEventListener('click', (e) => {
      const checkbox = label.querySelector('.filter-toggle');
      const toggleSwitch = label.querySelector('.w-12.h-7 > div');
      const toggleBg = label.querySelector('.w-12.h-7');

       // 如果要開啟找附近模式，但沒有定位權限
      if (checkbox.dataset.id === 'nearbyMode') {
        if (!checkbox.checked && state.locationPermission !== 'granted') {
          e.preventDefault();
          
          // 定位成功後要啟用找附近模式
          state.pendingNearbyMode = true;
          
          // 顯示定位權限Modal
          showLocationPermissionModal();
          return;
        }
      }
      
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

       // ========== 找附近模式切換時，控制距離滑桿 ========== 
      if (checkbox.dataset.id === 'nearbyMode') {
        const distanceSection = document.getElementById('distance-slider-section');
        const distSlider = document.getElementById('filter-dist');
        const dispDist = document.getElementById('disp-dist');

        if (checkbox.checked) {
          // 啟用距離滑桿
          distanceSection.classList.remove('opacity-50', 'pointer-events-none');
          distSlider.disabled = false;
          distSlider.classList.remove('accent-slate-300');
          distSlider.classList.add('accent-retro-blue');
          dispDist.classList.remove('text-retro-blue/40', 'font-bold');
          dispDist.classList.add('text-retro-blue', 'font-black');
        } else {
          // 停用距離滑桿
          distanceSection.classList.add('opacity-50', 'pointer-events-none');
          distSlider.disabled = true;
          distSlider.classList.remove('accent-retro-blue');
          distSlider.classList.add('accent-slate-300');
          dispDist.classList.remove('text-retro-blue', 'font-black');
          dispDist.classList.add('text-retro-blue/40', 'font-bold');
        }
      }

      e.preventDefault();
    });
  });

  // ========== 清除條件按鈕 ========== 
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // 重置所有設定為預設值
      state.userSettings = { ...DEFAULT_USER_SETTINGS };

      // 黃點點
      updateFilterBadge();
      
      // 重新渲染篩選面板
      renderFilterPanel();
      
      // console.log('已清除所有篩選條件');
    });
  }
  
}

// 初始事件監聽
function initEventListeners() {

  document.getElementById('search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderShopList();
  });

  document.getElementById('deny-location-btn')?.addEventListener('click', () => {
    hideLocationPermissionModal();
    // 不設定permission，下次進入還會詢問要不要啟用定位
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

  // 定位權限Modal事件
  document.getElementById('allow-location-btn').addEventListener('click', handleAllowLocation);
  // document.getElementById('deny-location-btn').addEventListener('click', handleDenyLocation);
}

// ========== 初始化 ========== //

async function init() {
   const savedPermission = localStorage.getItem('locationPermission');

  //使用定位
  if (savedPermission === 'granted') {
    state.locationPermission = 'granted';
    
    // 檢查快取是否有效
    if (isLocationCacheValid()) {
      // 使用快取的位置
      const cached = loadLocationFromStorage();
      if (cached) {
        state.userLocation = cached.location;
        state.locationTimestamp = cached.timestamp;
        console.log('使用快取位置（' + Math.round((Date.now() - cached.timestamp) / 1000) + '秒前）');
      }
    } else {
      // 快取過期，背景更新
      // console.log('位置快取已過期，正在更新');
      // 先使用舊位置渲染，同時在背景更新
      const cached = loadLocationFromStorage();
      if (cached) {
        state.userLocation = cached.location;
      }
      updateLocationInBackground(); // 背景更新
    }
    
  } else if (savedPermission === 'denied') {
    //暫不使用定位
    state.locationPermission = 'denied';

  } else {
    // 第一次使用，顯示定位權限 Modal
    showLocationPermissionModal();
  }
  
  renderShopList();
  await loadShopsFromFirestore();
  renderShopList();
  initEventListeners();
  lucide.createIcons();
  
  // ========== 新增：定期背景更新 ========== 
  // 每5分鐘檢查一次是否需要更新位置
  setInterval(() => {
    if (state.locationPermission === 'granted' && !isLocationCacheValid()) {
      updateLocationInBackground();
    }
  }, LOCATION_CACHE_DURATION);

   checkAdminStatus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}