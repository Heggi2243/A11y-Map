const VIEW_CONTENT = {
PRIVACY: {
    title: '隱私權政策',
    html: `
    <p class="mb-3 text-retro-dark/80 leading-relaxed">本隱私權政策(以下稱「本政策」)旨在說明「暢行無阻 A11y-Map」(以下稱「本網站」或「我們」)在您使用本網站服務時,如何收集、使用及保護您的個人資料。
        本網站由個人名義營運與管理。</p>
    <div class="space-y-6 animate-fade-in">
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm">
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">1. 資料收集方式與類型</h3>
        <p class="text-retro-dark/80 leading-relaxed">
            由於本網站目前不開放會員註冊功能,我們不會主動要求您提供姓名、地址等直接識別個人的資料。然而,我們透過使用第三方服務,會在您瀏覽本網站時自動收集以下資訊:<br>
        1.1 瀏覽器定位服務 (HTML5 Geolocation):收集使用者當前位置的經度與緯度。僅在使用者主動同意並點擊篩選附近店家時啟用,以提供距離篩選服務。<br>
        1.2 網站紀錄 (Firebase/Firestore):收集 IP 位址、瀏覽器類型、裝置類型、操作系統、頁面瀏覽紀錄、訪問時間。用於網站維護、追蹤系統錯誤、防止惡意行為,確保服務安全。<br>
        1.3 Google Analytics (流量分析):收集匿名化流量數據、瀏覽行為、用戶來源、點擊路徑,以提升網站效能與服務品質分析。<br>
        1.4 Google AdSense (廣告服務):收集 Cookie 與裝置識別碼等追蹤技術所產生的匿名資料,用於向您投放個人化廣告。
        </p>
        </div>
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm">
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">2. 資料使用</h3>
        <p class="text-retro-dark/80 leading-relaxed">
            我們收集的資料僅用於以下目的:<br>
            2.1 位置數據:根據您同意開啟的定位資訊,提供「附近店家篩選」服務,僅用於即時提供無障礙路徑規劃與設施查詢功能。<br>
            2.2 廣告與行銷:透過 Google AdSense 投放個人化廣告,以維持本網站營運。<br>
            2.3 維護與安全:監控網站運行狀態,追蹤錯誤,並防止任何可能損害本網站或其他使用者的惡意或詐欺行為。<br>
            您的個人資料將不會向任何未參與本服務提供的第三方共享、出售或出租。
        </p>
        </div>
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm">
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">3. 第三方服務</h3>
        <p class="text-retro-dark/80 leading-relaxed">
            本網站依賴 Google 提供的多項服務(AdSense、Analytics、Maps、Firebase)運行。這些服務可能會使用 Cookie、網站信標或其他追蹤技術,以達到廣告優化、流量分析等目的。
        依據 Google 的政策,使用 AdSense 的網站必須揭露 Cookie 的使用。若您不希望接收個人化廣告,您可以透過您的瀏覽器設定或Google的<a href="https://myadcenter.google.com/" class="text-retro-blue underline hover:text-retro-lightBlue">廣告設定頁面</a>進行調整。
        </p>
        </div>
    </div>
    `
},
TERMS: {
    title: '服務條款',
    html: `
    <p class="mb-3 text-retro-dark/80 leading-relaxed">歡迎您使用「暢行無阻 A11y-Map」(以下稱「本網站」或「我們」)。當您開始使用本網站時,即表示您已閱讀、理解並同意遵守本服務條款(以下稱「本條款」)。</p>
    <div class="space-y-6 animate-fade-in">
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm">
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">1. 服務內容與變更</h3>
        <p class="text-retro-dark/80 leading-relaxed">
            1.1 本網站提供台灣地區無障礙美食店家的資訊、地圖定位服務與個人評價等內容,供使用者參考。<br>
            1.2 我們保留在任何時間、以任何理由,修改、暫停或終止本網站的全部或部分服務的權利,而無需事先通知使用者。
        </p>
        </div>
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm">
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">2. 內容所有權與智慧財產權</h3>
        <p class="text-retro-dark/80 leading-relaxed">
            2.1 本網站上所有的內容,包括但不限於地圖資料、無障礙資訊、文字敘述、圖片、照片、網站設計及程式碼,其所有權、著作權及其他智慧財產權均歸屬於「暢行無阻 A11y-Map」所有。<br>
            2.2 未經本網站事前書面同意,使用者不得以任何形式(包括但不限於複製、散布、轉載、公開展示或創作衍生作品)使用本網站之內容。
        </p>
        </div>
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm">
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">3. 使用者行為規範與禁止事項</h3>
        <p class="text-retro-dark/80 leading-relaxed">
            3.1 本網站目前不開放留言、評論或圖片上傳功能。<br>
            3.2 嚴格禁止任何使用者利用本網站從事以下行為:<br>
            &ensp;• &ensp;惡意攻擊與騷擾: 發表或傳播任何帶有歧視、人身攻擊、威脅、淫穢、煽動或不法之資訊。<br>
            &ensp;• &ensp;散布不實資訊: 散布任何虛假、不實或具誤導性的資訊,特別是關於店家營業狀況或無障礙設施的資訊。<br>
            &ensp;• &ensp;未經授權使用: 試圖非法入侵、破壞、存取或繞過本網站或其相關系統的任何安全措施。<br>
            &ensp;• &ensp;資料爬取: 未經書面許可,以任何自動化方式(如爬蟲程式、機器人)大量擷取、複製或使用本網站的資料內容。
        </p>
        </div>
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm">
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">4. 重要免責聲明</h3>
        <p class="text-retro-dark/80 leading-relaxed">
            <b>4.1 資訊時效性與準確性:</b><br>
            本網站提供的無障礙資訊、地圖資料及店家現況(包括坡道、電梯、出入口等)皆是我們在撰寫時依據當下實際情況或公開資料所整理。然而,<b>店家設施可能隨時變動,本網站不保證所有資訊的即時性或絕對準確性。</b><br>
            <b>4.2 使用者查證義務:</b><br>
            本網站提供的資訊僅供<b>參考</b>之用。使用者應自行承擔所有風險,並有義務在實際前往店家前,自行透過電話或其他方式再次查證其無障礙設施的現況,以確保其旅遊或用餐安全。<br>
            <b>4.3 不擔保責任:</b><br>
            本網站不對因使用或無法使用本網站服務所導致的任何直接、間接、附帶或衍生性損害承擔責任。<br>
        </p>
        </div>
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm">
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">5. 準據法與管轄法院</h3>
        <p class="text-retro-dark/80 leading-relaxed">
            5.1 本條款的解釋、效力及任何相關爭議,均應依照中華民國法律解釋與規範。<br>
            5.2 若因使用本網站服務而產生任何法律爭議,應以台灣台北地方法院為第一審管轄法院。<br>
        </p>
        </div>
    </div>
    `
},
ABOUT: {
    title: '關於我們',
    html: `
    <div class="space-y-6 animate-fade-in">
        <div class="bg-white/80 p-6 rounded-2xl border-2 border-retro-blue/10 shadow-sm backdrop-blur-sm text-center">
        <div class="w-20 h-20 bg-retro-yellow rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
            <img 
            src="img/cat.png" 
            id="knarfCat"
            alt="Black Cat Decoration" 
            style="width: 4rem;"
        />
        </div>
        <h3 class="text-xl font-display font-bold text-retro-blue mb-3">「充滿困難的日常,我們不想讓它習以為常。」</h3>
        <p class="text-retro-dark/80 leading-relaxed mb-4">
            對於需仰賴輔具生活的人來說,每次外出都是一場必須經過重重規劃的挑戰。目前台灣的無障礙設施還不是很全面,google Map上的相關資訊也尚少,我們時常遇到「大門就在眼前,輪椅卻不得其門而入」、「實際進去店家/旅館後,才發現不太適合輪椅使用者」的窘境,這種資訊落差與困頓讓我們決定為身障者做出一些改變。<br>
            <br>
            《暢行無阻 A11y-Map》是一位由輪椅輔助的身障者以及他的伴侶製作出來的網站,每一筆資料、每一張照片,都是我們親自走訪並經過實際情況撰寫的原創內容,以身障者、使用者的雙重視角提供具體且可靠的無障礙資訊。<br>
            <br>
            我們希望人人都有快樂生活的權利,讓身障者、年邁的長輩或行動不便的朋友,不再因為擔心設施不全或造成他人困擾而卻步。也讓您在為身邊的親友安排聚餐或旅遊行程時,不再感到手足無措,能夠自信地規劃出一趟<b>暢行無阻之旅</b>。
            <br><br>
            【聯絡信箱】cxwzA11yMap@gmail.com
            <br>
            <a href="/donate.html" class="inline-block bg-retro-blue mt-6 text-white px-6 py-3 rounded-xl font-bold hover:bg-retro-blue/90 transition">
                贊助我們
            </a>
        </p>
        <p class="text-sm text-retro-blue/60 font-bold">Version 1.0.0</p>
        </div>
    </div>
    `
}
};

// Button Style Classes
const BTN_ACTIVE = "bg-retro-blue text-white ring-2 ring-retro-blue ring-offset-2 ring-offset-retro-paper";
const BTN_INACTIVE = "bg-white text-retro-blue border-2 border-retro-blue/10 hover:bg-retro-blue/5 hover:border-retro-blue/30";

let currentView = 'PRIVACY';

// ============================================

function getViewFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get('view');
  
  if (view) {
    const viewUpper = view.toUpperCase();
    if (VIEW_CONTENT[viewUpper]) {
      return viewUpper;
    }
  }
  
  return 'PRIVACY';
}

function updateView(viewName) {
  currentView = viewName;
  const data = VIEW_CONTENT[viewName];

  document.getElementById('page-title').textContent = data.title;
  document.getElementById('content-container').innerHTML = data.html;
  updateButtonStyles();
  lucide.createIcons();
}

function updateButtonStyles() {
  const buttons = [
    { id: 'nav-privacy', view: 'PRIVACY' },
    { id: 'nav-terms', view: 'TERMS' },
    { id: 'nav-about', view: 'ABOUT' }
  ];

  buttons.forEach(btnInfo => {
    const btnEl = document.getElementById(btnInfo.id);
    btnEl.className = "nav-btn flex items-center px-6 py-2.5 text-sm font-display font-bold rounded-full transition-all duration-200 shadow-sm";
    
    if (btnInfo.view === currentView) {
      btnEl.className += ` ${BTN_ACTIVE}`;
    } else {
      btnEl.className += ` ${BTN_INACTIVE}`;
    }
  });
}

// 事件綁定

function initEventListeners() {
  document.getElementById('nav-privacy').addEventListener('click', () => updateView('PRIVACY'));
  document.getElementById('nav-terms').addEventListener('click', () => updateView('TERMS'));
  document.getElementById('nav-about').addEventListener('click', () => updateView('ABOUT'));
}

// 初始化

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  const initialView = getViewFromURL();
  updateView(initialView);
  initEventListeners(); // 綁定事件監聽
});