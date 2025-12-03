// ============================================
// 商店詳情
// ============================================

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// 全局變數儲存 Swiper 實例
let gallerySwiper = null;
let modalSwiper = null;

// 從URL取得商店ID
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('id');

if (!shopId) {
  showError('缺少店家 ID');
} else {
  loadShopDetail(shopId);
}


/**
 * 初始化 Swiper
 */
function initSwiper(images) {
  // 等待 DOM 渲染完成
  setTimeout(() => {
   
    gallerySwiper = new Swiper('.gallery-swiper', {
      slidesPerView: 'auto',
      spaceBetween: 12,
      freeMode: true,
      navigation: {
        nextEl: '.gallery-swiper .swiper-button-next',
        prevEl: '.gallery-swiper .swiper-button-prev',
      },
      breakpoints: {
        640: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 3,
        },
        1024: {
          slidesPerView: 4,
        },
      },
    });
    
    // 初始化Modal-Swiper
    modalSwiper = new Swiper('.modal-swiper', {
      navigation: {
        nextEl: '.modal-swiper .swiper-button-next',
        prevEl: '.modal-swiper .swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'fraction',
      },
      keyboard: {
        enabled: true,
      },
      loop: images.length > 4,
    });
  }, 100);
}

/**
 * 開啟圖片放大Modal
 */
function openImageModal(index) {
  const modal = document.getElementById('imageModal');
  if (!modal) {
    console.error('找不到 imageModal 元素');
    return;
  }
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  
  // 跳到對應的圖片
  if (modalSwiper) {
    modalSwiper.slideTo(index, 0);
  }
  
  // 重新初始化lucide icons
  lucide.createIcons();
  console.log('🔧 openImageModal 函數已定義:', typeof openImageModal);
}

/**
 * 關閉圖片放大Modal
 */
function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

// 如果使用 type="module"，要將函數掛到window上，不然會not defiend
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

// ESC鍵關閉Modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeImageModal();
  }
});

// ========== 載入與渲染函數 ========== //

/**
 * 載入商店詳情
 */
async function loadShopDetail(id) {
  try {
    console.log('📥 載入商店詳情:', id);
    
    const doc = await db.collection('stores').doc(id).get();
    
    if (!doc.exists) {
      showError('找不到此店家');
      return;
    }
    
    const data = doc.data();
    console.log('✅ 商店資料:', data);
    
    // 轉換資料格式（與index.js相同）
    const shop = {
      id: doc.id,
      name: data.店家名稱 || '未命名店家',
      category: Array.isArray(data.類別) ? data.類別.join(', ') : data.類別 || '其他',
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
      rating: calculateRating(data),
      specs: {
        ramp: data.出入口坡道 || '未提供',
        steps: Array.isArray(data.階梯狀況) ? data.階梯狀況.join(', ') : data.階梯狀況 || '未提供',
        restroom: data.廁所 || '未提供',
        restroomFloor: data.廁所位在幾樓 || null,
        circulation: data.內部動線 || '未提供',
        doorWidthCm: parseDoorWidth(data.門寬),
        assistance: Array.isArray(data.協助需求) ? data.協助需求.join(', ') : data.協助需求 || '未提供',
      },
      transport: {
        nearestParking: data.最近無障礙車位 || '未提供',
        nearestTransit: buildTransitInfo(data),
        mrtElevatorExit: data.捷運補充說明 || '未提供',
        recommendedRoute: data.推薦無障礙路線 || '未提供',
        mapUrl: data.地圖網址 || null,
      },
      tags: generateTags(data),
    };
    
    renderShopDetail(shop);
    
  } catch (error) {
    console.error('❌ 載入失敗:', error);
    showError('載入失敗: ' + error.message);
  }
}

/**
 * 渲染商店詳情
 */
function renderShopDetail(shop) {
  const allImages = [
    ...shop.images.cover,
    ...shop.images.entrance,
    ...shop.images.interior
  ].slice(0, 6);

  /**
   * 暢行無阻(綠色): 動線/便利度評分 >= 4 && 協助需求 == 完全不需要
   * 這地點對您的設備非常友善
   * 尚可接受(黃色): 動線/便利度評分 3~4 && 協助需求 <= 1
   *  需要陪伴者提供一點協助
   * 有點難度(橘色): 動線/便利度評分 3~4 && 協助需求 = 2
   *  需要陪伴者與店家共同協助
   * 困難指數MAX(紅色):動線/便利度評分 >3 && 協助需求 >= 2
   * 整體來說不太適合身障者
   * 
   *  */

//     const warningList = [];
  
//   if (shop.specs.doorWidthCm < state.userSettings.wheelchairWidthCm) {
//     warningList.push(`門寬不足 (店: ${shop.specs.doorWidthCm}cm < 您: ${state.userSettings.wheelchairWidthCm}cm)`);
//   }
//   if (state.userSettings.needsAccessibleRestroom && !shop.specs.restroom.includes('無障礙')) {
//     warningList.push('無專用無障礙廁所');
//   }
//   if (shop.specs.ramp === '無坡道') {
//     warningList.push('入口無坡道');
//   }

//   let alertHtml = '';
//   if (warningList.length > 0) {
//     alertHtml = `
//       <div class="bg-red-50 border-2 border-red-200 rounded-2xl p-5 shadow-sm transform rotate-[-1deg]">
//         <h3 class="font-display font-bold text-red-800 flex items-center mb-2 text-lg">
//           <i data-lucide="accessibility" size="24" class="mr-2" stroke-width="2.5"></i> 注意:可能存在障礙
//         </h3>
//         <ul class="list-disc list-inside text-sm font-bold text-red-700 space-y-1 ml-2">
//           ${warningList.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
//         </ul>
//       </div>`;
//   } else {
//     alertHtml = `
//       <div class="bg-brand-50 border-2 border-brand-200 rounded-2xl p-5 shadow-sm transform rotate-1 flex items-center">
//         <div class="p-3 bg-brand-100 rounded-full mr-4 border border-brand-200">
//           <i data-lucide="star" class="text-brand-600 fill-brand-600" size="24"></i>
//         </div>
//         <div>
//           <h3 class="font-display font-bold text-brand-800 text-lg">暢行無阻!</h3>
//           <p class="text-sm font-bold text-brand-700">這地點對您的設備非常友善。</p>
//         </div>
//       </div>`;
//   }
//   ------------------------------------------------
  const galleryHtml = allImages.length > 0 ? `
    <div class="mt-12">
        <h2 class="text-2xl font-display font-black text-retro-blue mb-4 flex items-center">
            <i data-lucide="store" class="mr-3" size="28"></i>店家實景
        </h2>
        
        <!-- Swiper 容器 -->
        <div class="swiper gallery-swiper -mx-4 px-4">
            <div class="swiper-wrapper">
            ${allImages.map((url, index) => `
                <div class="swiper-slide">
                <img 
                    src="${url}" 
                    class="h-32 w-48 object-cover rounded-2xl border-2 border-retro-blue/10 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" 
                    data-index="${index}"
                    onclick="openImageModal(${index})"
                    onerror="this.parentElement.style.display='none'"
                >
                </div>
            `).join('')}
            </div>
            
            <!-- 導航按鈕，對swiper想改css只能來硬的 -->
            <div class="swiper-button-prev" style="color: #1e3a8a; --swiper-navigation-color: #ffffff;"></div>
            <div class="swiper-button-next" style="color: #1e3a8a; --swiper-navigation-color: #ffffff;"></div>
        </div>
        
        <!-- 圖片放大 Modal -->
        <div id="imageModal" class="fixed inset-0 bg-black/90 z-50 hidden items-center justify-center p-4" onclick="closeImageModal()">
            <button class="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-colors z-10" onclick="closeImageModal()">
                <i data-lucide="x" size="32" stroke-width="2.5"></i>
            </button>
            
            <div class="swiper modal-swiper w-auto max-w-md" onclick="event.stopPropagation()" style="height: 80vh;">
                <div class="swiper-wrapper" style="align-items: center;">
                ${allImages.map(url => `
                    <div class="swiper-slide" style="display: flex; align-items: center; justify-content: center; height: 100%;">
                    <img 
                        src="${url}" 
                        class="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl"
                        onerror="this.src='https://picsum.photos/800/600?random=${shop.id}'"
                    >
                    </div>
                `).join('')}
               </div>
                <div class="swiper-button-prev" style="color: #1e3a8a; --swiper-navigation-color: #ffffff;"></div>
                <div class="swiper-button-next" style="color: #1e3a8a; --swiper-navigation-color: #ffffff;"></div>
                <div class="swiper-pagination !bottom-4"></div>
            </div>
        </div>
    </div>
  ` : '';

  const tagsHtml = shop.tags.map(t => 
    `<span class="px-4 py-1.5 bg-white text-retro-blue text-sm font-bold rounded-xl border-2 border-retro-blue/10 shadow-sm">#${escapeHtml(t)}</span>`
  ).join('');

  const html = `
    <div class="relative h-72 w-full rounded-b-[3rem] overflow-hidden shadow-xl shadow-retro-blue/10">
      <img src="${shop.imageUrl}" class="w-full h-full object-cover" onerror="this.src='https://picsum.photos/800/600?random=${shop.id}'">
      <div class="absolute inset-0 bg-gradient-to-t from-retro-blue/90 via-retro-blue/30 to-transparent"></div>
      <a href="/index.html" class="absolute top-6 left-6 bg-white p-3 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all z-20">
        <i data-lucide="arrow-left" size="24" class="text-retro-blue" stroke-width="3"></i>
      </a>
      <div class="absolute bottom-8 left-6 right-6 text-white">
        <h1 class="text-3xl font-display font-black leading-none mb-2 drop-shadow-md">${escapeHtml(shop.name)}</h1>
        <p class="text-white/90 text-sm font-bold flex items-center gap-3">
          <span class="bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">${escapeHtml(shop.category)}</span>
          <span>${escapeHtml(shop.address)}</span>
        </p>
      </div>
    </div>

    <div class="max-w-3xl mx-auto p-4 -mt-8 relative z-10 space-y-6">
      ${galleryHtml}
      
      <div class="flex items-stretch justify-between bg-white rounded-3xl border-2 border-retro-blue/10 shadow-lg shadow-retro-blue/5 overflow-hidden">
        <div class="flex flex-col items-center justify-center bg-retro-blue/5 p-6 border-r-2 border-retro-blue/10 w-1/3">
          <span class="text-xs text-retro-blue/60 uppercase tracking-wide font-black mb-1">便利度</span>
          <span class="text-4xl font-display font-black text-retro-blue leading-none">${shop.rating}</span>
        </div>
        <div class="flex flex-col justify-center flex-1 p-6">
          <span class="text-xs text-retro-blue/60 uppercase tracking-wide font-black mb-1">平均消費</span>
          <div class="flex items-center justify-between">
            <span class="text-retro-blue font-bold text-lg">${shop.avgCost}</span>
            <div class="flex items-center text-xl ">${renderPriceLevel(shop.priceLevel)}</div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">${tagsHtml}</div>

      ${shop.transport.mapUrl ? `
      <a href="${shop.transport.mapUrl}" target="_blank" class="w-full flex items-center justify-center py-4 bg-retro-blue text-white rounded-2xl font-display font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-1 hover:shadow-none transition-all border-2 border-retro-blue">
        <i data-lucide="navigation" size="20" class="mr-2" stroke-width="2.5"></i> 導航前往
      </a>
      ` : ''}

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
            ${shop.transport.nearestParking !== '未提供' ? `
            <div><span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">最近無障礙車位</span><p class="text-retro-blue font-bold text-lg">${escapeHtml(shop.transport.nearestParking)}</p></div>
            <hr class="border-retro-blue/10"/>
            ` : ''}
            <div>
              <span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">捷運 / 公車</span>
              <p class="text-retro-blue font-bold text-lg">${escapeHtml(shop.transport.nearestTransit)}</p>
              ${shop.transport.mrtElevatorExit !== '未提供' ? `<div class="mt-2 inline-block bg-brand-100 text-brand-800 text-xs font-bold px-3 py-1 rounded-full border border-brand-200">電梯出口: ${escapeHtml(shop.transport.mrtElevatorExit)}</div>` : ''}
            </div>
            ${shop.transport.recommendedRoute !== '未提供' ? `
            <hr class="border-retro-blue/10"/>
            <div><span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">推薦無障礙路線</span><p class="text-retro-blue font-medium leading-relaxed">${escapeHtml(shop.transport.recommendedRoute)}</p></div>
            ` : ''}
          </div>
        </section>
        
        ${shop.description ? `
        <section>
          <h2 class="text-2xl font-display font-black text-retro-blue mb-4 flex items-center"><i data-lucide="message-circle-more" class="mr-3" size="28"></i>走訪心得</h2>
          <div class="bg-white p-6 rounded-2xl border-2 border-retro-blue/5">
            <p class="text-retro-blue/80 font-medium leading-relaxed whitespace-pre-wrap">${escapeHtml(shop.description)}</p>
          </div>
        </section>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('shop-detail-container').innerHTML = html;
  lucide.createIcons();
  
  // 初始化 Swiper
  if (allImages.length > 0) {
    initSwiper(allImages);
  }
}

/**
 * 顯示錯誤
 */
function showError(message) {
  document.getElementById('shop-detail-container').innerHTML = `
    <div class="text-center py-20">
      <p class="text-red-600 font-bold text-lg mb-4">${escapeHtml(message)}</p>
      <a href="/index.html" class="inline-block px-6 py-3 bg-retro-blue text-white font-display rounded-xl hover:bg-retro-blue/90 transition-all">
        返回首頁
      </a>
    </div>
  `;
}

// ========== 工具函式（與 index.js 相同） ========== //

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
    parseFloat(data.動線和便利度評分) || 0,
    parseFloat(data.食物評分) || 0,
    parseFloat(data.服務評分) || 0,
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

function generateTags(data) {
  const tags = [];
  if (data.出入口坡道 === '有坡道 (平緩)') tags.push('坡道友善');
  if (data.出入口坡道 === '有坡道 (陡峭)') tags.push('坡道較陡');
  if (data.出入口坡道 === '無坡道') tags.push('無坡道');
  if (data.廁所 && data.廁所.includes('無障礙')) tags.push('無障礙廁所');
  const doorWidth = parseDoorWidth(data.門寬);
  if (doorWidth >= 90) tags.push('門寬寬敞');
  if (data.內部動線 === '寬敞') tags.push('動線寬敞');
  if (Array.isArray(data.協助需求) && data.協助需求.includes('無須協助')) {
    tags.push('完全無障礙');
  }
  return tags;
}

function renderPriceLevel(level) {
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += `<span class="${i < level ? 'text-retro-blue font-black' : 'text-retro-blue/20 font-bold'}">$</span>`;
  }
  return html;
}

function renderFootprintsHtml(circulation, size = 16) {
  let count = 1;
  if (circulation === '寬敞') count = 3;
  else if (circulation === '普通') count = 2;
  
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

function renderDetailItem(label, value, iconOrHtml) {
  const iconContent = typeof iconOrHtml === 'string' && iconOrHtml.startsWith('<') 
    ? iconOrHtml 
    : `<i data-lucide="${iconOrHtml}" size="20"></i>`;

  return `
    <div class="flex items-center p-4 bg-white border-2 border-retro-blue/10 rounded-2xl shadow-sm hover:border-retro-blue/30 transition-colors">
      <div class="text-retro-blue mr-4 bg-retro-blue/5 p-2 rounded-xl flex items-center justify-center min-w-[2.5rem]">${iconContent}</div>
      <div>
        <span class="block text-xs font-bold text-retro-blue/40 mb-0.5">${escapeHtml(label)}</span>
        <span class="block text-base font-bold text-retro-blue">${escapeHtml(value)}</span>
      </div>
    </div>`;
}