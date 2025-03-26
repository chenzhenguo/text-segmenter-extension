// 后台脚本，用于处理跨页面通信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse(result.settings || {});
    });
    return true; // 保持消息通道开放
  }
});