/** Firebase Function
 * 適用需要呼叫第三方API等比較複雜的邏輯業務
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require('axios');
const crypto = require('crypto'); // Node.js內建，不需安裝(接綠界相關)
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-core');  // 改用 puppeteer-core
const chromium = require('@sparticuz/chromium');  // 新增這行

// 14天快取 = 1,209,600 秒
const CACHE_MAX_AGE = 1209600;


// 用process.env讀取環境變數
const { defineString } = require('firebase-functions/params');
const GOOGLE_MAPS_API_KEY = defineString('GOOGLE_MAPS_API_KEY');
/*
 *  (舊)const apiKey = functions.config().google.maps_api_key;
 *  ↑本來要在try裡面使用，但這個方法2026.03要被棄用了QQ
*/

// 綠界
const ECPAY_MERCHANT_ID = defineString('ECPAY_MERCHANT_ID');
const ECPAY_HASH_KEY = defineString('ECPAY_HASH_KEY');
const ECPAY_HASH_IV = defineString('ECPAY_HASH_IV');

// 通知email
const GMAIL_USER = defineString('GMAIL_USER'); 
const GMAIL_PASSWORD = defineString('GMAIL_PASSWORD'); 

// ========== Gmail SMTP 設定 ========== 
let transporter = null;

function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER.value(),
        pass: GMAIL_PASSWORD.value()
      }
    });
  }
  return transporter;
}

admin.initializeApp();

// 管理員 UID 白名單
const allowedUIDs = [
    "TKJqrWGdmoPtaZuDmSLOUtTAzqK2",
    "bwYPuwjyX9VTDSVYw5THhFW7xAg2",
];

/**
 * Cloud Function 1: 阻擋未授權用戶
 * 1. 用戶註冊 -> 檢查 UID 是否在白名單(目前只允許兩位管理員)
 * 2.1 是管理員 -> 保留帳號
 * 2.2 不是管理員 -> 立即刪除帳號
 * (雖然還沒開放會員註冊，但就先擺起來放著)
 */
exports.blockUnauthorizedUsers = functions.region('asia-east1').auth.user().onCreate(async (user) => {
    const uid = user.uid;
    const email = user.email || "無 Email";

    console.log(`新用戶創建: UID=${uid}, Email=${email}`);

    if (!allowedUIDs.includes(uid)) {
        console.warn(`⚠️ 未授權用戶，準備刪除: UID=${uid}, Email=${email}`);
        
        try {
            await admin.auth().deleteUser(uid);
            console.log(`✅ 成功刪除未授權用戶: UID=${uid}`);
        } catch (error) {
            console.error(`❌ 刪除用戶時發生錯誤: UID=${uid}`, error);
        }
        return null;
    }

    console.log(`✅ 授權管理員用戶創建成功: UID=${uid}, Email=${email}`);
    return null;
});

/**
 * Cloud Function 2: 監聽新 login_sessions 並發送 Email 通知
 * 偵測到新裝置登入時,發送 Email 通知
 * 觸發時機:
 * 每當 login_sessions 集合有新文件時執行
 */
exports.sendNewDeviceEmail = functions.region('asia-east1').firestore
    .document('login_sessions/{sessionId}')
    .onCreate(async (snap, context) => {
        const sessionData = snap.data();
        const uid = sessionData.uid;
        const email = sessionData.email;
        const ipAddress = sessionData.ipAddress;
        const browser = sessionData.browser || '未知';
        const os = sessionData.os || '未知';
        const deviceInfo = sessionData.deviceInfo || {};
        const timezone = deviceInfo.timezone || '未知';
        const loginTimeStamp = sessionData.loginTime;
        const loginTime = loginTimeStamp
            ? loginTimeStamp.toDate().toLocaleString('zh-TW', {
                timeZone: 'Asia/Taipei',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })
            : '未知';

        // console.log(`新 Session 記錄: UID=${uid}, Email=${email}`);

        // 檢查是否為新裝置
        const isNewDevice = await checkIfNewDevice(uid, sessionData.deviceFingerprint, snap.id);

        if (!isNewDevice) {
            console.log('已知裝置，不發送通知');
            return null;
        }

        // console.log('偵測到新裝置登入，準備發送 Email');

        // Email內容
        

        const emailContent = `
            親愛的管理員，

            系統偵測到您的帳號有新裝置登入：

            📧 帳號: ${email}
            🕐 登入時間: ${loginTime}
            🌐 IP 位址: ${ipAddress}
            🌍 時區: ${timezone}
            🔍 瀏覽器資訊: ${browser}

            如果這不是您本人的操作，請立即：
            1. 變更您的密碼
            2. 檢查Session管理後台
            3. 告知美麗的阿吉

            此為系統自動通知，請勿直接回覆此郵件。

            ---
            暢行無阻小精靈
        `;

         // 文件ID
        const baseDocId = sessionData.documentId || snap.id; // 如果沒有就用原本的
        const mailDocId = `${baseDocId}-偵測到新登入`;
        
        try {
            // 改用nodemailer發送郵件
            const transporter = getEmailTransporter();
            
            const info = await transporter.sendMail({
                from: `"暢行無阻小精靈" <${GMAIL_USER.value()}>`,
                to: email,
                subject: '偵測到新裝置登入您的管理員帳號',
                text: emailContent,
                html: emailContent.replace(/\n/g, '<br>')
            });
            
            // console.log('Email 已發送:', info.messageId);
            
            // 寫入 mail collection（紀錄用）
            await admin.firestore().collection('mail').doc(mailDocId).set({
                to: email,
                subject: '偵測到新裝置登入您的管理員帳號',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'sent',
                messageId: info.messageId,
                relatedSessionId: baseDocId
            });
            
        } catch (error) {
            console.error('發送Email失敗:', error);
            
            // 記錄失敗
            await admin.firestore().collection('mail').doc(mailDocId).set({
                to: email,
                subject: '偵測到新裝置登入您的管理員帳號',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'failed',
                error: error.message,
                relatedSessionId: baseDocId
            });
        }


        return null;
});

/**
 * 輔助函式：檢查是否為新裝置
 * @param {string} uid - 用戶 UID
 * @param {string} fingerprint - 裝置指紋
 * @param {string} currentSessionId - 當前 Session ID（排除自己）
 * @returns {boolean} 是否為新裝置
 */
async function checkIfNewDevice(uid, fingerprint, currentSessionId) {
    const snapshot = await admin.firestore()
        .collection('login_sessions')
        .where('uid', '==', uid)
        .where('deviceFingerprint', '==', fingerprint)
        .get();

    // 如果只有1筆就是剛剛新增的，表示是新裝置
    let count = 0;
    snapshot.forEach(doc => {
        if (doc.id !== currentSessionId) {
            count++;
        }
    });

    return count === 0;
}

/**
 * Geocoding Cloud Function(限管理員使用)
 * 在uploadPage上傳資料時塞入經緯度
 *  */ 

exports.geocodeAddress = functions.region('asia-east1').https.onCall(async (data, context) => {

  const userUID = context.auth.uid;
  
  if (!allowedUIDs.includes(userUID)) {
    console.warn(`❌ 未授權的使用者嘗試呼叫 geocodeAddress: ${userUID}`);
    throw new functions.https.HttpsError(
      'permission-denied', 
      '您沒有權限使用此功能（僅限管理員）'
    );
  }
  
  console.log(`✅ 管理員 ${userUID} 呼叫 geocodeAddress`);
  
  // 驗證地址參數
  const { address } = data;
  
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      '地址不可為空'
    );
  }
  
  // 呼叫Google Geocoding API
  try {
    // 改用新的方式讀取API金鑰
    const apiKey = GOOGLE_MAPS_API_KEY.value();
    
    if (!apiKey) {
      throw new Error('Google Maps API金鑰未設定');
    }
    
    console.log(`正在轉換地址: ${address}`);
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address.trim(),
        region: 'TW',
        key: apiKey,
        language: 'zh-TW'
      },
      timeout: 10000 // 10秒逾時
    });
    
    // 處理API回應
    if (response.data.status === 'OK' && response.data.results[0]) {
      const location = response.data.results[0].geometry.location;
      const lat = location.lat;
      const lng = location.lng;
      const formattedAddress = response.data.results[0].formatted_address;
      
      // 檢查是否在台灣範圍內
      if (lat >= 21.9 && lat <= 25.3 && lng >= 120.0 && lng <= 122.0) {
        console.log(`✅ 座標取得成功: (${lat}, ${lng})`);
        
        return {
          success: true,
          latitude: lat,
          longitude: lng,
          formattedAddress: formattedAddress
        };
      } else {
        console.warn(`⚠️ 地址不在台灣範圍內: (${lat}, ${lng})`);
        throw new functions.https.HttpsError(
          'out-of-range', 
          '地址不在台灣範圍內'
        );
      }
    } else {
      // 處理各種Google API錯誤
      let errorMessage = '無法取得座標';
      
      switch (response.data.status) {
        case 'ZERO_RESULTS':
          errorMessage = '找不到此地址，請確認地址是否正確';
          break;
        case 'OVER_QUERY_LIMIT':
          errorMessage = 'API 使用量超過限制，請稍後再試';
          break;
        case 'REQUEST_DENIED':
          errorMessage = 'API 請求被拒絕，請聯絡管理員';
          break;
        case 'INVALID_REQUEST':
          errorMessage = '地址格式不正確';
          break;
        default:
          errorMessage = `Geocoding失敗: ${response.data.status}`;
      }
      
      console.error(`❌ Geocoding失敗: ${response.data.status}`);
      throw new functions.https.HttpsError('not-found', errorMessage);
    }
    
  } catch (error) {
    console.error('❌ Geocoding錯誤:', error);
    
    // 如果是已經拋出的HttpsError，直接再拋出
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // 處理網路錯誤
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new functions.https.HttpsError(
        'deadline-exceeded', 
        '請求逾時，請稍後再試'
      );
    }
    
    // 其他未知錯誤
    throw new functions.https.HttpsError(
      'internal', 
      `系統錯誤: ${error.message}`
    );
  }
});

// ========== 綠界 ========== 

/**
 * 產生綠界檢查碼
 */
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

    // 4. 進行 URL Encode (關鍵！這裡是用來模擬 .NET 的編碼邏輯)
    let encodedString = encodeURIComponent(rawString).toLowerCase();

    // 5. 修正編碼差異 (綠界對於特殊符號的龜毛要求)
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

/**
 * 建立綠界訂單
 */
exports.createECPayOrder = functions.region('asia-east1').https.onCall(async (data, context) => {
  try {
    console.log('建立綠界訂單:', data);

    const { amount, itemName = '贊助暢行無阻' } = data;

    // 驗證金額
    if (!amount || amount < 1) {
      throw new functions.https.HttpsError('invalid-argument', '金額必須大於 0');
    }

    const merchantId = ECPAY_MERCHANT_ID.value();
    const hashKey = ECPAY_HASH_KEY.value();
    const hashIV = ECPAY_HASH_IV.value();

    // 產生訂單編號（時間戳 + 隨機數）
    const tradeNo = `A11Y${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 綠界 API 參數
    const params = {
      MerchantID: merchantId,
      MerchantTradeNo: tradeNo,
      MerchantTradeDate: new Date().toLocaleString('zh-TW', { 
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '/').replace(/,/g, ''),
      PaymentType: 'aio',
      TotalAmount: amount,
      TradeDesc: '贊助暢行無阻網站',
      ItemName: itemName,
      ReturnURL: 'https://asia-east1-a11y-map.cloudfunctions.net/ecpayCallback', // 付款完成後端通知
      ClientBackURL: 'https://a11y-map.web.app/donate-success.html', // 付款完成前端跳轉
      ChoosePayment: 'ALL',
      EncryptType: 1,
    };

    // 產生檢查碼
    params.CheckMacValue = generateCheckMacValue(params, hashKey, hashIV);

    console.log('✅ 訂單參數:', params);

    return {
      success: true,
      formData: params,
      actionUrl: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
    };

  } catch (error) {
    console.error('建立訂單失敗:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * 綠界付款結果回呼
 */
exports.ecpayCallback = functions.region('asia-east1').https.onRequest(async (req, res) => {
  try {
    console.log('收到綠界回呼:', req.body);

    const { RtnCode, RtnMsg, TradeNo, TradeAmt, PaymentDate } = req.body;

    if (RtnCode === '1') {
      console.log('付款成功:', TradeNo, TradeAmt);

      // 儲存捐款記錄到Firestore
      await admin.firestore().collection('donations').add({
        tradeNo: TradeNo,
        amount: parseInt(TradeAmt),
        paymentDate: PaymentDate,
        status: 'success',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      console.log('付款失敗:', RtnMsg);
    }

    // 回應綠界（必須回傳 "1|OK"）
    res.send('1|OK');

  } catch (error) {
    console.error('回呼處理失敗:', error);
    res.send('0|ERROR');
  }
});


exports.renderStore = functions
  .region('asia-east1')
  .runWith({
    memory: '2GB',  // 增加記憶體
    timeoutSeconds: 120,
    maxInstances: 5
  })
  .https.onRequest(async (req, res) => {
    
    const shopId = req.path.replace('/store/', '').replace('/', '');
    
    if (!shopId) {
      return res.redirect(301, '/');
    }
    
    // ========== 修正的 User-Agent 偵測 ==========
    const userAgent = req.headers['user-agent'] || '';
    const lowerUserAgent = userAgent.toLowerCase();
    
    const isBot = (
      lowerUserAgent.includes('googlebot') ||
      lowerUserAgent.includes('google-inspectiontool') ||
      lowerUserAgent.includes('bingbot') ||
      lowerUserAgent.includes('yandex') ||
      lowerUserAgent.includes('baiduspider') ||
      lowerUserAgent.includes('twitterbot') ||
      lowerUserAgent.includes('facebookexternalhit') ||
      lowerUserAgent.includes('rogerbot') ||
      lowerUserAgent.includes('linkedinbot') ||
      lowerUserAgent.includes('embedly') ||
      lowerUserAgent.includes('showyoubot') ||
      lowerUserAgent.includes('outbrain') ||
      lowerUserAgent.includes('pinterest') ||
      lowerUserAgent.includes('slackbot') ||
      lowerUserAgent.includes('vkshare') ||
      lowerUserAgent.includes('w3c_validator') ||
      lowerUserAgent.includes('applebot') ||
      lowerUserAgent.includes('whatsapp')
    );
    // =============================================
    
    // 記錄請求
    console.log('[REQUEST]', {
      shopId: shopId,
      isBot: isBot,
      userAgent: userAgent.substring(0, 80)  // 增加長度，看完整 UA
    });
    
    // 如果不是爬蟲，直接重導向
    if (!isBot) {
      return res.redirect(302, `/store.html?id=${shopId}`);
    }
    
    // 爬蟲請求 - 進行 SSR
    try {
      console.log(`[SSR] Rendering for bot: ${shopId}`);
      
      const startTime = Date.now();
      const html = await renderPage(shopId);
      const renderTime = Date.now() - startTime;
      
      console.log(`[SSR] Rendered ${shopId} in ${renderTime}ms`);
      
      // 設定快取 14 天
      res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=86400`);
      res.set('X-Render-Time', `${renderTime}ms`);
      res.status(200).send(html);
      
    } catch (error) {
      console.error(`[SSR] Error rendering ${shopId}:`, error);
      
      // 錯誤時返回基本 HTML
      const fallbackHtml = await getFallbackHTML(shopId);
      res.set('Cache-Control', 'no-cache');
      res.status(200).send(fallbackHtml);
    }
});

async function renderPage(shopId) {
  let browser;
  
  try {
    console.log(`[SSR] Starting render for ${shopId}`);
    
    // 使用 Chromium for Cloud Functions
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),  // 關鍵！使用 chromium 的執行檔
      headless: chromium.headless,
    });
    
    console.log(`[SSR] Browser launched`);
    
    const page = await browser.newPage();
    
    // 設定資源阻擋（節省記憶體）
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();
      
      if (
        resourceType === 'font' ||
        resourceType === 'media' ||
        resourceType === 'image' ||
        url.includes('googletagmanager') ||
        url.includes('analytics')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    await page.setUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
    await page.setViewport({ width: 375, height: 812 });
    
    const url = `https://a11y-map.web.app/store.html?id=${shopId}`;
    console.log(`[SSR] Navigating to ${url}`);
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 45000
    });
    
    console.log(`[SSR] Page loaded, waiting for content`);
    
    // 等待關鍵內容
    try {
      await page.waitForSelector('#shop-detail-container h1', {
        timeout: 25000
      });
      
      console.log(`[SSR] Content found!`);
      await page.waitForTimeout(2000);
      
    } catch (e) {
      console.error(`[SSR] Timeout:`, e.message);
      
      // 即使超時也繼續
      const content = await page.content();
      if (content.length < 5000) {
        throw new Error('Content too short');
      }
    }
    
    const html = await page.content();
    console.log(`[SSR] Success! HTML length: ${html.length}`);
    
    return html;
    
  } catch (error) {
    console.error(`[SSR] Error:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[SSR] Browser closed`);
    }
  }
}

async function getFallbackHTML(shopId) {
  const db = admin.firestore();
  
  try {
    const doc = await db.collection('stores').doc(shopId).get();
    
    if (!doc.exists) {
      return getDefaultHTML();
    }
    
    const shop = doc.data();
    const name = shop.name || '未命名店家';
    const category = Array.isArray(shop.category) ? shop.category.join(', ') : (shop.category || '其他');
    const description = shop.description || `${name} - ${category}類無障礙友善店家`;
    const imageUrl = (shop.store_cover?.[0] || shop.entrance_photo?.[0] || shop.interior_photo?.[0]) || 'https://a11y-map.web.app/img/og-default.jpg';
    
    // 建立更豐富的內容
    const facilities = [];
    if (shop.ramp) facilities.push(`坡道: ${shop.ramp}`);
    if (shop.doorWidthCm) facilities.push(`門寬: ${shop.doorWidthCm}`);
    if (shop.restroom) facilities.push(`廁所: ${shop.restroom}`);
    if (shop.circulation) facilities.push(`動線: ${shop.circulation}`);
    
    return `<!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(name)} - 無障礙${escapeHtml(category)} | 暢行無阻 A11y-Map</title>
      <meta name="description" content="${escapeHtml(description.substring(0, 150))}">
      <meta name="keywords" content="無障礙,輪椅友善,${escapeHtml(category)},${escapeHtml(name)},${escapeHtml(shop.address || '')}">
      
      <!-- Open Graph -->
      <meta property="og:type" content="website">
      <meta property="og:title" content="${escapeHtml(name)} - 無障礙${escapeHtml(category)}">
      <meta property="og:description" content="${escapeHtml(description.substring(0, 200))}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:url" content="https://a11y-map.web.app/store/${shopId}">
      
      <!-- 結構化資料 -->
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "${category.includes('餐飲') ? 'Restaurant' : 'LocalBusiness'}",
        "name": "${escapeHtml(name)}",
        "description": "${escapeHtml(description)}",
        "image": "${imageUrl}",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "TW",
          "streetAddress": "${escapeHtml(shop.address || '')}"
        },
        ${shop.convenience ? `
        "review": {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "暢行無阻 A11y-Map"
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": ${shop.convenience},
            "bestRating": "5"
          }
        },` : ''}
        "url": "https://a11y-map.web.app/store/${shopId}"
      }
      </script>
      
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #1e40af; }
        .facility { background: #eff6ff; padding: 8px 12px; margin: 4px; display: inline-block; border-radius: 4px; }
        img { max-width: 100%; height: auto; border-radius: 8px; }
        .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(name)}</h1>
      <img src="${imageUrl}" alt="${escapeHtml(name)}" loading="lazy">
      
      <p><strong>類別：</strong>${escapeHtml(category)}</p>
      ${shop.address ? `<p><strong>地址：</strong>${escapeHtml(shop.address)}</p>` : ''}
      ${shop.convenience ? `<p><strong>便利度：</strong>${shop.convenience} / 5</p>` : ''}
      
      <h2>無障礙設施</h2>
      ${facilities.map(f => `<span class="facility">${escapeHtml(f)}</span>`).join('')}
      
      <h2>詳細說明</h2>
      <p>${escapeHtml(description)}</p>
      
      <a href="/store.html?id=${shopId}" class="btn">查看完整互動式頁面</a>
      
      <noscript>
        <p><a href="/store.html?id=${shopId}">點擊這裡查看完整頁面</a></p>
      </noscript>
    </body>
    </html>`;
    
  } catch (error) {
    console.error('[SSR] Fallback HTML error:', error);
    return getDefaultHTML();
  }
}

function getDefaultHTML() {
    return `<!DOCTYPE html>
  <html lang="zh-TW">
  <head>
    <meta charset="UTF-8">
    <title>暢行無阻 A11y-Map - 無障礙友善店家</title>
    <meta name="description" content="提供台灣各地無障礙友善店家資訊">
    <meta http-equiv="refresh" content="0; url=/">
  </head>
  <body>
    <h1>暢行無阻 A11y-Map</h1>
    <p>載入中...</p>
  </body>
  </html>`;
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