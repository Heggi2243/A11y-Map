/**
 * 這裡是拿來放一些通用小工具的地方
 * 不要再忘記加 export 了-.-
 */

/**
 * 生成文件ID
 * 格式: 
 *  - string 日期 → YYYYMMDD + 3位流水號 (例: 20260107001)
 *  - timestamp → YYYYMMDDHHMM (例: 202601071354)
 * @param {string|Date|Timestamp} dateTime - 日期時間
 * @param {string} collectionName - 集合名稱
 * @param {object} db - 資料庫
 */

export async function generateDocumentId(dateTime, collectionName, db) {

  // 判斷dateTime的類型
  let dateObj;
  let useTimestamp = false;

  if (dateTime instanceof Date) {
    // 已經是 Date 物件
    dateObj = dateTime;
    useTimestamp = true;
  } else if (typeof dateTime === 'string') {
    // 字串格式 (YYYY-MM-DD)
    dateObj = new Date(dateTime);
    useTimestamp = false;
  } else if (dateTime?.toDate) {
    // Firebase Timestamp
    dateObj = dateTime.toDate();
    useTimestamp = true;
  } else if (typeof dateTime === 'number') {
    // Unix timestamp (毫秒)
    dateObj = new Date(dateTime);
    useTimestamp = true;
  } else {
    throw new Error('無效的 dateTime 格式');
  }
    

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
   // 根據類型決定後綴
  if (useTimestamp) {
    // 使用時間戳記: YYYYMMDDHHMM
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const docId = `${datePrefix}${hours}${minutes}${seconds}`;  
    return docId;

  } else {
    // 使用流水號: YYYYMMDD + 3位流水號
    const snapshot = await db.collection(collectionName)
      .where(firebase.firestore.FieldPath.documentId(), '>=', `${datePrefix}000`)
      .where(firebase.firestore.FieldPath.documentId(), '<=', `${datePrefix}999`)
      .orderBy(firebase.firestore.FieldPath.documentId(), 'desc')
      .limit(1)
      .get();
    
    let sequence = 1; // 預設流水號為 001
    
    if (!snapshot.empty) {
      // 取得最後一個文件ID的流水號並加1
      const lastDocId = snapshot.docs[0].id;
      const lastSequence = parseInt(lastDocId.slice(-3));
      sequence = lastSequence + 1;
    }
  
    // 組合文件ID: YYYYMMDD + 3位流水號
    const docId = `${datePrefix}${String(sequence).padStart(3, '0')}`;
    return docId;
  }
}

/**
 * 登出功能
 * @param {firebase.firestore.Firestore} db - 避免沒有載入firebase-config.js報錯undefined
 */
export async function handleLogout(db) {
  try {
    const sessionId = sessionStorage.getItem('currentSessionId');
    
    if (sessionId && db) {
      await db.collection('login_sessions').doc(sessionId).update({
        status: 'logged_out',
        endTime: firebase.firestore.FieldValue.serverTimestamp()
      });
      sessionStorage.removeItem('currentSessionId');
      console.log('✅ Session 已更新為 logged_out');
    }
    
    await firebase.auth().signOut();
    console.log('✅ 登出成功');
    window.location.href = '/loginPage.html';
    
  } catch (error) {
    console.error('❌ 登出失敗:', error);
    alert('登出失敗: ' + error.message);
    throw error;
  }
}

// ============================================
// 通用分頁功能
// ============================================

/**
 * 建立分頁控制器
 * @param {Object} options - 分頁配置
 * @param {number} options.currentPage - 當前頁碼
 * @param {number} options.totalItems - 總資料筆數
 * @param {number} options.itemsPerPage - 每頁顯示筆數
 * @param {Function} options.onPageChange - 換頁回調函式
 * @param {HTMLElement} options.container - 分頁控制器要插入的容器
 * @returns {HTMLElement} 分頁控制器元素
 */
export function createPagination(options) {
  const {
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    container
  } = options;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // 移除舊的分頁控制
  const oldPagination = container.querySelector('#pagination-controls');
  if (oldPagination) oldPagination.remove();
  
  if (totalPages <= 1) return null; // 只有一頁或沒有資料,不顯示分頁
  
  // 創建分頁容器
  const paginationContainer = document.createElement('div');
  paginationContainer.id = 'pagination-controls';
  paginationContainer.className = 'flex justify-center items-center gap-2 p-6 bg-blue-50 border-t-2 border-blue-900';
  
  // 上一頁按鈕
  const prevBtn = createPaginationButton('← 上一頁', currentPage > 1, () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  });
  paginationContainer.appendChild(prevBtn);
  
  // 頁碼資訊
  const pageInfo = document.createElement('div');
  pageInfo.className = 'px-4 py-2 text-sm font-bold text-blue-900';
  pageInfo.textContent = `第 ${currentPage} / ${totalPages} 頁 (共 ${totalItems} 筆)`;
  paginationContainer.appendChild(pageInfo);
  
  // 下一頁按鈕
  const nextBtn = createPaginationButton('下一頁 →', currentPage < totalPages, () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  });
  paginationContainer.appendChild(nextBtn);
  
  // 插入到容器
  container.appendChild(paginationContainer);
  
  return paginationContainer;
}

/**
 * 建立分頁按鈕
 */
function createPaginationButton(text, enabled, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.className = enabled 
    ? 'px-4 py-2 bg-blue-900 text-white font-bold border-2 border-blue-900 hover:bg-blue-800 transition-all active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]'
    : 'px-4 py-2 bg-gray-300 text-gray-500 font-bold border-2 border-gray-400 cursor-not-allowed';
  btn.disabled = !enabled;
  if (enabled) btn.onclick = onClick;
  return btn;
}

/**
 * 計算當前頁面應顯示的資料範圍
 */
export function getPageSlice(data, currentPage, itemsPerPage) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}


/**
 * 格式化日期顯示 (Firestore Timestamp 或 Date 物件)
 * @param {*} dateValue - Firestore Timestamp 或 Date 物件
 * @returns {string} 格式化的日期字串 (YYYY/MM/DD)
 */
export function formatDate(dateValue) {
  if (!dateValue) return '';
  
  let date;
  
  // 處理 Firestore Timestamp
  if (dateValue && typeof dateValue.toDate === 'function') {
    date = dateValue.toDate();
  } 
  // 處理 Date 物件
  else if (dateValue instanceof Date) {
    date = dateValue;
  }
  // 處理字串
  else if (typeof dateValue === 'string') {
    date = new Date(dateValue);
  }
  else {
    return '';
  }
  
  // 檢查是否為有效日期
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
}