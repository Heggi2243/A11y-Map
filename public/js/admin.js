// ============================================
// session Controller
// ============================================

import { handleLogout } from '../utils/basic.js';

/**
 * 更新:集中管理變數
 */
const elements = {
  adminSelect: document.getElementById('admin-select'),
  timeSelect: document.getElementById('time-select'),
  filterBtn: document.getElementById('filter-btn'),
  tableBody: document.getElementById('table-body'),
  logoutBtn: document.getElementById('logout-btn'),
  currentUserEmail: document.getElementById('current-user-email'),
  loadingOverlay: document.getElementById('loading-overlay')
};

// Firebase 配置
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const auth = firebase.auth();

// 分頁相關變數
const ITEMS_PER_PAGE = 20;
let currentPage = 1;
let filteredSessions = [];

// ============================================
// 身份驗證
// ============================================

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    console.log('未登入，重導向到登入頁');
    alert('❌ 您尚未登入，將跳轉到登入頁');
    window.location.href = '/loginPage.html';
    return;
  }

  console.log('已登入:', user.uid);
  elements.currentUserEmail.textContent = user.email;
  elements.loadingOverlay.classList.add('hidden');
  
  await loadAdminList();
  await applyFilters();
});

// ============================================
// 登出功能
// ============================================

elements.logoutBtn.addEventListener('click', () => handleLogout(db));

// ============================================
// 工具函數
// ============================================

function getStatusColorClass(status) {
  const statusColors = {
    'active': 'bg-green-100 text-green-800 border-green-800',
    'logged_out': 'bg-blue-100 text-blue-800 border-blue-800',
    'expired': 'bg-orange-100 text-orange-800 border-orange-800',
    'browser_closed': 'bg-gray-100 text-gray-600 border-gray-500'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-800';
}

function getStatusDisplayText(status) {
  const statusText = {
    'active': '線上',
    'logged_out': '已登出',
    'expired': '連線過期',
    'browser_closed': '已關閉瀏覽器'
  };
  return statusText[status] || 'UNKNOWN';
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp.seconds * 1000).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// ============================================
// 分頁功能
// ============================================

function renderPagination() {
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  
  // 移除舊的分頁控制
  const oldPagination = document.getElementById('pagination-controls');
  if (oldPagination) oldPagination.remove();
  
  if (totalPages <= 1) return; // 只有一頁或沒有資料,不顯示分頁
  
  // 創建分頁容器
  const paginationContainer = document.createElement('div');
  paginationContainer.id = 'pagination-controls';
  paginationContainer.className = 'flex justify-center items-center gap-2 p-6 bg-blue-50 border-t-2 border-blue-900';
  
  // 上一頁按鈕
  const prevBtn = createPaginationButton('← 上一頁', currentPage > 1, () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  });
  paginationContainer.appendChild(prevBtn);
  
  // 頁碼資訊
  const pageInfo = document.createElement('div');
  pageInfo.className = 'px-4 py-2 text-sm font-bold text-blue-900';
  pageInfo.textContent = `第 ${currentPage} / ${totalPages} 頁 (共 ${filteredSessions.length} 筆)`;
  paginationContainer.appendChild(pageInfo);
  
  // 下一頁按鈕
  const nextBtn = createPaginationButton('下一頁 →', currentPage < totalPages, () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  });
  paginationContainer.appendChild(nextBtn);
  
  // 插入到表格下方
  const tableSection = elements.tableBody.closest('section');
  tableSection.appendChild(paginationContainer);
}

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

function renderCurrentPage() {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const sessionsToShow = filteredSessions.slice(startIndex, endIndex);
  renderTable(sessionsToShow);
  renderPagination();
  
  // 滾動到頂部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 表格渲染
// ============================================

function renderTable(sessions) {
  elements.tableBody.innerHTML = '';
  // console.log(sessions);
  
  if (sessions.length === 0) {
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-500 italic">
          No sessions found for the selected criteria.
        </td>
      </tr>
    `;
    return;
  }

  sessions.forEach(session => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-blue-50 transition-colors';
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-900 font-bold">
        ${formatTimestamp(session.loginTime)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">
        ${session.email || 'Unknown'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
        ${session.ipAddress || 'Unknown'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        ${session.os || 'Unknown'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        ${session.browser || 'Unknown'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-700">
        ${session.deviceFingerprint || 'Unknown'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase tracking-wide border-2 ${getStatusColorClass(session.status)}">
          ${getStatusDisplayText(session.status)}
        </span>
      </td>
    `;
    elements.tableBody.appendChild(row);
  });
}

// ============================================
// 資料載入
// ============================================

async function loadAdminList() {
  try {
    // js串聯寫法(Method Chaining)
    const snapshot = await db.collection('login_sessions')
      .orderBy('loginTime', 'desc')
      //最多抓100筆就好
      .limit(100)
      .get();

    const emails = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) emails.add(data.email);
    });

    elements.adminSelect.innerHTML = '<option value="">所有使用者</option>';
    Array.from(emails).sort().forEach(email => {
      const option = document.createElement('option');
      option.value = email;
      option.textContent = email;
      elements.adminSelect.appendChild(option);
    });

  } catch (error) {
    console.error('載入管理員列表失敗:', error);
  }
}

async function applyFilters() {
  elements.filterBtn.textContent = 'Loading...';
  elements.filterBtn.disabled = true;

  try {
    const selectedEmail = elements.adminSelect.value;
    const timeRange = elements.timeSelect.value;
    
    let query = db.collection('login_sessions');

    // 管理員篩選
    if (selectedEmail) {
      query = query.where('email', '==', selectedEmail);
    }

    // 時間範圍篩選
    if (timeRange !== 'ALL') {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'TODAY':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'ONE_WEEK':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'ONE_MONTH':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'THREE_MONTHS':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startDate) {
        query = query.where('loginTime', '>=', startDate);
      }
    }

    // 排序並限制數量
    query = query.orderBy('loginTime', 'desc').limit(200);
    

    /**
     * ...doc.data()展開運算子
     {
      id: doc.id,
      email: doc.data().email,
      loginTime: doc.data().loginTime,
      status: doc.data().status
      }
     */
    const snapshot = await query.get();
    console.log(snapshot);
    snapshot.forEach(doc => {
      filteredSessions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    // console.log(filteredSessions);

    console.log(`找到 ${filteredSessions.length} 筆 Session 記錄`);
    
    // 重置到第一頁
    currentPage = 1;
    renderCurrentPage();

  } catch (error) {
    console.error('載入 Sessions 失敗:', error);
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-red-600">
          Error loading sessions: ${error.message}
        </td>
      </tr>
    `;
  } finally {
    elements.filterBtn.textContent = '篩選查詢';
    elements.filterBtn.disabled = false;
  }
}

// ============================================
// 事件監聽
// ============================================

elements.filterBtn.addEventListener('click', applyFilters);