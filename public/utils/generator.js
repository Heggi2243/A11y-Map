/**
 * 這裡是拿來放一些通用小工具的地方
 * 不要再忘記加 export 了-.-
 */

/**
 * 生成文件ID
 * 格式: YYYYMMDD + 3位流水號
 * @param {string} visitDate - 日期 (YYYY-MM-DD)
 * @param {string} collectionName - 集合名稱
 * @param {object} db - Firestore 實例
 */

export async function generateDocumentId(visitDate,collectionName,db) {

    
  // 將日期轉換為 YYYYMMDD 格式
  const dateObj = new Date(visitDate);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  // 查詢當天已有的文件數量
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


