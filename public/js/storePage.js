// ============================================
// storePage Controller
// ============================================

import { handleLogout } from '../utils/basic.js';


/**
 * 更新:變數集中營
 */
const elements = {
  logoutBtn: document.getElementById('logout-btn'),
  tableBody: document.getElementById('table-body'),
};

// let allStore = [];

// Firebase 配置
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const auth = firebase.auth();

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
        const allStore = [];
        
        snapshot.forEach(doc => {
           allStore.push({
            id: doc.id,
            ...doc.data()
           }) 
        });

        // console.log(`載入完成，共 ${allStore.length} 筆資料`);


        renderTable(allStore);
        // allStore
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
    const category = Array.isArray(store.類別)
      ? store.類別.join(', ')
      : store.類別;

    row.innerHTML = `
    <td class="px-3 py-2 whitespace-nowrap">
      <img src="${coverImage || '../img/763732019.jpg'}" alt="${store.店家名稱|| 'Unknown'}" class="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110 rounded-lg">
    </td>
    <td class="px-3 py-2 whitespace-nowrap">
      <div class="flex items-center gap-2 mb-1">
        <span class="bg-retro-yellow text-retro-blue text-xs font-black px-1.5 p-1 rounded border border-retro-blue"> ${category || 'Unknown'}</span>
        <h3 class="text-xl font-black text-retro-blue truncate tracking-tight">${store.店家名稱}</h3>
      </div>
      <div class="flex items-center text-retro-blue/80 text-sm font-bold truncate">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin w-3 h-3 mr-1 flex-shrink-0" aria-hidden="true">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0">
            </path>
        <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span class="truncate">${store.店家地址|| 'Unknown'}</span>
      </div>
      <div class="flex items-center text-retro-blue text-sm font-bold truncate">
      ${store.到訪日期|| 'Unknown'}
      </div>
    </td>
    <td class="px-3 py-2 whitespace-nowrap">
       <div class="flex flex-col items-center gap-2">
          <button 
            onclick="editStore('${store.id}')" 
            class="p-3 rounded-full bg-retro-blue text-white border-2 border-retro-blue hover:bg-retro-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-retro-blue" 
            aria-label="編輯店家"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen text-white" aria-hidden="true">
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
            </svg>
          </button>

        </div>
      </td>
    `
    elements.tableBody.appendChild(row);
  });

   console.log(`渲染完成，共 ${allStore.length} 筆`);
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
  if (!confirm('確定要刪除此店家嗎？此操作無法復原。')) {
    console.log('❌ 用戶取消刪除');
    return;
  }
  
  try {
    console.log('🗑️ 正在刪除店家:', storeId);
    
    await db.collection('allStore').doc(storeId).delete();
    
    console.log('✅ 刪除成功');
    alert('✅ 刪除成功');
    
    // 重新載入列表（只執行一次）
    await loadStoreList();
    
  } catch (error) {
    console.error('❌ 刪除失敗:', error);
    alert('刪除失敗: ' + error.message);
  }
};


/**
 * 刪除功能   
          <button 
            onclick="deleteStore('${store.id}')" 
            class="p-3 rounded-full bg-retro-blue text-white border-2 border-retro-blue hover:bg-retro-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-retro-blue" 
            aria-label="刪除店家"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 text-white" aria-hidden="true">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
 */