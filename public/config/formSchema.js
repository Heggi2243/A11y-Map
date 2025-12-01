// ============================================
// 這裡負責表單內容配置
// ============================================

/**
 * 快速創造標籤小工具
 */
export function createEl(tag, classes = "", innerHTML = "") {
  const el = document.createElement(tag);
  if (classes) el.className = classes;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

/**
 * 收到的表單資料會存在這
 */
export const formData = {};

export function setFormData(key, value) {
  formData[key] = value;
  console.log('FormData updated:', formData);
}

// ============================================
//  表單項目
// ============================================

export const FORM_SCHEMA = {
  "formTitle": "無障礙店家資訊上傳表單",
  "sections": [
    {
      "sectionId": "basic_info",
      "sectionTitle": "基本店家資訊",
      "fields": [
        { "itemId": "store_cover", "label": "店家封面", "type": "file_upload", "required": true, "dataType": "image", "note": "圖片上傳 (可複數)" },
        { "itemId": "店家名稱", "label": "店家名稱", "type": "text_input", "required": true},
        {
          "itemId": "類別",
          "label": "類別",
          "type": "checkbox_group", 
          "selectionType": "multiple",   
          "required": true,
          "options": [
            {"value": "餐飲", "label": "餐飲"},
            {"value": "景點", "label": "景點"},
            {"value": "購物", "label": "購物"},
            {"value": "住宿", "label": "住宿"}
          ]
        },
        { "itemId": "店家地址", "label": "店家地址", "type": "text_input", "required": true},
        { "itemId": "一人平均消費", "label": "一人平均消費(元)", "type": "number_input", "required": true},
        { "itemId": "到訪日期", "label": "到訪日期", "type": "date_input", "required": true},
        { "itemId": "地圖網址", 
          "label": "地圖網址", 
          "type": "textarea",
          "required": true, 
          "validation": {    // 自訂驗證
          "pattern": "^https://maps\\.app\\.goo\\.gl/",
           "message": "地圖網址格式錯誤，必須是 Google Maps 短網址"
          }
        },
        { "itemId": "entrance_photo", "label": "門口/階梯狀況", "type": "file_upload", "required": true, "dataType": "image", "note": "圖片上傳 (可複數)" },
        { "itemId": "interior_photo", "label": "餐飲/店內環境", "type": "file_upload", "required": true, "dataType": "image", "note": "圖片上傳 (可複數)" },
        {
          "itemId": "動線和便利度評分",
          "label": "動線/便利度評分",
          "type": "select_rating", 
          "required": true,
          "options": ["5","4.5", "4","3.5", "3", "2", "1", "0"], 
        },
        {
          "itemId": "食物評分",
          "label": "食物評分",
          "type": "select_rating",
          "required": true,
          "options": ["5", "4", "3", "2", "1", "0"]
        },
        {
          "itemId": "服務評分",
          "label": "服務評分",
          "type": "select_rating",
          "required": true,
          "options": ["5", "4", "3", "2", "1", "0"]
        }
      ]
    },
    {
      "sectionId": "space_facilities",
      "sectionTitle": "空間與設施",
      "fields": [
        {
          "itemId": "出入口坡道", "label": "出入口坡道", "type": "radio_group", "required": true, "selectionType": "single",
          "options": [
            {"value": "有坡道 (平緩)", "label": "有坡道 (平緩)"},
            {"value": "有坡道 (陡峭)", "label": "有坡道 (陡峭)"},
            {"value": "無坡道", "label": "無坡道"}
          ]
        },
        {
          "itemId": "階梯狀況",
          "label": "階梯狀況",
          "type": "checkbox_group", 
          "selectionType": "multiple",   
          "required": true,
          "options": [
            {"value": "無階梯", "label": "無階梯"},
            {"value": "一大階", "label": "一大階"},
            {"value": "多階 (兩階以上)", "label": "多階 (兩階以上)"},
            {"value": "微小門檻 (需翹輪椅)", "label": "微小門檻 (需翹輪椅)"},
            {"value": "微小門檻 (無需翹輪椅)", "label": "微小門檻 (無需翹輪椅)"}
          ]
        },
        { "itemId": "門寬",
          "label": "門寬", 
          "type": "radio_group", 
          "selectionType": "single",
          "required": true,
          "options": [
            {"value": "寬敞(90cm以上)", "label": "寬敞(90cm以上)"},
            {"value": "普通(80~90cm)", "label": "普通(80~90cm)"},
            {"value": "狹窄(70-80cm)", "label": "狹窄(70-80cm)"},
            ]
           },
        {
          "itemId": "廁所",
          "label": "廁所",
          "type": "radio_group",
          "selectionType": "single",
          "required": true,
          "options": [
            {"value": "一般廁所 (同層)", "label": "一般廁所 (同層)"},
            {"value": "一般廁所 (不同層)", "label": "一般廁所 (不同層)"},
            {"value": "無障礙廁所 (同層)", "label": "無障礙廁所 (同層)"},
            {"value": "無障礙廁所 (不同層)", "label": "無障礙廁所 (不同層)"},
            {"value": "無提供廁所", "label": "無提供廁所"},
          ],
          "conditionalFields": [
            {
              "triggerValues": ["一般廁所 (不同層)", "無障礙廁所 (不同層)"],
              "itemId": "廁所位在幾樓",
              "label": "請填寫廁所位在幾樓",
              "type": "number_input",
              // "required": true
            }
          ]
        },
        {
          "itemId": "內部動線", "label": "內部動線", "type": "radio_group", "required": true, "selectionType": "single",
          "options": [
            {"value": "普通", "label": "普通"},
            {"value": "寬敞", "label": "寬敞"},
            {"value": "略顯壅擠", "label": "略顯壅擠"}
          ]
        },
        {
          "itemId": "協助需求", "label": "協助需求", "type": "checkbox_group", "required": true, "selectionType": "multiple",
          "options": [
            {"value": "需協助開門", "label": "需協助開門"},
            {"value": "需協助進門", "label": "需協助進門"},
            {"value": "需協助入座", "label": "需協助入座"},
            {"value": "無須協助", "label": "無須協助，環境友善"},
            {"value": "其他", "label": "其他"}
          ],
          "conditionalField": {
            "triggerValue": "其他", "itemId": "其他協助需求補充", "label": "其他協助需求補充", "type": "text_input","required": true, "note": "當勾選「其他」時顯示此欄位"
          }
        }
      ]
    },
    {
      "sectionId": "transport_guidance",
      "sectionTitle": "交通指引",
      "fields": [
        { "itemId": "最近無障礙車位", "label": "最近無障礙車位", "type": "textarea", "required": false },
        {
          "itemId": "公車", "label": "捷運/公車", "type": "checkbox_group","required": false, "selectionType": "multiple",
          "options": [
            {"value": "捷運", "label": "捷運"},
            {"value": "公車", "label": "公車"}
          ],
          "conditionalFields": [
            {
              "triggerValue": "捷運", "itemId": "捷運補充說明", "label": "捷運補充說明", "type": "text_input","required": true, "note": "需填寫站別、電梯在幾號出口。", "placeholder": "例如：龍山寺捷運站2號出口，距離店家300公尺"
            },
            {
              "triggerValue": "公車", "itemId": "公車補充說明", "label": "公車補充說明", "type": "textarea","required": true, "note": "補充說明公車路線、站牌等。"
            }
          ]
        },
        { "itemId": "推薦無障礙路線", "label": "推薦無障礙路線", "type": "textarea", "required": false, "note": "說明從最近交通點到店家的路線。" }
      ]
    },
    {
        "sectionId":"Thoughts",
        "sectionTitle": "走訪心得",
        "fields": [
            { "itemId": "心得", "type": "textarea", "required": true, },
        ]
    }
  ]
};