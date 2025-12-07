/** Firebase Function
 * 適用需要呼叫第三方API等比較複雜的邏輯業務
 */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require('axios');


// 用process.env讀取環境變數
const { defineString } = require('firebase-functions/params');
const GOOGLE_MAPS_API_KEY = defineString('GOOGLE_MAPS_API_KEY');
/*
 *  (舊)const apiKey = functions.config().google.maps_api_key;
 *  ↑本來要在try裡面使用，但這個方法2026.03要被棄用了QQ
*/

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
exports.blockUnauthorizedUsers = functions.auth.user().onCreate(async (user) => {
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
exports.sendNewDeviceEmail = functions.firestore
    .document('login_sessions/{sessionId}')
    .onCreate(async (snap, context) => {
        const sessionData = snap.data();
        const uid = sessionData.uid;
        const email = sessionData.email;
        const ipAddress = sessionData.ipAddress;
        const deviceInfo = sessionData.deviceInfo || {};
        const loginTime = sessionData.loginTime;

        console.log(`新 Session 記錄: UID=${uid}, Email=${email}`);

        // 檢查是否為新裝置
        const isNewDevice = await checkIfNewDevice(uid, sessionData.deviceFingerprint, snap.id);

        if (!isNewDevice) {
            console.log('已知裝置，不發送通知');
            return null;
        }

        console.log('⚠️ 偵測到新裝置登入，準備發送 Email');

        // 準備 Email 內容
        const platform = deviceInfo.platform || '未知';
        const userAgent = deviceInfo.userAgent || '未知';
        const timezone = deviceInfo.timezone || '未知';

        const emailContent = `
            親愛的管理員，

            系統偵測到您的帳號有新裝置登入：

            📧 帳號: ${email}
            🕐 登入時間: ${loginTime ? loginTime.toDate().toLocaleString('zh-TW') : '未知'}
            🌐 IP 位址: ${ipAddress}
            💻 作業系統: ${platform}
            🌍 時區: ${timezone}
            🔍 瀏覽器資訊: ${userAgent}

            如果這不是您本人的操作，請立即：
            1. 變更您的密碼
            2. 檢查 Session 管理後台
            3. 聯繫其他管理員

            此為系統自動通知，請勿直接回覆此郵件。

            ---
            無障礙店家管理系統
        `;

        // 發送 Email（使用 Firebase Extensions 的 Trigger Email 或自訂方式）
        // 方式 1: 使用 mail 集合（需要安裝 Trigger Email extension）
        try {
            await admin.firestore().collection('mail').add({
                to: email,
                message: {
                    subject: '⚠️ 偵測到新裝置登入您的管理員帳號',
                    text: emailContent,
                    html: emailContent.replace(/\n/g, '<br>')
                }
            });
            console.log('✅ Email 通知已加入佇列');
        } catch (error) {
            console.error('❌ 發送 Email 失敗:', error);
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

