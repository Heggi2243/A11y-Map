<img width="879" height="903" alt="indexPage" src="https://github.com/user-attachments/assets/32ffc7c9-a1bb-40b3-926a-9adfb4f18aa9" />

# 暢行無阻 A11y-Map 

> 這是一個為輪椅使用者打造的無障礙美食與旅遊地圖。
> An accessibility map dedicated to wheelchair users, built with Vanilla JS & Firebase.

[🔗前往網站](https://a11y-map.web.app/)

## 專案背景
「充滿困難的日常，我們不想讓它習以為常。」
這個專案的靈感來自於我的伴侶，他是一位輪椅使用者，對他來說每次外出都是一場必須經過重重規劃的挑戰。
目前台灣的無障礙設施還不是很全面，Google Map上的無障礙資訊也不見得能呈現出輪椅使用者需要知道的資訊，我們時常遇到「大門就在眼前，輪椅卻不得其門而入」、「實際進去店家/旅館後,才發現不太適合輪椅使用者」的窘境。

2025.11.20 Google AI Studio搭載了GEMINI 3的消息，讓我不禁聯想：「vibe coding會否成為一種客戶與程式設計師的全新溝通方式？」
我讓伴侶試著跟AI溝通製作出一個簡易Demo(如上圖那樣的indexPage)，讓他以使用者的角度提出真實的需求，我負責資料結構設計、全端開發與部署。我們希望透過高度結構化的資料與自動評級演算，解決資訊不對稱的問題。
因此 **「暢行無阻 A11y-Map」** 就這樣誕生了！21天歷時160個小時，堪稱用愛發電的爆肝之作( ･ิω･ิ)b

<img width="1784" height="855" alt="無標題-2025-12-12-1243" src="https://github.com/user-attachments/assets/1cc6217a-3bcd-4704-a00b-c2d3e23663b1" />


## 核心功能

<img width="1536" height="3804" alt="storeInfo" src="https://github.com/user-attachments/assets/bfc79e8f-4c2d-4cc0-aa16-6c1bd60ea4db" />

- **🛡️ 智慧分級**：
  系統不依賴人工主觀判斷等級，而是根據輸入的客觀條件（如：是否需協助、便利度評分），計算出四個無障礙等級：
  1. **🟢 暢行無阻**：無須協助且環境便利度高。
  2. **🟡 整體不錯**：需要陪伴者提供些許協助。
  3. **🟠 有點難度**：需要陪伴者與店家共同協助。
  4. **🔴 困難指數 MAX**：環境極不友善，不建議前往。

- **📝 詳細的環境參數**：
  不同於一般地圖僅標示「有無」，我們收集詳細的無障礙參數：
  - **空間數據**：門寬、階梯狀況 、坡道類型。
  - **設施細節**：廁所位置 (樓層/是否同層)、內部動線寬敞度。
  - **交通指引**：最近的無障礙車位、捷運電梯出口資訊。

- **🔍 個人化篩選**：依照輪椅尺寸、距離、類別 (美食/景點/住宿) 進行篩選。
  <img width="482" height="1098" alt="userSettings" src="https://github.com/user-attachments/assets/1a8648a2-fbfe-4b34-896a-eda6516bc2d5" />


- **🔐 CMS管理後台**：提供管理員使用的商店管理後台和資料上傳表單，支援圖片上傳、資料CRUD。
<img width="1899" height="1595" alt="storeManage html" src="https://github.com/user-attachments/assets/e227e83d-1071-4dd9-9877-ca8ba25e02d3" />
注意到了嗎？不管前台後台的footer都是像賽道般的小方塊，因為我們希望使用者能像我們的網站名一樣用飆的(暢行無阻)！

## 🛠️ Tech Stack

這是一個 **Solo Project**，由我從0到1獨立完成設計與開發。

### Frontend
- **JavaScript (ES6 Modules)**: 使用原生JS進行模組化開發，不依賴龐大框架，保持輕量。
- **HTML5 / CSS3**: RWD響應式設計，支援桌機與行動裝置。
- **Geocoding API**: 地址與經緯度轉換。

### Backend & Cloud
- **Firebase Firestore (NoSQL)**: 儲存店家結構化資料。
- **Firebase Authentication**: 實作管理員權限控管。
- **Firebase Storage**: 儲存店家封面與環境照片。
- **Firebase Hosting**: 網站部署與SSL憑證管理。

## 🧬 資料結構與邏輯

本專案的核心在於如何定義「無障礙」。為了確保資料精確，我設計了詳細的Schema並實作自動評分邏輯。

### 1. 資料模型 (Schema Design)
我設計了超過20個欄位的表單來紀錄環境細節，部分關鍵欄位如下：
```javascript
// 範例：部分資料結構
{
  "entrance": {
    "ramp": "有坡道 (平緩) / 有坡道 (陡峭) / 無坡道",
    "steps": ["微小門檻", "多階"],
    "doorWidth": "寬敞 (90cm以上)"
  },
  "facility": {
    "restroom": "無障礙廁所 (同層)",
    "aisle": "寬敞"
  },
  "metrics": {
    "convenience": 5, // 便利度評分 (0-5)
    "assistance": ["無須協助"] // 協助需求標籤
  }
}
```

2. 自動評級邏輯 (Rating Algorithm)
系統會讀取 assistance (協助需求) 與 convenience (便利度) 欄位，自動判定地點等級：
```javascript
// 核心邏輯簡化版
if (assistance.includes('無須協助') && convenience >= 4) {
    return '🟢 暢行無阻'; // 設備非常友善
} else if (convenience >= 3) {
    return '🟡 整體不錯'; // 需陪伴者協助
} else if (convenience >= 2) {
    return '🟠 有點難度'; // 需店家共同協助
} else {
    return '🔴 困難指數 MAX'; // 不適合輔具使用者
}
```

## 🔐 安全性與管理後台 (Security & Administration)

<img width="1911" height="903" alt="a11y-map web app_loginPage html" src="https://github.com/user-attachments/assets/a89297fa-299f-4e5d-99c6-a723b8f02d1c" />

為了確保資料庫安全並有效追蹤管理員的操作紀錄，我自行設計了一套後台管理系統，包含以下特色：

### 1. MFA驗證與環境隔離
為了保護擁有資料修改權限的管理員帳號，我在登入流程中實作了SMS簡訊驗證。

- **錯誤攔截機制**：
  系統不會直接拒絕登入，而是攔截 `auth/multi-factor-auth-required` 錯誤代碼，動態觸發 `PhoneAuthProvider` 流程，引導使用者輸入簡訊驗證碼。
- **Invisible reCAPTCHA**：
  整合 Google reCAPTCHA (Invisible mode) 防止暴力破解機器人，同時保持流暢的使用者體驗。
- **開發環境隔離 (Dev/Prod Separation)**：
  為了提升開發效率並節省簡訊配額，系統會自動偵測 `hostname`。若為本地開發環境 (`localhost`)，則自動啟用 `appVerificationDisabledForTesting` 模式，避免觸發真實的 reCAPTCHA 驗證。

```javascript
// 範例：MFA 錯誤攔截與開發環境判斷
try {
  await firebase.auth().signInWithEmailAndPassword(email, password);
} catch (error) {
  // 攔截MFA需求
  if (error.code === 'auth/multi-factor-auth-required') {
    const resolver = error.resolver;
    
    // 判斷是否為本地開發環境
    if (window.location.hostname === 'localhost') {
       firebase.auth().settings.appVerificationDisabledForTesting = true;
    }

    // 發送驗證碼並解決登入Promise
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      { multiFactorHint: resolver.hints[0], session: resolver.session },
      window.recaptchaVerifier
    );
    // ...後續驗證邏輯
  }
}
```
<img width="1251" height="1769" alt="adminPage" src="https://github.com/user-attachments/assets/0f8351f7-956f-4694-8e50-897b9136b73f" />

### 2. 裝置指紋識別 (Device Fingerprinting)
由於 Firebase Authentication 僅提供基本的登入驗證，為了進一步區分「異常登入」或「不同裝置的操作」，我實作了輕量級的裝置指紋技術。

- **運作原理**：
  蒐集瀏覽器的非敏感特徵（如 User Agent、螢幕解析度、時區偏移、CPU 核心數...等），經過運算產生一組 **32-bit Hash**。
- **解決痛點**：
  即便 IP 位置相同（例如連接同一個 Wi-Fi），系統仍能透過指紋區分出不同的實體裝置，作為安全稽核的依據。
- **隱私考量**：
  僅蒐集硬體特徵，不紀錄任何個人識別資訊 (PII)，無法反向推導出真實身分。

```javascript
// 核心程式碼：將特徵轉為 Hash
function generateDeviceFingerprint() {
  const features = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0
    // ...其他特徵
  ];
  
  // 簡單的Hash演算法，將字串轉為32位元整數
  const fingerprint = features.join('|');
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return hash;
}
```


## 🪙 金流串接
<img width="755" height="868" alt="donate" src="https://github.com/user-attachments/assets/b37e5d92-e818-44fc-bb11-72a5bd226c51" />

- 成功整合**綠界科技 (ECPay)**第三方支付 API，實作完整的贊助流程：

- 安全加密：使用Node.js crypto模組實作符合綠界規範的SHA256 CheckMacValue加密演算法。

- **非同步處理**：透過Cloud Functions建立後端API，確保金鑰（HashKey/IV）不外流至前端。

- 實作動態表單自動提交機制，實現從網站到支付頁面的無縫跳轉。

```
function generateCheckMacValue(params, hashKey, hashIV) {
  // 1. 參數排序(依照ASCII)
  const sortedKeys = Object.keys(params).sort();
  // 2. 組合成 Query String
    let rawString = sortedKeys
      .filter(key => key !== 'CheckMacValue') // 確保不包含 CheckMacValue
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 3. 前後加上 HashKey 與 HashIV
    rawString = `HashKey=${hashKey}&${rawString}&HashIV=${hashIV}`;

    // 4. 進行 URL Encode
    let encodedString = encodeURIComponent(rawString).toLowerCase();

    // 5. 修正編碼差異
    encodedString = encodedString
      .replace(/%2d/g, '-')
      .replace(/%5f/g, '_')
      .replace(/%2e/g, '.')
      .replace(/%21/g, '!')
      .replace(/%2a/g, '*')
      .replace(/%28/g, '(')
      .replace(/%29/g, ')')
      .replace(/%20/g, '+'); // 空白要轉成 +

    // 6. SHA256 加密並轉大寫
    const checkMacValue = crypto
      .createHash('sha256')
      .update(encodedString)
      .digest('hex')
      .toUpperCase();

    return checkMacValue;
}
```
- 2025/12/18 綠界金流已正式啟用。
- 路徑：點選首頁footer → [關於我們](https://a11y-map.web.app/info.html?view=about) ，即可於下方看到贊助按鈕。

## 🚀 未來展望

- [ ] 意見箱：開放一般使用者提交資訊更新要求。
- [ ] 更精緻的價格區間顯示：根據商店類別標示價格範圍。
- [ ] 加入 ARIA Labels、Semantic HTML，讓視障朋友也能透過螢幕閱讀器順利使用本網站。
- [ ] SEO優化。


## 📑 更新紀錄

### 2025/12/30 **Version 1.1.0**
- **[新增]** 管理員草稿功能：支援文章暫存，不再需要一次性完成撰寫。
- **[新增]** 快速返回後台按鈕：優化管理員在首頁與後台間的切換體驗。
- **[新增]** SEO：基本SEO(description、keywords)、Open Graph、Twitter Card，台/臺異體字keywords。
- **[優化]** 定位精準度：導入位置快取過期機制，每五分鐘更新一次定位。確保及時定位的準確性。
- **[優化]** 搜尋列表支援"臺"、"台"異體字搜尋。

### 2026/01/07 **Version 1.1.1**
- **[優化]** 定位功能UX：使用者同意啟用定位功能後，商店的"需啟用定位功能"會先轉為"抓取定位中..."，計算好後再呈現實際距離資訊。
- **[優化]** 個人化篩選UI/UX：於「找附近模式」同意啟用定位後，按鈕會先轉為ON再抓定位，改善使用者體驗。
- **[優化]** Database：loginSession、新裝置登入通知email的資料名稱改為人類可讀的時間戳記。(我真是太懶了)

### 2026/01/18 **Version 1.2.1**
- **[新增]** 「重新定位」按鈕，供使用者手動抓取定位。
- **[優化]** 定位快取改為每三分鐘更新一次。
- **[新增]** 「其他」類別商店，讓收錄的商店更具多元性。

### 2026/01/26 **Version 1.3.0**
- **[新增]** 針對住宿類商店的價格評比、無障礙評級、相關標籤、表單新增更細緻的判斷。
- **[優化]** SEO關鍵字以及Schema.org。
- **[優化]** 後臺資料管理介面。
- **[優化]** 使用lazy loading提升載入速度。
- **[優化]** 根據設備響應式載入圖片(另有安裝firebase插件Resize Images)。


## 📄 版權聲明 (Copyright & License)
- 本專案僅供閱覽、學習與技術交流參考，未開放任何形式的授權。
- 未經作者許可，禁止複製、修改、分發或用於任何商業用途。
- All rights reserved. This project is for viewing and educational purposes only. No reuse or redistribution is permitted.

