// ══════════════════════════════════════════════════════════════
//  PEMBATALAN FAKTUR — Content Script
//  Reads window.__pembatalanFakturList (array of { nomorFaktur })
//  and window.__pembatalanPassphrase (string)
//  Processes each invoice: search → cancel → confirm → sign → close
// ══════════════════════════════════════════════════════════════
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
          <div style="font-size:11px;color:#4e5668;margin-top:2px;">Pembatalan Faktur</div>
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

  const values = window.__pembatalanFakturList;
  const kataSandi = window.__pembatalanPassphrase;

  // Cleanup global variables immediately
  delete window.__pembatalanFakturList;
  delete window.__pembatalanPassphrase;

  if (!values || values.length === 0) {
    console.error("\x5b\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x54\x69\x64\x61\x6b\x20\x61\x64\x61\x20\x64\x61\x74\x61\x20\x66\x61\x6b\x74\x75\x72\x20\x75\x6e\x74\x75\x6b\x20\x64\x69\x70\x72\x6f\x73\x65\x73\x2e");
    return;
  }

  if (!kataSandi) {
    console.error("\x5b\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x50\x61\x73\x73\x70\x68\x72\x61\x73\x65\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x2e");
    return;
  }

  // Get delay setting from storage
  let delay = 1500;
  try {
    const res = await chrome.storage.local.get("\x\x36\x34\x\x36\x35\x\x36\x63\x\x36\x31\x\x37\x39\x\x35\x66\x\x37\x30\x\x36\x35\x\x36\x64\x\x36\x32\x\x36\x31\x\x37\x34\x\x36\x31\x\x36\x63\x\x36\x31\x\x36\x65");
    if (res.delay_pembatalan) delay = parseInt(res.delay_pembatalan) || 1500;
  } catch {
    // use default delay
  }

  // ══════════════════════════════════════════════════════════════
  //  UTILITY FUNCTIONS
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
   */
  function hasSpinner() {
    const modal = document.querySelector("\x75\x69\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x6d\x6f\x64\x61\x6c");
    if (modal && modal.offsetParent !== null) return true;
    const dtLoading = document.querySelector("\x2e\x70\x2d\x64\x61\x74\x61\x74\x61\x62\x6c\x65\x2d\x6c\x6f\x61\x64\x69\x6e\x67\x2d\x6f\x76\x65\x72\x6c\x61\x79");
    if (dtLoading) return true;
    const spinner2 = document.querySelector("\x75\x69\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72");
    const spinner3 = document.querySelector("\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72");
    if (spinner2 || spinner3) return true;
    return false;
  }

  /**
   * Wait until spinner is gone.
   */
  async function waitSpinnerGone(timeoutMs = 30000) {
    if (!hasSpinner()) {
      await sleep(Math.min(BASE_POLL, 300));
      return true;
    }
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!hasSpinner()) return true;
      await sleep(BASE_POLL);
    }
    console.warn("\x5b\x53\x70\x69\x6e\x6e\x65\x72\x5d\x20\x54\x69\x6d\x65\x6f\x75\x74\x20\u2014\x20\x73\x70\x69\x6e\x6e\x65\x72\x20\x74\x69\x64\x61\x6b\x20\x68\x69\x6c\x61\x6e\x67");
    return false;
  }

  /**
   * After an action that triggers a server call, wait for spinner to appear then disappear.
   */
  async function waitForAction(startWindowMs = 1500, finishTimeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < startWindowMs) {
      if (hasSpinner()) {
        return await waitSpinnerGone(finishTimeoutMs);
      }
      await sleep(50);
    }
    return true;
  }

  /**
   * Wait for a specific DOM element to appear and be visible.
   */
  function waitForElement(selector, timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) {
          clearInterval(interval);
          resolve(el);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(null);
        }
      }, 200);
    });
  }

  /**
   * Wait for confirmation dialog to appear (the one with "Ya" and "No/Batal" buttons).
   */
  function waitForConfirmDialog(timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const dialog = document.querySelector("\x2e\x70\x2d\x63\x6f\x6e\x66\x69\x72\x6d\x2d\x64\x69\x61\x6c\x6f\x67");
        if (dialog && dialog.offsetParent !== null) {
          const acceptBtn = dialog.querySelector("\x2e\x70\x2d\x63\x6f\x6e\x66\x69\x72\x6d\x2d\x64\x69\x61\x6c\x6f\x67\x2d\x61\x63\x63\x65\x70\x74");
          if (acceptBtn && acceptBtn.offsetParent !== null) {
            clearInterval(interval);
            resolve(acceptBtn);
            return;
          }
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(null);
        }
      }, 200);
    });
  }

  /**
   * Wait for the "Tanda Tangan Dokumen" signing modal to appear.
   * This modal contains SignerPassword-input and button-close.
   */
  function waitForSigningModal(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const passwordInput = document.getElementById("\x53\x69\x67\x6e\x65\x72\x50\x61\x73\x73\x77\x6f\x72\x64\x2d\x69\x6e\x70\x75\x74");
        const closeBtn = document.getElementById("\x62\x75\x74\x74\x6f\x6e\x2d\x63\x6c\x6f\x73\x65");
        if (passwordInput && closeBtn) {
          clearInterval(interval);
          resolve({ passwordInput, closeBtn });
          return;
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(null);
        }
      }, 300);
    });
  }

  /**
   * Wait for the Signer Provider dropdown to be populated and select the first option.
   */
  async function selectSignerProvider(timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const dropdown = document.querySelector("\x23\x73\x65\x6c\x65\x63\x74\x2d\x53\x69\x67\x6e\x65\x72\x50\x72\x6f\x76\x69\x64\x65\x72\x20\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e");
      if (dropdown && !dropdown.classList.contains("\x\x37\x30\x\x32\x64\x\x36\x34\x\x36\x39\x\x37\x33\x\x36\x31\x\x36\x32\x\x36\x63\x\x36\x35\x\x36\x34")) {
        // Check if already has a value selected (not placeholder)
        const label = dropdown.querySelector("\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e\x2d\x6c\x61\x62\x65\x6c");
        if (label && !label.classList.contains("\x70\x2d\x70\x6c\x61\x63\x65\x68\x6f\x6c\x64\x65\x72")) {
          return true; // Already selected
        }

        // Click to open dropdown
        dropdown.click();
        await sleep(500);

        // Find dropdown items
        const items = document.querySelectorAll("\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e\x2d\x69\x74\x65\x6d\x73\x20\x2e\x70\x2d\x64\x72\x6f\x70\x64\x6f\x77\x6e\x2d\x69\x74\x65\x6d");
        if (items.length > 0) {
          items[0].click(); // Select first option
          await sleep(300);
          return true;
        }
      }
      await sleep(300);
    }
    return false;
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

  /**
   * Wait for the signing modal to close (disappear from DOM).
   */
  function waitForSigningModalClose(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const passwordInput = document.getElementById("\x53\x69\x67\x6e\x65\x72\x50\x61\x73\x73\x77\x6f\x72\x64\x2d\x69\x6e\x70\x75\x74");
        if (!passwordInput) {
          clearInterval(interval);
          resolve(true);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      }, 300);
    });
  }

  function getDataTableTbody() {
    const tbody = document.querySelector("\x70\x2d\x74\x61\x62\x6c\x65\x20\x2e\x70\x2d\x64\x61\x74\x61\x74\x61\x62\x6c\x65\x2d\x74\x62\x6f\x64\x79");
    if (tbody) return tbody;
    const tables = document.querySelectorAll("\x5b\x69\x64\x24\x3d\x27\x2d\x74\x61\x62\x6c\x65\x27\x5d\x20\x3e\x20\x2e\x70\x2d\x64\x61\x74\x61\x74\x61\x62\x6c\x65\x2d\x74\x62\x6f\x64\x79");
    return tables.length > 0 ? tables[0] : null;
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

  // ══════════════════════════════════════════════════════════════
  //  REKAP CSV
  // ══════════════════════════════════════════════════════════════

  const rekapResults = [];

  function downloadRekapCSV() {
    const header = "\x4e\x6f\x6d\x6f\x72\x20\x46\x61\x6b\x74\x75\x72\x2c\x53\x74\x61\x74\x75\x73\x2c\x4b\x65\x74\x65\x72\x61\x6e\x67\x61\x6e\x2c\x57\x61\x6b\x74\x75\x20\x50\x72\x6f\x73\x65\x73";
    const rows = rekapResults.map(r => {
      const fields = [
        `'${r.nomorFaktur}`,
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
    a.download = `rekap_pembatalan_faktur_${timestamp}.csv`;
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
  progressPanel.id = "\x74\x75\x6b\x61\x6e\x67\x2d\x70\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x2d\x70\x72\x6f\x67\x72\x65\x73\x73";
  progressPanel.style.cssText = `
    position:fixed;bottom:24px;right:24px;width:360px;
    background:#0f1117;border:1px solid rgba(255,255,255,.08);
    border-radius:14px;padding:18px 20px;z-index:999999;
    font-family:'DM Sans',system-ui,sans-serif;
    box-shadow:0 16px 48px rgba(0,0,0,.5);color:#e2e8f0;
  `;
  progressPanel.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🚫</div>
      <div>
        <div style="font-size:13px;font-weight:600;color:#f0f2f8;">Pembatalan Faktur</div>
        <div id="tkbf-subtitle" style="font-size:11px;color:#4e5668;margin-top:2px;">Memulai proses...</div>
      </div>
    </div>
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#4e5668;margin-bottom:4px;">
        <span id="tkbf-status">0 / ${values.length}</span>
        <span id="tkbf-percent">0%</span>
      </div>
      <div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;">
        <div id="tkbf-bar" style="height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#ef4444,#dc2626);transition:width .5s cubic-bezier(.4,0,.2,1);"></div>
      </div>
    </div>
    <div id="tkbf-current" style="font-size:12px;color:#94a3b8;font-family:'DM Mono',monospace;word-break:break-all;margin-bottom:8px;">—</div>
  `;
  document.body.appendChild(progressPanel);

  const elSubtitle = document.getElementById("\x74\x6b\x62\x66\x2d\x73\x75\x62\x74\x69\x74\x6c\x65");
  const elStatus = document.getElementById("\x74\x6b\x62\x66\x2d\x73\x74\x61\x74\x75\x73");
  const elPercent = document.getElementById("\x74\x6b\x62\x66\x2d\x70\x65\x72\x63\x65\x6e\x74");
  const elBar = document.getElementById("\x74\x6b\x62\x66\x2d\x62\x61\x72");
  const elCurrent = document.getElementById("\x74\x6b\x62\x66\x2d\x63\x75\x72\x72\x65\x6e\x74");

  function updateProgress(index, total, text, color) {
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

  const invoiceInput = document.querySelector('\x23\x66\x69\x6c\x74\x65\x72\x54\x61\x78\x49\x6e\x76\x6f\x69\x63\x65\x4e\x75\x6d\x62\x65\x72\x20\x69\x6e\x70\x75\x74');

  if (!invoiceInput) {
    console.error("\x5b\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x49\x6e\x70\x75\x74\x20\x6e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x20\x70\x61\x64\x61\x20\x68\x61\x6c\x61\x6d\x61\x6e\x2e");
    elCurrent.textContent = "\u274c\x20\x49\x6e\x70\x75\x74\x20\x6e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x20\x70\x61\x64\x61\x20\x68\x61\x6c\x61\x6d\x61\x6e\x2e";
    elCurrent.style.color = "\x23\x66\x38\x37\x31\x37\x31";
    return;
  }

  let successCount = 0;
  let failCount = 0;

  console.log(`[Pembatalan Faktur] Memulai proses pembatalan ${values.length} faktur...`);
  console.log(`[Pembatalan Faktur] Delay: ${delay}ms`);
  elSubtitle.textContent = `Memproses ${values.length} faktur...`;

  for (let i = 0; i < values.length; i++) {
    // ── Escape leading apostrophe from CSV ──
    let nomorFaktur = values[i].nomorFaktur;
    nomorFaktur = nomorFaktur.replace(/^'\x2b\x2f\x2c\x20\x22\x22\x29\x2e\x74\x72\x69\x6d\x28\x29\x3b

\x20\x20\x20\x20\x63\x6f\x6e\x73\x74\x20\x70\x72\x6f\x63\x65\x73\x73\x53\x74\x61\x72\x74\x54\x69\x6d\x65\x20\x3d\x20\x6e\x65\x77\x20\x44\x61\x74\x65\x28\x29\x2e\x74\x6f\x4c\x6f\x63\x61\x6c\x65\x53\x74\x72\x69\x6e\x67\x28\x22\x\x36\x39\x\x36\x34\x\x32\x64\x\x34\x39\x\x34\x34\x22\x29\x3b

\x20\x20\x20\x20\x69\x66\x20\x28\x21\x6e\x6f\x6d\x6f\x72\x46\x61\x6b\x74\x75\x72\x29\x20\x7b
\x20\x20\x20\x20\x20\x20\x63\x6f\x6e\x73\x6f\x6c\x65\x2e\x77\x61\x72\x6e\x28\x60\x5b\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x28\x24\x7b\x69\x20\x2b\x20\x31\x7d\x2f\x24\x7b\x76\x61\x6c\x75\x65\x73\x2e\x6c\x65\x6e\x67\x74\x68\x7d\x29\x20\x4e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x6b\x6f\x73\x6f\x6e\x67\x2c\x20\x73\x6b\x69\x70\x2e\x60\x29\x3b
\x20\x20\x20\x20\x20\x20\x72\x65\x6b\x61\x70\x52\x65\x73\x75\x6c\x74\x73\x2e\x70\x75\x73\x68\x28\x7b
\x20\x20\x20\x20\x20\x20\x20\x20\x6e\x6f\x6d\x6f\x72\x46\x61\x6b\x74\x75\x72\x3a\x20\x22\x28\x6b\x6f\x73\x6f\x6e\x67\x29\x22\x2c
\x20\x20\x20\x20\x20\x20\x20\x20\x73\x74\x61\x74\x75\x73\x3a\x20\x22\x53\x4b\x49\x50\x22\x2c
\x20\x20\x20\x20\x20\x20\x20\x20\x6b\x65\x74\x65\x72\x61\x6e\x67\x61\x6e\x3a\x20\x22\x4e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x6b\x6f\x73\x6f\x6e\x67\x22\x2c
\x20\x20\x20\x20\x20\x20\x20\x20\x77\x61\x6b\x74\x75\x50\x72\x6f\x73\x65\x73\x3a\x20\x70\x72\x6f\x63\x65\x73\x73\x53\x74\x61\x72\x74\x54\x69\x6d\x65
\x20\x20\x20\x20\x20\x20\x7d\x29\x3b
\x20\x20\x20\x20\x20\x20\x63\x6f\x6e\x74\x69\x6e\x75\x65\x3b
\x20\x20\x20\x20\x7d

\x20\x20\x20\x20\x63\x6f\x6e\x73\x6f\x6c\x65\x2e\x6c\x6f\x67\x28\x60\x5b\x50\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x46\x61\x6b\x74\x75\x72\x5d\x20\x28\x24\x7b\x69\x20\x2b\x20\x31\x7d\x2f\x24\x7b\x76\x61\x6c\x75\x65\x73\x2e\x6c\x65\x6e\x67\x74\x68\x7d\x29\x20\x4d\x65\x6d\x70\x72\x6f\x73\x65\x73\x3a\x20\x24\x7b\x6e\x6f\x6d\x6f\x72\x46\x61\x6b\x74\x75\x72\x7d\x60\x29\x3b
\x20\x20\x20\x20\x75\x70\x64\x61\x74\x65\x50\x72\x6f\x67\x72\x65\x73\x73\x28\x69\x2c\x20\x76\x61\x6c\x75\x65\x73\x2e\x6c\x65\x6e\x67\x74\x68\x2c\x20\x6e\x6f\x6d\x6f\x72\x46\x61\x6b\x74\x75\x72\x2c\x20\x22\x23\x66\x63\x61\x35\x61\x35\x22\x29\x3b
\x20\x20\x20\x20\x65\x6c\x53\x75\x62\x74\x69\x74\x6c\x65\x2e\x74\x65\x78\x74\x43\x6f\x6e\x74\x65\x6e\x74\x20\x3d\x20\x60\x4d\x65\x6d\x70\x72\x6f\x73\x65\x73\x20\x24\x7b\x69\x20\x2b\x20\x31\x7d\x20\x64\x61\x72\x69\x20\x24\x7b\x76\x61\x6c\x75\x65\x73\x2e\x6c\x65\x6e\x67\x74\x68\x7d\x2e\x2e\x2e\x60\x3b

\x20\x20\x20\x20\x74\x72\x79\x20\x7b
\x20\x20\x20\x20\x20\x20\x2f\x2f\x20\u2500\u2500\x20\x53\x74\x65\x70\x20\x31\x3a\x20\x45\x6e\x73\x75\x72\x65\x20\x77\x65're on grid page ──
      const onGrid = await waitForGridPage(5000);
      if (!onGrid) throw new Error("\x54\x69\x64\x61\x6b\x20\x62\x65\x72\x61\x64\x61\x20\x64\x69\x20\x68\x61\x6c\x61\x6d\x61\x6e\x20\x67\x72\x69\x64");
      await waitSpinnerGone();

      // ── Step 2: Fill invoice input ──
      invoiceInput.focus();
      setAngularInputValue(invoiceInput, nomorFaktur);
      invoiceInput.blur();
      console.log(`  ✓ Input filled: ${nomorFaktur}`);

      // ── Step 3: Click Refresh ──
      const refreshBtn = document.querySelector('\x62\x75\x74\x74\x6f\x6e\x5b\x70\x74\x6f\x6f\x6c\x74\x69\x70\x3d\x22\x52\x65\x66\x72\x65\x73\x68\x22\x5d');
      if (refreshBtn) {
        refreshBtn.click();
        console.log(`  ✓ Refresh clicked`);
      } else {
        throw new Error("\x54\x6f\x6d\x62\x6f\x6c\x20\x52\x65\x66\x72\x65\x73\x68\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e");
      }

      // ── Step 4: Wait for spinner to disappear after refresh ──
      await waitForAction(2000, 30000);
      console.log(`  ✓ Spinner gone after refresh`);

      // Small additional wait for DOM to settle
      await sleep(delay);

      // ── Step 5: Find and click Cancel button ──
      const cancelBtn = document.getElementById('\x43\x61\x6e\x63\x65\x6c\x42\x75\x74\x74\x6f\x6e');
      if (!cancelBtn || cancelBtn.offsetParent === null) {
        throw new Error("\x54\x6f\x6d\x62\x6f\x6c\x20\x43\x61\x6e\x63\x65\x6c\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e\x20\x61\x74\x61\x75\x20\x74\x69\x64\x61\x6b\x20\x74\x65\x72\x6c\x69\x68\x61\x74");
      }
      cancelBtn.click();
      console.log(`  ✓ Cancel clicked`);

      // ── Step 6: Wait for confirmation dialog to appear ──
      const confirmAcceptBtn = await waitForConfirmDialog(15000);
      if (!confirmAcceptBtn) {
        throw new Error("\x44\x69\x61\x6c\x6f\x67\x20\x6b\x6f\x6e\x66\x69\x72\x6d\x61\x73\x69\x20\x70\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e\x20\x74\x69\x64\x61\x6b\x20\x6d\x75\x6e\x63\x75\x6c");
      }
      console.log(`  ✓ Confirmation dialog appeared`);

      // ── Step 7: Click "Ya" on confirmation dialog ──
      confirmAcceptBtn.click();
      console.log(`  ✓ Clicked "Ya" on confirmation`);

      // ── Step 8: Wait for spinner after confirmation ──
      await waitForAction(2000, 30000);

      // ── Step 9: Wait for signing modal to appear ──
      const signingModal = await waitForSigningModal(30000);
      if (!signingModal) {
        throw new Error("\x4d\x6f\x64\x61\x6c\x20\x54\x61\x6e\x64\x61\x20\x54\x61\x6e\x67\x61\x6e\x20\x44\x6f\x6b\x75\x6d\x65\x6e\x20\x74\x69\x64\x61\x6b\x20\x6d\x75\x6e\x63\x75\x6c");
      }
      console.log(`  ✓ Signing modal appeared`);

      const { passwordInput, closeBtn } = signingModal;

      // ── Step 10: Select Signer Provider (if needed) ──
      const providerSelected = await selectSignerProvider(10000);
      if (!providerSelected) {
        console.warn(`  ⚠ Signer Provider mungkin tidak terpilih, melanjutkan...`);
      } else {
        console.log(`  ✓ Signer Provider selected`);
      }

      // Wait a bit for form to update after provider selection
      await sleep(500);

      // ── Step 11: Fill passphrase ──
      passwordInput.focus();
      setAngularInputValue(passwordInput, kataSandi);
      passwordInput.blur();
      console.log(`  ✓ Passphrase filled`);

      // ── Step 12: Click "Simpan" button ──
      // The Simpan button is the sibling before button-close
      const simpanBtn = closeBtn.previousElementSibling;
      if (simpanBtn) {
        // Enable the button if disabled
        simpanBtn.removeAttribute('\x64\x69\x73\x61\x62\x6c\x65\x64');
        await sleep(300);
        simpanBtn.click();
        console.log(`  ✓ Simpan clicked`);
      } else {
        throw new Error("\x54\x6f\x6d\x62\x6f\x6c\x20\x53\x69\x6d\x70\x61\x6e\x20\x74\x69\x64\x61\x6b\x20\x64\x69\x74\x65\x6d\x75\x6b\x61\x6e");
      }

      // ── Step 13: Wait for spinner after Simpan ──
      await waitForAction(2000, 30000);

      // ── Step 14: Wait for toast or for the modal to update, then click "Konfirmasi Tanda Tangan" (button-close) ──
      await sleep(delay);

      // Click the "Konfirmasi Tanda Tangan" / Close button
      const confirmSignBtn = document.getElementById("\x62\x75\x74\x74\x6f\x6e\x2d\x63\x6c\x6f\x73\x65");
      if (confirmSignBtn && confirmSignBtn.offsetParent !== null) {
        confirmSignBtn.click();
        console.log(`  ✓ Konfirmasi Tanda Tangan clicked`);
      }

      // ── Step 15: Wait for the signing modal to close ──
      await waitForAction(2000, 30000);
      await waitForSigningModalClose(15000);

      // ── Step 16: Wait for toast notification ──
      await waitForToastAppearAndDisappear(15000);

      // ── Step 17: Ensure back on grid ──
      const backToGrid = await waitForGridPage(10000);
      if (!backToGrid) {
        console.warn(`  ⚠ Mungkin tidak kembali ke grid, melanjutkan...`);
      }
      await waitSpinnerGone(10000);

      successCount++;
      console.log(`  ✅ Faktur ${nomorFaktur} berhasil dibatalkan`);
      updateProgress(i, values.length, `✓ ${nomorFaktur}`, "\x23\x32\x32\x63\x35\x35\x65");

      rekapResults.push({
        nomorFaktur,
        status: "\x42\x45\x52\x48\x41\x53\x49\x4c",
        keterangan: "\x53\x75\x6b\x73\x65\x73\x20\x64\x69\x62\x61\x74\x61\x6c\x6b\x61\x6e",
        waktuProses: processStartTime
      });

    } catch (err) {
      console.error(`  ❌ Error pada faktur ${nomorFaktur}:`, err.message);
      updateProgress(i, values.length, `✗ ${nomorFaktur}: ${err.message}`, "\x23\x66\x38\x37\x31\x37\x31");
      failCount++;

      rekapResults.push({
        nomorFaktur,
        status: "\x47\x41\x47\x41\x4c",
        keterangan: err.message,
        waktuProses: processStartTime
      });

      // Try to close any open modal/dialog
      try {
        const rejectBtn = document.querySelector("\x2e\x70\x2d\x63\x6f\x6e\x66\x69\x72\x6d\x2d\x64\x69\x61\x6c\x6f\x67\x2d\x72\x65\x6a\x65\x63\x74");
        if (rejectBtn && rejectBtn.offsetParent !== null) rejectBtn.click();
      } catch {}
      try {
        const dialogClose = document.querySelector("\x2e\x70\x2d\x64\x69\x61\x6c\x6f\x67\x2d\x68\x65\x61\x64\x65\x72\x2d\x63\x6c\x6f\x73\x65");
        if (dialogClose && dialogClose.offsetParent !== null) dialogClose.click();
      } catch {}

      // Ensure we're back on grid
      const onGrid = document.getElementById("\x66\x69\x6c\x74\x65\x72\x54\x61\x78\x49\x6e\x76\x6f\x69\x63\x65\x4e\x75\x6d\x62\x65\x72");
      if (!onGrid) {
        await sleep(1000);
        // Try to wait for grid
        await waitForGridPage(10000);
        await waitSpinnerGone(10000);
      }
    }

    // Wait before next iteration
    await sleep(delay);
  }

  // ══════════════════════════════════════════════════════════════
  //  DONE — Show summary + download rekap button
  // ══════════════════════════════════════════════════════════════

  const totalMsg = `Selesai: ${successCount} berhasil, ${failCount} gagal`;
  console.log(`\n══════════════════════════════════════════`);
  console.log(`[Pembatalan Faktur] ${totalMsg}`);
  console.log(`  ✅ Berhasil: ${successCount}`);
  console.log(`  ❌ Gagal: ${failCount}`);
  console.log(`  📊 Total: ${values.length}`);
  console.log(`══════════════════════════════════════════\n`);

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
    <div style="display:flex;justify-content:space-between;">
      <span>❌ Gagal</span>
      <span style="color:#f87171;font-weight:600;font-family:'DM Mono',monospace;">${failCount}</span>
    </div>
  `;
  progressPanel.appendChild(rekapSummary);

  // Download Rekap CSV button
  const downloadBtn = document.createElement("\x62\x75\x74\x74\x6f\x6e");
  downloadBtn.textContent = "\u{1f4e5}\x20\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x20\x52\x65\x6b\x61\x70\x20\x43\x53\x56";
  downloadBtn.style.cssText = `
    width:100%;padding:10px;margin-top:10px;
    border:none;
    background:linear-gradient(135deg,#ef4444,#dc2626);
    border-radius:8px;color:#fff;font-size:12px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;
    box-shadow:0 3px 10px rgba(239,68,68,.3);
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
      downloadBtn.style.background = "\x6c\x69\x6e\x65\x61\x72\x2d\x67\x72\x61\x64\x69\x65\x6e\x74\x28\x31\x33\x35\x64\x65\x67\x2c\x23\x65\x66\x34\x34\x34\x34\x2c\x23\x64\x63\x32\x36\x32\x36\x29";
    }, 2000);
  };
  progressPanel.appendChild(downloadBtn);

  // Close button
  const closePanelBtn = document.createElement("\x62\x75\x74\x74\x6f\x6e");
  closePanelBtn.textContent = "\x54\x75\x74\x75\x70";
  closePanelBtn.style.cssText = `
    width:100%;padding:9px;margin-top:8px;
    border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);
    border-radius:8px;color:#a0aec0;font-size:12px;font-weight:500;
    cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;
  `;
  closePanelBtn.onmouseover = () => { closePanelBtn.style.background = "\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x31\x29"; };
  closePanelBtn.onmouseout = () => { closePanelBtn.style.background = "\x72\x67\x62\x61\x28\x32\x35\x35\x2c\x32\x35\x35\x2c\x32\x35\x35\x2c\x2e\x30\x34\x29"; };
  closePanelBtn.onclick = () => progressPanel.remove();
  progressPanel.appendChild(closePanelBtn);

})();