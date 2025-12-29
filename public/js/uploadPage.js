// ============================================
// uploadPage Controller
// ============================================

// 通用小工具
import { generateDocumentId } from '../utils/basic.js';
// 表單配置&渲染
import { formData, initFormData, clearFormData } from '../config/formSchema.js';
import { renderForm } from '../config/formRender.js';

import { validateForm, showValidationErrors } from '../config/formValidator.js';

// ============================================
// 圖片壓縮功能
// ============================================

/**
 * 壓縮圖片（支援單張或多張）
 * @param {File|File[]} files - 單張圖片或圖片陣列
 * @returns {Promise<File|File[]>} 壓縮後的檔案
 */
async function compressImages(files) {
  // 判斷是單張還是多張
  const isArray = Array.isArray(files);
  const fileList = isArray ? files : [files];
  
  console.log(`📦 開始壓縮 ${fileList.length} 張圖片...`);
  
  const compressedFiles = [];
  
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    
    try {
      const compressed = await new Promise((resolve, reject) => {
        new Compressor(file, {
          quality: 0.8,           // 品質設定
          maxWidth: 1920,         // 最大寬度
          maxHeight: 1920,        // 最大高度
          mimeType: 'image/webp', // 輸出格式
          convertSize: 1000000,
          
          success(result) {
            const compressedFile = new File(
              [result], 
              file.name.replace(/\.\w+$/, '.webp'),
              { type: 'image/webp' }
            );
            
            console.log(`壓縮完成: ${file.name}`);
            console.log(`   原始: ${(file.size / 1024 / 1024).toFixed(2)} MB → 壓縮後: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
            
            resolve(compressedFile);
          },
          
          error(err) {
            reject(err);
          },
        });
      });
      
      compressedFiles.push(compressed);
      
    } catch (error) {
      console.warn(`圖片 ${file.name} 壓縮失敗，使用原檔案`);
      compressedFiles.push(file);
    }
  }
  
  console.log(`批次壓縮完成！`);
  
  return isArray ? compressedFiles : compressedFiles[0];
}

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
      } else {
          alert('❌ 您尚未登入，將跳轉到登入頁');
          window.location.href = '/loginPage.html';
          return;
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Firebase 初始化失敗:', error);
    return false;
  }
}

/**
 * 使用 Firebase Cloud Function 將地址轉換為經緯度
 * @param {string} address - 完整地址
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function geocodeAddress(address) {
  try {
    console.log('📍 呼叫 Cloud Function 轉換地址...');
    
    // 檢查使用者是否已登入
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      throw new Error('請先登入');
    }
    
    console.log(`👤 當前使用者: ${currentUser.uid}`);

    //前端也指定連接區域
    const functions = firebase.app().functions('asia-east1');
    
    // 呼叫 Cloud Function
    const geocodeFunction = functions.httpsCallable('geocodeAddress');
    console.log('準備呼叫 geocodeAddress function (asia-east1)...');
    
    const result = await geocodeFunction({ address: address });
    
    if (result.data.success) {
      const lat = result.data.latitude;
      const lng = result.data.longitude;
      console.log(`✅ 地址轉換成功: ${address} → (${lat}, ${lng})`);
      console.log(`📍 格式化地址: ${result.data.formattedAddress}`);
      return { lat, lng };
    } else {
      throw new Error('轉換失敗');
    }
  } catch (error) {
    console.error('❌ Geocoding 失敗:', error);
    
    // 處理不同類型的錯誤
    if (error.code === 'unauthenticated') {
      throw new Error('請先登入管理員帳號');
    } else if (error.code === 'permission-denied') {
      throw new Error('您沒有權限使用此功能（僅限管理員）');
    } else if (error.code === 'invalid-argument') {
      throw new Error('地址格式不正確');
    } else if (error.code === 'out-of-range') {
      throw new Error('地址不在台灣範圍內');
    } else if (error.code === 'not-found') {
      throw new Error(error.message || '找不到此地址');
    } else if (error.code === 'deadline-exceeded') {
      throw new Error('請求逾時，請稍後再試');
    } else {
      throw new Error(error.message || '無法取得座標');
    }
  }
}

// ========== 12/2新增：模式判斷 ========== 
/**
 * 判斷是新增還是編輯
 * @returns {Object} { isEditMode, storeId }
 */
function getPageMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const storeId = urlParams.get('id');
  
  return {
    isEditMode: !!storeId,
    storeId: storeId
  };
}

// ========== 新增：載入店家資料（編輯模式） ========== 
/**
 * 載入店家資料並預填表單
 * @param {string} storeId - 店家文件 ID
 */
async function loadStoreData(storeId) {
  try {
    console.log('📥 載入店家資料:', storeId);
    
    const doc = await db.collection('stores').doc(storeId).get();
    
    if (!doc.exists) {
      alert('❌ 找不到此店家資料');
      window.location.href = '/admin.html'; 
      return false;
    }
    
    const storeData = doc.data();
    // console.log('✅ 店家資料已載入:', storeData);
    
    // 初始化表單資料（預填）
    initFormData(storeData);
    
    return true;
    
  } catch (error) {
    console.error('❌ 載入店家資料失敗:', error);
    alert('載入資料失敗: ' + error.message);
    return false;
  }
}

// ========== 更新頁面標題(根據模式) ========== 
/**
 * 根據模式更新頁面標題和按鈕文字
 * @param {boolean} isEditMode - 是否為編輯模式
 */
function updatePageUI(isEditMode) {
  // 更新頁面標題
  const pageTitle = document.querySelector('title');
  if (pageTitle) {
    pageTitle.textContent = isEditMode ? '編輯店家資訊' : '新增店家資訊';
  }
  
  // 更新表單標題
  const formTitle = document.getElementById('form-title');
  if (formTitle) {
    formTitle.textContent = isEditMode ? '編輯店家資訊' : '無障礙店家資訊上傳表單';
  }
  
  // 更新提交按鈕文字
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    const btnText = submitBtn.querySelector('.font-display');
    if (btnText) {
      btnText.textContent = isEditMode ? '更新資料' : '提交表單';
    }
  }
}
// ==================== 圖片、資料寫入處理 ==================== 

/**
 * 處理圖片上傳並返回上傳後的資料
 * @param {boolean} isEditMode - 是否為編輯模式
 * @param {string} docId - 文件ID
 * @param {Object} oldData - 舊資料（編輯模式使用）
 * @returns {Promise<Object>} 上傳後的資料
 */
async function processImageUpload(isEditMode, docId, oldData = {}) {
  const uploadedData = {};
  let globalImageCounter = 1;
  
  // 從現有圖片找出最大編號
  if (isEditMode && oldData) {
    const imageFields = ['store_cover', 'entrance_photo', 'interior_photo'];
    let maxNumber = 0;
    
    for (const field of imageFields) {
      const urls = oldData[field] || [];
      for (const url of urls) {
        const match = url.match(/_(\d+)\./);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) maxNumber = num;
        }
      }
    }
    globalImageCounter = maxNumber + 1;
    console.log(`編輯模式：從編號 ${globalImageCounter} 繼續上傳`);
  }

  // 處理每個欄位
  for (const [key, value] of Object.entries(formData)) {
    // 新上傳的圖片
    if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
      console.log(`上傳圖片到資料夾: ${key}, 共 ${value.length} 張`);
      const compressedFiles = await compressImages(value);
      const uploadedUrls = [];
      
      for (let i = 0; i < compressedFiles.length; i++) {
        const file = compressedFiles[i];
        const fileExtension = file.name.split('.').pop();
        const imageNumber = String(globalImageCounter).padStart(2, '0');
        const fileName = `stores/${key}/${docId}_${imageNumber}.${fileExtension}`;
        
        const storageRef = storage.ref(fileName);
        await storageRef.put(file);
        const downloadURL = await storageRef.getDownloadURL();
        uploadedUrls.push(downloadURL);
        
        globalImageCounter++;
      }
      uploadedData[key] = uploadedUrls;
    } 
    // 保留現有圖片
    else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('http')) {
      uploadedData[key] = value;
    } 
    // 一般資料
    else {
      uploadedData[key] = value;
    }
  }
  
  return uploadedData;
}

/**
 * 刪除被移除的圖片
 * @param {Object} oldData - 舊資料
 * @param {Object} newData - 新資料
 */
async function deleteRemovedImages(oldData, newData) {
  const imageFields = ['store_cover', 'entrance_photo', 'interior_photo'];
  
  for (const field of imageFields) {
    const oldUrls = oldData[field] || [];
    const newUrls = newData[field] || [];
    const deletedUrls = oldUrls.filter(url => !newUrls.includes(url));
    
    if (deletedUrls.length > 0) {
      console.log(`🗑️ 準備刪除 ${field} 的圖片:`, deletedUrls);
      for (const url of deletedUrls) {
        try {
          const storageRef = storage.refFromURL(url);
          await storageRef.delete();
          console.log(`   ✅ 已刪除: ${storageRef.fullPath}`);
        } catch (error) {
          console.warn(`   ⚠️ 刪除失敗 (${url}):`, error.message);
        }
      }
    }
  }
}

/**
 * 寫入或更新 Firestore 文件
 * @param {boolean} isEditMode - 是否為編輯模式
 * @param {string} docId - 文件ID
 * @param {Object} uploadedData - 上傳後的資料
 * @param {number|null} latitude - 緯度
 * @param {number|null} longitude - 經度
 * @param {number} draft - 是否為草稿 (0=正式, 1=草稿)
 */
async function saveToFirestore(isEditMode, docId, uploadedData, latitude, longitude, draft) {
  const docData = {
    ...uploadedData,
    documentId: docId,
    latitude: latitude,
    longitude: longitude,
    draft: draft,
  };
  
  if (isEditMode) {
    docData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    docData.updatedBy = firebase.auth().currentUser?.uid || 'anonymous';
    await db.collection('stores').doc(docId).update(docData);
  } else {
    docData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    docData.createdBy = firebase.auth().currentUser?.uid || 'anonymous';
    docData.status = draft === 1 ? 'draft' : 'pending';
    await db.collection('stores').doc(docId).set(docData);
  }
}

// ==================== 草稿模式(不驗證、不取得座標) ==================== 
async function handleSaveDraft(buttonElement) {
  const originalHTML = buttonElement.innerHTML;
  const { isEditMode, storeId } = getPageMode();
  
  try {
    console.log('開始存成草稿:', formData);
    
    buttonElement.disabled = true;
    buttonElement.innerHTML = `<span class="text-2xl font-bold font-display tracking-widest uppercase">儲存中...</span>`;

    // 取得舊資料
    let oldData = {};
    if (isEditMode) {
      const oldDoc = await db.collection('stores').doc(storeId).get();
      if (oldDoc.exists) oldData = oldDoc.data();
    }

    // 決定文件 ID
    let docId = isEditMode ? storeId : await generateDocumentId(
      formData['visitDate'] || new Date().toISOString().split('T')[0], 
      'stores', 
      db
    );

    // 處理圖片上傳
    const uploadedData = await processImageUpload(isEditMode, docId, oldData);

    // 刪除被移除的圖片
    if (isEditMode) {
      await deleteRemovedImages(oldData, uploadedData);
    }

    // 寫入 Firestore (draft = 1, 保留舊座標)
    await saveToFirestore(
      isEditMode, 
      docId, 
      uploadedData, 
      oldData.latitude || null, 
      oldData.longitude || null, 
      1
    );

    console.log('✅ 草稿儲存成功! Document ID:', docId);
    alert(`✅ 草稿已儲存！\n文件 ID: ${docId}`);
    
    window.location.href = '/storePage.html'; 
    
  } catch (error) {
    console.error('❌ 儲存草稿失敗:', error);
    alert(`❌ 儲存失敗: ${error.message}`);
    buttonElement.disabled = false;
    buttonElement.innerHTML = originalHTML;
  }
}

// ==================== 提交處理（支援新增和編輯） ==================== 
async function handleSubmit(buttonElement) {
  const originalHTML = buttonElement.innerHTML;
  const { isEditMode, storeId } = getPageMode();
  
  try {
    console.log(`開始${isEditMode ? '更新' : '上傳'}表單資料:`, formData);
    
    // 表單驗證
    const validation = validateForm(formData);
    if (!validation.isValid) {
      showValidationErrors(validation.errors);
      return;
    }
    
    buttonElement.disabled = true;
    buttonElement.innerHTML = `<span class="text-2xl font-bold font-display tracking-widest uppercase">${isEditMode ? '更新中...' : '上傳中...'}</span>`;

    // 取得舊資料
    let oldData = {};
    if (isEditMode) {
      const oldDoc = await db.collection('stores').doc(storeId).get();
      if (oldDoc.exists) oldData = oldDoc.data();
    }
    
    // 地址轉經緯度
    let latitude = null;
    let longitude = null;

    if (formData.address) {
      const needsGeocoding = !isEditMode || (oldData.address !== formData.address);
      
      if (needsGeocoding) {
        try {
          buttonElement.innerHTML = `<span class="text-2xl font-bold font-display tracking-widest uppercase">取得座標中...</span>`;
          const coords = await geocodeAddress(formData.address);
          latitude = coords.lat;
          longitude = coords.lng;
          console.log(`✅ 座標: (${latitude}, ${longitude})`);
        } catch (error) {
          console.warn('⚠️ 座標取得失敗:', error.message);
          if (!confirm(`無法取得座標：${error.message}\n\n是否繼續上傳？(無座標將無法顯示距離)`)) {
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalHTML;
            return;
          }
        }
      } else {
        latitude = oldData.latitude;
        longitude = oldData.longitude;
      }
    }

    // 決定文件 ID
    let docId = isEditMode ? storeId : await generateDocumentId(formData['visitDate'], 'stores', db);

    // 處理圖片上傳
    const uploadedData = await processImageUpload(isEditMode, docId, oldData);

    // 刪除被移除的圖片
    if (isEditMode) {
      await deleteRemovedImages(oldData, uploadedData);
    }

    // 寫入 Firestore (draft = 0)
    await saveToFirestore(isEditMode, docId, uploadedData, latitude, longitude, 0);

    console.log(`✅ ${isEditMode ? '更新' : '上傳'}成功! Document ID:`, docId);
    alert(`✅ 店家資料${isEditMode ? '更新' : '上傳'}成功！\n文件 ID: ${docId}\n座標: ${latitude ? `(${latitude}, ${longitude})` : '未取得'}`);
    
    window.location.href = '/storePage.html'; 
    
  } catch (error) {
    console.error('❌ 操作失敗:', error);
    
    let errorMsg = `${isEditMode ? '更新' : '上傳'}失敗，請稍後再試。`;
    if (error.code === 'permission-denied') errorMsg = '權限不足';
    else if (error.message) errorMsg = error.message;
    
    alert(`❌ ${errorMsg}`);
    buttonElement.disabled = false;
    buttonElement.innerHTML = originalHTML;
  }
}

// ========== 修改：初始化 ========== 
async function init() {

  if (!initFirebase()) {
    alert('系統初始化失敗');
    return;
  }

  const { isEditMode, storeId } = getPageMode();
  updatePageUI(isEditMode);
  
  if (isEditMode) {
    const loaded = await loadStoreData(storeId);
    if (!loaded) return;
  } else {
    clearFormData();
  }
  
  renderForm();

  // 綁定提交按鈕
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.onclick = () => handleSubmit(submitBtn);
  }
  
  // 綁定草稿按鈕
  const draftBtn = document.getElementById('draft-btn');
  if (draftBtn) {
    draftBtn.onclick = () => handleSaveDraft(draftBtn);
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
}

// 當 DOM 載入完成後啟動應用程式
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}