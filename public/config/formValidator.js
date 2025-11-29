// public/utils/validator.js

import { FORM_SCHEMA } from './formSchema.js';

function generateValidationRules() {
  const required = [];
  const fileRequired = [];
  const optional = [];
  const custom = {};
  const conditional = [];


  function processField(field, isConditional = false) {
    // 預設必填(除非明確設定required: false)
    const isRequired = field.required !== false;

    if (!isRequired) {
      optional.push(field.itemId);
      return;
    }

    if (field.type === 'file_upload') {
      fileRequired.push(field.itemId);
    } else {
      required.push(field.itemId);
    }

    if (isConditional) {
      conditional.push({
        fieldId: field.itemId,
        parentId: field.parentId,
        triggerValue: field.triggerValue,
        triggerValues: field.triggerValues
      });
    }


    // 自訂驗證規則
    if (field.validation) {
      custom[field.itemId] = {
        pattern: new RegExp(field.validation.pattern),
        message: field.validation.message
      };
    }
  }

  // 遍歷所有欄位
  FORM_SCHEMA.sections.forEach(section => {
    section.fields.forEach(field => {
      processField(field);

      // 條件欄位
      if (field.conditionalField) {
        const condField = { 
          ...field.conditionalField, 
          parentId: field.itemId,
          triggerValue: field.conditionalField.triggerValue
        };
        processField(condField, true);  // ← 標記為條件欄位
      }

      if (field.conditionalFields) {
        field.conditionalFields.forEach(condField => {
          const enrichedField = {
            ...condField,
            parentId: field.itemId
          };
          processField(enrichedField, true);  // ← 標記為條件欄位
        });
      }
    });
  });

  return { required, fileRequired, optional, custom, conditional };
}

export const VALIDATION_RULES = generateValidationRules();

function getFieldLabel(fieldId) {
  for (const section of FORM_SCHEMA.sections) {
    for (const field of section.fields) {
      if (field.itemId === fieldId) {
        return field.label || fieldId;
      }

      if (field.conditionalField && field.conditionalField.itemId === fieldId) {
        return field.conditionalField.label || fieldId;
      }

      if (field.conditionalFields) {
        for (const condField of field.conditionalFields) {
          if (condField.itemId === fieldId) {
            return condField.label || fieldId;
          }
        }
      }
    }
  }

  return fieldId;
}

/**
 * 檢查條件欄位是否應該被驗證
 */
function shouldValidateConditionalField(fieldId, formData) {
  const conditionalInfo = VALIDATION_RULES.conditional.find(c => c.fieldId === fieldId);
  
  if (!conditionalInfo) {
    return true;  // 不是條件欄位,正常驗證
  }

  const parentValue = formData[conditionalInfo.parentId];

  // 單選觸發 (triggerValue)
  if (conditionalInfo.triggerValue) {
    // checkbox 的情況
    if (Array.isArray(parentValue)) {
      return parentValue.includes(conditionalInfo.triggerValue);
    }
    // radio 的情況
    return parentValue === conditionalInfo.triggerValue;
  }

  // 多選觸發 (triggerValues)
  if (conditionalInfo.triggerValues) {
    return conditionalInfo.triggerValues.includes(parentValue);
  }

  return true;
}

export function validateField(fieldId, value, formData = {}) {
  // 條件欄位檢查:如果父欄位沒有觸發,跳過驗證
  if (VALIDATION_RULES.conditional.some(c => c.fieldId === fieldId)) {
    if (!shouldValidateConditionalField(fieldId, formData)) {
      return { isValid: true, message: '' };  // 未觸發,不驗證
    }
  }

  if (VALIDATION_RULES.optional.includes(fieldId)) {
    return { isValid: true, message: '' };
  }

  if (VALIDATION_RULES.fileRequired.includes(fieldId)) {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { 
        isValid: false, 
        message: `請上傳「${getFieldLabel(fieldId)}」圖片` 
      };
    }
    return { isValid: true, message: '' };
  }

  if (VALIDATION_RULES.required.includes(fieldId)) {
    if (value === undefined || value === null || value === '') {
      return { 
        isValid: false, 
        message: `請填寫「${getFieldLabel(fieldId)}」` 
      };
    }

    if (Array.isArray(value) && value.length === 0) {
      return { 
        isValid: false, 
        message: `請選擇至少一項「${getFieldLabel(fieldId)}」` 
      };
    }
  }

  if (VALIDATION_RULES.custom[fieldId]) {
    const rule = VALIDATION_RULES.custom[fieldId];
    
    if (rule.pattern && !rule.pattern.test(value)) {
      return { 
        isValid: false, 
        message: rule.message 
      };
    }
  }

  return { isValid: true, message: '' };
}

export function validateForm(formData) {
  const errors = [];

  VALIDATION_RULES.required.forEach(fieldId => {
    const result = validateField(fieldId, formData[fieldId], formData);  // ← 傳入 formData
    if (!result.isValid) {
      errors.push(result.message);
    }
  });

  VALIDATION_RULES.fileRequired.forEach(fieldId => {
    const result = validateField(fieldId, formData[fieldId], formData);  // ← 傳入 formData
    if (!result.isValid) {
      errors.push(result.message);
    }
  });

  Object.keys(VALIDATION_RULES.custom).forEach(fieldId => {
    const result = validateField(fieldId, formData[fieldId], formData);  // ← 傳入 formData
    if (!result.isValid) {
      errors.push(result.message);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function showValidationErrors(errors) {
  if (errors.length === 0) return;

  const errorMessage = '請完成以下必填項目:\n\n' + 
                       errors.map((err, index) => `${index + 1}. ${err}`).join('\n');
  
  alert(errorMessage);
}