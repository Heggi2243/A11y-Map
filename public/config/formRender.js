// ============================================
// 這裡只負責渲染UI
// renderForm()->遍歷FORM_SCHEMA的sections->每個section呼叫renderField()
// ->renderField()查詢FIELD_RENDERERS對應的渲染項目&&呼叫
// ->返回DOM組裝表單
// ============================================


import { createEl, setFormData, formData, FORM_SCHEMA } from './formSchema.js';


// ============================================
// 欄位渲染對應項目
// if else太難看了先改這樣
// ============================================

const FIELD_RENDERERS = {
  'text_input': renderTextInput,
  'number_input': renderTextInput,
  'date_input': renderTextInput,
  'textarea': renderTextarea,
  'select_rating': renderSelectRating,
  'file_upload': renderFileUpload,
  'radio_group': renderRadioGroup,
  'checkbox_group': renderCheckboxGroup
};

// 通用樣式
const commonClasses = "w-full p-3 rounded-lg border-2 border-retro-blue/20 focus:border-retro-blue focus:ring-2 focus:ring-retro-blue/20 outline-none transition-all bg-white font-body text-gray-700 placeholder-gray-400";

// ============================================
// 各類型欄位渲染器
// ============================================

function renderTextInput(field) {

  // 判斷input type，預設text
  const inputType = field.type === 'number_input' ? 'number' 
                  : field.type === 'date_input' ? 'date'
                  : 'text';
  
  // 創造input
  const input = createEl('input', commonClasses);
  input.type = inputType;
  input.id = field.itemId;

  if (field.placeholder) input.placeholder = field.placeholder;
  
  // 編輯模式
  if (formData[field.itemId] !== undefined) {
    input.value = formData[field.itemId];
  }
  
  // 綁定，當用戶輸入時->更新formData
  input.oninput = (e) => setFormData(field.itemId, e.target.value);
  
  return input;
}
// ===== 12/2 更新:支援編輯模式 =====
function renderTextarea(field) {
  const textarea = createEl('textarea', commonClasses);
  textarea.id = field.itemId;
  textarea.rows = 4;
  if (field.placeholder) textarea.placeholder = field.placeholder;
  
  // 編輯模式
  if (formData[field.itemId] !== undefined) {
    textarea.value = formData[field.itemId];
  }
  
  textarea.oninput = (e) => setFormData(field.itemId, e.target.value);
  
  return textarea;
}

function renderSelectRating(field) {
  const select = createEl('select', commonClasses);
  select.id = field.itemId;

  const defaultOption = createEl('option', 'text-gray-400', '請選擇評分...');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  field.options.forEach(optionValue => {
    const optionEl = createEl('option', '', optionValue + ' 顆星');
    optionEl.value = optionValue;

    // 編輯模式
     if (formData[field.itemId] == optionValue) {
      optionEl.selected = true;
    }

    select.appendChild(optionEl);
  });

  select.onchange = (e) => setFormData(field.itemId, parseFloat(e.target.value));
  
  return select;
}

// 檔案上傳介面渲染
function renderFileUpload(field) {

  // 最外層
  const container = createEl('div', 'w-full');
  // 點擊上傳的區塊
  const dropzone = createEl('div', 'border-2 border-dashed border-retro-blue/40 bg-white rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors gap-2 min-h-[120px]');
  dropzone.innerHTML = `
    <i data-lucide="upload" class="text-retro-blue" style="width:32px;height:32px"></i>
    <span class="text-retro-blue font-medium text-sm">點擊上傳 (可多選)</span>
  `;

  // 隱藏按鈕，很醜
  const input = createEl('input', 'hidden');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true; //可多選

  const previewContainer = createEl('div', 'mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4');

  let files = [];
  let previews = [];

  // ========== 新增：編輯模式載入現有圖片 ========== //
  if (formData[field.itemId] && Array.isArray(formData[field.itemId])) {
    const existingUrls = formData[field.itemId];
    // console.log(`載入現有圖片 (${field.itemId}):`, existingUrls);
    
    existingUrls.forEach(url => {
      // 標記為現有圖片（不是新上傳的 File）
      previews.push({ 
        url: url, 
        isExisting: true  // <-標記這是從資料庫來的
      });
    });
    
    // 渲染現有圖片
    renderPreviews();
  }

  dropzone.onclick = () => input.click();

  input.onchange = (e) => {
    // 取得新上傳的檔案
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // 加到現有檔案
      files = [...files, ...newFiles];
      
      // 建立新檔案的預覽
      newFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        previews.push({ 
          url, 
          file,
          isExisting: false  // <-標記這是新上傳的
        });
      });
      
      // 合併現有URL和新檔案
      updateFormData();
      
      renderPreviews();
    }
  };

  // ========== 12/2新增：更新formData ========== //
  function updateFormData() {
    // 分離現有圖片 URL 和新上傳的 File
    const existingUrls = previews
      .filter(p => p.isExisting)
      .map(p => p.url);
    
    const newFiles = previews
      .filter(p => !p.isExisting && p.file)
      .map(p => p.file);
    
    // 如果有新檔案，傳 File 陣列
    // 如果只有現有圖片，傳 URL 陣列
    if (newFiles.length > 0) {
      setFormData(field.itemId, newFiles);
    } else {
      setFormData(field.itemId, existingUrls);
    }
    
    console.log('📝 更新 formData:', {
      field: field.itemId,
      existingUrls: existingUrls.length,
      newFiles: newFiles.length
    });
  }

  //渲染預覽
  function renderPreviews() {
    previewContainer.innerHTML = '';

    previews.forEach((item) => {
      // 圖片預覽框框
      const wrapper = createEl('div', 'relative group aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm');
      
     // ======= 支援現有圖片和新上傳圖片 ======= //
      const imgTag = `<img src="${item.url}" alt="Preview" class="w-full h-full object-cover" />`;
      
      // 如果是現有圖片 加上標記
      if (item.isExisting) {
        wrapper.innerHTML = `
          ${imgTag}
          <div class="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
            已上傳
          </div>
        `;
      } else {
        wrapper.innerHTML = imgTag;
      }
      // ================================================= //      
      
      // wrapper.innerHTML = `<img src="${item.url}" alt="Preview" class="w-full h-full object-cover" />`;
      // 右上角刪除按鈕
      const removeBtn = createEl('button', 'absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-1 shadow-md hover:bg-red-500 hover:text-white transition-all');
      removeBtn.innerHTML = '<i data-lucide="x" style="width:14px;height:14px"></i>';
      
      removeBtn.onclick = (ev) => {
        ev.stopPropagation(); // 阻止冒泡


      // ========== 修改：處理刪除邏輯 ========== //
        if (item.isExisting) {
          // 刪除現有圖片：從 previews 移除
          console.log('🗑️ 刪除現有圖片:', item.url);
          previews = previews.filter(p => p !== item);
        } else {
          // 刪除新上傳的圖片：從 files 和 previews 移除
          console.log('🗑️ 刪除新上傳圖片:', item.file?.name);
          files = files.filter(f => f !== item.file);
          previews = previews.filter(p => p !== item);
          
          // 釋放記憶體
          if (item.url) {
            URL.revokeObjectURL(item.url);
          }
        }
        // ======================================= //
        
        // 更新 formData
        updateFormData();
        
        // 重新渲染
        renderPreviews();
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
      };
      
      wrapper.appendChild(removeBtn);
      previewContainer.appendChild(wrapper);
    });
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  container.appendChild(dropzone);
  container.appendChild(input);
  container.appendChild(previewContainer);
  
  setTimeout(() => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 0);
  
  return container;
}

// 單選按鈕
function renderRadioGroup(field) {
  // 包裹radio的區塊
  const container = createEl('div', 'space-y-3 bg-white p-4 rounded-lg border-2 border-retro-blue/10');
  // 隱藏欄位的區塊-最愛層
  const conditionalsContainer = createEl('div', 'mt-4 space-y-2');
  
  // 收集所有條件欄位
  const allConditionals = [];
  if (field.conditionalField) allConditionals.push(field.conditionalField);
  if (field.conditionalFields) allConditionals.push(...field.conditionalFields); // (廁所、捷運/公車) 

  const conditionalElsMap = {};
  
  allConditionals.forEach(cond => {
    // 隱藏欄位的區塊-第二層(黃線)
    const condWrapper = createEl('div', 'hidden ml-6 pl-4 border-l-4 border-retro-yellow');
    // 最外層>第二層>條件區塊
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

  // 創建label
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
    // 抓取input
    const radio = labelEl.querySelector('input');
    
    // 編輯模式
    if (formData[field.itemId] === opt.value) {
      radio.checked = true;
      // 顯示對應的條件欄位
      if (conditionalElsMap[opt.value]) {
        conditionalElsMap[opt.value].classList.remove('hidden');
      }
    }

    //更新formData
    radio.onchange = () => {
      setFormData(field.itemId, opt.value);
      //預設隱藏
      Object.values(conditionalElsMap).forEach(el => {
        el.classList.add('hidden');
      });
      
      if (conditionalElsMap[opt.value]) {
        conditionalElsMap[opt.value].classList.remove('hidden');
      }
    };
    
    container.appendChild(labelEl);
  });
  
  const wrapper = createEl('div');
  wrapper.appendChild(container);
  wrapper.appendChild(conditionalsContainer);
  return wrapper;
}

function renderCheckboxGroup(field) {
  const container = createEl('div', 'space-y-4');
  const optionsContainer = createEl('div', 'bg-white p-4 rounded-lg border-2 border-retro-blue/10 grid grid-cols-1 sm:grid-cols-2 gap-3');
  const conditionalsContainer = createEl('div', 'space-y-2');
  
  const allConditionals = [];
  if (field.conditionalField) allConditionals.push(field.conditionalField);
  if (field.conditionalFields) allConditionals.push(...field.conditionalFields);

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

    // ===== 編輯模式 =====
  const prefilledValues = formData[field.itemId] || [];
  // ================================
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
    
    // ===== 編輯模式 =====
    if (prefilledValues.includes(opt.value)) {
      checkbox.checked = true;
      // 顯示對應的條件欄位
      if (conditionalEls[opt.value]) {
        conditionalEls[opt.value].classList.remove('hidden');
      }
    }
    
    checkbox.onchange = (e) => {
      const current = formData[field.itemId] || [];
      let next;
      if (e.target.checked) next = [...current, opt.value];
      else next = current.filter(v => v !== opt.value);
      
      setFormData(field.itemId, next);
      
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
  
  setTimeout(() => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 0);
  
  return container;
}

// ============================================
// 主欄位渲染
// ============================================

export function renderField(field) {
  const wrapper = createEl('div', 'mb-8');
  
  // 隱藏欄位的標題
  if (field.label) {
    const label = createEl('label', 'block text-lg font-bold text-retro-blue mb-2 font-display tracking-wide', field.label);
    label.htmlFor = field.itemId;
    wrapper.appendChild(label);
  }

  // 根據類型渲染
  const renderer = FIELD_RENDERERS[field.type];
  if (renderer) {
    const fieldElement = renderer(field);
    wrapper.appendChild(fieldElement);
  } else {
    console.warn(`未知的欄位類型: ${field.type}`);
  }

  // Note
  if (field.note) {
    const note = createEl('p', 'mt-2 text-sm text-gray-500 flex items-center gap-1');
    note.innerHTML = `<span class="inline-block w-4 h-4 rounded-full bg-retro-yellow text-white text-xs flex items-center justify-center font-bold">!</span> ${field.note}`;
    wrapper.appendChild(note);
  }

  return wrapper;
}

// ============================================
// 主表單渲染
// ============================================

export function renderForm() {
  document.getElementById('form-title').textContent = FORM_SCHEMA.formTitle;
  
  const formContainer = document.getElementById('form-container');
  formContainer.innerHTML = '';

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

  setTimeout(() => {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      console.warn('⚠️ Lucide 圖標庫未載入');
    }
  }, 100);
}