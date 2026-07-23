(function () {
  let activeKeepAwakeCount = 0;
  let currentLevel = null;

  function requestKeepAwake(level = "display") {
    if (!chrome.power?.requestKeepAwake) {
      return {
        ok: false,
        reason: "chrome.power API tidak tersedia",
      };
    }

    activeKeepAwakeCount += 1;
    currentLevel = level;

    chrome.power.requestKeepAwake(level);

    return {
      ok: true,
      level,
      activeKeepAwakeCount,
    };
  }

  function releaseKeepAwake() {
    activeKeepAwakeCount = Math.max(0, activeKeepAwakeCount - 1);

    if (activeKeepAwakeCount === 0 && chrome.power?.releaseKeepAwake) {
      chrome.power.releaseKeepAwake();
      currentLevel = null;
    }

    return {
      ok: true,
      activeKeepAwakeCount,
      currentLevel,
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.action) return;

    if (msg.action === "tkPowerKeepAwakeStart") {
      const level = msg.level === "system" ? "system" : "display";
      sendResponse(requestKeepAwake(level));
      return true;
    }

    if (msg.action === "tkPowerKeepAwakeStop") {
      sendResponse(releaseKeepAwake());
      return true;
    }

    if (msg.action === "tkPowerKeepAwakeStatus") {
      sendResponse({
        ok: true,
        activeKeepAwakeCount,
        currentLevel,
      });
      return true;
    }
  });

  self.TK_POWER = {
    requestKeepAwake,
    releaseKeepAwake,
  };
})();
