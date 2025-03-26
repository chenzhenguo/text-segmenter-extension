document.addEventListener('DOMContentLoaded', function() {
  const maxLengthInput = document.getElementById('default-max-length');
  const splitPatternSelect = document.getElementById('default-split-pattern');
  const customPatternInput = document.getElementById('custom-split-pattern');
  const saveButton = document.getElementById('save-settings');
  const statusMessage = document.getElementById('status-message');
  const siteSettingsContainer = document.getElementById('site-settings');
  
  // 加载保存的设置
  chrome.storage.sync.get(['settings', 'savedSelectors'], function(result) {
    const settings = result.settings || {};
    const savedSelectors = result.savedSelectors || [];
    
    if (settings.defaultMaxLength) {
      maxLengthInput.value = settings.defaultMaxLength;
    }
    
    if (settings.defaultSplitPattern) {
      if (settings.defaultSplitPattern.custom) {
        splitPatternSelect.value = 'custom';
        customPatternInput.style.display = 'block';
        customPatternInput.value = settings.defaultSplitPattern.value;
      } else {
        splitPatternSelect.value = settings.defaultSplitPattern.value;
      }
    }
    
    // 加载保存的选择器
    if (savedSelectors.length > 0) {
      const savedSelectorsHtml = `
        <div class="setting-item">
          <label>已保存的选择器:</label>
          <select id="saved-selectors" style="margin-bottom: 5px; width: 100%;">
            <option value="">-- 选择保存的选择器 --</option>
            ${savedSelectors.map(selector => 
              `<option value="${selector}">${selector}</option>`
            ).join('')}
          </select>
          <button id="remove-selector" style="width: 100%; padding: 5px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px; font-size: 12px;">
            删除选择器
          </button>
        </div>
      `;
      
      siteSettingsContainer.innerHTML = savedSelectorsHtml;
      
      // 选择器选择事件
      document.getElementById('saved-selectors').addEventListener('change', function() {
        if (this.value) {
          // 可以在这里添加选择器应用逻辑
        }
      });
      
      // 删除选择器按钮
      document.getElementById('remove-selector').addEventListener('click', function() {
        const selectorToRemove = document.getElementById('saved-selectors').value;
        if (!selectorToRemove) {
          statusMessage.textContent = '请选择要删除的选择器';
          setTimeout(() => statusMessage.textContent = '', 2000);
          return;
        }
        
        const updatedSelectors = savedSelectors.filter(s => s !== selectorToRemove);
        chrome.storage.sync.set({ savedSelectors: updatedSelectors }, function() {
          statusMessage.textContent = `已删除选择器: ${selectorToRemove}`;
          setTimeout(() => location.reload(), 1000);
        });
      });
    } else {
      siteSettingsContainer.innerHTML = '<p>暂无保存的选择器</p>';
    }
  });
  
  // 切换自定义正则输入框
  splitPatternSelect.addEventListener('change', function() {
    customPatternInput.style.display = this.value === 'custom' ? 'block' : 'none';
  });
  
  // 保存设置
  saveButton.addEventListener('click', function() {
    const settings = {
      defaultMaxLength: parseInt(maxLengthInput.value) || 2000,
      defaultSplitPattern: {
        value: splitPatternSelect.value === 'custom' 
          ? customPatternInput.value 
          : splitPatternSelect.value,
        custom: splitPatternSelect.value === 'custom'
      }
    };
    
    chrome.storage.sync.set({ settings: settings }, function() {
      statusMessage.textContent = '设置已保存';
      statusMessage.style.color = '#4CAF50';
      setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.style.color = '#666';
      }, 2000);
    });
  });
});