// ============================================
// seo Controller
// ============================================

import { formatDate } from '../utils/basic.js';

/**
 * 變數集中營
 */
const elements = {
  tableBody: document.getElementById('table-body'),
  selectAllCheckbox: document.getElementById('select-all-stores'),
  generateFallbackBtn: document.getElementById('generateFallback'),
  createSiteMapBtn: document.getElementById('createSiteMap'),
};

// Firebase 配置
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const auth = firebase.auth();


let allStore = [];
let author = '';


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


/**
 * 載入資料庫
 */
async function loadStoreList() {
    try {

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

        allStore.sort((a, b) => {
          // 每筆資料：有 updatedAt 用 updatedAt，否則用 createdAt（皆為 Firestore Timestamp）
          const getTime = (store) => {
            const ts = store.updatedAt || store.createdAt;
            if (!ts) return 0;
            return typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
          };
          const timeA = getTime(a);
          const timeB = getTime(b);
          return timeB - timeA; // 降冪排序：新的在前面
        });


        renderTable(allStore);

    } catch (error) {
        console.error('載入商店列表失敗:', error);
    }
}


// ============================================
// 表格渲染
// ============================================
function renderTable(stores){

//   console.log('開始渲染表格...');
//   console.log(stores.length);
  
  // 清空舊的表格內容
  elements.tableBody.innerHTML = '';

  if (stores.length === 0) {
    console.log('沒有資料');
    elements.tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="px-3 py-8 text-center text-gray-500">目前沒有店家資料</td>
      </tr>
    `;
    return;
  }

  stores.forEach(store => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-blue-50 transition-colors';

    const createdAtStr = formatDate(store.createdAt) || '—';
    const updatedAtStr = formatDate(store.updatedAt) || '—';

    if (store.updatedBy === 'TKJqrWGdmoPtaZuDmSLOUtTAzqK2') {
        author = '法蘭';
    } else if (store.updatedBy === 'bwYPuwjyX9VTDSVYw5THhFW7xAg2') {
        author = '阿吉';
    }
    
    row.innerHTML = `
    <td class="px-3 py-2 whitespace-nowrap">
      <input type="checkbox" class="store-checkbox w-4 h-4" data-store-id="${store.id}" aria-label="選取 ${escapeHtml(store.name || '')}" />
    </td>
    <td class="px-3 py-2 whitespace-nowrap font-black">${escapeHtml(store.name || '—')}</td>
    <td class="px-3 py-2 whitespace-nowrap">${createdAtStr}</td>
    <td class="px-3 py-2 whitespace-nowrap">${updatedAtStr}</td>
    <td class="px-3 py-2 whitespace-nowrap font-black">${author}</td>
    `;
    elements.tableBody.appendChild(row);
  });

  // 全選 checkbox：勾選/取消勾選所有列
  if (elements.selectAllCheckbox) {
    elements.selectAllCheckbox.checked = false;
    elements.selectAllCheckbox.onchange = () => {
      const checkboxes = elements.tableBody.querySelectorAll('.store-checkbox');
      checkboxes.forEach(cb => { cb.checked = elements.selectAllCheckbox.checked; });
    };
  }
}


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
 * 取得目前勾選的店家；若沒有勾選任何一筆，則回傳全部店家（預設生成所有 store）
 */
function getSelectedStores() {
  if (!elements.tableBody) return [...allStore];
  const checkboxes = elements.tableBody.querySelectorAll('.store-checkbox:checked');
  if (!checkboxes.length) return [...allStore];
  const selectedIds = Array.from(checkboxes).map(cb => cb.getAttribute('data-store-id'));
  return allStore.filter(store => selectedIds.includes(store.id));
}

/**
 * 根據規格產生 Fallback 用的純 HTML 字串（依勾選項目；無勾選則全部）
 */
function buildFallbackHtml() {
  const latestStores = getSelectedStores();

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
 * @param {Array} [stores] 指定要生成的店家；不傳或空陣列時使用全部店家
 */
async function generateSitemapXml(stores) {
  try {
    // 確保資料已載入
    if (allStore.length === 0) {
      console.log('🔄 正在載入店家資料...');
      await loadStoreList();
    }

    const list = Array.isArray(stores) && stores.length > 0 ? stores : allStore;

    if (list.length === 0) {
      alert('❌ 目前沒有店家資料可供生成 sitemap');
      return '';
    }

    console.log(`🚀 開始生成 sitemap.xml，共 ${list.length} 筆店家資料`);



    // 生成指定店家的 URL 區塊
    console.log('📝 正在處理每家店家的資料...');
    const urlBlocks = list.map((store, index) => {
      const progress = `[${index + 1}/${list.length}]`;
      console.log(`${progress} 處理店家：${store.name || store.id || '未知'}`);
      return generateStoreUrlBlock(store);
    });
    
    console.log('✅ 所有店家資料處理完成！');
    
    // 組合完整的 sitemap.xml
    const sitemapXml = `${urlBlocks.join('\n\n')}`;
    
    console.log(`✨ sitemap.xml 生成完成！總長度：${sitemapXml.length} 字元`);
    
    return sitemapXml;
    
  } catch (error) {
    console.error('❌ 生成 sitemap.xml 失敗:', error);
    alert('❌ 生成 sitemap.xml 失敗: ' + error.message);
    return '';
  }
}

/**
 * 點擊「生成sitemap」按鈕時，產生 sitemap.xml 並讓使用者複製（依勾選項目；無勾選則全部）
 */
async function handleCreateSiteMapClick() {
  const selectedStores = getSelectedStores();
  const sitemapXml = await generateSitemapXml(selectedStores);
  
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
