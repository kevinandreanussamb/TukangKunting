(function () {
  const TK = (window.TK = window.TK || {});

  function get(keys) {
    return new Promise((resolve) => {
      if (!chrome?.storage?.local) {
        resolve({});
        return;
      }

      chrome.storage.local.get(keys, resolve);
    });
  }

  function set(payload) {
    return new Promise((resolve) => {
      if (!chrome?.storage?.local) {
        resolve(false);
        return;
      }

      chrome.storage.local.set(payload, () => resolve(true));
    });
  }

  async function getNumber(key, defaultValue = 0) {
    const result = await get([key]);
    const value = Number(result[key]);

    return Number.isFinite(value) ? value : defaultValue;
  }

  async function getDelay(key, defaultValue = 500) {
    return getNumber(key, defaultValue);
  }

  TK.Storage = {
    get,
    set,
    getNumber,
    getDelay,
  };
})();