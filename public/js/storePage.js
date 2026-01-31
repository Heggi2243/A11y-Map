// ============================================
// storePage Controller
// ============================================

import { handleLogout, createPagination, getPageSlice, formatDate } from '../utils/basic.js';


/**
 * 更新:變數集中營
 */
const elements = {
  logoutBtn: document.getElementById('logout-btn'),
  tableBody: document.getElementById('table-body'),
  searchInput: document.getElementById('search-input'), // 新增
  generateFallbackBtn: document.getElementById('generateFallback'),
  createSiteMapBtn: document.getElementById('createSiteMap'),
};

// Firebase 配置
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage(); // <-刪除Storage圖片

// 分頁控制器
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let allStore = [];
let filteredStore = []; // 新增：篩選後的資料

// ============================================
// 身份驗證
// ============================================

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    console.log('未登入');
    // 未登入跳轉
    alert('❌ 您尚未登入，將跳轉到登入頁');
    window.location.href = '/loginPage.html';
    return;
  }

  console.log('已登入:', user.uid);
  await loadStoreList();
});

// ============================================
// Fallback HTML 產生器（給 SEO / 爬蟲）
// ============================================

/**
 * 簡單的 HTML escape，避免內容破壞標籤結構
 */
function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 取得依 createdAt 由新到舊排序後的前 N 筆資料
 */
function getLatestStoresByCreatedAt(limit = 10) {
  if (!Array.isArray(allStore) || allStore.length === 0) return [];

  const storesWithCreatedAt = allStore.filter(store => store.createdAt);

  const sorted = storesWithCreatedAt.sort((a, b) => {
    const getTime = (value) => {
      if (!value) return 0;
      // Firestore Timestamp 物件
      if (typeof value.toMillis === 'function') {
        return value.toMillis();
      }
      // ISO 字串或一般日期字串
      const t = new Date(value).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    return getTime(b.createdAt) - getTime(a.createdAt);
  });

  return sorted.slice(0, limit);
}

/**
 * 根據規格產生 Fallback 用的純 HTML 字串
 */
function buildFallbackHtml() {
  const latestStores = getLatestStoresByCreatedAt(10);

  if (latestStores.length === 0) {
    return '<!-- 目前沒有可用的店家資料供 Fallback 使用 -->';
  }

  const articles = latestStores.map(store => {
    const name = escapeHtml(store.name || '');
    const address = escapeHtml(store.address || '');
    const ramp = escapeHtml(store.ramp || '');
    const steps = escapeHtml(store.steps || '');
    const doorWidthCm = escapeHtml(store.doorWidthCm || '');
    const restroom = escapeHtml(store.restroom || '');
    const description = escapeHtml(store.description || '');
    const visitDate = escapeHtml(store.visitDate || '');


    return [
      '<article class="seo-fallback">',
      `  <h3><a href="/store/${store.id}">${name}</a></h3>`,
      `  <p>地址：${address}</p>`,
      `  <p>【無障礙資訊】<strong>坡道設置：${ramp}</strong>、<strong>階梯狀況：${steps}</strong>、<strong>門寬：${doorWidthCm}</strong>、<strong>廁所：${restroom}</strong></p>`,
      `  <p>參訪心得：${description}</p>`,
      `  <p>參訪日期：${visitDate}</p>`,
      '</article>'
    ].join('\n');
  });

  return articles.join('\n\n');
}

/**
 * 點擊「生成Fallback」按鈕時，產生 HTML 並讓使用者複製
 */
async function handleGenerateFallbackClick() {
  const html = buildFallbackHtml();

  console.log('生成的 Fallback HTML：\n', html);

  // 嘗試直接複製到剪貼簿（若瀏覽器/環境允許）
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(html);
      alert('已生成並複製Fallback HTML到剪貼簿！\n若失敗，可從console中手動複製。');
      return;
    }
  } catch (err) {
    // 如果剪貼簿權限失敗就 fallback 到 prompt
    console.warn('無法寫入剪貼簿，改用提示視窗供複製：', err);
  }

  // 最保險的方式：用 prompt 讓使用者自行複製
  window.prompt('以下為生成的 Fallback HTML，請手動全選後複製：', html);
}

if (elements.generateFallbackBtn) {
  elements.generateFallbackBtn.addEventListener('click', handleGenerateFallbackClick);
}

// ============================================
// Sitemap XML 產生器（給 SEO / 爬蟲）
// ============================================

/**
 * XML escape，避免內容破壞 XML 結構
 */
function escapeXml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 處理 entrance_photo，可能是陣列或單一值
 */
function getEntrancePhotos(store) {
  const storeName = store.name || store.id || '未知店家';
  
  if (!store.entrance_photo) {
    console.log(`📷 [${storeName}] 沒有出入口照片`);
    return [];
  }
  
  if (Array.isArray(store.entrance_photo)) {
    const validPhotos = store.entrance_photo.filter(photo => photo && typeof photo === 'string');
    console.log(`📷 [${storeName}] 找到 ${validPhotos.length} 張出入口照片（原始資料：${store.entrance_photo.length} 筆）`);
    return validPhotos;
  }
  
  console.log(`📷 [${storeName}] 找到 1 張出入口照片（單一值格式）`);
  return [store.entrance_photo];
}

/**
 * 生成單一店家的 sitemap URL 區塊
 */
function generateStoreUrlBlock(store) {
  const storeId = store.id || '';
  const loc = `https://a11y-map.web.app/store/${storeId}`;
  const lastmod = store.updatedAt ? formatDate(store.updatedAt) : '';
  const storeName = escapeXml(store.name || '');
  const entrancePhotos = getEntrancePhotos(store);
  
  let urlBlock = `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
`;
  
  // 如果有出入口照片，加入 image:image 區塊
  if (entrancePhotos.length > 0) {
    entrancePhotos.forEach(photoUrl => {
      if (photoUrl) {
        urlBlock += `    
    <image:image>
      <image:loc>${escapeXml(photoUrl)}</image:loc>
      <image:title>${storeName}的出入口實景照</image:title>
    </image:image>
`;
      }
    });
  }
  
  urlBlock += `    
  </url>`;
  
  return urlBlock;
}

/**
 * 生成完整的 sitemap.xml 內容
 */
async function generateSitemapXml() {
  try {
    // 確保資料已載入
    if (allStore.length === 0) {
      console.log('🔄 正在載入店家資料...');
      await loadStoreList();
    }
    
    if (allStore.length === 0) {
      alert('❌ 目前沒有店家資料可供生成 sitemap');
      return '';
    }
    
    console.log(`🚀 開始生成 sitemap.xml，共 ${allStore.length} 筆店家資料`);
    
    // XML 標頭與命名空間
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
    
    // 生成所有店家的 URL 區塊
    console.log('📝 正在處理每家店家的資料...');
    const urlBlocks = allStore.map((store, index) => {
      const progress = `[${index + 1}/${allStore.length}]`;
      console.log(`${progress} 處理店家：${store.name || store.id || '未知'}`);
      return generateStoreUrlBlock(store);
    });
    
    console.log('✅ 所有店家資料處理完成！');
    
    // 組合完整的 sitemap.xml
    const sitemapXml = `${xmlHeader}
${urlBlocks.join('\n\n')}
</urlset>`;
    
    console.log(`✨ sitemap.xml 生成完成！總長度：${sitemapXml.length} 字元`);
    
    return sitemapXml;
    
  } catch (error) {
    console.error('❌ 生成 sitemap.xml 失敗:', error);
    alert('❌ 生成 sitemap.xml 失敗: ' + error.message);
    return '';
  }
}

/**
 * 點擊「生成sitemap」按鈕時，產生 sitemap.xml 並讓使用者複製
 */
async function handleCreateSiteMapClick() {
  const sitemapXml = await generateSitemapXml();
  
  if (!sitemapXml) {
    return;
  }
  
  console.log('生成的 sitemap.xml：\n', sitemapXml);
  
  // 嘗試直接複製到剪貼簿（若瀏覽器/環境允許）
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(sitemapXml);
      alert('✅ 已生成並複製 sitemap.xml 到剪貼簿！\n若失敗，可從 console 中手動複製。');
      return;
    }
  } catch (err) {
    // 如果剪貼簿權限失敗就 fallback 到 prompt
    console.warn('無法寫入剪貼簿，改用提示視窗供複製：', err);
  }
  
  // 最保險的方式：用 prompt 讓使用者自行複製
  window.prompt('以下為生成的 sitemap.xml，請手動全選後複製：', sitemapXml);
}

if (elements.createSiteMapBtn) {
  elements.createSiteMapBtn.addEventListener('click', handleCreateSiteMapClick);
}

// ============================================
// 登出功能
// ============================================

elements.logoutBtn.addEventListener('click', () => handleLogout(db));

/**
 * 載入資料庫
 */
async function loadStoreList() {
    try {
        const snapshot = await db.collection('stores').get();
        
        // 修正：每次都建立新的陣列，避免累積
        allStore = [];
        
        snapshot.forEach(doc => {
           allStore.push({
            id: doc.id,
            ...doc.data()
           }) 
        });

        // ========== 新增：以 documentId 降冪排序 ========== 
        allStore.sort((a, b) => {
          const idA = a.documentId || a.id;
          const idB = b.documentId || b.id;
          return idB.localeCompare(idA); // 降冪排序（新的在前）
        });

        console.log(`載入完成，共 ${allStore.length} 筆資料`);

        // 初始化篩選結果
        filteredStore = [...allStore];
        
        currentPage = 1;
        renderCurrentPage();
        
    } catch (error) {
        console.error('載入商店列表失敗:', error);
    }
}

// ========== 新增：搜尋功能 ========== 
/**
 * 處理搜尋
 */
function handleSearch() {
  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  
  if (searchTerm === '') {
    // 搜尋框為空，顯示所有資料
    filteredStore = [...allStore];
  } else {
    // 根據店名篩選
    filteredStore = allStore.filter(store => {
      const name = (store.name || '').toLowerCase();
      return name.includes(searchTerm);
    });
  }
  
  // console.log(`搜尋結果: ${filteredStore.length} 筆`);
  
  // 重置到第一頁
  currentPage = 1;
  renderCurrentPage();
}

/**
 * 初始化搜尋監聽
 */
function initSearchListener() {
  if (elements.searchInput) {
    // 輸入時即時搜尋
    elements.searchInput.addEventListener('input', handleSearch);
  }
}

// ============================================
// 表格渲染
// ============================================
function renderTable(stores){

  // console.log('開始渲染表格...');
  
  // 清空舊的表格內容
  elements.tableBody.innerHTML = '';

  if (stores.length === 0){
    // console.log('沒有資料');
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="px-3 py-8 text-center text-gray-500">
          ${elements.searchInput.value.trim() ? '找不到符合的店家' : '目前沒有店家資料'}
        </td>
      </tr>
    `;
    return;
  }

  stores.forEach(store =>{
    const row = document.createElement('tr');
    row.className = 'hover:bg-blue-50 transition-colors';

    // 處理可能是陣列的store_cover
    const coverImage = Array.isArray(store.store_cover) 
      ? store.store_cover[0] 
      : store.store_cover;
    
    // 可能是陣列的類別
    const category = Array.isArray(store.category)
      ? store.category.join(', ')
      : store.category;

    row.innerHTML = `
    <td class="px-3 py-2 whitespace-nowrap">
      <img src="${coverImage || '../img/cat.png'}" alt="${store.name|| 'Unknown'}" class="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110 rounded-lg">
    </td>
    <td class="px-3 py-2 whitespace-nowrap max-w-[200px] md:max-w-none">
      <div class="flex items-center gap-2 mb-1">
        <span class="bg-retro-yellow text-retro-blue text-xs font-black px-1.5 p-1 rounded border border-retro-blue"> ${category || '未設置'}</span>
        ${store.draft === 1 ? '<span class="bg-orange-500 text-white text-xs font-black px-2 py-1 rounded border-2 border-orange-700 ">草稿</span>' : ''}
        <h3 class="text-xl font-black text-retro-blue truncate tracking-tight">${store.name}</h3>
      </div>
      <div class="flex items-center text-retro-blue/80 text-sm font-bold truncate">
        <i data-lucide="map-pin" class="w-3 h-3 mr-1"></i>
        <span class="truncate">${store.address|| 'Unknown'}</span>
      </div>
      <div class="flex items-center text-retro-blue text-sm font-bold truncate">
      ${store.visitDate|| 'Unknown'}
      </div>
    </td>
    <td class="px-3 py-2 whitespace-nowrap">
      <div class="flex flex-col items-center gap-2">
          <button 
            onclick="editStore('${store.id}')" 
            class="p-3 rounded-full bg-retro-blue text-white border-2 border-retro-blue hover:bg-retro-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-retro-blue" 
            aria-label="編輯店家"
          >
            <i data-lucide="pencil" class="text-white" width="1em" height="1em" ></i>
          </button>
          <button 
            onclick="deleteStore('${store.id}')" 
            class="p-3 rounded-full bg-retro-blue text-white border-2 border-retro-blue hover:bg-retro-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-retro-blue" 
            aria-label="刪除店家"
          >
             <i data-lucide="trash-2" class="text-white" width="1em" height="1em" ></i>
          </button>
      </div>
    </td>
    `;
    elements.tableBody.appendChild(row);
  });

  //  console.log(`渲染完成，共 ${stores.length} 筆`);

   if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ============================================
// 分頁功能
// ============================================

function renderPagination() {

  const tableSection = elements.tableBody.closest('section');
  
  createPagination({
    currentPage: currentPage,
    totalItems: filteredStore.length, // 改用 filteredStore
    itemsPerPage: ITEMS_PER_PAGE,
    onPageChange: (newPage) => {
      currentPage = newPage;
      renderCurrentPage();
    },
    container: tableSection
  });
}


function renderCurrentPage() {
  const sessionsToShow = getPageSlice(filteredStore, currentPage, ITEMS_PER_PAGE); // 改用 filteredStore
  renderTable(sessionsToShow);
  renderPagination();
  
  // 滾動到頂部
  // window.scrollTo({ top: 500, behavior: 'smooth' });
}


/**
 * 編輯店家
 */
window.editStore = function(storeId) {
  console.log('✏️ 編輯店家:', storeId);
  window.location.href = `/uploadPage.html?id=${storeId}`;
};

/**
 * 刪除店家
 */
window.deleteStore = async function(storeId) {
  if (!confirm('⚠️ 確定要刪除此店家嗎？\n\n此操作將會：\n1. 刪除所有店家圖片\n2. 刪除店家資料\n\n此操作無法復原！')) {
    console.log('❌ 用戶取消刪除');
    return;
  }
  
  try {
    console.log('🗑️ 正在刪除店家:', storeId);
    
    // ========== Step 1: 取得店家資料 ========== //
    const doc = await db.collection('stores').doc(storeId).get();
    
    if (!doc.exists) {
      alert('❌ 找不到此店家');
      return;
    }
    
    const storeData = doc.data();
    console.log('📦 店家資料:', storeData);
    
    // ========== Step 2: 收集所有圖片 URL ========== //
    const allImageUrls = [];
    
    // 店家封面
    if (Array.isArray(storeData.store_cover)) {
      allImageUrls.push(...storeData.store_cover);
    } else if (storeData.store_cover) {
      allImageUrls.push(storeData.store_cover);
    }
    
    // 門口照片
    if (Array.isArray(storeData.entrance_photo)) {
      allImageUrls.push(...storeData.entrance_photo);
    } else if (storeData.entrance_photo) {
      allImageUrls.push(storeData.entrance_photo);
    }
    
    // 內部照片
    if (Array.isArray(storeData.interior_photo)) {
      allImageUrls.push(...storeData.interior_photo);
    } else if (storeData.interior_photo) {
      allImageUrls.push(storeData.interior_photo);
    }
    
    // 過濾掉空值
    const validUrls = allImageUrls.filter(url => url && typeof url === 'string');
    
    console.log(`🖼️ 找到 ${validUrls.length} 張圖片需要刪除`);
    
    // ========== Step 3: 刪除所有圖片 ========== //
    const deletePromises = validUrls.map(async (url) => {
      try {
        // 從 URL 取得 Storage Reference
        const imageRef = storage.refFromURL(url);
        await imageRef.delete();
        console.log('✅ 刪除圖片成功:', url);
      } catch (error) {
        // 圖片可能已經不存在，忽略錯誤
        if (error.code === 'storage/object-not-found') {
          console.warn('⚠️ 圖片不存在（可能已被刪除）:', url);
        } else {
          console.error('❌ 刪除圖片失敗:', url, error);
        }
      }
    });
    
    // 等待所有圖片刪除完成
    await Promise.all(deletePromises);
    
    // ========== Step 4: 刪除 Firestore 文件 ========== //
    await db.collection('stores').doc(storeId).delete();
    
    console.log('✅ 刪除完成');
    alert('✅ 刪除成功！\n已刪除所有圖片和店家資料。');
    
    // 重新載入列表
    await loadStoreList();
    
  } catch (error) {
    console.error('❌ 刪除失敗:', error);
    console.error('錯誤代碼:', error.code);
    console.error('錯誤訊息:', error.message);

    if (error.code === 'permission-denied') {
      alert('❌ 權限不足\n\n可能原因：\n1. 您不是管理員\n2. 登入狀態已過期\n\n請重新登入後再試');
    } else {
      alert('❌ 刪除失敗: ' + error.message);
    }
  }
};

// ========== 新增：初始化搜尋功能 ========== 
initSearchListener();