/**
 * 這裡是拿來放一些通用小工具的地方
 * 不要再忘記加 export 了-.-
 */

/**
 * 生成文件ID
 * 格式: 
 *  - string 日期 → YYYYMMDD + 3位流水號 (例: 20260107001)
 *  - timestamp → YYYYMMDDHHMM (例: 202601071354)
 * @param {string|Date|Timestamp} dateTime - 日期時間
 * @param {string} collectionName - 集合名稱
 * @param {object} db - 資料庫
 */

export async function generateDocumentId(dateTime, collectionName, db) {

  // 判斷dateTime的類型
  let dateObj;
  let useTimestamp = false;

  if (dateTime instanceof Date) {
    // 已經是 Date 物件
    dateObj = dateTime;
    useTimestamp = true;
  } else if (typeof dateTime === 'string') {
    // 字串格式 (YYYY-MM-DD)
    dateObj = new Date(dateTime);
    useTimestamp = false;
  } else if (dateTime?.toDate) {
    // Firebase Timestamp
    dateObj = dateTime.toDate();
    useTimestamp = true;
  } else if (typeof dateTime === 'number') {
    // Unix timestamp (毫秒)
    dateObj = new Date(dateTime);
    useTimestamp = true;
  } else {
    throw new Error('無效的 dateTime 格式');
  }
    

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
   // 根據類型決定後綴
  if (useTimestamp) {
    // 使用時間戳記: YYYYMMDDHHMM
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const docId = `${datePrefix}${hours}${minutes}${seconds}`;  
    return docId;

  } else {
    // 使用流水號: YYYYMMDD + 3位流水號
    const snapshot = await db.collection(collectionName)
      .where(firebase.firestore.FieldPath.documentId(), '>=', `${datePrefix}000`)
      .where(firebase.firestore.FieldPath.documentId(), '<=', `${datePrefix}999`)
      .orderBy(firebase.firestore.FieldPath.documentId(), 'desc')
      .limit(1)
      .get();
    
    let sequence = 1; // 預設流水號為 001
    
    if (!snapshot.empty) {
      // 取得最後一個文件ID的流水號並加1
      const lastDocId = snapshot.docs[0].id;
      const lastSequence = parseInt(lastDocId.slice(-3));
      sequence = lastSequence + 1;
    }
  
    // 組合文件ID: YYYYMMDD + 3位流水號
    const docId = `${datePrefix}${String(sequence).padStart(3, '0')}`;
    return docId;
  }
}

/**
 * 登出功能
 * @param {firebase.firestore.Firestore} db - 避免沒有載入firebase-config.js報錯undefined
 */
export async function handleLogout(db) {
  try {
    const sessionId = sessionStorage.getItem('currentSessionId');
    
    if (sessionId && db) {
      await db.collection('login_sessions').doc(sessionId).update({
        status: 'logged_out',
        endTime: firebase.firestore.FieldValue.serverTimestamp()
      });
      sessionStorage.removeItem('currentSessionId');
      console.log('✅ Session 已更新為 logged_out');
    }
    
    await firebase.auth().signOut();
    console.log('✅ 登出成功');
    window.location.href = '/loginPage.html';
    
  } catch (error) {
    console.error('❌ 登出失敗:', error);
    alert('登出失敗: ' + error.message);
    throw error;
  }
}
