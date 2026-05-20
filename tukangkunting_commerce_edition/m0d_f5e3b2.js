// pengkreditan_faktur.js
// Processes each row from CSV: filter grid → edit → change period/year → click Kredit
(async function () {
  /**************************************
   * LICENSE CHECK
   **************************************/
  async function checkLicense() {
    return new Promise((resolve) => {
      if (!chrome?.runtime?.sendMessage) {
        resolve({ ok: false, reason: "\x\x36\x65\x\x36\x66\x\x35\x66\x\x37\x32\x\x37\x35\x\x36\x65\x\x37\x34\x\x36\x39\x\x36\x64\x\x36\x35" });
        return;
      }
      chrome.runtime.sendMessage({ action: "\x\x36\x33\x\x36\x38\x\x36\x35\x\x36\x33\x\x36\x62\x\x34\x63\x\x36\x39\x\x36\x33\x\x36\x35\x\x36\x65\x\x37\x33\x\x36\x35" }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, reason: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: false, reason: "\x\x36\x65\x\x36\x66\x\x35\x66\x\x37\x32\x\x36\x35\x\x37\x33\x\x37\x30\x\x36\x66\x\x36\x65\x\x37\x33\x\x36\x35" });
      });
    });
  }

  const license = await checkLicense();

  if (!license.ok) {
    console.error("\u274c\x20\x4c\x69\x73\x65\x6e\x73\x69\x20\x74\x69\x64\x61\x6b\x20\x76\x61\x6c\x69\x64\x3a", license.reason);
    const notice = document.createElement("\x64\x69\x76");
    notice.id = "\x74\x75\x6b\x61\x6e\x67\x2d\x6c\x69\x63\x65\x6e\x73\x65\x2d\x6e\x6f\x74\x69\x63\x65";
    notice.style.cssText = `
      position:fixed;bottom:24px;right:24px;width:300px;
      background:#0f1117;border:1px solid rgba(239,68,68,.3);
      border-radius:14px;padding:18px 20px;z-index:999999;
      font-family:'DM Sans',system-ui,sans-serif;
      box-shadow:0 16px 48px rgba(0,0,0,.5);
      animation:tka-slideup .3s cubic-bezier(.16,1,.3,1);
    `;
    let reasonText = "\x4c\x69\x73\x65\x6e\x73\x69\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x2e";
    if (license.reason === "\x\x36\x63\x\x36\x39\x\x37\x33\x\x36\x35\x\x36\x65\x\x37\x33\x\x36\x39\x\x32\x30\x\x37\x33\x\x37\x35\x\x36\x34\x\x36\x31\x\x36\x38\x\x32\x30\x\x36\x35\x\x37\x38\x\x37\x30\x\x36\x39\x\x37\x32\x\x36\x35\x\x36\x34") reasonText = "\x4c\x69\x73\x65\x6e\x73\x69\x20\x41\x6e\x64\x61\x20\x73\x75\x64\x61\x68\x20\x65\x78\x70\x69\x72\x65\x64\x2e\x20\x48\x75\x62\x75\x6e\x67\x69\x20\x6f\x77\x6e\x65\x72\x20\x75\x6e\x74\x75\x6b\x20\x70\x65\x72\x70\x61\x6e\x6a\x61\x6e\x67\x61\x6e\x2e";
    else if (license.reason === "\x\x36\x64\x\x36\x31\x\x36\x33\x\x36\x38\x\x36\x39\x\x36\x65\x\x36\x35\x\x32\x30\x\x36\x33\x\x36\x66\x\x36\x34\x\x36\x35\x\x32\x30\x\x37\x34\x\x36\x39\x\x36\x34\x\x36\x31\x\x36\x62\x\x32\x30\x\x36\x33\x\x36\x66\x\x36\x33\x\x36\x66\x\x36\x62") reasonText = "\x54\x6f\x6b\x65\x6e\x20\x74\x69\x64\x61\x6b\x20\x63\x6f\x63\x6f\x6b\x20\x64\x65\x6e\x67\x61\x6e\x20\x70\x65\x72\x61\x6e\x67\x6b\x61\x74\x20\x69\x6e\x69\x2e";
    else if (license.reason === "\x\x36\x65\x\x36\x66\x\x35\x66\x\x36\x63\x\x36\x39\x\x36\x33\x\x36\x35\x\x36\x65\x\x37\x33\x\x36\x35") reasonText = "\x42\x65\x6c\x75\x6d\x20\x61\x64\x61\x20\x6c\x69\x73\x65\x6e\x73\x69\x20\x61\x6b\x74\x69\x66\x2e\x20\x4b\x6c\x69\x6b\x20\x69\x63\x6f\x6e\x20\x65\x78\x74\x65\x6e\x73\x69\x6f\x6e\x20\x75\x6e\x74\x75\x6b\x20\x61\x6b\x74\x69\x76\x61\x73\x69\x2e";
    notice.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:32px;height:32px;background:rgba(239,68,68,.12);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🔒</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#f87171;">Lisensi Tidak Aktif</div>
          <div style="font-size:11px;color:#4e5668;margin-top:2px;">Pengkreditan Faktur</div>
        </div>
      </div>
      <div style="font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:14px;">${reasonText}</div>
      <button id="tukang-license-close" style="
        width:100%;padding:9px;border:1px solid rgba(255,255,255,.09);
        background:rgba(255,255,255,.04);border-radius:8px;
        color:#a0aec0;font-size:12px;font-weight:500;cursor:pointer;
        font-family:'DM Sans',sans-serif;transition:background .15s;
      ">Tutup</button>
    `;
    document.body.appendChild(notice);
    document.getElementById("\x74\x75\x6b\x61\x6e\x67\x2d\x6c\x69\x63\x65\x6e\x73\x65\x2d\x63\x6c\x6f\x73\x65").onclick = () => notice.remove();
    return;
  }

  if (license.expiry) {
    const daysLeft = Math.ceil((license.expiry - Date.now()) / 86_400_000);
    const expDate = new Date(license.expiry).toLocaleDateString("\x\x36\x39\x\x36\x34\x\x32\x64\x\x34\x39\x\x34\x34", { day: "\x\x36\x65\x\x37\x35\x\x36\x64\x\x36\x35\x\x37\x32\x\x36\x39\x\x36\x33", month: "\x\x36\x63\x\x36\x66\x\x36\x65\x\x36\x37", year: "\x\x36\x65\x\x37\x35\x\x36\x64\x\x36\x35\x\x37\x32\x\x36\x39\x\x36\x33" });
    console.log(`✅ Lisensi aktif — berlaku hingga ${expDate} (${daysLeft} hari lagi)`);
  }

  const fakturList = window.__pengkreditanFakturList || [];
  delete window.__pengkreditanFakturList;

  if (fakturList.length === 0) {
    console.warn("\x5b\x50\x65\x6e\x67\x6b\x72\x65\x64\x69\x74\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x54\x69\x64\x61\x6b\x20\x61\x64\x61\x20\x64\x61\x74\x61\x20\x75\x6e\x74\x75\x6b\x20\x64\x69\x70\x72\x6f\x73\x65\x73\x2e");
    return;
  }

  const BULAN_NAMES = ["","\x4a\x61\x6e\x75\x61\x72\x69","\x46\x65\x62\x72\x75\x61\x72\x69","\x4d\x61\x72\x65\x74","\x41\x70\x72\x69\x6c","\x4d\x65\x69","\x4a\x75\x6e\x69","\x4a\x75\x6c\x69","\x41\x67\x75\x73\x74\x75\x73","\x53\x65\x70\x74\x65\x6d\x62\x65\x72","\x4f\x6b\x74\x6f\x62\x65\x72","\x4e\x6f\x76\x65\x6d\x62\x65\x72","\x44\x65\x73\x65\x6d\x62\x65\x72"];

  const rekapResults = [];

  // ══════════════════════════════════════════════════════════════
  //  UTILITY FUNCTIONS — Spinner detection matching PPN downloader
  // ══════════════════════════════════════════════════════════════

  const BASE_POLL = 300;

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setAngularInputValue(inputEl, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "\x76\x61\x6c\x75\x65"
    ).set;
    nativeInputValueSetter.call(inputEl, value);
    inputEl.dispatchEvent(new Event("\x69\x6e\x70\x75\x74", { bubbles: true }));
    inputEl.dispatchEvent(new Event("\x63\x68\x61\x6e\x67\x65", { bubbles: true }));
  }

  /**
   * Check if any loading spinner/overlay is currently visible.
   * Matches the PPN downloader's hasSpinner() approach — checks multiple
   * possible spinner selectors used by the E-Invoice portal.
   */
  function hasSpinner() {
    // Primary: the modal overlay from ui-progress-spinner
    const modal = document.querySelector("\x75\x69\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x6d\x6f\x64\x61\x6c");
    if (modal && modal.offsetParent !== null) return true;
    // Secondary: PrimeNG datatable loading overlay
    const dtLoading = document.querySelector("\x2e\x70\x2d\x64\x61\x74\x61\x74\x61\x62\x6c\x65\x2d\x6c\x6f\x61\x64\x69\x6e\x67\x2d\x6f\x76\x65\x72\x6c\x61\x79");
    if (dtLoading) return true;
    // Tertiary: generic PrimeNG progress spinners
    const spinner2 = document.querySelector("\x75\x69\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72");
    const spinner3 = document.querySelector("\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72");
    if (spinner2 || spinner3) return true;
    return false;
  }

  /**
   * Wait until spinner is gone. Only polls while spinner is visible.
   * Matches PPN downloader's waitTableStable() — fast, no unnecessary timeout.
   */
  async function waitSpinnerGone(timeoutMs = 30000) {
    if (!hasSpinner()) {
      // No spinner visible — give a tiny buffer for DOM to settle, then return
      await sleep(Math.min(BASE_POLL, 300));
      return true;
    }
    // Spinner is visible — poll until it's gone
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!hasSpinner()) {
        return true;
      }
      await sleep(BASE_POLL);
    }
    console.warn("\x5b\x53\x70\x69\x6e\x6e\x65\x72\x5d\x20\x54\x69\x6d\x65\x6f\x75\x74\x20\u2014\x20\x73\x70\x69\x6e\x6e\x65\x72\x20\x74\x69\x64\x61\x6b\x20\x68\x69\x6c\x61\x6e\x67");
    return false;
  }

  /**
   * After an action that triggers a server call (click Refresh, click Edit, etc.),
   * briefly wait for spinner to appear, then wait for it to disappear.
   * If spinner never appears within a short window, assume fast response and move on.
   * This prevents the old bug of waiting the full startTimeout when the portal responds instantly.
   */
  async function waitForAction(startWindowMs = 1500, finishTimeoutMs = 30000) {
    // Brief window to see if spinner appears
    const start = Date.now();
    while (Date.now() - start < startWindowMs) {
      if (hasSpinner()) {
        // Spinner appeared — now wait for it to disappear
        return await waitSpinnerGone(finishTimeoutMs);
      }
      await sleep(50);
    }
    // Spinner never appeared — fast response, move on
    return true;
  }

  /**
   * Wait for toast notification to appear then disappear.
   */
  function waitForToastAppearAndDisappear(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();
      let toastAppeared = false;

      const interval = setInterval(() => {
        const toastItems = document.querySelectorAll("\x70\x2d\x74\x6f\x61\x73\x74\x20\x70\x2d\x74\x6f\x61\x73\x74\x69\x74\x65\x6d");
        const visibleToast = Array.from(toastItems).some(
          item => item.offsetParent !== null
        );

        if (visibleToast) toastAppeared = true;

        if (toastAppeared && !visibleToast) {
          clearInterval(interval);
          resolve(true);
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(toastAppeared);
        }
      }, 100);
    });
  }

  function waitForButton(textOrLabel, timeoutMs = 10000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const allButtons = document.querySelectorAll("\x62\x75\x74\x74\x6f\x6e");
        for (const btn of allButtons) {
          const btnText = btn.textContent.trim();
          const ariaLabel = btn.getAttribute("\x61\x72\x69\x61\x2d\x6c\x61\x62\x65\x6c") || "";
          if (
            (btnText === textOrLabel || ariaLabel === textOrLabel) &&
            btn.offsetParent !== null &&
            !btn.disabled
          ) {
            clearInterval(interval);
            resolve(btn);
            return;
          }
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });
  }

  function getDataTableTbody() {
    const tbody = document.querySelector("\x70\x2d\x74\x61\x62\x6c\x65\x20\x2e\x70\x2d\x64\x61\x74\x61\x74\x61\x62\x6c\x65\x2d\x74\x62\x6f\x64\x79");
    if (tbody) return tbody;
    const tables = document.querySelectorAll("\x5b\x69\x64\x24\x3d\x27\x2d\x74\x61\x62\x6c\x65\x27\x5d\x20\x3e\x20\x2e\x70\x2d\x64\x61\x74\x61\x74\x61\x62\x6c\x65\x2d\x74\x62\x6f\x64\x79");
    return tables.length > 0 ? tables[0] : null;
  }

  function waitForFilteredRows(searchText, timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const tbody = getDataTableTbody();
        if (!tbody) {
          if (Date.now() - start > timeoutMs) { clearInterval(interval); resolve(null); }
          return;
        }
        const rows = tbody.querySelectorAll("\x74\x72");
        for (const row of rows) {
          if (row.textContent && row.textContent.includes(searchText)) {
            clearInterval(interval);
            resolve(rows);
            return;
          }
        }
        if (Date.now() - start > timeoutMs) { clearInterval(interval); resolve(null); }
      }, 200);
    });
  }

  function waitForGridPage(timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (document.getElementById("\x66\x69\x6c\x74\x65\x72\x54\x61\x78\x49\x6e\x76\x6f\x69\x63\x65\x4e\x75\x6d\x62\x65\x72")) {
          clearInterval(interval);
          resolve(true);
        }
        if (Date.now() - start > timeoutMs) { clearInterval(interval); resolve(false); }
      }, 100);
    });
  }

  function waitForEditPage(timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (document.getElementById("\x54\x61\x78\x49\x6e\x76\x6f\x69\x63\x65\x4e\x75\x6d\x62\x65\x72")) {
          clearInterval(interval);
          resolve(true);
        }
        if (Date.now() - start > timeoutMs) { clearInterval(interval); resolve(false); }
      }, 100);
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  GRID FILTER FUNCTIONS
  // ══════════════════════════════════════════════════════════════

  function getFilterNomorFaktur() {
    const container = document.getElementById("\x66\x69\x6c\x74\x65\x72\x54\x61\x78\x49\x6e\x76\x6f\x69\x63\x65\x4e\x75\x6d\x62\x65\x72");
    return container ? container.querySelector("\x69\x6e\x70\x75\x74") : null;
  }

  function getFilterTahun() {
    const container = document.getElementById("\x66\x69\x6c\x74\x65\x72\x54\x61\x78\x49\x6e\x76\x6f\x69\x63\x65\x59\x65\x61\x72");
    return container ? container.querySelector("\x69\x6e\x70\x75\x74") : null;
  }

  async function selectMasaPajakFilter(bulanName) {
    const multiSelects = document.querySelectorAll("\x70\x2d\x63\x6f\x6c\x75\x6d\x6e\x66\x69\x6c\x74\x65\x72\x20\x70\x2d\x6d\x75\x6c\x74\x69\x73\x65\x6c\x65\x63\x74");
    if (multiSelects.length === 0) {
      console.warn("\x5b\x46\x69\x6c\x74\x65\x72\x5d\x20\x70\x2d\x6d\x75\x6c\x74\x69\x73\x65\x6c\x65\x63\x74\x20\x75\x6e\x74\x75\x6b\x20\x4d\x61\x73\x61\x20\x50\x61\x6a\x61\x6b\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e");
      return false;
    }

    const multiSelect = multiSelects[0];
    const trigger = multiSelect.querySelector("\x2e\x70\x2d\x6d\x75\x6c\x74\x69\x73\x65\x6c\x65\x63\x74\x2d\x74\x72\x69\x67\x67\x65\x72") || multiSelect;
    trigger.click();

    let panel = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      panel = document.querySelector("\x2e\x70\x2d\x6d\x75\x6c\x74\x69\x73\x65\x6c\x65\x63\x74\x2d\x70\x61\x6e\x65\x6c");
      if (panel && panel.offsetParent !== null) break;
      await sleep(100);
    }
    if (!panel) {
      console.warn("\x5b\x46\x69\x6c\x74\x65\x72\x5d\x20\x50\x61\x6e\x65\x6c\x20\x6d\x75\x6c\x74\x69\x73\x65\x6c\x65\x63\x74\x20\x74\x69\x64\x61\x6b\x20\x6d\x75\x6e\x63\x75\x6c");
      return false;
    }

    // Uncheck all currently selected items
    const highlightedItems = panel.querySelectorAll("\x70\x2d\x6d\x75\x6c\x74\x69\x73\x65\x6c\x65\x63\x74\x69\x74\x65\x6d\x20\x6c\x69\x2e\x70\x2d\x68\x69\x67\x68\x6c\x69\x67\x68\x74");
    for (const item of highlightedItems) {
      item.click();
      await sleep(50);
    }

    // Select the target month
    const allItems = panel.querySelectorAll("\x70\x2d\x6d\x75\x6c\x74\x69\x73\x65\x6c\x65\x63\x74\x69\x74\x65\x6d\x20\x6c\x69");
    let found = false;
    for (const item of allItems) {
      const label = item.getAttribute("\x61\x72\x69\x61\x2d\x6c\x61\x62\x65\x6c") || item.textContent.trim();
      if (label === bulanName) {
        item.click();
        found = true;
        break;
      }
    }

    // Close the panel
    const closeBtn = panel.querySelector("\x2e\x70\x2d\x6d\x75\x6c\x74\x69\x73\x65\x6c\x65\x63\x74\x2d\x63\x6c\x6f\x73\x65");
    if (closeBtn) closeBtn.click();
    else trigger.click();
    await sleep(100);

    return found;
  }

  function clickRefreshButton() {
    const selectors = [
      "\x23\x52\x65\x66\x72\x65\x73\x68\x42\x75\x74\x74\x6f\x6e",
      "\x62\x75\x74\x74\x6f\x6e\x5b\x69\x64\x2a\x3d\x27\x52\x65\x66\x72\x65\x73\x68\x27\x5d",
      "\x62\x75\x74\x74\x6f\x6e\x5b\x69\x64\x2a\x3d\x27\x72\x65\x66\x72\x65\x73\x68\x27\x5d",
    ];
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) { btn.click(); return true; }
    }
    const allBtns = document.querySelectorAll("\x62\x75\x74\x74\x6f\x6e");
    for (const btn of allBtns) {
      const icon = btn.querySelector("\x2e\x70\x69\x2d\x72\x65\x66\x72\x65\x73\x68\x2c\x20\x2e\x70\x69\x2d\x73\x65\x61\x72\x63\x68");
      if (icon && btn.offsetParent !== null) { btn.click(); return true; }
    }
    return false;
  }

  function clearAllFilters() {
    const nfInput = getFilterNomorFaktur();
    if (nfInput) setAngularInputValue(nfInput, "");
    const yearInput = getFilterTahun();
    if (yearInput) setAngularInputValue(yearInput, "");
  }

  async function applyGridFilters(bulanNumber, tahun, nomorFaktur) {
    const bulanName = BULAN_NAMES[bulanNumber] || "";

    if (bulanName) {
      await selectMasaPajakFilter(bulanName);
    }

    const yearInput = getFilterTahun();
    if (yearInput && tahun) {
      yearInput.focus();
      setAngularInputValue(yearInput, tahun);
    }

    const nfInput = getFilterNomorFaktur();
    if (nfInput && nomorFaktur) {
      nfInput.focus();
      setAngularInputValue(nfInput, nomorFaktur);
    }

    // Click Refresh to apply all filters
    const refreshed = clickRefreshButton();
    if (!refreshed && nfInput) {
      nfInput.dispatchEvent(new KeyboardEvent("\x6b\x65\x79\x64\x6f\x77\x6e", { key: "\x45\x6e\x74\x65\x72", code: "\x45\x6e\x74\x65\x72", keyCode: 13, bubbles: true }));
    }

    // Wait for spinner to appear → disappear (fast, like PPN downloader)
    await waitForAction(1500, 30000);
  }

  // ══════════════════════════════════════════════════════════════
  //  EDIT PAGE FUNCTIONS
  // ══════════════════════════════════════════════════════════════

  async function selectPrimeNGDropdown(dropdownContainer, optionText, timeoutMs = 5000) {
    dropdownContainer.click();
    await sleep(200);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const items = document.querySelectorAll("\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e\x2d\x69\x74\x65\x6d\x73\x20\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e\x2d\x69\x74\x65\x6d");
      for (const item of items) {
        if (item.textContent.trim() === optionText) {
          item.click();
          return true;
        }
      }
      await sleep(100);
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════════
  //  CSV REKAP DOWNLOAD
  // ══════════════════════════════════════════════════════════════

  function downloadRekapCSV() {
    const header = "\x4e\x6f\x6d\x6f\x72\x20\x46\x61\x6b\x74\x75\x72\x2c\x4d\x61\x73\x61\x20\x50\x61\x6a\x61\x6b\x20\x46\x61\x6b\x74\x75\x72\x2c\x54\x61\x68\x75\x6e\x20\x50\x61\x6a\x61\x6b\x20\x46\x61\x6b\x74\x75\x72\x2c\x4d\x61\x73\x61\x20\x50\x61\x6a\x61\x6b\x20\x50\x65\x6e\x67\x6b\x72\x65\x64\x69\x74\x61\x6e\x2c\x54\x61\x68\x75\x6e\x20\x50\x61\x6a\x61\x6b\x20\x50\x65\x6e\x67\x6b\x72\x65\x64\x69\x74\x61\x6e\x2c\x53\x74\x61\x74\x75\x73\x2c\x4b\x65\x74\x65\x72\x61\x6e\x67\x61\x6e\x2c\x57\x61\x6b\x74\x75\x20\x50\x72\x6f\x73\x65\x73";
    const rows = rekapResults.map(r => {
      const masaFaktur = BULAN_NAMES[r.masaPajakFaktur] || r.masaPajakFaktur;
      const masaKredit = BULAN_NAMES[r.masaPajakPengkreditan] || r.masaPajakPengkreditan;
      const fields = [
        `'${r.nomorFaktur}`,
        masaFaktur,
        r.tahunPajakFaktur,
        masaKredit,
        r.tahunPajakPengkreditan,
        r.status,
        `"${(r.keterangan || "").replace(/"/g, '""')}"`,
        r.waktuProses
      ];
      return fields.join("\x2c");
    });

    const csvContent = "\u\x46\x45\x46\x46" + header + "\n" + rows.join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "\x74\x65\x78\x74\x2f\x63\x73\x76\x3b\x63\x68\x61\x72\x73\x65\x74\x3d\x75\x74\x66\x2d\x38\x3b" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("\x61");
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "\x30") +
      String(now.getDate()).padStart(2, "\x30") + "\x5f" +
      String(now.getHours()).padStart(2, "\x30") +
      String(now.getMinutes()).padStart(2, "\x30") +
      String(now.getSeconds()).padStart(2, "\x30");
    a.href = url;
    a.download = `rekap_pengkreditan_faktur_${timestamp}.csv`;
    a.style.display = "\x6e\x6f\x6e\x65";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ══════════════════════════════════════════════════════════════
  //  PROGRESS PANEL UI
  // ══════════════════════════════════════════════════════════════

  const progressPanel = document.createElement("\x64\x69\x76");
  progressPanel.id = "\x74\x75\x6b\x61\x6e\x67\x2d\x70\x65\x6e\x67\x6b\x72\x65\x64\x69\x74\x61\x6e\x2d\x70\x72\x6f\x67\x72\x65\x73\x73";
  progressPanel.style.cssText = `
    position:fixed;bottom:24px;right:24px;width:360px;
    background:#0f1117;border:1px solid rgba(255,255,255,.08);
    border-radius:14px;padding:18px 20px;z-index:999999;
    font-family:'DM Sans',system-ui,sans-serif;
    box-shadow:0 16px 48px rgba(0,0,0,.5);color:#e2e8f0;
  `;
  progressPanel.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🧾</div>
      <div>
        <div style="font-size:13px;font-weight:600;color:#f0f2f8;">Pengkreditan Faktur</div>
        <div id="tkpf-subtitle" style="font-size:11px;color:#4e5668;margin-top:2px;">Memulai proses...</div>
      </div>
    </div>
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#4e5668;margin-bottom:4px;">
        <span id="tkpf-status">0 / ${fakturList.length}</span>
        <span id="tkpf-percent">0%</span>
      </div>
      <div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;">
        <div id="tkpf-bar" style="height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#8b5cf6,#7c3aed);transition:width .5s cubic-bezier(.4,0,.2,1);"></div>
      </div>
    </div>
    <div id="tkpf-current" style="font-size:12px;color:#94a3b8;font-family:'DM Mono',monospace;word-break:break-all;margin-bottom:8px;">—</div>
  `;
  document.body.appendChild(progressPanel);

  const elSubtitle = document.getElementById("\x74\x6b\x70\x66\x2d\x73\x75\x62\x74\x69\x74\x6c\x65");
  const elStatus = document.getElementById("\x74\x6b\x70\x66\x2d\x73\x74\x61\x74\x75\x73");
  const elPercent = document.getElementById("\x74\x6b\x70\x66\x2d\x70\x65\x72\x63\x65\x6e\x74");
  const elBar = document.getElementById("\x74\x6b\x70\x66\x2d\x62\x61\x72");
  const elCurrent = document.getElementById("\x74\x6b\x70\x66\x2d\x63\x75\x72\x72\x65\x6e\x74");

  function updateProgress(index, total, text, status, color) {
    const pct = Math.round(((index + 1) / total) * 100);
    elStatus.textContent = `${index + 1} / ${total}`;
    elPercent.textContent = `${pct}%`;
    elBar.style.width = `${pct}%`;
    elCurrent.textContent = text;
    elCurrent.style.color = color || "\x23\x39\x34\x61\x33\x62\x38";
  }

  // ══════════════════════════════════════════════════════════════
  //  MAIN PROCESSING LOOP
  // ══════════════════════════════════════════════════════════════

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  console.log(`[Pengkreditan Faktur] Memulai proses ${fakturList.length} faktur...`);
  elSubtitle.textContent = `Memproses ${fakturList.length} faktur...`;

  for (let i = 0; i < fakturList.length; i++) {
    const item = fakturList[i];
    const noFaktur = item.nomorFaktur.trim();
    const masaPajakFaktur = item.masaPajakFaktur;
    const tahunPajakFaktur = item.tahunPajakFaktur;
    const masaPajakKredit = item.masaPajakPengkreditan;
    const tahunPajakKredit = item.tahunPajakPengkreditan;
    const bulanKreditName = BULAN_NAMES[masaPajakKredit] || "";
    const processStartTime = new Date().toLocaleString("\x\x36\x39\x\x36\x34\x\x32\x64\x\x34\x39\x\x34\x34");

    if (!noFaktur) {
      skipCount++;
      rekapResults.push({
        nomorFaktur: noFaktur || "\x28\x6b\x6f\x73\x6f\x6e\x67\x29",
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan: masaPajakKredit,
        tahunPajakPengkreditan: tahunPajakKredit,
        status: "\x53\x4b\x49\x50",
        keterangan: "\x4e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x6b\x6f\x73\x6f\x6e\x67",
        waktuProses: processStartTime
      });
      continue;
    }

    console.log(`[Pengkreditan Faktur] (${i + 1}/${fakturList.length}) ${noFaktur}`);
    elCurrent.textContent = noFaktur;
    elCurrent.style.color = "\x23\x63\x34\x62\x35\x66\x64";
    elSubtitle.textContent = `Memproses ${i + 1} dari ${fakturList.length}...`;

    try {
      // ── Step 1: Ensure grid page ──
      const onGrid = await waitForGridPage(5000);
      if (!onGrid) throw new Error("\x54\x69\x64\x61\x6b\x20\x62\x65\x72\x61\x64\x61\x20\x64\x69\x20\x68\x61\x6c\x61\x6d\x61\x6e\x20\x67\x72\x69\x64");
      await waitSpinnerGone();

      // ── Step 2: Apply filters & refresh ──
      await applyGridFilters(masaPajakFaktur, tahunPajakFaktur, noFaktur);

      // ── Step 3: Find matching row ──
      const rows = await waitForFilteredRows(noFaktur, 20000);
      if (!rows) throw new Error("\x44\x61\x74\x61\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x20\x73\x65\x74\x65\x6c\x61\x68\x20\x66\x69\x6c\x74\x65\x72");

      const tbody = getDataTableTbody();
      const allRows = tbody ? tbody.querySelectorAll("\x74\x72") : [];
      let targetRow = null;
      for (const row of allRows) {
        if (row.textContent && row.textContent.includes(noFaktur)) {
          targetRow = row;
          break;
        }
      }
      if (!targetRow) throw new Error("\x4e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x20\x64\x69\x20\x74\x61\x62\x65\x6c");

      // ── Step 4: Click Edit button ──
      const editBtn = targetRow.querySelector("\x23\x45\x64\x69\x74\x42\x75\x74\x74\x6f\x6e");
      if (!editBtn) throw new Error("\x54\x6f\x6d\x62\x6f\x6c\x20\x45\x64\x69\x74\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e");
      editBtn.click();

      // Wait for spinner (fast — like PPN downloader)
      await waitForAction(1500, 30000);
      const editLoaded = await waitForEditPage(20000);
      if (!editLoaded) throw new Error("\x48\x61\x6c\x61\x6d\x61\x6e\x20\x65\x64\x69\x74\x20\x67\x61\x67\x61\x6c\x20\x64\x69\x6d\x75\x61\x74");
      // Wait for any secondary spinner on the edit page
      await waitSpinnerGone(10000);

      // ── Step 5: Change "Masa Pajak Dikreditkan" dropdown ──
      const allFormItems = document.querySelectorAll("\x65\x69\x6e\x76\x2d\x64\x6f\x63\x2d\x66\x6f\x72\x6d\x2d\x69\x74\x65\x6d");
      let periodCreditDropdown = null;
      let yearCreditInput = null;

      for (const formItem of allFormItems) {
        const label = formItem.querySelector("\x6c\x61\x62\x65\x6c");
        if (!label) continue;
        const labelText = label.textContent.trim();
        if (labelText.includes("\x4d\x61\x73\x61\x20\x50\x61\x6a\x61\x6b\x20\x44\x69\x6b\x72\x65\x64\x69\x74\x6b\x61\x6e")) {
          periodCreditDropdown = formItem.querySelector("\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e");
        }
        if (labelText.includes("\x54\x61\x68\x75\x6e\x20\x50\x61\x6a\x61\x6b\x20\x44\x69\x6b\x72\x65\x64\x69\x74\x6b\x61\x6e")) {
          yearCreditInput = formItem.querySelector("\x69\x6e\x70\x75\x74\x5b\x74\x79\x70\x65\x3d\x27\x74\x65\x78\x74\x27\x5d");
        }
      }

      if (!periodCreditDropdown) throw new Error("\x44\x72\x6f\x70\x64\x6f\x77\x6e\x20\x4d\x61\x73\x61\x20\x50\x61\x6a\x61\x6b\x20\x44\x69\x6b\x72\x65\x64\x69\x74\x6b\x61\x6e\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e");
      if (periodCreditDropdown.classList.contains("\x\x37\x30\x\x32\x64\x\x36\x34\x\x36\x39\x\x37\x33\x\x36\x31\x\x36\x32\x\x36\x63\x\x36\x35\x\x36\x34")) throw new Error("\x44\x72\x6f\x70\x64\x6f\x77\x6e\x20\x4d\x61\x73\x61\x20\x50\x61\x6a\x61\x6b\x20\x44\x69\x6b\x72\x65\x64\x69\x74\x6b\x61\x6e\x20\x64\x69\x73\x61\x62\x6c\x65\x64");

      const monthOk = await selectPrimeNGDropdown(periodCreditDropdown, bulanKreditName);
      if (!monthOk) throw new Error(`Gagal memilih bulan '${bulanKreditName}'`);

      // ── Step 6: Change "Tahun Pajak Dikreditkan" ──
      if (!yearCreditInput) throw new Error("\x49\x6e\x70\x75\x74\x20\x54\x61\x68\x75\x6e\x20\x50\x61\x6a\x61\x6b\x20\x44\x69\x6b\x72\x65\x64\x69\x74\x6b\x61\x6e\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e");
      if (yearCreditInput.disabled) throw new Error("\x49\x6e\x70\x75\x74\x20\x54\x61\x68\x75\x6e\x20\x50\x61\x6a\x61\x6b\x20\x44\x69\x6b\x72\x65\x64\x69\x74\x6b\x61\x6e\x20\x64\x69\x73\x61\x62\x6c\x65\x64");
      yearCreditInput.focus();
      setAngularInputValue(yearCreditInput, tahunPajakKredit);

      // ── Step 7: Click "Kredit" button ──
      let kreditBtn = await waitForButton("\x43\x72\x65\x64\x69\x74", 8000);
      if (!kreditBtn) kreditBtn = await waitForButton("\x4b\x72\x65\x64\x69\x74", 3000);
      if (!kreditBtn) throw new Error("\x54\x6f\x6d\x62\x6f\x6c\x20\x4b\x72\x65\x64\x69\x74\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e");

      kreditBtn.click();

      // ── Step 8: Wait for spinner + toast notification ──
      await waitForAction(1500, 30000);

      // Check for confirmation dialog and accept it
      const confirmBtn = document.querySelector("\x2e\x70\x2d\x63\x6f\x6e\x66\x69\x72\x6d\x2d\x64\x69\x61\x6c\x6f\x67\x2d\x61\x63\x63\x65\x70\x74");
      if (confirmBtn && confirmBtn.offsetParent !== null) {
        confirmBtn.click();
        await waitForAction(1500, 30000);
      }

      // Wait for toast to appear and disappear
      await waitForToastAppearAndDisappear(15000);

      // ── Step 9: Navigate back to grid ──
      const stillOnEdit = document.getElementById("\x54\x61\x78\x49\x6e\x76\x6f\x69\x63\x65\x4e\x75\x6d\x62\x65\x72");
      if (stillOnEdit) {
        window.history.back();
      }

      const backToGrid = await waitForGridPage(15000);
      if (!backToGrid) {
        window.history.back();
        await waitForGridPage(10000);
      }
      await waitSpinnerGone(10000);

      console.log(`[Pengkreditan Faktur] ✓ Berhasil: ${noFaktur}`);
      updateProgress(i, fakturList.length, noFaktur, "\u2713", "\x23\x32\x32\x63\x35\x35\x65");
      successCount++;

      rekapResults.push({
        nomorFaktur: noFaktur,
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan: masaPajakKredit,
        tahunPajakPengkreditan: tahunPajakKredit,
        status: "\x42\x45\x52\x48\x41\x53\x49\x4c",
        keterangan: "\x53\x75\x6b\x73\x65\x73\x20\x64\x69\x6b\x72\x65\x64\x69\x74\x6b\x61\x6e",
        waktuProses: processStartTime
      });

    } catch (err) {
      console.error(`[Pengkreditan Faktur] ✗ Gagal: ${noFaktur}`, err.message);
      updateProgress(i, fakturList.length, noFaktur, `✗ ${err.message}`, "\x23\x66\x38\x37\x31\x37\x31");
      failCount++;

      rekapResults.push({
        nomorFaktur: noFaktur,
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan: masaPajakKredit,
        tahunPajakPengkreditan: tahunPajakKredit,
        status: "\x47\x41\x47\x41\x4c",
        keterangan: err.message,
        waktuProses: processStartTime
      });

      const onGrid = document.getElementById("\x66\x69\x6c\x74\x65\x72\x54\x61\x78\x49\x6e\x76\x6f\x69\x63\x65\x4e\x75\x6d\x62\x65\x72");
      if (!onGrid) {
        window.history.back();
        await waitForGridPage(15000);
        await waitSpinnerGone(10000);
      }
    }

    try { clearAllFilters(); } catch (e) { /* ignore */ }
  }

  // ══════════════════════════════════════════════════════════════
  //  DONE — Show summary + download rekap button
  // ══════════════════════════════════════════════════════════════

  const totalMsg = `Selesai: ${successCount} berhasil, ${failCount} gagal, ${skipCount} dilewati`;
  console.log(`[Pengkreditan Faktur] ${totalMsg}`);
  elSubtitle.textContent = "\x53\x65\x6c\x65\x73\x61\x69\x21";
  elCurrent.textContent = totalMsg;
  elCurrent.style.color = "\x23\x32\x32\x63\x35\x35\x65";
  elBar.style.background = "\x6c\x69\x6e\x65\x61\x72\x2d\x67\x72\x61\x64\x69\x65\x6e\x74\x28\x39\x30\x64\x65\x67\x2c\x23\x32\x32\x63\x35\x35\x65\x2c\x23\x31\x36\x61\x33\x34\x61\x29";
  elBar.style.width = "\x31\x30\x30\x25";

  // Rekap summary
  const rekapSummary = document.createElement("\x64\x69\x76");
  rekapSummary.style.cssText = `
    margin-top:12px;padding:12px 14px;
    background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);
    border-radius:10px;font-size:11px;color:#94a3b8;line-height:1.7;
  `;
  rekapSummary.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span>✅ Berhasil</span>
      <span style="color:#22c55e;font-weight:600;font-family:'DM Mono',monospace;">${successCount}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span>❌ Gagal</span>
      <span style="color:#f87171;font-weight:600;font-family:'DM Mono',monospace;">${failCount}</span>
    </div>
    <div style="display:flex;justify-content:space-between;">
      <span>⏭️ Dilewati</span>
      <span style="color:#f59e0b;font-weight:600;font-family:'DM Mono',monospace;">${skipCount}</span>
    </div>
  `;
  progressPanel.appendChild(rekapSummary);

  // Download Rekap CSV button
  const downloadBtn = document.createElement("\x62\x75\x74\x74\x6f\x6e");
  downloadBtn.textContent = "\u{1f4e5}\x20\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x20\x52\x65\x6b\x61\x70\x20\x43\x53\x56";
  downloadBtn.style.cssText = `
    width:100%;padding:10px;margin-top:10px;
    border:none;
    background:linear-gradient(135deg,#8b5cf6,#7c3aed);
    border-radius:8px;color:#fff;font-size:12px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;
    box-shadow:0 3px 10px rgba(139,92,246,.3);
    transition:opacity .15s,transform .12s;
  `;
  downloadBtn.onmouseover = () => { downloadBtn.style.opacity = "\x30\x2e\x39"; downloadBtn.style.transform = "\x74\x72\x61\x6e\x73\x6c\x61\x74\x65\x59\x28\x2d\x31\x70\x78\x29"; };
  downloadBtn.onmouseout = () => { downloadBtn.style.opacity = "\x31"; downloadBtn.style.transform = "\x6e\x6f\x6e\x65"; };
  downloadBtn.onclick = () => {
    downloadRekapCSV();
    downloadBtn.textContent = "\u2705\x20\x52\x65\x6b\x61\x70\x20\x54\x65\x72\x64\x6f\x77\x6e\x6c\x6f\x61\x64\x21";
    downloadBtn.style.background = "\x6c\x69\x6e\x65\x61\x72\x2d\x67\x72\x61\x64\x69\x65\x6e\x74\x28\x31\x33\x35\x64\x65\x67\x2c\x23\x32\x32\x63\x35\x35\x65\x2c\x23\x31\x36\x61\x33\x34\x61\x29";
    setTimeout(() => {
      downloadBtn.textContent = "\u{1f4e5}\x20\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x20\x52\x65\x6b\x61\x70\x20\x43\x53\x56";
      downloadBtn.style.background = "\x6c\x69\x6e\x65\x61\x72\x2d\x67\x72\x61\x64\x69\x65\x6e\x74\x28\x31\x33\x35\x64\x65\x67\x2c\x23\x38\x62\x35\x63\x66\x36\x2c\x23\x37\x63\x33\x61\x65\x64\x29";
    }, 2000);
  };
  progressPanel.appendChild(downloadBtn);

  // Close button
  const closeBtn = document.createElement("\x62\x75\x74\x74\x6f\x6e");
  closeBtn.textContent = "\x54\x75\x74\x75\x70";
  closeBtn.style.cssText = `
    width:100%;padding:9px;margin-top:8px;
    border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);
    border-radius:8px;color:#a0aec0;font-size:12px;font-weight:500;
    cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;
  `;
  closeBtn.onmouseover = () => { closeBtn.style.background = "\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x31\x29"; };
  closeBtn.onmouseout = () => { closeBtn.style.background = "\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x30\x34\x29"; };
  closeBtn.onclick = () => progressPanel.remove();
  progressPanel.appendChild(closeBtn);

})();