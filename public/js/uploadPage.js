// ============================================
// uploadPage Controller
// ============================================

// 通用小工具
import { generateDocumentId } from '../utils/generator.js';
// 表單配置&渲染
import { formData } from '../config/formSchema.js';
import { renderForm } from '../config/formRender.js';

import { validateForm, showValidationErrors } from '../config/formValidator.js';


/**
 * Firebase Initialization 
 */

let db, storage;

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK 未載入');
    return false;
  }

  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    storage = firebase.storage();
    
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log('✅ 當前登入用戶UID:', user.uid);
        console.log('   是否為管理員:', [
          "TKJqrWGdmoPtaZuDmSLOUtTAzqK2",
          "bwYPuwjyX9VTDSVYw5THhFW7xAg2"
        ].includes(user.uid));
      } else {
        console.log('❌ 未登入');
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Firebase 初始化失敗:', error);
    return false;
  }
}




async function handleSubmit(buttonElement) {
    const originalHTML = buttonElement.innerHTML;
  
  try {
    console.log('🚀 開始上傳表單資料:', formData);
    
    // // ========== 驗證必填欄位 ========== 
    // if (!formData['到訪日期']) {
    //   alert('❌ 請填寫「到訪日期」');
    //   return;
    // }

     // ========== 表單驗證 ========== 
    const validation = validateForm(formData);
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors);
      return;  // ← 驗證失敗,中斷上傳
    }
    
    
    // 顯示載入狀態
    buttonElement.disabled = true;
    buttonElement.innerHTML = `<span class="text-2xl font-bold font-display tracking-widest uppercase">上傳中...</span>`;

    // ========== 1. 生成文件ID ========== 
    const docId = await generateDocumentId(formData['到訪日期'],'stores',db);
    console.log(`📋 生成文件ID: ${docId}`);

    // ========== 2. 處理圖片上傳 ========== 
    const uploadedData = {};
    let globalImageCounter = 1; // 全域圖片計數器
    
    for (const [key, value] of Object.entries(formData)) {
      // 檢查是否為檔案陣列
      if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
        console.log(`📤 上傳圖片到資料夾: ${key}, 共 ${value.length} 張`);
        
        const uploadedUrls = [];
        
        for (let i = 0; i < value.length; i++) {
          const file = value[i];
          
          // 取得檔案副檔名
          const fileExtension = file.name.split('.').pop();
          
          // 生成圖片名稱: docId_01, docId_02... (使用全域計數器)
          const imageNumber = String(globalImageCounter).padStart(2, '0');
          
          // 路徑結構: stores/{itemId}/{docId_序號}.副檔名
          const fileName = `stores/${key}/${docId}_${imageNumber}.${fileExtension}`;
          
          console.log(`   ↳ 上傳到: ${fileName}`);
          
          // 上傳到 Firebase Storage
          const storageRef = storage.ref(fileName);
          await storageRef.put(file);
          
          // 取得下載 URL
          const downloadURL = await storageRef.getDownloadURL();
          uploadedUrls.push(downloadURL);
          
          console.log(`   ✅ 圖片 ${i + 1}/${value.length} 上傳成功`);
          
          globalImageCounter++; // 遞增全域計數器
        }
        
        // 將檔案陣列替換成 URL 陣列
        uploadedData[key] = uploadedUrls;
      } else {
        // 非檔案資料直接複製
        uploadedData[key] = value;
      }
    }

    console.log('📝 準備寫入的資料:', uploadedData);

    // ========== 3. 準備要寫入 Firestore 的資料 ========== 
    const docData = {
      ...uploadedData,
      documentId: docId, // 加入文件ID欄位方便查詢
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'anonymous',
      status: 'pending'
    };

    // ========== 4. 使用自訂ID寫入 Firestore ========== 
    await db.collection('stores').doc(docId).set(docData);
    
    console.log('✅ 資料上傳成功! Document ID:', docId);
    
    // 顯示成功訊息
    alert(`✅ 店家資料上傳成功！\n文件 ID: ${docId}`);
    
    // 重置表單
    location.reload();
    
  } catch (error) {
    console.error('❌ 上傳失敗:', error);
    console.error('錯誤代碼:', error.code);
    console.error('錯誤訊息:', error.message);
    
    let errorMsg = '上傳失敗,請稍後再試。';
    
    // 根據錯誤類型提供更清楚的訊息
    if (error.code === 'permission-denied') {
      errorMsg = '權限不足,請檢查 Firestore 規則設定。';
    } else if (error.code === 'unavailable') {
      errorMsg = '無法連接到資料庫,請檢查網路連線。';
    } else if (error.code === 'already-exists') {
      errorMsg = '文件ID已存在,請稍後再試或聯絡管理員。';
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    alert(`❌ ${errorMsg}\n\n詳細資訊請查看 Console`);
    
    // 恢復按鈕
    buttonElement.disabled = false;
    buttonElement.innerHTML = originalHTML;
  }
}


// ============================================
// 8. Initialization
// ============================================

function init() {

  
  if (!initFirebase()) {
    console.error('❌ Firebase 初始化失敗，無法使用上傳功能');
    alert('系統初始化失敗，請重新整理頁面或聯絡管理員。');
    return;
  }

  // 渲染表單（會在內部初始化圖標）
  renderForm();

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.onclick = () => handleSubmit(submitBtn);
  }
}

// 當 DOM 載入完成後啟動應用程式
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}