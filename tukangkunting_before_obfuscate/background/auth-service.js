(function () {
  const CORETAX_DOMAIN = "coretaxdjp.pajak.go.id";
  const CORETAX_ORIGIN = "https://coretaxdjp.pajak.go.id";
  const CORETAX_HOME = `${CORETAX_ORIGIN}/home-portal/id-ID/`;

  const contexts = new Map();

  function getContextKey(sender) {
    const tabId = sender?.tab?.id;
    const incognito = !!sender?.tab?.incognito;

    if (tabId == null) {
      return incognito ? "incognito_unknown" : "normal_unknown";
    }

    return `${incognito ? "incognito" : "normal"}:${tabId}`;
  }

  function getOrCreateContext(sender) {
    const key = getContextKey(sender);

    if (!contexts.has(key)) {
      contexts.set(key, {
        key,
        sourceTabId: sender?.tab?.id ?? null,
        incognito: !!sender?.tab?.incognito,
        loginWindowId: null,
        loginTabId: null,
        cookieStoreId: null,
      });
    }

    const context = contexts.get(key);

    context.sourceTabId = sender?.tab?.id ?? context.sourceTabId;
    context.incognito = !!sender?.tab?.incognito;

    return context;
  }

  function getAllCookieStores() {
    return new Promise((resolve) => {
      chrome.cookies.getAllCookieStores((stores) => {
        resolve(Array.isArray(stores) ? stores : []);
      });
    });
  }

  async function getCookieStoreIdForContext(context) {
    if (context.cookieStoreId) {
      return context.cookieStoreId;
    }

    const stores = await getAllCookieStores();

    if (context.sourceTabId != null) {
      const matchedBySourceTab = stores.find((store) => {
        return Array.isArray(store.tabIds) && store.tabIds.includes(context.sourceTabId);
      });

      if (matchedBySourceTab) {
        context.cookieStoreId = matchedBySourceTab.id;
        return context.cookieStoreId;
      }
    }

    if (context.loginTabId != null) {
      const matchedByLoginTab = stores.find((store) => {
        return Array.isArray(store.tabIds) && store.tabIds.includes(context.loginTabId);
      });

      if (matchedByLoginTab) {
        context.cookieStoreId = matchedByLoginTab.id;
        return context.cookieStoreId;
      }
    }

    const fallback = stores[0];

    context.cookieStoreId = fallback?.id || null;

    return context.cookieStoreId;
  }

  async function getAllCoretaxCookies(context) {
    const storeId = await getCookieStoreIdForContext(context);

    return new Promise((resolve) => {
      const query = {
        domain: CORETAX_DOMAIN,
      };

      if (storeId) {
        query.storeId = storeId;
      }

      chrome.cookies.getAll(query, (cookies) => {
        resolve(Array.isArray(cookies) ? cookies : []);
      });
    });
  }

  async function getCoretaxSessionStatus(context) {
    const cookies = await getAllCoretaxCookies(context);

    const portalCookies = cookies.filter((cookie) => cookie.name === "Portal");
    const idsrvSessionCookies = cookies.filter((cookie) => cookie.name === "idsrv.session");
    const xsrfCookies = cookies.filter((cookie) => cookie.name === "Portal-xsrf-cookie");
    const slSessionCookies = cookies.filter((cookie) => cookie.name === "sl-session");

    const hasPortal = portalCookies.length > 0;
    const hasIdsrvSession = idsrvSessionCookies.length > 0;

    return {
      ok: hasPortal || hasIdsrvSession,
      incognito: !!context.incognito,
      storeId: context.cookieStoreId || null,
      sourceTabId: context.sourceTabId,
      loginWindowId: context.loginWindowId,
      loginTabId: context.loginTabId,
      hasPortal,
      hasIdsrvSession,
      hasXsrf: xsrfCookies.length > 0,
      hasSlSession: slSessionCookies.length > 0,
      portalCount: portalCookies.length,
      idsrvSessionCount: idsrvSessionCookies.length,
      cookieNames: [...new Set(cookies.map((cookie) => cookie.name))],
      checkedAt: Date.now(),
    };
  }

  function windowsUpdate(windowId, updateInfo) {
    return new Promise((resolve) => {
      chrome.windows.update(windowId, updateInfo, (win) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }

        resolve(win || null);
      });
    });
  }

  function windowsCreate(createData) {
    return new Promise((resolve, reject) => {
      chrome.windows.create(createData, (win) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(win);
      });
    });
  }

  function windowsRemove(windowId) {
    return new Promise((resolve) => {
      chrome.windows.remove(windowId, () => {
        if (chrome.runtime.lastError) {
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }

  async function openLoginPopup(context) {
    try {
      if (context.loginWindowId) {
        const existing = await windowsUpdate(context.loginWindowId, {
          focused: true,
        });

        if (existing) {
          return {
            ok: true,
            windowId: context.loginWindowId,
            tabId: context.loginTabId,
            reused: true,
            incognito: context.incognito,
            url: CORETAX_HOME,
          };
        }

        context.loginWindowId = null;
        context.loginTabId = null;
        context.cookieStoreId = null;
      }

      const win = await windowsCreate({
        url: CORETAX_HOME,
        type: "popup",
        width: 760,
        height: 820,
        focused: true,
        incognito: !!context.incognito,
      });

      context.loginWindowId = win.id || null;
      context.loginTabId = Array.isArray(win.tabs) && win.tabs[0] ? win.tabs[0].id : null;

      context.cookieStoreId = null;
      await getCookieStoreIdForContext(context);

      return {
        ok: true,
        windowId: context.loginWindowId,
        tabId: context.loginTabId,
        reused: false,
        incognito: context.incognito,
        storeId: context.cookieStoreId,
        url: CORETAX_HOME,
      };
    } catch (err) {
      return {
        ok: false,
        reason: err.message || "Gagal membuka popup login Coretax.",
      };
    }
  }

  async function closeLoginPopup(context) {
    if (!context.loginWindowId) {
      return {
        ok: true,
      };
    }

    const removed = await windowsRemove(context.loginWindowId);

    context.loginWindowId = null;
    context.loginTabId = null;
    context.cookieStoreId = null;

    return {
      ok: removed,
    };
  }

  function waitForCoretaxSession(context, timeoutMs = 5 * 60 * 1000, pollMs = 1000, settleMs = 6000) {
    return new Promise((resolve) => {
      const start = Date.now();

      let firstOkAt = null;
      let lastStatus = null;

      const timer = setInterval(async () => {
        const status = await getCoretaxSessionStatus(context);
        lastStatus = status;

        if (status.ok) {
          if (!firstOkAt) {
            firstOkAt = Date.now();
          }

          const stableFor = Date.now() - firstOkAt;

          if (stableFor >= settleMs) {
            clearInterval(timer);

            resolve({
              ok: true,
              status,
              stableFor,
            });

            return;
          }
        } else {
          firstOkAt = null;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);

          resolve({
            ok: false,
            reason: "timeout_waiting_login",
            status: lastStatus,
          });
        }
      }, pollMs);
    });
  }

  chrome.windows.onRemoved.addListener((windowId) => {
    for (const context of contexts.values()) {
      if (context.loginWindowId === windowId) {
        context.loginWindowId = null;
        context.loginTabId = null;
        context.cookieStoreId = null;
      }
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.action) return;

    const context = getOrCreateContext(sender);

    if (msg.action === "coretaxSessionStatus") {
      (async () => {
        sendResponse(await getCoretaxSessionStatus(context));
      })();

      return true;
    }

    if (msg.action === "openCoretaxLoginPopup") {
      (async () => {
        sendResponse(await openLoginPopup(context));
      })();

      return true;
    }

    if (msg.action === "waitForCoretaxSession") {
      (async () => {
        const timeoutMs = Number(msg.timeoutMs || 5 * 60 * 1000);
        const pollMs = Number(msg.pollMs || 1000);
        const settleMs = Number(msg.settleMs || 6000);

        sendResponse(await waitForCoretaxSession(context, timeoutMs, pollMs, settleMs));
      })();

      return true;
    }

    if (msg.action === "closeCoretaxLoginPopup") {
      (async () => {
        sendResponse(await closeLoginPopup(context));
      })();

      return true;
    }
  });

  self.TK_AUTH = {
    getCoretaxSessionStatus,
    openLoginPopup,
    waitForCoretaxSession,
    closeLoginPopup,
  };
})();
``