// ============================================
// storePage Controller
// ============================================

import { handleLogout, createPagination, getPageSlice } from '../utils/basic.js';


/**
 * 更新:變數集中營
 */
const elements = {
  logoutBtn: document.getElementById('logout-btn'),
  tableBody: document.getElementById('table-body'),
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
// 登出功能
// ============================================

elements.logoutBtn.addEventListener('click', () => handleLogout(db));

/**
 * 載入資料庫
 */
async function loadStoreList() {
    try {
        // 如果我只需要取特定幾筆:
        // let query = db.collection('stores');
        // query = query.orderBy('documentId', 'desc'); //(資料>1000筆再在資料庫使用)

        const snapshot = await db.collection('stores').get();
        // console.log(snapshot);
        
        //  修正：每次都建立新的陣列，避免累積
        allStore = [];
        
        snapshot.forEach(doc => {
           allStore.push({
            id: doc.id,
            ...doc.data()
           }) 
        });

        // console.log(`載入完成，共 ${allStore.length} 筆資料`);


        currentPage = 1;
        renderCurrentPage();
        
        
    } catch (error) {
        console.error('載入商店列表失敗:', error);
    }
}

// ============================================
// 表格渲染
// ============================================
function renderTable(allStore){

  console.log('開始渲染表格...');
  
  // 清空舊的表格內容
  elements.tableBody.innerHTML = '';

  if (allStore.length === 0){
    console.log('沒有資料');
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="3" class="px-3 py-8 text-center text-gray-500">
          目前沒有店家資料
        </td>
      </tr>
    `;
    return;
  }

  allStore.forEach(store =>{
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
    `
    elements.tableBody.appendChild(row);
  });

   console.log(`渲染完成，共 ${allStore.length} 筆`);

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
    totalItems: allStore.length,
    itemsPerPage: ITEMS_PER_PAGE,
    onPageChange: (newPage) => {
      currentPage = newPage;
      renderCurrentPage();
    },
    container: tableSection
  });
}


function renderCurrentPage() {
  const sessionsToShow = getPageSlice(allStore, currentPage, ITEMS_PER_PAGE);
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
