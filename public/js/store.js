// ============================================
// 商店詳情 store.js
// ============================================

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const analytics = firebase.analytics(); 

// Swiper
let gallerySwiper = null; 
let modalSwiper = null;

// 從 URL 取得商店 ID
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('id');

if (!shopId) {
  showError('缺少店家ID');
} else {
  loadShopDetail(shopId);
}


// ==================== SEO相關 ==================== //

/**
 * 更新頁面的 SEO meta tags 和 JSON-LD
 */
function updateSEO(shop) {
  const name = shop.name || '未命名店家';
  const category = Array.isArray(shop.category) ? shop.category.join(', ') : shop.category || '其他';
  const address = shop.address || '';
  const description = shop.description || `${name} - ${category}類無障礙友善店家`;
  const imageUrl = (shop.store_cover?.[0] || shop.entrance_photo?.[0] || shop.interior_photo?.[0]) || 'https://yourdomain.com/img/og-default.jpg';
  const currentUrl = window.location.href;
  
  // 更新 title
  document.title = `${name} - 無障礙${category} | 暢行無阻 A11y-Map`;
  
  // 更新 meta description
  updateMetaTag('name', 'description', `${name} - ${description.substring(0, 150)}`);
  
  // 處理異體字「臺」、「台」
  const locationPart = address.split(/市|區|鄉|鎮/)[0]; // 例如：臺中、臺北
  const locationVariants = locationPart ? [
    locationPart,
    locationPart.replace(/臺/g, '台'), // 臺中 → 台中
    locationPart.replace(/台/g, '臺')  // 台中 → 臺中（反向也處理）
  ] : [];

  // 更新 meta keywords
  const keywords = [
    '無障礙',
    '輪椅友善',
    category,
    name,
    ...locationVariants, // 包含所有異體字變化
    '臺灣',
    '台灣'
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(','); // 去重
  
  updateMetaTag('name', 'keywords', keywords);
  
  // 更新 Open Graph
  updateMetaTag('property', 'og:title', `${name} - 無障礙${category}`);
  updateMetaTag('property', 'og:description', description.substring(0, 200));
  updateMetaTag('property', 'og:image', imageUrl);
  updateMetaTag('property', 'og:url', currentUrl);
  
  // 更新 Twitter Card
  updateMetaTag('name', 'twitter:title', `${name} - 無障礙${category}`);
  updateMetaTag('name', 'twitter:description', description.substring(0, 200));
  updateMetaTag('name', 'twitter:image', imageUrl);
  
  // 更新 Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.href = currentUrl;
  }
  
  // 更新 JSON-LD Structured Data
  updateStructuredData(shop, imageUrl);
}

/**
 * 更新或創建 meta tag
 */
function updateMetaTag(attribute, attributeValue, content) {
  let meta = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, attributeValue);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}

/**
 * 更新 JSON-LD Structured Data
 */
function updateStructuredData(shop, imageUrl) {
  const name = shop.name || '未命名店家';
  const category = Array.isArray(shop.category) ? shop.category.join(', ') : shop.category || '其他';
  const address = shop.address || '';
  const description = shop.description || '';
  
  // 建立評分（基於便利度）
  const rating = shop.convenience ? {
    "@type": "AggregateRating",
    "ratingValue": shop.convenience,
    "bestRating": "5",
    "worstRating": "1"
  } : null;
  
  // 建立價格範圍
  let priceRange = '$$';
  if (shop.avgCost) {
    const cost = parseInt(shop.avgCost);
    if (cost < 300) priceRange = '$';
    else if (cost < 500) priceRange = '$$';
    else if (cost < 800) priceRange = '$$$';
    else priceRange = '$$$$';
  }
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": name,
    "description": description,
    "image": imageUrl,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "TW",
      "streetAddress": address
    },
    "priceRange": priceRange,
    "servesCuisine": category,
    "url": window.location.href,
    "isAccessibleForFree": true,
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "無障礙設施",
        "value": true
      }
    ]
  };
  
  // 如果有評分，加入評分資料
  if (rating) {
    structuredData.aggregateRating = rating;
  }
  
  // 如果有座標，加入地理位置
  if (shop.latitude && shop.longitude) {
    structuredData.geo = {
      "@type": "GeoCoordinates",
      "latitude": shop.latitude,
      "longitude": shop.longitude
    };
  }
  
  // 更新 script tag
  let script = document.getElementById('structured-data');
  if (script) {
    script.textContent = JSON.stringify(structuredData, null, 2);
  } else {
    script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
  }
}

// ==================== Swiper Modal 控制函數 ==================== //

function initSwiper(images) {
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
        640: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        1024: { slidesPerView: 4 },
      },
    });
    
    modalSwiper = new Swiper('.modal-swiper', {
      navigation: {
        nextEl: '.modal-swiper .swiper-button-next',
        prevEl: '.modal-swiper .swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'fraction',
      },
      keyboard: { enabled: true },
      loop: images.length > 4,
    });
  }, 100);
}

function openImageModal(index) {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  
  if (modalSwiper) modalSwiper.slideTo(index, 0);
  lucide.createIcons();
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeImageModal();
});

// ========== 載入商店資料 ========== //

async function loadShopDetail(id) {
  try {
    // console.log('載入商店詳情:', id);
    
    const doc = await db.collection('stores').doc(id).get();
    
    if (!doc.exists) {
      showError('找不到此店家');
      return;
    }
    
    const shop = { id: doc.id, ...doc.data() };
    // console.log('商店資料:', shop);
    
    renderShopDetail(shop);
    
  } catch (error) {
    // console.error('載入失敗:', error);
    showError('載入失敗: ' + error.message);
  }
}

//計算星星
function renderRating(item) {
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += `<span class="${i < item ? 'text-retro-blue font-black' : 'text-retro-blue/20 font-bold'}">★</span>`;
  }
  return html;
}

// ========== 渲染商店詳情 ========== //

function renderShopDetail(shop) {

  // SEO
  updateSEO(shop);

  // 整合所有圖片
  const allImages = [
    ...(shop.store_cover || []),
    ...(shop.entrance_photo || []),
    ...(shop.interior_photo || []),
  ];

  // 基本資訊
  const name = shop.name || '未命名店家';
  const category = Array.isArray(shop.category) ? shop.category.join(', ') : shop.category || '其他';
  const avgCost = shop.avgCost ? `${shop.avgCost}元` : '未提供';
  const address = shop.address || '地址未提供';
  const description = shop.description || '暫無描述';
  const imageUrl = allImages[0] || `https://picsum.photos/800/600?random=${shop.id}`;

  
  // 價格等級
  const cost = parseInt(shop.avgCost);
  let priceLevel = 2;
  if (cost < 300) priceLevel = 1;
  else if (cost < 500) priceLevel = 2;
  else if (cost < 800) priceLevel = 3;
  else if (cost < 1200) priceLevel = 4;
  else priceLevel = 5;
  
  // hashTag 
  const tags = [];
  let count = 0;
  // 0 = 背景色；1 = 框線色；2 = icon名稱；3 = icon顏色；4 = 文字顏色
  let colorAry = [];
  let content = [];

  if (shop.ramp?.includes('平緩') || shop.ramp?.includes('順行')) {
    tags.push('坡道友善');
    count ++;
  } else if(shop.ramp?.includes('陡峭')) {
    tags.push('坡道較陡');
    count --;
  }

  if (shop.restroom?.includes('無障礙')) {
    tags.push('無障礙廁所');
    count ++;
  }
  if (shop.doorWidthCm?.includes('寬敞')) {
    tags.push('門寬寬敞');
    count ++;
  }

  if (shop.circulation === '寬敞') {
    tags.push('動線寬敞');
    count ++;
  }

  if (shop.food === 5) {
    tags.push('食物優質');
  }

  if (shop.service === 5){
    tags.push('服務優質');
  }

  if (Array.isArray(shop.assistance) && shop.assistance.includes('無須協助') && shop.convenience >= 4) {
    tags.push('完全無障礙');
    colorAry = ['brand-50','brand-600','star','brand-800','brand-800'];
    content = ['暢行無阻!','這地點對您的設備非常友善。'];
  }else if (shop.convenience >= 3 && count >= 1) {
    colorAry = ['blue-50','blue-200','heart-handshake','blue-600','blue-800'];
    content = ['整體不錯','需要陪伴者提供一點協助'];
  }else if (shop.convenience >= 2 && count >= 1){
    colorAry = ['org-50','org-200','hand-helping','org-600','org-800'];
    content = ['有點難度','需要陪伴者與店家共同協助'];
  }else {
    colorAry = ['red-50','red-200','frown','red-600','red-800'];
    content = ['困難指數MAX','整體來說不太適合輔具使用者'];
  }


  
  // 交通資訊
  const transitInfo = buildTransitInfo(shop);

  const evaluationHtml = `
      <div class="bg-${colorAry[0]} border-2 border-${colorAry[1]} rounded-2xl p-5 rotate-1 flex items-center">
        <div class="p-3 rounded-full mr-4 border border-${colorAry[1]}">
          <i data-lucide="${colorAry[2]}" class="text-${colorAry[3]}" size="24"></i>
        </div>
        <div>
          <h3 class="font-display font-bold text-${colorAry[4]} text-lg">${content[0]}</h3>
          <p class="text-sm font-bold text-${colorAry[4]}">${content[1]}</p>
        </div>
      </div>`;

  // 渲染圖片畫廊
  const galleryHtml = allImages.length > 0 ? `
    <div class="mt-12">
      <h2 class="text-2xl font-display font-black text-retro-blue mb-4 flex items-center">
        <i data-lucide="store" class="mr-3" size="28"></i>店家實景
      </h2>
      
      <div class="swiper gallery-swiper -mx-4 px-4">
        <div class="swiper-wrapper">
          ${allImages.map((url, index) => `
            <div class="swiper-slide">
              <img 
                src="${url}" 
                class="border-default h-32 w-48 object-cover rounded-2xl shadow-sm cursor-pointer hover:opacity-90 transition-opacity" 
                onclick="openImageModal(${index})"
                onerror="this.parentElement.style.display='none'"
              >
            </div>
          `).join('')}
        </div>
        
        <div class="swiper-button-prev" style="color: #1e3a8a;"></div>
        <div class="swiper-button-next" style="color: #1e3a8a;"></div>
      </div>
      
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
          
          <div class="swiper-button-prev" style="color: #1e3a8a;"></div>
          <div class="swiper-button-next" style="color: #1e3a8a;"></div>
          <div class="swiper-pagination !bottom-4"></div>
        </div>
      </div>
    </div>
  ` : '';

  const tagsHtml = tags.map(t => 
    `<span class="border-default px-4 py-1.5 bg-white text-retro-blue text-sm font-bold rounded-xl shadow-sm">#${escapeHtml(t)}</span>`
  ).join('');

  const html = `
    <div class="relative h-72 w-full rounded-b-[3rem] overflow-hidden shadow-xl shadow-retro-blue/10">
      <img src="${imageUrl}" class="w-full h-full object-cover" onerror="this.src='https://picsum.photos/800/600?random=${shop.id}'">
      <div class="absolute inset-0 bg-gradient-to-t from-retro-dark/90 via-retro-dark/30 to-transparent"></div>
      <a href="/index.html" class="absolute top-6 left-6 bg-white p-3 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all z-20">
        <i data-lucide="arrow-left" size="24" class="text-retro-blue" stroke-width="3"></i>
      </a>
      <div class="absolute bottom-8 left-6 right-6 text-white">
        <h1 class="text-3xl font-display font-black leading-none mb-2 drop-shadow-md">${escapeHtml(name)}</h1>
        <p class="text-white/90 text-sm font-bold flex items-center gap-3">
          <span class="bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">${escapeHtml(category)}</span>
          <span>${escapeHtml(address)}</span>
        </p>
      </div>
    </div>

    <div class="max-w-3xl mx-auto p-4 -mt-8 relative z-10 space-y-6">
      ${evaluationHtml}
      ${galleryHtml}
      <div class="border-default flex items-stretch justify-between bg-white rounded-3xl shadow-lg shadow-retro-blue/5 overflow-hidden">
        <div class="flex flex-col items-center justify-center bg-retro-blue/5 p-6 border-r-2 border-retro-blue/10 w-1/3">
          <span class="text-xs text-retro-blue/60 uppercase tracking-wide font-black mb-1">便利度</span>
          <span class="text-4xl font-display font-black text-retro-blue leading-none">${shop.convenience}</span>
        </div>
        
        <div class="flex flex-col justify-center flex-1 p-6">
          <span class="text-xs text-retro-blue/60 uppercase tracking-wide font-black mb-1">平均消費</span>
          <div class="flex items-center justify-between">
            <span class="text-retro-blue font-bold text-lg">${avgCost}</span>
            <div class="flex items-center text-xl">${renderPriceLevel(priceLevel)}</div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">${tagsHtml}</div>

      ${shop.mapUrl ? `
      <a href="${shop.mapUrl}" target="_blank" class="w-full flex items-center justify-center py-4 bg-retro-blue text-white rounded-2xl font-display font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-1 hover:shadow-none transition-all border-2 border-retro-blue">
        <i data-lucide="navigation" size="20" class="mr-2" stroke-width="2.5"></i> 導航前往
      </a>
      ` : ''}

      <div class="space-y-8">
        <section>
          <h2 class="text-2xl font-display font-black text-retro-blue mb-4 flex items-center"><i data-lucide="accessibility" class="mr-3" size="28"></i> 空間與設施</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${shop.food ? renderDetailItem('食物', renderRating(shop.food), 'utensils', true) : ''}
            ${shop.service ? renderDetailItem('服務', renderRating(shop.service), 'smile', true) : ''}
            ${renderDetailItem('出入口坡道', shop.ramp || '未提供', 'arrow-up-circle')}
            ${renderDetailItem('階梯狀況', Array.isArray(shop.steps) ? shop.steps.join(', ') : shop.steps || '未提供', 'accessibility')}
            ${renderDetailItem('門寬', shop.doorWidthCm , 'door-open')}
            ${renderDetailItem('內部動線', shop.circulation || '未提供', 'container')}
            ${renderDetailItem(
              '廁所', 
              (shop.restroom || '未提供') +
              (shop.restroomFloor ? `<div class="mt-2 inline-block bg-brand-100 text-brand-800 text-xs font-bold px-3 py-1 mx-2 rounded-full border border-brand-200"> ${escapeHtml(shop.restroomFloor)}樓</div>` : ''),
              'users', 
              true 
            )}
            ${renderDetailItem(
              '協助需求',
              (Array.isArray(shop.assistance) ? shop.assistance.join(', ') : shop.assistance || '未提供') + 
              (shop.assistanceOther ? `<div class="mt-2 inline-block bg-brand-100 text-brand-800 text-xs font-bold px-3 py-1 rounded-full border border-brand-200">其他: ${escapeHtml(shop.assistanceOther)}</div>` : ''),
              'help-circle',
              true
            )}
          </div>
        </section>
        
        <section>
          <h2 class="text-2xl font-display font-black text-retro-blue mb-4 flex items-center"><i data-lucide="truck" class="mr-3" size="28"></i> 交通指引</h2>
          <div class="border-default bg-white rounded-3xl p-6 shadow-sm space-y-6">
            ${shop.nearestParking ? `
            <div><span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">最近無障礙車位</span><p class="text-retro-blue font-bold text-lg">${escapeHtml(shop.nearestParking)}</p></div>
            <hr class="border-retro-blue/10"/>
            ` : ''}
            <div>
              <span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">捷運 / 公車</span>
              <p class="text-retro-blue font-bold text-lg">${escapeHtml(transitInfo)}</p>
            </div>
            ${shop.recommendedRoute ? `
            <hr class="border-retro-blue/10"/>
            <div><span class="text-xs font-black text-retro-blue/50 uppercase block mb-1">推薦無障礙路線</span><p class="text-retro-blue font-medium leading-relaxed">${escapeHtml(shop.recommendedRoute)}</p></div>
            ` : ''}
          </div>
        </section>
        
        ${description ? `
        <section>
          <h2 class="text-2xl font-display font-black text-retro-blue mb-4 flex items-center"><i data-lucide="message-circle-more" class="mr-3" size="28"></i>走訪心得</h2>
          <div class="border-default bg-white p-6 rounded-2xl">
            <p class="text-retro-blue/80 font-medium leading-relaxed whitespace-pre-wrap">${escapeHtml(description)}</p>
          </div>
        </section>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('shop-detail-container').innerHTML = html;
  lucide.createIcons();
  
  if (allImages.length > 0) {
    initSwiper(allImages);
  }
}

// ========== 工具函式 ========== //

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

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function buildTransitInfo(shop) {
  const transits = [];
  if (shop.mrt) transits.push(`捷運: ${shop.mrt}`);
  if (shop.bus) transits.push(`公車: ${shop.bus}`);
  return transits.length > 0 ? transits.join(' / ') : '(無)';
}

function renderPriceLevel(level) {
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += `<span class="${i < level ? 'text-retro-blue font-black' : 'text-retro-blue/20 font-bold'}">$</span>`;
  }
  return html;
}



function renderDetailItem(label, value, iconOrHtml, isHtml = false) {
    const iconContent = typeof iconOrHtml === 'string' && iconOrHtml.startsWith('<') 
    ? iconOrHtml 
    : `<i data-lucide="${iconOrHtml}" size="20"></i>`;

  // 如果isHtml為true，直接使用 value；否則進行 escapeHtml
  const displayValue = isHtml ? value : escapeHtml(value);

  return `
    <div class="border-default flex items-center p-4 bg-white rounded-2xl shadow-sm transition-colors">
      <div class="text-retro-blue mr-4 bg-retro-blue/5 p-2 rounded-xl flex items-center justify-center min-w-[2.5rem]">${iconContent}</div>
      <div>
        <span class="block text-xs font-bold text-retro-blue/40 mb-0.5">${escapeHtml(label)}</span>
        <span class="block text-base font-bold text-retro-blue">${displayValue}</span>
      </div>
    </div>`;
}

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

