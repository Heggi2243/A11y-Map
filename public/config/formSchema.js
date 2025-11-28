// ============================================
// 快速創造標籤小工具
// ============================================

function createEl(tag, classes = "", innerHTML = "") {
  const el = document.createElement(tag);
  if (classes) el.className = classes;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

/**
 * 
 */
export const formData = {};

function setFormData(key, value) {
  formData[key] = value;
  console.log('FormData updated:', formData);
}

// ============================================
//  表單項目
// 變數名是寫死的別動
// ============================================

export const FORM_SCHEMA = {
  "formTitle": "無障礙店家資訊上傳表單",
  "sections": [
    {
      "sectionId": "basic_info",
      "sectionTitle": "基本店家資訊",
      "fields": [
        { "itemId": "store_cover", "label": "店家封面", "type": "file_upload", "dataType": "image", "note": "圖片上傳 (可複數)" },
        { "itemId": "店家名稱", "label": "店家名稱", "type": "text_input" },
        { "itemId": "店家地址", "label": "店家地址", "type": "text_input" },
        { "itemId": "一人平均消費", "label": "一人平均消費(元)", "type": "number_input" },
        { "itemId": "到訪日期", "label": "到訪日期", "type": "date_input" },
        { "itemId": "地圖網址", "label": "地圖網址", "type": "textarea" },
        { "itemId": "entrance_photo", "label": "門口/階梯狀況", "type": "file_upload", "dataType": "image", "note": "圖片上傳 (可複數)" },
        { "itemId": "interior_photo", "label": "餐飲/店內環境", "type": "file_upload", "dataType": "image", "note": "圖片上傳 (可複數)" },
        {
          "itemId": "動線和便利度評分",
          "label": "動線/便利度評分",
          "type": "select_rating", 
          "options": ["5", "4", "3", "2", "1", "0"], 
          "description": "點選星，滿分是五顆星 (可選半星)"
        },
        {
          "itemId": "食物評分",
          "label": "食物評分",
          "type": "select_rating",
          "options": ["5", "4", "3", "2", "1", "0"]
        },
        {
          "itemId": "服務評分",
          "label": "服務評分",
          "type": "select_rating",
          "options": ["5", "4", "3", "2", "1", "0"]
        }
      ]
    },
    {
      "sectionId": "space_facilities",
      "sectionTitle": "空間與設施",
      "fields": [
        {
          "itemId": "出入口坡道", "label": "出入口坡道", "type": "radio_group", "selectionType": "single",
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
          "options": [
            {"value": "無階梯", "label": "無階梯"},
            {"value": "一大階", "label": "一大階"},
            {"value": "多階 (兩階以上)", "label": "多階 (兩階以上)"},
            {"value": "微小門檻 (需翹輪椅)", "label": "微小門檻 (需翹輪椅)"},
            {"value": "微小門檻 (無需翹輪椅)", "label": "微小門檻 (無需翹輪椅)"}
          ]
        },
        { "itemId": "門寬", "label": "門寬(cm)", "type": "text_input", "placeholder": "請輸入門的寬度 (e.g., 80cm)" },
        {
          "itemId": "廁所",
          "label": "廁所",
          "type": "radio_group",
          "selectionType": "single",
          "options": [
            {"value": "一般廁所 (同層)", "label": "一般廁所 (同層)"},
            {"value": "一般廁所 (不同層)", "label": "一般廁所 (不同層)"},
            {"value": "無障礙廁所 (同層)", "label": "無障礙廁所 (同層)"},
            {"value": "無障礙廁所 (不同層)", "label": "無障礙廁所 (不同層)"}
          ],
          "conditionalFields": [
            {
              "triggerValues": ["一般廁所 (不同層)", "無障礙廁所 (不同層)"],
              "itemId": "廁所位在幾樓",
              "label": "請填寫廁所位在幾樓",
              "type": "text_input"
            }
          ]
        },
        {
          "itemId": "內部動線", "label": "內部動線", "type": "radio_group", "selectionType": "single",
          "options": [
            {"value": "普通", "label": "普通"},
            {"value": "寬敞", "label": "寬敞"},
            {"value": "略顯壅擠", "label": "略顯壅擠"}
          ]
        },
        {
          "itemId": "協助需求", "label": "協助需求", "type": "checkbox_group", "selectionType": "multiple",
          "options": [
            {"value": "需協助開門", "label": "需協助開門"},
            {"value": "需協助進門", "label": "需協助進門"},
            {"value": "需協助入座", "label": "需協助入座"},
            {"value": "其他", "label": "其他"}
          ],
          "conditionalField": {
            "triggerValue": "其他", "itemId": "其他協助需求補充", "label": "其他協助需求補充", "type": "text_input", "note": "當勾選「其他」時顯示此欄位"
          }
        }
      ]
    },
    {
      "sectionId": "transport_guidance",
      "sectionTitle": "交通指引",
      "fields": [
        { "itemId": "最近無障礙車位", "label": "最近無障礙車位", "type": "textarea" },
        {
          "itemId": "公車", "label": "捷運/公車", "type": "checkbox_group", "selectionType": "multiple",
          "options": [
            {"value": "捷運", "label": "捷運"},
            {"value": "公車", "label": "公車"}
          ],
          "conditionalFields": [
            {
              "triggerValue": "捷運", "itemId": "捷運補充說明", "label": "捷運補充說明", "type": "text_input", "note": "需填寫站別、電梯在幾號出口。", "placeholder": "例如：龍山寺捷運站2號出口，距離店家300公尺"
            },
            {
              "triggerValue": "公車", "itemId": "公車補充說明", "label": "公車補充說明", "type": "textarea", "note": "補充說明公車路線、站牌等。"
            }
          ]
        },
        { "itemId": "推薦無障礙路線", "label": "推薦無障礙路線", "type": "textarea", "note": "說明從最近交通點到店家的路線。" }
      ]
    },
    {
        "sectionId":"Thoughts",
        "sectionTitle": "走訪心得",
        "fields": [
            { "itemId": "心得", "type": "textarea" },
        ]
    }
  ]
};

// ============================================
// 表單的版面
// ============================================
export function renderForm() {
  // 設定表單標題
  document.getElementById('form-title').textContent = FORM_SCHEMA.formTitle;
  
  const formContainer = document.getElementById('form-container');
  formContainer.innerHTML = '';

  // 渲染每個區段
  FORM_SCHEMA.sections.forEach(section => {
    const sectionEl = createEl('section', 'bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-10 shadow-lg border border-white relative overflow-hidden');
    sectionEl.innerHTML = `<div class="absolute top-0 left-0 w-full h-3 bg-retro-blue"></div>`;
    
    const title = createEl('h3', 'text-2xl sm:text-3xl font-display font-bold text-retro-blue mb-8 flex items-center gap-3');
    title.innerHTML = `<span class="w-8 h-8 rounded-full bg-retro-yellow text-white flex items-center justify-center text-lg shadow-sm">#</span> ${section.sectionTitle}`;
    sectionEl.appendChild(title);

    const fieldsContainer = createEl('div', 'space-y-2');
    section.fields.forEach(field => {
      fieldsContainer.appendChild(renderField(field));
    });
    sectionEl.appendChild(fieldsContainer);
    formContainer.appendChild(sectionEl);
  });

  
  // 渲染完成後初始化所有 Lucide 圖標
  setTimeout(() => {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      console.warn('⚠️ Lucide 圖標庫未載入');
    }
  }, 100);
}

// ============================================
// 通用欄位渲染器
// ============================================
function renderField(field, parentValues = []) {
  const wrapper = createEl('div', 'mb-8');
  
  // Label
  const label = createEl('label', 'block text-lg font-bold text-retro-blue mb-2 font-display tracking-wide', field.label);
  label.htmlFor = field.itemId;
  wrapper.appendChild(label);

  const commonClasses = "w-full p-3 rounded-lg border-2 border-retro-blue/20 focus:border-retro-blue focus:ring-2 focus:ring-retro-blue/20 outline-none transition-all bg-white font-body text-gray-700 placeholder-gray-400";

  let inputEl;

  // ========== text_input, number_input, datetime_input, date_input ========== //
  if (['text_input', 'number_input', 'datetime_input', 'date_input'].includes(field.type)) {
    const inputType = field.type === 'number_input' ? 'number' 
                    : field.type === 'datetime_input' ? 'datetime-local' 
                    : field.type === 'date_input' ? 'date'
                    : 'text';
    inputEl = createEl('input', commonClasses);
    inputEl.type = inputType;
    inputEl.id = field.itemId;
    if (field.placeholder) inputEl.placeholder = field.placeholder;
    inputEl.oninput = (e) => setFormData(field.itemId, e.target.value);
    wrapper.appendChild(inputEl);
  }
  
  // ========== textarea ========== //
  else if (field.type === 'textarea') {
    inputEl = createEl('textarea', commonClasses);
    inputEl.id = field.itemId;
    inputEl.rows = 4;
    if (field.placeholder) inputEl.placeholder = field.placeholder;
    inputEl.oninput = (e) => setFormData(field.itemId, e.target.value);
    wrapper.appendChild(inputEl);
  }
  
  // ========== select_rating ========== //
  else if (field.type === 'select_rating') {
    inputEl = createEl('select', commonClasses);
    inputEl.id = field.itemId;

    const defaultOption = createEl('option', 'text-gray-400', '請選擇評分...');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    inputEl.appendChild(defaultOption);

    field.options.forEach(optionValue => {
      const optionEl = createEl('option', '', optionValue + ' 顆星');
      optionEl.value = optionValue;
      inputEl.appendChild(optionEl);
    });

    inputEl.onchange = (e) => setFormData(field.itemId, parseFloat(e.target.value));
    wrapper.appendChild(inputEl);
  }
  
  // ========== file_upload ========== //
  else if (field.type === 'file_upload') {
    wrapper.appendChild(renderFileUpload(field));
  }
  
  // ========== radio_group ========== //
  else if (field.type === 'radio_group') {
    const container = createEl('div', 'space-y-3 bg-white p-4 rounded-lg border-2 border-retro-blue/10');
    const conditionalsContainer = createEl('div', 'mt-4 space-y-2');
    
    // 收集所有條件欄位
    const allConditionals = [];
    if (field.conditionalField) allConditionals.push(field.conditionalField);
    if (field.conditionalFields) allConditionals.push(...field.conditionalFields);

    // 預先渲染所有條件欄位（隱藏）
    const conditionalElsMap = {};
    
    allConditionals.forEach(cond => {
      const condWrapper = createEl('div', 'hidden ml-6 pl-4 border-l-4 border-retro-yellow');
      condWrapper.appendChild(renderField(cond));
      conditionalsContainer.appendChild(condWrapper);
      
      if (cond.triggerValue) {
        conditionalElsMap[cond.triggerValue] = condWrapper;
      } else if (cond.triggerValues) {
        cond.triggerValues.forEach(triggerVal => {
          conditionalElsMap[triggerVal] = condWrapper;
        });
      }
    });

    // 渲染選項
    field.options.forEach(opt => {
      const labelEl = createEl('label', 'flex items-center space-x-3 cursor-pointer group');
      labelEl.innerHTML = `
        <div class="relative flex items-center">
          <input type="radio" name="${field.itemId}" value="${opt.value}" class="peer h-6 w-6 cursor-pointer appearance-none rounded-full border-2 border-retro-blue transition-all checked:border-retro-blue checked:bg-retro-blue">
          <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
            <div class="h-2.5 w-2.5 rounded-full bg-white shadow-sm"></div>
          </div>
        </div>
        <span class="text-gray-700 font-medium group-hover:text-retro-blue transition-colors">${opt.label}</span>
      `;
      const radio = labelEl.querySelector('input');
      
      radio.onchange = () => {
        setFormData(field.itemId, opt.value);
        
        // 切換條件欄位顯示
        Object.values(conditionalElsMap).forEach(el => {
          el.classList.add('hidden');
        });
        
        if (conditionalElsMap[opt.value]) {
          const el = conditionalElsMap[opt.value];
          el.classList.remove('hidden');
        }
      };
      
      container.appendChild(labelEl);
    });
    
    wrapper.appendChild(container);
    wrapper.appendChild(conditionalsContainer);
  }
  
  // ========== checkbox_group ========== //
  else if (field.type === 'checkbox_group') {
    const container = createEl('div', 'space-y-4');
    const optionsContainer = createEl('div', 'bg-white p-4 rounded-lg border-2 border-retro-blue/10 grid grid-cols-1 sm:grid-cols-2 gap-3');
    const conditionalsContainer = createEl('div', 'space-y-2');
    
    // 收集所有條件欄位
    const allConditionals = [];
    if (field.conditionalField) allConditionals.push(field.conditionalField);
    if (field.conditionalFields) allConditionals.push(...field.conditionalFields);

    // 預先渲染條件欄位（隱藏）
    const conditionalEls = {};
    allConditionals.forEach(cond => {
      const condWrapper = createEl('div', 'hidden ml-6 pl-4 border-l-4 border-retro-yellow');
      condWrapper.appendChild(renderField(cond));
      conditionalsContainer.appendChild(condWrapper);
      
      if (cond.triggerValue) {
        conditionalEls[cond.triggerValue] = condWrapper;
      } else if (cond.triggerValues) {
        cond.triggerValues.forEach(triggerVal => {
          conditionalEls[triggerVal] = condWrapper;
        });
      }
    });

    field.options.forEach(opt => {
      const labelEl = createEl('label', 'flex items-center space-x-3 cursor-pointer group p-2 hover:bg-blue-50 rounded transition-colors');
      labelEl.innerHTML = `
        <div class="relative flex items-center">
          <input type="checkbox" value="${opt.value}" class="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-retro-blue transition-all checked:bg-retro-blue checked:border-retro-blue">
          <i data-lucide="check" class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity" style="width:16px;height:16px"></i>
        </div>
        <span class="text-gray-700 font-medium">${opt.label}</span>
      `;
      const checkbox = labelEl.querySelector('input');
      checkbox.onchange = (e) => {
        const current = formData[field.itemId] || [];
        let next;
        if(e.target.checked) next = [...current, opt.value];
        else next = current.filter(v => v !== opt.value);
        
        setFormData(field.itemId, next);
        
        // 切換條件欄位
        if (conditionalEls[opt.value]) {
          const el = conditionalEls[opt.value];
          if (e.target.checked) {
            el.classList.remove('hidden');
          } else {
            el.classList.add('hidden');
          }
        }
      };
      optionsContainer.appendChild(labelEl);
    });

    container.appendChild(optionsContainer);
    container.appendChild(conditionalsContainer);
    wrapper.appendChild(container);
    
    // 初始化圖標
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 0);
  }

  // ========== Note ========== //
  if (field.note) {
    const note = createEl('p', 'mt-2 text-sm text-gray-500 flex items-center gap-1');
    note.innerHTML = `<span class="inline-block w-4 h-4 rounded-full bg-retro-yellow text-white text-xs flex items-center justify-center font-bold">!</span> ${field.note}`;
    wrapper.appendChild(note);
  }

  return wrapper;
}


// ============================================
// 檔案上傳元件
// ============================================
function renderFileUpload(field) {

  const container = createEl('div', 'w-full');
  const dropzone = createEl('div', 'border-2 border-dashed border-retro-blue/40 bg-white rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors gap-2 min-h-[120px]');
  
  //點擊上傳的框框
  dropzone.innerHTML = `
    <i data-lucide="upload" class="text-retro-blue" style="width:32px;height:32px"></i>
    <span class="text-retro-blue font-medium text-sm">點擊上傳 (可多選)</span>
  `;

  const input = createEl('input', 'hidden');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  
  //上傳圖片的預覽位置
  const previewContainer = createEl('div', 'mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4');

  let files = [];
  let previews = [];

  dropzone.onclick = () => input.click();

  input.onchange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      files = [...files, ...newFiles];
      setFormData(field.itemId, files);

      // 圖片預覽
      newFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        previews.push({ url, file });
      });
      renderPreviews();
    }
  };

  /**
   * 圖片預覽
   */
  function renderPreviews() {
    previewContainer.innerHTML = '';
    previews.forEach((item, index) => {
      const wrapper = createEl('div', 'relative group aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm');
      wrapper.innerHTML = `
        <img src="${item.url}" alt="Preview" class="w-full h-full object-cover" />
      `;
      const removeBtn = createEl('button', 'absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-1 shadow-md hover:bg-red-500 hover:text-white transition-all');
      removeBtn.innerHTML = '<i data-lucide="x" style="width:14px;height:14px"></i>';
      removeBtn.onclick = (ev) => {
        ev.stopPropagation();
        files = files.filter(f => f !== item.file);
        previews = previews.filter(p => p !== item);
        setFormData(field.itemId, files);
        URL.revokeObjectURL(item.url);
        renderPreviews();
        
        // 重新初始化圖標
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      };
      wrapper.appendChild(removeBtn);
      previewContainer.appendChild(wrapper);
    });
    
    // 初始化圖標
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  container.appendChild(dropzone);
  container.appendChild(input);
  container.appendChild(previewContainer);
  
  // 初始化圖標
  setTimeout(() => {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }, 0);
  
  return container;
}