(function () {
  const TK = (window.TK = window.TK || {});

  const CORETAX_HOME = "https://coretaxdjp.pajak.go.id/home-portal/id-ID/";

  class SessionExpiredError extends Error {
    constructor(message = "SESSION_EXPIRED") {
      super(message);
      this.name = "SessionExpiredError";
      this.code = "SESSION_EXPIRED";
    }
  }

  function sendMessage(payload) {
    return new Promise((resolve) => {
      try {
        if (!chrome?.runtime?.sendMessage) {
          resolve(null);
          return;
        }

        chrome.runtime.sendMessage(payload, (response) => {
          if (chrome.runtime.lastError) {
            resolve(null);
            return;
          }

          resolve(response || null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  function getBodyText() {
    return String(document.body?.innerText || "").toLowerCase();
  }

  function isLoginPageByUrl() {
    const href = location.href.toLowerCase();

    return (
      href.includes("/identityproviderportal/account/login") ||
      href.includes("/account/login") ||
      href.includes("/connect/endsession") ||
      href.includes("/account/logout")
    );
  }

  function isLoginPageByDom() {
    return !!(
      document.querySelector("input[name='Username']") ||
      document.querySelector("input#Username") ||
      document.querySelector("input[name='Password']") ||
      document.querySelector("input#Password") ||
      document.querySelector("input[type='password']")
    );
  }

  function hasSessionExpiredText() {
    const text = getBodyText();

    return (
      text.includes("session expired") ||
      text.includes("sesi berakhir") ||
      text.includes("sesi anda telah berakhir") ||
      text.includes("silakan login") ||
      text.includes("please login") ||
      text.includes("unauthorized") ||
      text.includes("401")
    );
  }

  function isCoretaxLoginLikePage() {
    return isLoginPageByUrl() || isLoginPageByDom();
  }

  async function getBackgroundSessionStatus() {
    return sendMessage({
      action: "coretaxSessionStatus",
    });
  }

  async function isActive() {
    if (isCoretaxLoginLikePage()) {
      return false;
    }

    const status = await getBackgroundSessionStatus();

    if (!status) {
      return !hasSessionExpiredText();
    }

    return !!status.ok;
  }

  async function openLoginPopup() {
    return sendMessage({
      action: "openCoretaxLoginPopup",
    });
  }

  async function waitForActiveSession(timeoutMs = 5 * 60 * 1000) {
    return sendMessage({
      action: "waitForCoretaxSession",
      timeoutMs,
      pollMs: 1000,
      settleMs: 6000,
    });
  }

  async function closeLoginPopup() {
    return sendMessage({
      action: "closeCoretaxLoginPopup",
    });
  }

  function rememberReturnUrl() {
    const current = location.href;

    if (!isCoretaxLoginLikePage()) {
      sessionStorage.setItem("tk_last_coretax_url", current);
      return current;
    }

    return sessionStorage.getItem("tk_last_coretax_url") || CORETAX_HOME;
  }

  async function handleExpired(ui, options = {}) {
    const timeoutMs = options.timeoutMs || 5 * 60 * 1000;
    const returnUrl = rememberReturnUrl();

    ui?.setStatus?.("Sesi Coretax berakhir", "paused");
    ui?.log?.("Sesi Coretax terdeteksi berakhir.");
    ui?.log?.("Membuka popup Coretax untuk login ulang...");

    const popupResult = await openLoginPopup();

    if (!popupResult?.ok) {
      ui?.error?.("Gagal membuka popup login");
      ui?.log?.(popupResult?.reason || "Popup login tidak dapat dibuka.");
      throw new SessionExpiredError("SESSION_POPUP_FAILED");
    }

    ui?.log?.(
      popupResult.incognito
        ? "Popup login dibuka dalam Incognito Mode."
        : "Popup login dibuka dalam Mode Normal."
    );

    if (popupResult.storeId) {
      ui?.log?.(`Cookie store: ${popupResult.storeId}`);
    }

    ui?.log?.("Silakan login ulang di popup Coretax.");
    ui?.log?.("Setelah login berhasil, tunggu 5–8 detik. Extension akan mendeteksi sesi aktif kembali.");

    const waitResult = await waitForActiveSession(timeoutMs);

    if (!waitResult?.ok) {
      ui?.error?.("Login timeout");
      ui?.log?.("Timeout menunggu login ulang Coretax.");
      ui?.log?.(`Debug session: ${JSON.stringify(waitResult?.status || {})}`);
      throw new SessionExpiredError("SESSION_LOGIN_TIMEOUT");
    }

    const status = waitResult.status || {};

    ui?.log?.("Cookie/session Coretax terdeteksi aktif kembali.");
    ui?.log?.(
      `Debug session: incognito=${!!status.incognito}, store=${status.storeId || "-"}, Portal=${!!status.hasPortal}, idsrv=${!!status.hasIdsrvSession}`
    );

    await TK.DOM.sleep(2500);

    await closeLoginPopup();

    ui?.setStatus?.("Resume proses...", "running");
    ui?.log?.("Sesi Coretax aktif kembali. Resume proses...");

    if (isCoretaxLoginLikePage()) {
      ui?.log?.("Tab utama masih berada di halaman login. Mengarahkan kembali ke halaman Coretax terakhir...");
      location.href = returnUrl || CORETAX_HOME;
      throw new SessionExpiredError("SESSION_RELOAD_REQUIRED");
    }

    await TK.DOM.sleep(1000);

    return true;
  }

  async function ensureActive(ui, options = {}) {
    const active = await isActive();

    if (active) {
      return true;
    }

    await handleExpired(ui, options);

    return true;
  }

  function isSessionError(err) {
    return (
      err instanceof SessionExpiredError ||
      err?.name === "SessionExpiredError" ||
      err?.code === "SESSION_EXPIRED" ||
      String(err?.message || "").includes("SESSION_")
    );
  }

  TK.Session = {
    SessionExpiredError,
    isLoginPageByUrl,
    isLoginPageByDom,
    isCoretaxLoginLikePage,
    hasSessionExpiredText,
    getBackgroundSessionStatus,
    isActive,
    ensureActive,
    handleExpired,
    isSessionError,
  };
})();