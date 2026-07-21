(function () {
  const {
    BADGE_CLEAR_TIMEOUT_MS,
    MAX_ACTIVITY_LOG_SIZE,
  } = self.TK_CONSTANTS;

  function createBatchNotification({ module: moduleName, summary, failCount }) {
    chrome.notifications.create(`tukang_batch_${Date.now()}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title: `Tukangkunting — ${moduleName} Selesai`,
      message: summary,
    });

    if (failCount > 0) {
      chrome.action.setBadgeText({ text: String(failCount) });
      chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    } else {
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
    }

    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, BADGE_CLEAR_TIMEOUT_MS);
  }

  function saveActivityLog(entry) {
    chrome.storage.local.get({ activity_log: [] }, (data) => {
      const log = Array.isArray(data.activity_log) ? data.activity_log : [];

      log.unshift({
        ...entry,
        timestamp: entry?.timestamp || Date.now(),
      });

      if (log.length > MAX_ACTIVITY_LOG_SIZE) {
        log.length = MAX_ACTIVITY_LOG_SIZE;
      }

      chrome.storage.local.set({ activity_log: log });
    });
  }

  function getActivityLog(sendResponse) {
    chrome.storage.local.get({ activity_log: [] }, (data) => {
      sendResponse({
        log: Array.isArray(data.activity_log) ? data.activity_log : [],
      });
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.action) return;

    if (msg.action === "batchComplete") {
      createBatchNotification(msg);
      sendResponse({ ok: true });
      return true;
    }

    if (msg.action === "saveActivityLog") {
      saveActivityLog(msg.entry);
      sendResponse?.({ ok: true });
      return true;
    }

    if (msg.action === "getActivityLog") {
      getActivityLog(sendResponse);
      return true;
    }
  });

  self.TK_ACTIVITY = {
    createBatchNotification,
    saveActivityLog,
    getActivityLog,
  };
})();