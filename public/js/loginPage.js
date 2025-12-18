
firebase.initializeApp(FIREBASE_CONFIG);
const analytics = firebase.analytics(); 

  // ========== 新增：初始化 reCAPTCHA ========== //
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('本地開發模式：啟用 App Verification 繞過');
  
  // 使用測試模式的 reCAPTCHA
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('submitBtn', {
    'size': 'invisible',
    'callback': (response) => {
      console.log('reCAPTCHA 驗證完成');
    },
    'error-callback': (error) => {
      console.error('reCAPTCHA 錯誤:', error);
    }
  });
  
  // 關鍵：設定 App Verification Disabled（僅限開發環境）
  firebase.auth().settings.appVerificationDisabledForTesting = true;
  
} else {
  // 正式環境的 reCAPTCHA 設定
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('submitBtn', {
    'size': 'invisible',
    'callback': (response) => {
      console.log('reCAPTCHA 驗證完成');
    }
  });
}
    // =========================================== //
      
      const db = firebase.firestore();

      document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('submitBtn');
        const errorMsg = document.getElementById('errorMessage');
        const originalText = btn.innerText;

        errorMsg.classList.remove('show');

        btn.disabled = true;
        btn.innerText = 'LOADING...';
        btn.classList.add('opacity-80', 'cursor-not-allowed');

        try {
          const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
          
          console.log('登入成功:', userCredential.user.email);
          
          // ========== 新增 3/4：呼叫記錄 Session 函式 ========== //
          await recordLoginSession(userCredential.user);
          // ==================================================== //
          
          window.location.href = '/admin.html';
          
        } catch (error) {
         console.error('登入錯誤:', error);
  
  if (error.code === 'auth/multi-factor-auth-required') {
    console.log('需要MFA驗證');
    
    try {
      const resolver = error.resolver;
      
      if (!resolver.hints || resolver.hints.length === 0) {
        throw new Error('找不到可用的 MFA 驗證方式');
      }
      
      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session
      };
      
      const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();
      
      console.log('📱 發送驗證碼到:', resolver.hints[0].phoneNumber);
      
      // 發送驗證碼
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        window.recaptchaVerifier
      );
      
      console.log('✅ 驗證碼已發送，verificationId:', verificationId);
      
      // 儲存資訊供後續驗證使用
      window.mfaResolver = resolver;
      window.mfaVerificationId = verificationId;
      
      // 提示用戶輸入驗證碼
      const code = prompt('請輸入簡訊驗證碼（6位數字）:');
      
      if (code) {
        // 建立驗證憑證
        const cred = firebase.auth.PhoneAuthProvider.credential(verificationId, code);
        const multiFactorAssertion = firebase.auth.PhoneMultiFactorGenerator.assertion(cred);
        
        // 完成 MFA 驗證
        const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
        
        console.log('✅ MFA 驗證成功:', userCredential.user.email);
        
        await recordLoginSession(userCredential.user);
        window.location.href = '/admin.html';
      }
      
    } catch (mfaError) {
      console.error('❌ MFA 處理失敗:', mfaError);
      errorMsg.textContent = '驗證失敗: ' + (mfaError.message || '請稍後再試');
      errorMsg.classList.add('show');
    }
    
    btn.disabled = false;
    btn.innerText = originalText;
    btn.classList.remove('opacity-80', 'cursor-not-allowed');
    return;
  }
  // ================================= //
          
          let errorMessage = '登入失敗，請檢查您的帳號密碼';
          
          if (error.code === 'auth/user-not-found') {
            errorMessage = '找不到此帳號';
          } else if (error.code === 'auth/wrong-password') {
            errorMessage = '密碼錯誤';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Email 格式不正確';
          } else if (error.code === 'auth/user-disabled') {
            errorMessage = '此帳號已被停用';
          } else if (error.code === 'auth/too-many-requests') {
            errorMessage = '嘗試次數過多，請稍後再試';
          }
          
          errorMsg.textContent = errorMessage;
          errorMsg.classList.add('show');
          
          btn.disabled = false;
          btn.innerText = originalText;
          btn.classList.remove('opacity-80', 'cursor-not-allowed');
        }
      });

    // ==================== Session記錄 ==================== //

    
    /**
     * 1. 生成裝置指紋，結合多種瀏覽器特徵來產生唯一識別碼
     * 2. 同一個ip無法區分"同一個人用不同裝置"或是"不同人用同一個網路"
     * 3. 指紋裝置：ip改變時仍能識別同一裝置，判斷登入異常、或從使用者習慣判斷是否異常
     * 4. 雖然防不了遠端桌面，但通常情況裝置指紋難以被偽造，可以多一個判斷
     * 5. 符合使用者隱私：不蒐集個人資訊，只蒐集裝置，無法反向推論管理員身分
     */
    function generateDeviceFingerprint() {

      const ua = navigator.userAgent;
      let browser = 'Unknown';
      let os = 'Unknown';

      // 瀏覽器(只保留名稱，不要版本
      if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Edg')) browser = 'Edge';

      // 作業系統識別
      if (ua.includes('Windows NT 10.0')) os = 'Windows10';
      else if (ua.includes('Windows NT 11.0')) os = 'Windows11';
      else if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Mac OS X')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

      // 收集裝置特徵
      const features = [
        browser, // 瀏覽器
        os,  // 作業系統
        navigator.language,  //語言設定
        screen.width + 'x' + screen.height, // 螢幕解析度(EX:1920x1080)，換螢幕機率低
        screen.colorDepth,  //色彩深度
        Math.round(new Date().getTimezoneOffset() / 60), // 時區(換這個看看)
        navigator.hardwareConcurrency || 0,   // CPU核心數
        navigator.maxTouchPoints || 0         // 觸控點數(區分手機/平板/電腦)
      ];

      /**
       * 組合成字串：
       * fingerprint = "Mozilla/5.0...|zh-TW|1920x1080|24|-480|8|Win32"
      */
      
      // 縮成短的hash值
      const fingerprint = features.join('|');
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i); //ASCII碼
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 轉換為32位元整數
      }
      
      return Math.abs(hash).toString(36); // 轉為36進位字串
    }

      /**
       * 記錄登入 Session
       * 包含：日期時間、管理員(email+UID)、IP、裝置(OS)、瀏覽器、狀態
       */
    async function recordLoginSession(user) {
      try {
        // 1. 生成裝置指紋
        const deviceFingerprint = generateDeviceFingerprint();
        console.log('🔐 裝置指紋:', deviceFingerprint);
        
        // 2. 更新上次未結束的 session 為 browser_closed
        const previousSessions = await db.collection('login_sessions')
          .where('uid', '==', user.uid)
          .where('status', '==', 'active')
          .get();
        
        if (!previousSessions.empty) {
          const batch = db.batch();
          previousSessions.forEach(doc => {
            batch.update(doc.ref, { 
              status: 'browser_closed',
              endTime: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        }
        
        // 3. 解析瀏覽器和作業系統
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        
        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Edg')) browser = 'Edge';
        
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS')) os = 'iOS';

        // 4. 取得 IP 位址
        let ipAddress = 'unknown';
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip;
          console.log('🔄 開始記錄 Session...');
          console.log('User UID:', user.uid);
          console.log('User Email:', user.email);
          console.log('IP Address:', ipAddress);
        } catch (e) {
          console.warn('無法取得 IP');
        }


        // 5. 建立 session 記錄 (加入 deviceFingerprint)
        const sessionData = {
          uid: user.uid,
          email: user.email,
          loginTime: firebase.firestore.FieldValue.serverTimestamp(),
          ipAddress: ipAddress,
          browser: browser,
          os: os,
          deviceFingerprint: deviceFingerprint,  // ← 加入這個
          deviceInfo: {  // ← 額外的裝置資訊
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`
          },
          status: 'active',
          endTime: null
        };

        const sessionRef = await db.collection('login_sessions').add(sessionData);
        sessionStorage.setItem('currentSessionId', sessionRef.id);
        
        console.log('Session 記錄成功:', sessionRef.id);
        
      } catch (error) {
        console.error('❌ Session 記錄失敗:', error);
      }
    }
          