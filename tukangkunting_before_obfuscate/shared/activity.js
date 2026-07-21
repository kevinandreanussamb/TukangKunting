(function () {
  const TK = (window.TK = window.TK || {});

  function batchComplete({ module, summary, failCount = 0 }) {
    try {
      chrome.runtime.sendMessage({
        action: "batchComplete",
        module,
        summary,
        failCount,
      });
    } catch (err) {
      console.warn("[TK.Activity] batchComplete gagal:", err);
    }
  }

  function saveLog(entry) {
    try {
      chrome.runtime.sendMessage({
        action: "saveActivityLog",
        entry: {
          ...entry,
          timestamp: entry?.timestamp || Date.now(),
          url: entry?.url || window.location.href,
        },
      });
    } catch (err) {
      console.warn("[TK.Activity] saveLog gagal:", err);
    }
  }

  function finish({ module, total, success, failed = 0, skipped = 0 }) {
    const summary =
      skipped > 0
        ? `${success} berhasil, ${failed} gagal, ${skipped} dilewati`
        : `${success} berhasil, ${failed} gagal`;

    batchComplete({
      module,
      summary,
      failCount: failed,
    });

    saveLog({
      module,
      total,
      success,
      failed,
      skipped,
      timestamp: Date.now(),
      url: window.location.href,
    });
  }

  TK.Activity = {
    batchComplete,
    saveLog,
    finish,
  };
})();