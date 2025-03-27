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
      
      // 通知内容脚本设置已更新
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'settingsUpdated', settings: settings});
      });
    });
  });

  // 添加网站管理部分
  const manageSection = document.createElement('div');
  manageSection.className = 'settings-group';
  manageSection.innerHTML = `
    <h3>网站管理</h3>
    <div class="setting-item">
      <label for="new-website">添加新网站:</label>
      <input type="text" id="new-website" placeholder="例如: example.com" style="width: 100%; margin-bottom: 5px;">
      <div style="display: flex; gap: 5px;">
        <input type="text" id="new-input-selector" placeholder="输入框选择器" style="flex: 1;">
        <input type="text" id="new-submit-selector" placeholder="发送按钮选择器" style="flex: 1;">
      </div>
      <button id="add-website" style="width: 100%; margin-top: 5px; padding: 5px; background: #2196F3;">添加网站</button>
    </div>
    <div id="website-list" style="margin-top: 10px;"></div>
  `;
  
  siteSettingsContainer.after(manageSection);
  
  // 加载网站列表
  function loadWebsiteList() {
    chrome.storage.sync.get(['websiteConfigs'], function(result) {
      const configs = result.websiteConfigs || {};
      const websiteList = document.getElementById('website-list');
      
      if (Object.keys(configs).length === 0) {
        websiteList.innerHTML = '<p>暂无保存的网站配置</p>';
        return;
      }
      
      websiteList.innerHTML = `
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">已配置网站:</div>
        <ul style="list-style: none; padding: 0; margin: 0; max-height: 200px; overflow-y: auto;">
          ${Object.entries(configs).map(([hostname, config]) => `
            <li style="padding: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
              <div style="flex: 1;">
                <div style="font-weight: bold;">${hostname}</div>
                <div style="font-size: 11px; color: #666;">
                  输入框: ${config.inputSelector || '未设置'}<br>
                  发送按钮: ${config.submitSelector || '未设置'}
                </div>
              </div>
              <button class="remove-website" data-hostname="${hostname}" style="background: #f44336; color: white; border: none; border-radius: 3px; padding: 2px 5px; font-size: 11px; cursor: pointer;">删除</button>
            </li>
          `).join('')}
        </ul>
      `;
      
      // 添加删除事件
      document.querySelectorAll('.remove-website').forEach(btn => {
        btn.addEventListener('click', function() {
          const hostname = this.dataset.hostname;
          delete configs[hostname];
          chrome.storage.sync.set({ websiteConfigs: configs }, loadWebsiteList);
        });
      });
    });
  }
  
  // 添加新网站
  document.getElementById('add-website').addEventListener('click', function() {
    const hostname = document.getElementById('new-website').value.trim();
    const inputSelector = document.getElementById('new-input-selector').value.trim();
    const submitSelector = document.getElementById('new-submit-selector').value.trim();
    
    if (!hostname) {
      statusMessage.textContent = '请输入网站域名';
      statusMessage.style.color = '#f44336';
      setTimeout(() => statusMessage.textContent = '', 2000);
      return;
    }
    
    chrome.storage.sync.get(['websiteConfigs'], function(result) {
      const configs = result.websiteConfigs || {};
      configs[hostname] = {
        inputSelector,
        submitSelector
      };
      
      chrome.storage.sync.set({ websiteConfigs: configs }, function() {
        document.getElementById('new-website').value = '';
        document.getElementById('new-input-selector').value = '';
        document.getElementById('new-submit-selector').value = '';
        statusMessage.textContent = '网站配置已添加';
        statusMessage.style.color = '#4CAF50';
        setTimeout(() => statusMessage.textContent = '', 2000);
        loadWebsiteList();
      });
    });
  });
  
  loadWebsiteList();
});