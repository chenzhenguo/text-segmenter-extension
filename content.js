class TextSegmenter {
  constructor() {
    this.segments = [];
    this.currentSegmentIndex = 0;
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
}

function createFloatingUI() {
  const container = document.createElement('div');
  container.id = 'text-segmenter-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '10000';

  const toggleButton = document.createElement('button');
  toggleButton.id = 'text-segmenter-toggle';
  toggleButton.innerHTML = '✂️';
  toggleButton.style.width = '50px';
  toggleButton.style.height = '50px';
  toggleButton.style.borderRadius = '50%';
  toggleButton.style.backgroundColor = '#4CAF50';
  toggleButton.style.color = 'white';
  toggleButton.style.border = 'none';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  toggleButton.style.fontSize = '20px';
  toggleButton.style.transition = 'all 0.3s ease';

  const panel = document.createElement('div');
  panel.id = 'text-segmenter-panel';
  panel.style.display = 'none';
  panel.style.position = 'absolute';
  panel.style.bottom = '60px';
  panel.style.right = '0';
  panel.style.width = '350px';
  panel.style.backgroundColor = 'white';
  panel.style.border = '1px solid #ddd';
  panel.style.borderRadius = '8px';
  panel.style.padding = '15px';
  panel.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';

  container.appendChild(toggleButton);
  container.appendChild(panel);
  document.body.appendChild(container);

  return { toggleButton, panel };
}

function initContentScript() {
  const segmenter = new TextSegmenter();
  const { toggleButton, panel } = createFloatingUI();

  // 创建面板内容
  const title = document.createElement('h3');
  title.textContent = '文本分割工具';
  title.style.marginTop = '0';

  const inputTextarea = document.createElement('textarea');
  inputTextarea.id = 'segmenter-input';
  inputTextarea.style.width = '100%';
  inputTextarea.style.height = '100px';
  inputTextarea.style.marginBottom = '10px';
  inputTextarea.placeholder = '在此粘贴要分割的文本';

  const settingsSection = document.createElement('div');
  settingsSection.style.marginBottom = '10px';

  const maxLengthLabel = document.createElement('label');
  maxLengthLabel.textContent = '最大段落长度: ';
  maxLengthLabel.style.marginRight = '10px';

  const maxLengthInput = document.createElement('input');
  maxLengthInput.type = 'number';
  maxLengthInput.value = '2000';
  maxLengthInput.style.width = '80px';

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

  splitPatternSelect.addEventListener('change', (e) => {
    customPatternInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
  });

  // 自定义输入框选择器
  const customTargetLabel = document.createElement('label');
  customTargetLabel.textContent = '目标输入框选择器: ';
  customTargetLabel.style.marginRight = '10px';
  customTargetLabel.style.marginTop = '10px';
  customTargetLabel.style.display = 'block';

  const customTargetInput = document.createElement('input');
  customTargetInput.type = 'text';
  customTargetInput.placeholder = '例如: .chat-input, #prompt-textarea';
  customTargetInput.style.width = '100%';
  customTargetInput.style.marginBottom = '10px';

  // 保存选择器按钮
  const saveSelectorButton = document.createElement('button');
  saveSelectorButton.textContent = '保存选择器';
  saveSelectorButton.style.width = '100%';
  saveSelectorButton.style.padding = '5px';
  saveSelectorButton.style.backgroundColor = '#9C27B0';
  saveSelectorButton.style.color = 'white';
  saveSelectorButton.style.border = 'none';
  saveSelectorButton.style.borderRadius = '4px';
  saveSelectorButton.style.cursor = 'pointer';
  saveSelectorButton.style.marginBottom = '10px';

  // 常用选择器建议
  const selectorSuggestions = document.createElement('div');
  selectorSuggestions.style.marginBottom = '10px';
  selectorSuggestions.innerHTML = `
    <div style="font-size:12px; color:#666;">常用选择器建议:</div>
    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
      <button class="selector-suggestion" data-selector="textarea" style="padding: 3px 5px; font-size:11px; background:#f0f0f0; border:1px solid #ddd; border-radius:3px; cursor:pointer;">textarea</button>
      <button class="selector-suggestion" data-selector="[contenteditable=true]" style="padding: 3px 5px; font-size:11px; background:#f0f0f0; border:1px solid #ddd; border-radius:3px; cursor:pointer;">[contenteditable]</button>
      <button class="selector-suggestion" data-selector=".chat-input" style="padding: 3px 5px; font-size:11px; background:#f0f0f0; border:1px solid #ddd; border-radius:3px; cursor:pointer;">.chat-input</button>
      <button class="selector-suggestion" data-selector="#prompt-textarea" style="padding: 3px 5px; font-size:11px; background:#f0f0f0; border:1px solid #ddd; border-radius:3px; cursor:pointer;">#prompt-textarea</button>
    </div>
  `;

  settingsSection.append(
    maxLengthLabel, maxLengthInput,
    splitPatternLabel, splitPatternSelect,
    customPatternInput,
    customTargetLabel, customTargetInput,
    saveSelectorButton,
    selectorSuggestions
  );

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

  const autoFillButton = document.createElement('button');
  autoFillButton.textContent = '自动填充下一段';
  autoFillButton.style.width = '100%';
  autoFillButton.style.padding = '8px';
  autoFillButton.style.backgroundColor = '#2196F3';
  autoFillButton.style.color = 'white';
  autoFillButton.style.border = 'none';
  autoFillButton.style.borderRadius = '4px';
  autoFillButton.style.cursor = 'pointer';
  autoFillButton.style.marginBottom = '10px';
  autoFillButton.style.display = 'none';

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

  const segmentList = document.createElement('div');
  segmentList.style.maxHeight = '200px';
  segmentList.style.overflowY = 'auto';
  segmentList.style.border = '1px solid #ddd';
  segmentList.style.borderRadius = '4px';
  segmentList.style.padding = '5px';

  panel.append(
    title,
    inputTextarea,
    settingsSection,
    segmentButton,
    autoFillButton,
    copyNextButton,
    segmentList
  );

  toggleButton.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  // 选择器建议点击事件
  selectorSuggestions.querySelectorAll('.selector-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      customTargetInput.value = btn.dataset.selector;
    });
  });

  // 保存选择器功能
  saveSelectorButton.addEventListener('click', () => {
    const selector = customTargetInput.value.trim();
    if (!selector) {
      alert('请输入有效的选择器');
      return;
    }
    
    // 测试选择器是否有效
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      alert('未找到匹配的元素，请检查选择器');
      return;
    }
    
    // 保存到storage
    chrome.storage.sync.get(['savedSelectors'], (result) => {
      const savedSelectors = result.savedSelectors || [];
      if (!savedSelectors.includes(selector)) {
        savedSelectors.push(selector);
        chrome.storage.sync.set({ savedSelectors }, () => {
          alert(`选择器 "${selector}" 已保存`);
        });
      } else {
        alert('该选择器已保存');
      }
    });
  });

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

    segmentList.innerHTML = '';
    const segments = segmenter.getAllSegments();
    
    if (segments.length === 0) {
      segmentList.innerHTML = '<p>没有可分割的段落</p>';
      autoFillButton.style.display = 'none';
      copyNextButton.style.display = 'none';
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

    autoFillButton.style.display = 'block';
    copyNextButton.style.display = 'block';
  });

  // 自动填充功能
  autoFillButton.addEventListener('click', () => {
    const segment = segmenter.getNextSegment();
    if (!segment) {
      alert('所有段落已填充完毕');
      autoFillButton.style.display = 'none';
      copyNextButton.style.display = 'none';
      return;
    }

    const targetSelector = customTargetInput.value.trim();
    let targetElement = null;

    // 1. 优先使用用户指定的选择器
    if (targetSelector) {
      targetElement = document.querySelector(targetSelector);
      if (!targetElement) {
        console.warn(`未找到匹配 ${targetSelector} 的元素`);
      }
    }

    // 2. 如果没找到，尝试自动检测
    if (!targetElement) {
      const activeElement = document.activeElement;
      const isTextarea = activeElement.tagName === 'TEXTAREA';
      const isContentEditable = activeElement.isContentEditable;
      
      if (isTextarea || isContentEditable) {
        targetElement = activeElement;
      } else {
        // 通用输入框检测
        const textareas = document.querySelectorAll('textarea');
        const contentEditables = document.querySelectorAll('[contenteditable="true"]');
        
        if (textareas.length > 0) {
          targetElement = textareas[textareas.length - 1]; // 通常最后一个是最新的
        } else if (contentEditables.length > 0) {
          targetElement = contentEditables[contentEditables.length - 1];
        }
      }
    }

    if (targetElement) {
      // 更健壮的填充方式
      try {
        if (targetElement.tagName === 'TEXTAREA') {
          targetElement.value = segment.content;
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
          targetElement.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (targetElement.isContentEditable) {
          targetElement.innerHTML = segment.content;
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          targetElement.value = segment.content;
          targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // 滚动到输入框
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 尝试找到发送按钮并点击
        const sendButtons = [
          ...document.querySelectorAll('button'),
          ...document.querySelectorAll('[role="button"]')
        ].filter(btn => {
          const text = btn.textContent || btn.innerText || btn.getAttribute('aria-label') || '';
          return /发送|提交|Submit|Send/i.test(text);
        });
        
        if (sendButtons.length > 0) {
          setTimeout(() => {
            sendButtons[0].focus();
            sendButtons[0].click();
          }, 300);
        }
      } catch (e) {
        console.error('填充失败:', e);
        alert('填充失败，请检查控制台');
      }
    } else {
      alert('未找到可用的输入框，请手动指定选择器');
    }
  });

  // 复制下一段功能
  copyNextButton.addEventListener('click', () => {
    const segment = segmenter.getNextSegment();
    if (!segment) {
      alert('所有段落已复制完毕');
      copyNextButton.style.display = 'none';
      return;
    }

    navigator.clipboard.writeText(segment.content)
      .then(() => {
        const originalText = copyNextButton.textContent;
        copyNextButton.textContent = '已复制!';
        copyNextButton.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
          copyNextButton.textContent = originalText;
          copyNextButton.style.backgroundColor = '#FF9800';
        }, 1000);
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请检查控制台');
      });
  });

  // 加载保存的选择器
  chrome.storage.sync.get(['savedSelectors'], (result) => {
    const savedSelectors = result.savedSelectors || [];
    if (savedSelectors.length > 0) {
      customTargetInput.value = savedSelectors[0]; // 默认加载第一个保存的选择器
    }
  });
}

// 等待页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}