(function () {
  const TK = (window.TK = window.TK || {});

  function sendMessage(payload) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(payload, (response) => {
          if (chrome.runtime.lastError) {
            resolve({
              ok: false,
              reason: chrome.runtime.lastError.message,
            });
            return;
          }

          resolve(response || { ok: false, reason: "no_response" });
        });
      } catch (err) {
        resolve({
          ok: false,
          reason: err.message || String(err),
        });
      }
    });
  }

  async function start(level = "display", ui = null) {
    const result = await sendMessage({
      action: "tkPowerKeepAwakeStart",
      level,
    });

    if (result?.ok) {
      ui?.log?.(`Keep Awake aktif: ${result.level}`);
    } else {
      ui?.log?.(`Keep Awake gagal: ${result?.reason || "unknown"}`);
    }

    return result;
  }

  async function stop(ui = null) {
    const result = await sendMessage({
      action: "tkPowerKeepAwakeStop",
    });

    if (result?.ok) {
      ui?.log?.("Keep Awake dilepas.");
    }

    return result;
  }

  async function status() {
    return sendMessage({
      action: "tkPowerKeepAwakeStatus",
    });
  }

  TK.Power = {
    start,
    stop,
    status,
  };
})();