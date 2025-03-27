// 后台脚本，用于处理跨页面通信和网站配置管理
const websiteConfigs = {
  "chat.openai.com": {
    inputSelector: "textarea#prompt-textarea",
    submitSelector: "button[data-testid='send-button']"
  },
  "claude.ai": {
    inputSelector: "div.ProseMirror",
    submitSelector: "button:has(svg[aria-label='Send Message'])"
  },
  "gemini.google.com": {
    inputSelector: "div.ql-editor",
    submitSelector: "button.send-button"
  }
};

// 保存配置到存储
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ websiteConfigs });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['settings', 'websiteConfigs'], (result) => {
      const hostname = new URL(sender.tab.url).hostname;
      const siteConfig = result.websiteConfigs?.[hostname] || {};
      sendResponse({
        globalSettings: result.settings || {},
        siteConfig
      });
    });
    return true;
  }
  
  if (request.action === 'saveSiteConfig') {
    chrome.storage.sync.get(['websiteConfigs'], (result) => {
      const configs = result.websiteConfigs || {};
      configs[request.hostname] = request.config;
      chrome.storage.sync.set({ websiteConfigs: configs }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});