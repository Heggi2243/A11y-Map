export function createSun() {
  return `
  <div class="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 overflow-hidden pointer-events-none z-0">
      <svg
        viewBox="0 0 100 100"
        class="w-full h-full text-amber-400 animate-[spin_10s_linear_infinite]"
        fill="currentColor"
      >
        <path d="M50 50 L50 0 L60 0 Z" />
        <path d="M50 50 L75 6.7 L82 14 Z" />
        <path d="M50 50 L93.3 25 L97 35 Z" />
        <path d="M50 50 L100 50 L100 60 Z" />
        <path d="M50 50 L93.3 75 L86 82 Z" />
        <path d="M50 50 L75 93.3 L65 97 Z" />
        <path d="M50 50 L50 100 L40 100 Z" />
        <path d="M50 50 L25 93.3 L18 86 Z" />
        <path d="M50 50 L6.7 75 L3 65 Z" />
        <path d="M50 50 L0 50 L0 40 Z" />
        <path d="M50 50 L6.7 25 L14 18 Z" />
        <path d="M50 50 L25 6.7 L35 3 Z" />
      </svg>
    </div>
  `;
}

// footer 前端共用元件
export function createFooter(containerId = 'app-footer') {
  // 取得或創建容器
  let container = document.getElementById(containerId);
  
  if (!container) {
    container = document.createElement('footer');
    container.id = containerId;
    document.body.appendChild(container);
  }

  // 設定 Footer HTML
  container.className = 'fixed bottom-0 left-0 w-full z-50 transition-all duration-300 ease-in-out bg-transparent';
  container.innerHTML = `
    <!-- Chevron Button -->
    <div class="absolute left-1/2 -translate-x-1/2 -top-5 z-50">
        <button id="footer-toggle-btn" class="bg-white border border-blue-100 shadow-md rounded-full w-10 h-10 flex items-center justify-center text-retro-blue hover:bg-blue-50 transition-transform duration-300 focus:outline-none group" aria-label="展開/收合頁尾" aria-expanded="false">
            <svg id="footer-chevron" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        </button>
    </div>

    <!-- Main Footer Body -->
    <div id="footer-body" class="bg-white/95 backdrop-blur-md border-t border-blue-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        
        <!-- Expandable Content (Links) -->
        <div id="footer-links" class="max-h-0 overflow-hidden transition-all duration-500 ease-in-out">
            <div class="py-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="info.html?view=privacy" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 text-retro-blue hover:bg-blue-50 hover:retro-blue-light border border-slate-200 hover:border-blue-200 transition-all text-sm font-medium group">
                    <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    隱私權政策與服務條款
                </a>
                <a href="info.html?view=about" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 text-retro-blue hover:bg-blue-50 hover:retro-blue-light border border-slate-200 hover:border-blue-200 transition-all text-sm font-medium group">
                    <svg class="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    關於我們
                </a>
            </div>
        </div>

        <!-- Copyright Label -->
        <div id="footer-label" class="py-3 cursor-pointer select-none">
          <p class="text-center text-blue-900 font-medium tracking-wide text-sm">
            暢行無阻 A11y-Map © 2025
          </p>
        </div>

        <!-- Checker Strip -->
        <div class="w-full h-4 checker-strip opacity-90 pointer-events-none" aria-hidden="true"></div>
    </div>
  `;

  // 初始化事件監聽
  initFooterEvents();

  return container;
}

/**
 * 初始化 Footer 的事件監聽器
 */
function initFooterEvents() {
  const footerToggleBtn = document.getElementById('footer-toggle-btn');
  const footerLabel = document.getElementById('footer-label');
  const footerLinks = document.getElementById('footer-links');
  const footerChevron = document.getElementById('footer-chevron');
  
  let isFooterExpanded = false;

  function toggleFooter() {
    isFooterExpanded = !isFooterExpanded;
    
    // 更新 aria-expanded 屬性以提升無障礙性
    footerToggleBtn.setAttribute('aria-expanded', isFooterExpanded);
    
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