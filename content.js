class TextSegmenter {
  constructor() {
    this.segments = [];
    this.currentSegmentIndex = 0;
    this.promptTemplate = '';
    this.autoSendInterval = null;
  }

  segment(text, options = {}) {
    const { maxLength = 2000, splitPattern = /[。！？\n]/ } = options;
    this.segments = [];
    let currentSegment = '';
    let segmentId = 0;

    const addSegment = (content) => {
      if (content.trim()) {
        this.segments.push({ id: segmentId++, content: content.trim() });
      }
    };

    let remainingText = text;
    while (remainingText.length > 0) {
      const match = remainingText.match(splitPattern);
      const splitIndex = match ? match.index : -1;

      if (splitIndex !== -1) {
        const segment = remainingText.slice(0, splitIndex + 1);
        currentSegment += segment;

        if (currentSegment.length >= maxLength) {
          addSegment(currentSegment);
          currentSegment = '';
        }

        remainingText = remainingText.slice(splitIndex + 1);
      } else {
        currentSegment += remainingText;
        if (currentSegment.length >= maxLength) {
          addSegment(currentSegment);
          currentSegment = '';
        }
        break;
      }
    }

    if (currentSegment.trim()) {
      addSegment(currentSegment);
    }

    this.currentSegmentIndex = 0;
  }

  getNextSegment() {
    return this.currentSegmentIndex < this.segments.length
      ? this.segments[this.currentSegmentIndex++]
      : null;
  }

  getAllSegments() {
    return this.segments;
  }

  setPromptTemplate(template) {
    this.promptTemplate = template;
  }

  getNextSegmentWithPrompt() {
    const segment = this.getNextSegment();
    if (!segment) return null;
    
    return {
      ...segment,
      content: this.promptTemplate + segment.content
    };
  }

  startAutoSend(callback, interval = 3000) {
    this.stopAutoSend();
    this.autoSendInterval = setInterval(() => {
      const hasMore = callback();
      if (!hasMore) {
        this.stopAutoSend();
      }
    }, interval);
  }

  stopAutoSend() {
    if (this.autoSendInterval) {
      clearInterval(this.autoSendInterval);
      this.autoSendInterval = null;
    }
  }
}

function createFloatingUI() {
  const container = document.createElement('div');
  container.id = 'text-segmenter-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '10000';
  container.style.display = 'flex';
  container.style.gap = '10px';
  container.style.alignItems = 'flex-end';

  const mainButton = document.createElement('button');
  mainButton.id = 'text-segmenter-toggle';
  mainButton.innerHTML = '✂️';
  mainButton.style.width = '50px';
  mainButton.style.height = '50px';
  mainButton.style.borderRadius = '50%';
  mainButton.style.backgroundColor = '#4CAF50';
  mainButton.style.color = 'white';
  mainButton.style.border = 'none';
  mainButton.style.cursor = 'pointer';
  mainButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  mainButton.style.fontSize = '20px';
  mainButton.style.transition = 'all 0.3s ease';

  const autoFillButton = document.createElement('button');
  autoFillButton.id = 'text-segmenter-autofill';
  autoFillButton.innerHTML = '⏩';
  autoFillButton.style.width = '40px';
  autoFillButton.style.height = '40px';
  autoFillButton.style.borderRadius = '50%';
  autoFillButton.style.backgroundColor = '#9C27B0';
  autoFillButton.style.color = 'white';
  autoFillButton.style.border = 'none';
  autoFillButton.style.cursor = 'pointer';
  autoFillButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  autoFillButton.style.display = 'none';
  autoFillButton.title = '自动填充下一段';

  const copyButton = document.createElement('button');
  copyButton.id = 'text-segmenter-copy';
  copyButton.innerHTML = '📋';
  copyButton.style.width = '40px';
  copyButton.style.height = '40px';
  copyButton.style.borderRadius = '50%';
  copyButton.style.backgroundColor = '#2196F3';
  copyButton.style.color = 'white';
  copyButton.style.border = 'none';
  copyButton.style.cursor = 'pointer';
  copyButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  copyButton.style.display = 'none';
  copyButton.title = '复制下一段';

  const autoSendButton = document.createElement('button');
  autoSendButton.id = 'text-segmenter-autosend';
  autoSendButton.innerHTML = '⏱️';
  autoSendButton.style.width = '40px';
  autoSendButton.style.height = '40px';
  autoSendButton.style.borderRadius = '50%';
  autoSendButton.style.backgroundColor = '#FF9800';
  autoSendButton.style.color = 'white';
  autoSendButton.style.border = 'none';
  autoSendButton.style.cursor = 'pointer';
  autoSendButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  autoSendButton.style.display = 'none';
  autoSendButton.title = '定时自动发送';

  const panel = document.createElement('div');
  panel.id = 'text-segmenter-panel';
  panel.style.display = 'none';
  panel.style.position = 'absolute';
  panel.style.bottom = '60px';
  panel.style.right = '0';
  panel.style.width = '400px';
  panel.style.backgroundColor = 'white';
  panel.style.border = '1px solid #ddd';
  panel.style.borderRadius = '8px';
  panel.style.padding = '15px';
  panel.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';

  container.appendChild(panel);
  container.appendChild(mainButton);
  container.appendChild(autoFillButton);
  container.appendChild(copyButton);
  container.appendChild(autoSendButton);
  document.body.appendChild(container);

  return { mainButton, autoFillButton, copyButton, autoSendButton, panel };
}

async function initContentScript() {
  const segmenter = new TextSegmenter();
  const { mainButton, autoFillButton, copyButton, autoSendButton, panel } = createFloatingUI();
  const currentHostname = window.location.hostname;

  // 获取设置
  const settings = await new Promise(resolve => {
    chrome.storage.sync.get(['settings', 'siteSettings'], resolve);
  });

  // 创建面板内容
  const title = document.createElement('h3');
  title.textContent = '文本分割工具 - ' + currentHostname;
  title.style.marginTop = '0';

  const inputTextarea = document.createElement('textarea');
  inputTextarea.id = 'segmenter-input';
  inputTextarea.style.width = '100%';
  inputTextarea.style.height = '100px';
  inputTextarea.style.marginBottom = '10px';
  inputTextarea.placeholder = '在此粘贴要分割的文本';

  const settingsSection = document.createElement('div');
  settingsSection.style.marginBottom = '10px';

  // 最大长度设置
  const maxLengthLabel = document.createElement('label');
  maxLengthLabel.textContent = '最大段落长度: ';
  maxLengthLabel.style.marginRight = '10px';

  const maxLengthInput = document.createElement('input');
  maxLengthInput.type = 'number';
  maxLengthInput.value = settings.settings?.defaultMaxLength || '2000';
  maxLengthInput.style.width = '80px';

  // 分割规则设置
  const splitPatternLabel = document.createElement('label');
  splitPatternLabel.textContent = '分割规则: ';
  splitPatternLabel.style.marginRight = '10px';
  splitPatternLabel.style.marginLeft = '10px';

  const splitPatternSelect = document.createElement('select');
  splitPatternSelect.style.width = '120px';

  const patternOptions = [
    { value: '[。！？\\n]', text: '句号/感叹号/问号' },
    { value: '[。\\n]', text: '仅句号' },
    { value: '[\\n]', text: '仅换行' },
    { value: 'custom', text: '自定义' }
  ];

  patternOptions.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.text;
    splitPatternSelect.appendChild(opt);
  });

  const customPatternInput = document.createElement('input');
  customPatternInput.type = 'text';
  customPatternInput.placeholder = '输入正则表达式';
  customPatternInput.style.width = '100%';
  customPatternInput.style.marginTop = '5px';
  customPatternInput.style.display = 'none';

  // 定时发送间隔设置
  const autoSendLabel = document.createElement('label');
  autoSendLabel.textContent = '定时发送间隔(毫秒): ';
  autoSendLabel.style.marginRight = '10px';
  autoSendLabel.style.marginTop = '10px';
  autoSendLabel.style.display = 'block';

  const autoSendInput = document.createElement('input');
  autoSendInput.type = 'number';
  autoSendInput.value = '3000';
  autoSendInput.style.width = '100px';
  autoSendInput.style.marginBottom = '10px';

  // 初始化分割规则
  if (settings.settings?.defaultSplitPattern?.custom) {
    splitPatternSelect.value = 'custom';
    customPatternInput.value = settings.settings.defaultSplitPattern.value;
    customPatternInput.style.display = 'block';
  } else if (settings.settings?.defaultSplitPattern) {
    splitPatternSelect.value = settings.settings.defaultSplitPattern.value;
  }

  splitPatternSelect.addEventListener('change', (e) => {
    customPatternInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
  });

  // 目标输入框选择器
  const customTargetLabel = document.createElement('label');
  customTargetLabel.textContent = '目标输入框选择器: ';
  customTargetLabel.style.marginRight = '10px';
  customTargetLabel.style.marginTop = '10px';
  customTargetLabel.style.display = 'block';

  const customTargetInput = document.createElement('input');
  customTargetInput.type = 'text';
  customTargetInput.placeholder = '例如: .ql-editor, [contenteditable]';
  customTargetInput.style.width = '100%';
  customTargetInput.style.marginBottom = '10px';

  // 为 Google Gemini 设置默认选择器
  if (currentHostname.includes('gemini.google.com')) {
    customTargetInput.value = '.ql-editor, [contenteditable]';
  }

  // 提示词模板
  const promptLabel = document.createElement('label');
  promptLabel.textContent = '提示词模板: ';
  promptLabel.style.marginRight = '10px';
  promptLabel.style.display = 'block';
  promptLabel.style.marginTop = '10px';

  const promptInput = document.createElement('textarea');
  promptInput.id = 'prompt-template';
  promptInput.placeholder = '例如: "请继续分析以下文本:\\n\\n"';
  promptInput.style.width = '100%';
  promptInput.style.height = '60px';
  promptInput.style.marginBottom = '10px';

  // 自动检测按钮
  const detectButton = document.createElement('button');
  detectButton.textContent = '自动检测输入框和发送按钮';
  detectButton.style.width = '100%';
  detectButton.style.padding = '8px';
  detectButton.style.backgroundColor = '#9C27B0';
  detectButton.style.color = 'white';
  detectButton.style.border = 'none';
  detectButton.style.borderRadius = '4px';
  detectButton.style.cursor = 'pointer';
  detectButton.style.marginBottom = '10px';

  // 保存配置按钮
  const saveConfigButton = document.createElement('button');
  saveConfigButton.textContent = '保存当前网站配置';
  saveConfigButton.style.width = '100%';
  saveConfigButton.style.padding = '8px';
  saveConfigButton.style.backgroundColor = '#607D8B';
  saveConfigButton.style.color = 'white';
  saveConfigButton.style.border = 'none';
  saveConfigButton.style.borderRadius = '4px';
  saveConfigButton.style.cursor = 'pointer';
  saveConfigButton.style.marginBottom = '10px';

  // 分割按钮
  const segmentButton = document.createElement('button');
  segmentButton.textContent = '开始分割';
  segmentButton.style.width = '100%';
  segmentButton.style.padding = '8px';
  segmentButton.style.backgroundColor = '#4CAF50';
  segmentButton.style.color = 'white';
  segmentButton.style.border = 'none';
  segmentButton.style.borderRadius = '4px';
  segmentButton.style.cursor = 'pointer';
  segmentButton.style.marginBottom = '10px';

  // 自动填充按钮
  const panelAutoFillButton = document.createElement('button');
  panelAutoFillButton.textContent = '自动填充下一段';
  panelAutoFillButton.style.width = '100%';
  panelAutoFillButton.style.padding = '8px';
  panelAutoFillButton.style.backgroundColor = '#2196F3';
  panelAutoFillButton.style.color = 'white';
  panelAutoFillButton.style.border = 'none';
  panelAutoFillButton.style.borderRadius = '4px';
  panelAutoFillButton.style.cursor = 'pointer';
  panelAutoFillButton.style.marginBottom = '10px';
  panelAutoFillButton.style.display = 'none';

  // 复制按钮
  const copyNextButton = document.createElement('button');
  copyNextButton.textContent = '复制下一段';
  copyNextButton.style.width = '100%';
  copyNextButton.style.padding = '8px';
  copyNextButton.style.backgroundColor = '#FF9800';
  copyNextButton.style.color = 'white';
  copyNextButton.style.border = 'none';
  copyNextButton.style.borderRadius = '4px';
  copyNextButton.style.cursor = 'pointer';
  copyNextButton.style.marginBottom = '10px';
  copyNextButton.style.display = 'none';

  // 定时发送按钮
  const autoSendPanelButton = document.createElement('button');
  autoSendPanelButton.textContent = '定时自动发送';
  autoSendPanelButton.style.width = '100%';
  autoSendPanelButton.style.padding = '8px';
  autoSendPanelButton.style.backgroundColor = '#FF5722';
  autoSendPanelButton.style.color = 'white';
  autoSendPanelButton.style.border = 'none';
  autoSendPanelButton.style.borderRadius = '4px';
  autoSendPanelButton.style.cursor = 'pointer';
  autoSendPanelButton.style.marginBottom = '10px';
  autoSendPanelButton.style.display = 'none';

  // 段落列表
  const segmentList = document.createElement('div');
  segmentList.style.maxHeight = '200px';
  segmentList.style.overflowY = 'auto';
  segmentList.style.border = '1px solid #ddd';
  segmentList.style.borderRadius = '4px';
  segmentList.style.padding = '5px';

  // 添加到面板
  panel.append(
    title,
    promptLabel,
    promptInput,
    inputTextarea,
    settingsSection,
    autoSendLabel,
    autoSendInput,
    detectButton,
    saveConfigButton,
    segmentButton,
    panelAutoFillButton,
    copyNextButton,
    autoSendPanelButton,
    segmentList
  );

  // 主按钮点击事件
  mainButton.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  // 自动检测功能
  detectButton.addEventListener('click', () => {
    // 检测输入框
    const inputElements = [
      ...document.querySelectorAll('textarea'),
      ...document.querySelectorAll('[contenteditable="true"]'),
      ...document.querySelectorAll('input[type="text"]')
    ].filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

    if (inputElements.length > 0) {
      const bestInput = inputElements[0];
      customTargetInput.value = getBestSelector(bestInput);
      
      // 检测发送按钮
      const sendButtons = [
        ...document.querySelectorAll('button'),
        ...document.querySelectorAll('[role="button"]')
      ].filter(btn => {
        const text = (btn.textContent || btn.innerText || '').toLowerCase();
        return /发送|submit|send|enter|go/i.test(text);
      });

      if (sendButtons.length > 0) {
        alert(`检测到输入框: ${customTargetInput.value}\n发送按钮: ${getBestSelector(sendButtons[0])}`);
      } else {
        alert(`检测到输入框: ${customTargetInput.value}\n未检测到发送按钮`);
      }
    } else {
      alert('未检测到输入框');
    }
  });

  // 保存配置功能
  saveConfigButton.addEventListener('click', () => {
    const config = {
      inputSelector: customTargetInput.value.trim(),
      splitPattern: splitPatternSelect.value === 'custom' 
        ? customPatternInput.value 
        : splitPatternSelect.value,
      maxLength: parseInt(maxLengthInput.value) || 2000,
      promptTemplate: promptInput.value.trim(),
      autoSendInterval: parseInt(autoSendInput.value) || 3000
    };

    chrome.storage.sync.get(['siteSettings'], (result) => {
      const siteSettings = result.siteSettings || {};
      siteSettings[currentHostname] = config;
      
      chrome.storage.sync.set({ siteSettings }, () => {
        alert(`${currentHostname} 的配置已保存`);
      });
    });
  });

  // 分割按钮点击事件
  segmentButton.addEventListener('click', () => {
    const text = inputTextarea.value;
    if (!text.trim()) {
      alert('请输入要分割的文本');
      return;
    }

    const maxLength = parseInt(maxLengthInput.value) || 2000;
    let splitPattern = splitPatternSelect.value;

    if (splitPattern === 'custom' && customPatternInput.value) {
      splitPattern = customPatternInput.value;
    }

    try {
      new RegExp(splitPattern);
    } catch (e) {
      alert('无效的正则表达式');
      return;
    }

    segmenter.segment(text, {
      maxLength,
      splitPattern: new RegExp(splitPattern)
    });

    // 设置提示词模板
    if (promptInput.value.trim()) {
      segmenter.setPromptTemplate(promptInput.value.trim());
    }

    segmentList.innerHTML = '';
    const segments = segmenter.getAllSegments();
    
    if (segments.length === 0) {
      segmentList.innerHTML = '<p>没有可分割的段落</p>';
      panelAutoFillButton.style.display = 'none';
      copyNextButton.style.display = 'none';
      autoFillButton.style.display = 'none';
      copyButton.style.display = 'none';
      autoSendButton.style.display = 'none';
      autoSendPanelButton.style.display = 'none';
      return;
    }

    segments.forEach((segment, index) => {
      const segmentItem = document.createElement('div');
      segmentItem.style.padding = '5px';
      segmentItem.style.marginBottom = '5px';
      segmentItem.style.backgroundColor = '#f5f5f5';
      segmentItem.style.borderRadius = '3px';
      
      const segmentHeader = document.createElement('div');
      segmentHeader.style.display = 'flex';
      segmentHeader.style.justifyContent = 'space-between';
      
      const segmentNumber = document.createElement('span');
      segmentNumber.textContent = `段落 ${index + 1}`;
      segmentNumber.style.fontWeight = 'bold';
      
      const segmentLength = document.createElement('span');
      segmentLength.textContent = `${segment.content.length} 字符`;
      segmentLength.style.color = '#666';
      
      segmentHeader.append(segmentNumber, segmentLength);
      
      const segmentContent = document.createElement('div');
      segmentContent.textContent = segment.content.length > 50 
        ? segment.content.substring(0, 50) + '...' 
        : segment.content;
      segmentContent.style.marginTop = '3px';
      segmentContent.style.color = '#333';
      
      segmentItem.append(segmentHeader, segmentContent);
      segmentList.appendChild(segmentItem);
    });

    panelAutoFillButton.style.display = 'block';
    copyNextButton.style.display = 'block';
    autoFillButton.style.display = 'block';
    copyButton.style.display = 'block';
    autoSendButton.style.display = 'block';
    autoSendPanelButton.style.display = 'block';
  });

  // 自动填充功能
  const fillNextSegment = () => {
    const segment = promptInput.value.trim() 
      ? segmenter.getNextSegmentWithPrompt()
      : segmenter.getNextSegment();
      
    if (!segment) {
      alert('所有段落已填充完毕');
      panelAutoFillButton.style.display = 'none';
      copyNextButton.style.display = 'none';
      autoFillButton.style.display = 'none';
      copyButton.style.display = 'none';
      autoSendButton.style.display = 'none';
      autoSendPanelButton.style.display = 'none';
      segmenter.stopAutoSend();
      return false;
    }

    const targetSelector = customTargetInput.value.trim();
    let targetElement = findTargetElement(targetSelector);

    if (targetElement) {
      try {
        fillTargetElement(targetElement, segment.content);
        
        // 尝试找到并点击发送按钮
        const sendButton = findSendButton();
        if (sendButton) {
          setTimeout(() => sendButton.click(), 300);
        }
        return true;
      } catch (e) {
        console.error('填充失败:', e);
        alert(`填充失败: ${e.message}`);
        return false;
      }
    } else {
      alert('未找到可用的输入框，请手动指定选择器');
      return false;
    }
  };

  panelAutoFillButton.addEventListener('click', fillNextSegment);
  autoFillButton.addEventListener('click', fillNextSegment);

  // 复制功能
  const copyNextSegment = () => {
    const segment = promptInput.value.trim() 
      ? segmenter.getNextSegmentWithPrompt()
      : segmenter.getNextSegment();
      
    if (!segment) {
      alert('所有段落已复制完毕');
      copyNextButton.style.display = 'none';
      copyButton.style.display = 'none';
      return;
    }

    copyToClipboard(segment.content)
      .then(() => {
        copyNextButton.textContent = '已复制!';
        copyNextButton.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
          copyNextButton.textContent = '复制下一段';
          copyNextButton.style.backgroundColor = '#FF9800';
        }, 1000);
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请检查控制台');
      });
  };

  copyNextButton.addEventListener('click', copyNextSegment);
  copyButton.addEventListener('click', copyNextSegment);

  // 定时发送功能
  const toggleAutoSend = () => {
    if (segmenter.autoSendInterval) {
      segmenter.stopAutoSend();
      autoSendPanelButton.textContent = '定时自动发送';
      autoSendPanelButton.style.backgroundColor = '#FF5722';
      autoSendButton.innerHTML = '⏱️';
      autoSendButton.style.backgroundColor = '#FF9800';
    } else {
      const interval = parseInt(autoSendInput.value) || 3000;
      segmenter.startAutoSend(fillNextSegment, interval);
      autoSendPanelButton.textContent = '停止定时发送';
      autoSendPanelButton.style.backgroundColor = '#f44336';
      autoSendButton.innerHTML = '⏹️';
      autoSendButton.style.backgroundColor = '#f44336';
    }
  };

  autoSendPanelButton.addEventListener('click', toggleAutoSend);
  autoSendButton.addEventListener('click', toggleAutoSend);

  // 加载保存的网站配置
  if (settings.siteSettings?.[currentHostname]) {
    const siteConfig = settings.siteSettings[currentHostname];
    
    if (siteConfig.inputSelector) {
      customTargetInput.value = siteConfig.inputSelector;
    }
    if (siteConfig.maxLength) {
      maxLengthInput.value = siteConfig.maxLength;
    }
    if (siteConfig.splitPattern) {
      if (['[。！？\\n]', '[。\\n]', '[\\n]'].includes(siteConfig.splitPattern)) {
        splitPatternSelect.value = siteConfig.splitPattern;
      } else {
        splitPatternSelect.value = 'custom';
        customPatternInput.value = siteConfig.splitPattern;
        customPatternInput.style.display = 'block';
      }
    }
    if (siteConfig.promptTemplate) {
      promptInput.value = siteConfig.promptTemplate;
    }
    if (siteConfig.autoSendInterval) {
      autoSendInput.value = siteConfig.autoSendInterval;
    }
  }
}

// 辅助函数：查找目标元素
function findTargetElement(selector) {
  if (!selector) return null;
  
  // 尝试多个选择器
  const selectors = selector.split(',').map(s => s.trim());
  for (const sel of selectors) {
    const element = document.querySelector(sel);
    if (element) return element;
  }
  
  // 尝试自动检测
  const activeElement = document.activeElement;
  if (activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable) {
    return activeElement;
  }
  
  // 检测所有可能的输入元素
  const inputElements = [
    ...document.querySelectorAll('textarea'),
    ...document.querySelectorAll('[contenteditable="true"]')
  ];
  
  return inputElements.length > 0 ? inputElements[0] : null;
}

// 辅助函数：填充目标元素
function fillTargetElement(element, content) {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    element.value = content;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.isContentEditable) {
    element.innerHTML = content;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    throw new Error('不支持的元素类型');
  }
  
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 辅助函数：查找发送按钮
function findSendButton() {
  const buttons = [
    ...document.querySelectorAll('button'),
    ...document.querySelectorAll('[role="button"]')
  ];
  
  return buttons.find(btn => {
    const text = (btn.textContent || btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
    return /发送|submit|send|enter|go/i.test(text);
  });
}

// 辅助函数：复制到剪贴板
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

// 辅助函数：获取最佳选择器
function getBestSelector(element) {
  if (element.id) return `#${element.id}`;
  
  const classes = Array.from(element.classList)
    .filter(c => !c.startsWith('js-') && c.length < 20)
    .map(c => `.${c}`);
  
  if (classes.length > 0) {
    return `${element.tagName.toLowerCase()}${classes[0]}`;
  }
  
  return element.tagName.toLowerCase();
}

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}