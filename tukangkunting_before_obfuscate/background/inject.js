(function () {
  function executeScript(tabId, details) {
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          ...details,
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          resolve(results);
        }
      );
    });
  }

  async function setPageVars(tabId, vars = {}) {
    await executeScript(tabId, {
      args: [vars],
      func: (payload) => {
        Object.entries(payload || {}).forEach(([key, value]) => {
          window[key] = value;
        });
      },
    });
  }

  async function injectModule(tabId, moduleConfig, pageVars = {}) {
    if (!moduleConfig || !moduleConfig.file) {
      throw new Error("Module config/file tidak valid.");
    }

    const mergedVars = {
      ...(moduleConfig.pageVars || {}),
      ...(pageVars || {}),
    };

    if (Object.keys(mergedVars).length > 0) {
      await setPageVars(tabId, mergedVars);
    }

    await executeScript(tabId, {
      files: [
        ...self.TK_CONSTANTS.SHARED_CONTENT_FILES,
        moduleConfig.file,
      ],
    });
  }

  self.TK_INJECT = {
    executeScript,
    setPageVars,
    injectModule,
  };
})();