firebase.initializeApp(FIREBASE_CONFIG);
const analytics = firebase.analytics(); 
const donateBtn = document.getElementById('btn-donate');

donateBtn.addEventListener('click', async () => {

  alert('嘿，你是怎麼跑來這裡的？感謝你的心意，但目前金流帳號還在申請中，過幾天再來吧。');

  // try {
  //   // 取得選中的金額
  //   const selectedRadio = document.querySelector('input[name="amount"]:checked');
  //   const amount = selectedRadio ? selectedRadio.value : null;

  //   if (!amount || amount < 1) {
  //     alert('請選擇或輸入贊助金額');
  //     return;
  //   }

  //   console.log('贊助金額:', amount);

  //   // 顯示載入狀態
  //   const btn = document.getElementById('btn-donate');
  //   const originalHTML = btn.innerHTML;
  //   btn.disabled = true;
  //   btn.innerHTML = '<span>處理中...</span>';

  //   // 呼叫 Cloud Function 建立訂單
  //   const functions = firebase.app().functions('asia-east1');
  //   const createOrder = functions.httpsCallable('createECPayOrder');

  //   console.log('呼叫createECPayOrder');
    
  //   const result = await createOrder({ 
  //     amount: parseInt(amount),
  //     itemName: '贊助暢行無阻'
  //   });

  //   console.log('訂單建立成功:', result.data);

  //   if (result.data.success) {
  //       // alert('到目前都成功!');
  //     // 建立表單並自動提交到綠界
  //     submitToECPay(result.data.formData, result.data.actionUrl);
    
  //   } else {
  //     throw new Error('訂單建立失敗');
  //   }

  // } catch (error) {
  //   console.error('付款失敗:', error);
  //   alert('付款處理失敗，請稍後再試');
    
    // 恢復按鈕
    const btn = document.getElementById('btn-donate');
    btn.disabled = false;
    // btn.innerHTML = originalHTML;
  // }

});

/**
 * 提交表單到綠界
 */
function submitToECPay(formData, actionUrl) {
  // 建立隱藏表單
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = actionUrl;

    for (const key in formData) {
        if (formData.hasOwnProperty(key)) {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = key;
        hiddenField.value = formData[key];
        form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
    // submit 後可以移除 form
    document.body.removeChild(form);
}