// ============================================
//  formSchema.js 這裡負責表單內容配置
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
  // console.log('FormData updated:', formData);
}


// ====== 12/2新增: 編輯模式 ====== //
/**
 * 初始化表單資料
 * @param {Object} data - 從資料庫取得的資料
 */
export function initFormData(data) {
  
  // 清空現有資料
  Object.keys(formData).forEach(key => {
    delete formData[key];
  });
  
  // 填入新資料
  Object.keys(data).forEach(key => {
    formData[key] = data[key];
  });
  
  // console.log('formData已初始化:', formData);
}


/**
 * 清空表單資料（用於重置）
 */
export function clearFormData() {
  Object.keys(formData).forEach(key => {
    delete formData[key];
  });
  // console.log('表單資料已清空');
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
        { "itemId": "store_cover", "label": "*店家封面", "type": "file_upload", "required": true, "dataType": "image", "note": "圖片上傳 (可複數)" },
        { "itemId": "name", "label": "*店家名稱", "type": "text_input", "required": true},
        {
          "itemId": "category",
          "label": "*類別",
          "type": "checkbox_group", 
          "selectionType": "multiple",   
          "required": true,
          "options": [
            {"value": "美食", "label": "美食"},
            {"value": "景點", "label": "景點"},
            {"value": "購物", "label": "購物"},
            {"value": "住宿", "label": "住宿"},
            {"value": "其他", "label": "其他"}
          ],
          // ========== 新增：當勾選「住宿」時顯示浴室設計 ========== 
          "conditionalField": {
            "triggerValue": "住宿",
            "itemId": "bathroomDesign",
            "label": "*浴室設計",
            "type": "radio_group",
            "required": true,
            "selectionType": "single",
            "options": [
              {"value": "無障礙設計", "label": "無障礙設計"},
              {"value": "非無障礙設計", "label": "非無障礙設計"},
              {"value": "危險", "label": "危險"}
            ],
            "note": "勾選「住宿」類別時需填寫此欄位"
          }
        },
        { "itemId": "address", "label": "*店家地址", "type": "text_input", "required": true},
        { "itemId": "avgCost", "label": "*一人平均消費(元)", "type": "number_input", "required": true},
        { "itemId": "visitDate", "label": "*到訪日期", "type": "date_input", "required": true},
        { "itemId": "mapUrl", 
          "label": "*地圖網址", 
          "type": "text_input",
          "required": true, 
          "validation": {    // 自訂驗證
          "pattern": "^https://maps\\.app\\.goo\\.gl/",
           "message": "地圖網址格式錯誤，必須是 Google Maps 短網址"
          }
        },
        { "itemId": "entrance_photo", "label": "*門口/階梯狀況", "type": "file_upload", "required": true, "dataType": "image", "note": "圖片上傳 (可複數)" },
        { "itemId": "interior_photo", "label": "*餐飲/店內環境", "type": "file_upload", "required": true, "dataType": "image", "note": "圖片上傳 (可複數)" },
        {
          "itemId": "convenience",
          "label": "*動線/便利度評分",
          "type": "select_rating", 
          "required": true,
          "options": ["5","4.5", "4","3.5", "3", "2", "1", "0"], 
        },
        {
          "itemId": "food",
          "label": "食物評分",
          "type": "select_rating",
          "required": false,
          "options": ["5", "4", "3", "2", "1", "0"]
        },
        {
          "itemId": "service",
          "label": "服務評分",
          "type": "select_rating",
          "required": false,
          "options": ["5", "4", "3", "2", "1", "0"]
        }
      ]
    },
    {
      "sectionId": "space_facilities",
      "sectionTitle": "空間與設施",
      "fields": [
        {
          "itemId": "ramp", "label": "*出入口坡道", "type": "radio_group", "required": true, "selectionType": "single",
          "options": [
            {"value": "有坡道 (平緩)", "label": "有坡道 (平緩)"},
            {"value": "有坡道 (陡峭)", "label": "有坡道 (陡峭)"},
            {"value": "無坡道 (順行)", "label": "無坡道 (順行)"}
          ]
        },
        {
          "itemId": "steps",
          "label": "*階梯狀況",
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
        { "itemId": "doorWidthCm",
          "label": "*門寬", 
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
          "itemId": "restroom",
          "label": "*廁所",
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
              "itemId": "restroomFloor",
              "label": "請填寫廁所位在幾樓",
              "type": "number_input",
              // "required": true
            }
          ]
        },
        {
          "itemId": "circulation", "label": "*內部動線", "type": "radio_group", "required": true, "selectionType": "single",
          "options": [
            {"value": "普通", "label": "普通"},
            {"value": "寬敞", "label": "寬敞"},
            {"value": "略顯壅擠", "label": "略顯壅擠"}
          ]
        },
        {
          "itemId": "assistance", "label": "*協助需求", "type": "checkbox_group", "required": true, "selectionType": "multiple",
          "options": [
            {"value": "需協助開門", "label": "需協助開門"},
            {"value": "需協助進門", "label": "需協助進門"},
            {"value": "需協助入座", "label": "需協助入座"},
            {"value": "無須協助", "label": "完全不需要"},
            {"value": "其他", "label": "其他"}
          ],
          "conditionalField": {
            "triggerValue": "其他", "itemId": "assistanceOther", "label": "其他協助需求補充", "type": "text_input","required": true, "note": "當勾選「其他」時顯示此欄位"
          }
        }
      ]
    },
    {
      "sectionId": "transport_guidance",
      "sectionTitle": "交通指引",
      "fields": [
        { "itemId": "nearestParking", "label": "最近無障礙車位", "type": "textarea", "required": false },
        {
          "itemId": "nearestTransit", "label": "捷運/公車", "type": "checkbox_group","required": false, "selectionType": "multiple",
          "options": [
            {"value": "捷運", "label": "捷運"},
            {"value": "公車", "label": "公車"}
          ],
          "conditionalFields": [
            {
              "triggerValue": "捷運", "itemId": "mrt", "label": "捷運補充說明", "type": "text_input","required": true, "note": "需填寫站別、電梯在幾號出口。", "placeholder": "例如：龍山寺捷運站2號出口，距離店家300公尺"
            },
            {
              "triggerValue": "公車", "itemId": "bus", "label": "公車補充說明", "type": "textarea","required": true, "note": "補充說明公車路線、站牌等。"
            }
          ]
        },
        { "itemId": "recommendedRoute", "label": "推薦無障礙路線", "type": "textarea", "required": false, "note": "說明從最近交通點到店家的路線。" }
      ]
    },
    {
        "sectionId":"Thoughts",
        "sectionTitle": "*走訪心得",
        "fields": [
            { "itemId": "description", "type": "textarea", "required": true, },
        ]
    }
  ]
};