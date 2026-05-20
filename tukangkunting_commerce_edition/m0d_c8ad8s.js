(async function () {

  /**************************************
   * LICENSE CHECK — wajib valid sebelum jalan
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

  // ── Cek lisensi ──
  const license = await checkLicense();

  if (!license.ok) {
    console.error("\u274c\x20\x4c\x69\x73\x65\x6e\x73\x69\x20\x74\x69\x64\x61\x6b\x20\x76\x61\x6c\x69\x64\x3a", license.reason);

    // Tampilkan pesan di halaman
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
    if (license.reason === "\x\x36\x63\x\x36\x39\x\x37\x33\x\x36\x35\x\x36\x65\x\x37\x33\x\x36\x39\x\x32\x30\x\x37\x33\x\x37\x35\x\x36\x34\x\x36\x31\x\x36\x38\x\x32\x30\x\x36\x35\x\x37\x38\x\x37\x30\x\x36\x39\x\x37\x32\x\x36\x35\x\x36\x34") {
      reasonText = "\x4c\x69\x73\x65\x6e\x73\x69\x20\x41\x6e\x64\x61\x20\x73\x75\x64\x61\x68\x20\x65\x78\x70\x69\x72\x65\x64\x2e\x20\x48\x75\x62\x75\x6e\x67\x69\x20\x6f\x77\x6e\x65\x72\x20\x75\x6e\x74\x75\x6b\x20\x70\x65\x72\x70\x61\x6e\x6a\x61\x6e\x67\x61\x6e\x2e";
    } else if (license.reason === "\x\x36\x64\x\x36\x31\x\x36\x33\x\x36\x38\x\x36\x39\x\x36\x65\x\x36\x35\x\x32\x30\x\x36\x33\x\x36\x66\x\x36\x34\x\x36\x35\x\x32\x30\x\x37\x34\x\x36\x39\x\x36\x34\x\x36\x31\x\x36\x62\x\x32\x30\x\x36\x33\x\x36\x66\x\x36\x33\x\x36\x66\x\x36\x62") {
      reasonText = "\x54\x6f\x6b\x65\x6e\x20\x74\x69\x64\x61\x6b\x20\x63\x6f\x63\x6f\x6b\x20\x64\x65\x6e\x67\x61\x6e\x20\x70\x65\x72\x61\x6e\x67\x6b\x61\x74\x20\x69\x6e\x69\x2e";
    } else if (license.reason === "\x\x36\x65\x\x36\x66\x\x35\x66\x\x36\x63\x\x36\x39\x\x36\x33\x\x36\x35\x\x36\x65\x\x37\x33\x\x36\x35") {
      reasonText = "\x42\x65\x6c\x75\x6d\x20\x61\x64\x61\x20\x6c\x69\x73\x65\x6e\x73\x69\x20\x61\x6b\x74\x69\x66\x2e\x20\x4b\x6c\x69\x6b\x20\x69\x63\x6f\x6e\x20\x65\x78\x74\x65\x6e\x73\x69\x6f\x6e\x20\x75\x6e\x74\x75\x6b\x20\x61\x6b\x74\x69\x76\x61\x73\x69\x2e";
    }

    notice.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:32px;height:32px;background:rgba(239,68,68,.12);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🔒</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#f87171;">Lisensi Tidak Aktif</div>
          <div style="font-size:11px;color:#4e5668;margin-top:2px;">e-Faktur Downloader</div>
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

    // ⛔ STOP — tidak lanjut eksekusi
    return;
  }

  // ✅ Lisensi valid — log info
  if (license.expiry) {
    const daysLeft = Math.ceil((license.expiry - Date.now()) / 86_400_000);
    const expDate = new Date(license.expiry).toLocaleDateString("\x\x36\x39\x\x36\x34\x\x32\x64\x\x34\x39\x\x34\x34", {
      day: "\x\x36\x65\x\x37\x35\x\x36\x64\x\x36\x35\x\x37\x32\x\x36\x39\x\x36\x33", month: "\x\x36\x63\x\x36\x66\x\x36\x65\x\x36\x37", year: "\x\x36\x65\x\x37\x35\x\x36\x64\x\x36\x35\x\x37\x32\x\x36\x39\x\x36\x33"
    });
    console.log(`✅ Lisensi aktif — berlaku hingga ${expDate} (${daysLeft} hari lagi)`);
  }

  /**************************************
   * MULAI SCRIPT UTAMA (hanya jalan kalau lisensi valid)
   **************************************/

  const downloaded = new Set();
  let totalDownloaded = 0;

  const successfulDownloads = [];

  /**************************************
   * GLOBAL DELAY DARI SETTINGS
   **************************************/
  function getDelay(key, defaultValue = 0) {
    return new Promise(resolve => {
      if (!chrome?.storage?.local) return resolve(defaultValue);

      chrome.storage.local.get([key], (res) => {
        if (res && res[key] !== undefined) {
          const v = Number(res[key]);
          resolve(Number.isFinite(v) ? v : defaultValue);
        } else {
          resolve(defaultValue);
        }
      });
    });
  }

  const DEFAULT_DELAY = 500;
  const GLOBAL_DELAY = await getDelay("\x\x36\x34\x\x36\x35\x\x36\x63\x\x36\x31\x\x37\x39\x\x35\x66\x\x37\x30\x\x37\x30\x\x36\x65", DEFAULT_DELAY);
  const DOWNLOAD_RETRY = 3;
  const MAX_WAIT_AFTER_CLICK = Math.max(GLOBAL_DELAY * 16, 8000);
  const BASE_POLL = Math.max(GLOBAL_DELAY, 300);

  const EXT_ICON = chrome.runtime.getURL("\x69\x63\x6f\x6e\x2e\x70\x6e\x67");

  console.log("\u23f3\x20\x47\x4c\x4f\x42\x41\x4c\x20\x44\x45\x4c\x41\x59\x20\x66\x72\x6f\x6d\x20\x73\x65\x74\x74\x69\x6e\x67\x73\x3a", GLOBAL_DELAY);
  console.log("\u23f3\x20\x4d\x41\x58\x5f\x57\x41\x49\x54\x5f\x41\x46\x54\x45\x52\x5f\x43\x4c\x49\x43\x4b\x3a", MAX_WAIT_AFTER_CLICK);

  /**************************************
   * MODAL
   **************************************/
  function createModal() {
    const style = document.createElement("\x73\x74\x79\x6c\x65");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

      #autoDownloaderPpnModal {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 280px;
        background: #0f1117;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.04),
          0 24px 48px rgba(0,0,0,0.6),
          0 0 60px rgba(56,130,246,0.07);
        z-index: 999999;
        font-family: 'DM Sans', system-ui, sans-serif;
        overflow: hidden;
        animation: ppn-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes ppn-slideIn {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .ppn-top-bar {
        height: 3px;
        background: linear-gradient(90deg, #3882f6, #2563eb, #7c3aed, #3882f6);
        background-size: 300% 100%;
        animation: ppn-shimmer 2s linear infinite;
      }

      .ppn-top-bar.done {
        background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #16a34a);
        background-size: 300% 100%;
        animation: ppn-shimmer 2s linear infinite;
      }

      @keyframes ppn-shimmer {
        0%   { background-position: 100% 0; }
        100% { background-position: -200% 0; }
      }

      .ppn-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .ppn-header-icon {
        width: 30px;
        height: 30px;
        background: linear-gradient(135deg, #f6ece1, #f6ece1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 3px 10px rgba(56,130,246,0.3);
      }

      .ppn-header-icon img {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }

      .ppn-header-text {
        flex: 1;
        min-width: 0;
      }

      .ppn-header-title {
        font-size: 13px;
        font-weight: 600;
        color: #f0f2f8;
        letter-spacing: -0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ppn-header-subtitle {
        font-size: 10.5px;
        color: #4e5668;
        margin-top: 1px;
        letter-spacing: 0.02em;
      }

      #ppnCloseBtn {
        width: 26px;
        height: 26px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 7px;
        display: none;
        align-items: center;
        justify-content: center;
        color: #4e5668;
        flex-shrink: 0;
        transition: background 0.15s, color 0.15s;
        padding: 0;
      }

      #ppnCloseBtn.visible {
        display: flex;
      }

      #ppnCloseBtn:hover {
        background: rgba(239, 68, 68, 0.12);
        color: #f87171;
      }

      .ppn-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(56,130,246,0.1);
        border: 1px solid rgba(56,130,246,0.2);
        border-radius: 20px;
        padding: 4px 10px;
        font-size: 11.5px;
        color: #7aa8f5;
        font-weight: 500;
        margin: 12px 16px 0;
        max-width: calc(100% - 32px);
        box-sizing: border-box;
        min-height: 26px;
        transition: background 0.4s, border-color 0.4s, color 0.4s;
      }

      .ppn-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #3882f6;
        flex-shrink: 0;
        animation: ppn-pulse 1.6s ease-in-out infinite;
      }

      .ppn-status-badge.done .ppn-status-dot {
        background: #22c55e;
        box-shadow: 0 0 6px rgba(34,197,94,0.5);
        animation: none;
      }

      .ppn-status-badge.done {
        background: rgba(34,197,94,0.08);
        border-color: rgba(34,197,94,0.2);
        color: #4ade80;
      }

      .ppn-status-badge.error {
        background: rgba(239,68,68,0.08);
        border-color: rgba(239,68,68,0.2);
        color: #f87171;
      }

      .ppn-status-badge.error .ppn-status-dot {
        background: #ef4444;
        box-shadow: 0 0 6px rgba(239,68,68,0.5);
        animation: none;
      }

      @keyframes ppn-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.4; transform: scale(0.85); }
      }

      #ppnAutoStatus {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .ppn-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 12px 16px;
      }

      .ppn-metric {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 9px;
        padding: 9px 11px;
      }

      .ppn-metric-label {
        font-size: 10px;
        color: #4e5668;
        font-weight: 500;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .ppn-metric-value {
        font-family: 'DM Mono', monospace;
        font-size: 16px;
        font-weight: 500;
        color: #e2e8f0;
        line-height: 1;
      }

      .ppn-metric-value.accent {
        color: #3882f6;
      }

      .ppn-metric-value.small {
        font-size: 13px;
      }

      .ppn-footer {
        padding: 10px 16px 14px;
        border-top: 1px solid rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .ppn-footer-icon {
        font-size: 11px;
        opacity: 0.5;
      }

      .ppn-footer-text {
        font-size: 10.5px;
        color: #4e5668;
        line-height: 1.4;
        font-style: italic;
      }

      #ppnDownloadCsvBtn {
        margin-left: auto;
        padding: 4px 10px;
        font-size: 11px;
        border-radius: 999px;
        border: 1px solid rgba(56,130,246,0.6);
        background: rgba(37,99,235,0.1);
        color: #93c5fd;
        cursor: pointer;
        display: none;
        font-family: 'DM Sans', system-ui, sans-serif;
      }

      #ppnDownloadCsvBtn.visible {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      #ppnDownloadCsvBtn:hover {
        background: rgba(37,99,235,0.2);
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement("\x64\x69\x76");
    modal.id = "\x61\x75\x74\x6f\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x65\x72\x50\x70\x6e\x4d\x6f\x64\x61\x6c";

    modal.innerHTML = `
      <div class="ppn-top-bar" id="ppnTopBar"></div>

      <div class="ppn-header">
        <div class="ppn-header-icon">
          <img src="${EXT_ICON}" />
        </div>
        <div class="ppn-header-text">
          <div class="ppn-header-title">Tukang Kunting</div>
          <div class="ppn-header-subtitle">Sedia Tukang Sebelum Hujan.</div>
        </div>
        <button id="ppnCloseBtn" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="ppn-status-badge" id="ppnStatusBadge">
        <div class="ppn-status-dot"></div>
        <span id="ppnAutoStatus">Starting...</span>
      </div>

      <div class="ppn-metrics">
        <div class="ppn-metric">
          <div class="ppn-metric-label">Page</div>
          <div class="ppn-metric-value accent" id="ppnPageNumber">—</div>
        </div>
        <div class="ppn-metric">
          <div class="ppn-metric-label">Downloaded</div>
          <div class="ppn-metric-value" id="ppnDownloadCount">0</div>
        </div>
        <div class="ppn-metric" style="grid-column:1/-1">
          <div class="ppn-metric-label">Delay</div>
          <div class="ppn-metric-value small">
            ${GLOBAL_DELAY}
            <span style="font-size:10px;color:#4e5668;font-family:'DM Sans',sans-serif;">ms</span>
          </div>
        </div>
      </div>

      <div class="ppn-footer">
        <span class="ppn-footer-icon">⚠️</span>
        <span class="ppn-footer-text">Jangan klik apa-apa sampai selesai.</span>
        <button id="ppnDownloadCsvBtn" title="Download daftar nomor faktur">
          ⬇ CSV
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("\x70\x70\x6e\x43\x6c\x6f\x73\x65\x42\x74\x6e").onclick = () => modal.remove();

    const downloadBtn = document.getElementById("\x70\x70\x6e\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x43\x73\x76\x42\x74\x6e");
    if (downloadBtn) {
      downloadBtn.addEventListener("\x63\x6c\x69\x63\x6b", () => {
        try {
          downloadCSVOfSuccess();
        } catch (err) {
          console.error("\x47\x61\x67\x61\x6c\x20\x6d\x65\x6d\x62\x75\x61\x74\x20\x43\x53\x56\x20\x50\x50\x4e\x3a", err);
          alert("\x54\x65\x72\x6a\x61\x64\x69\x20\x65\x72\x72\x6f\x72\x20\x73\x61\x61\x74\x20\x6d\x65\x6d\x62\x75\x61\x74\x20\x43\x53\x56\x2e\x20\x43\x65\x6b\x20\x63\x6f\x6e\x73\x6f\x6c\x65\x2e");
        }
      });
    }
  }

  function updateStatus(text) {
    const el        = document.getElementById("\x70\x70\x6e\x41\x75\x74\x6f\x53\x74\x61\x74\x75\x73");
    const badge     = document.getElementById("\x70\x70\x6e\x53\x74\x61\x74\x75\x73\x42\x61\x64\x67\x65");
    const bar       = document.getElementById("\x70\x70\x6e\x54\x6f\x70\x42\x61\x72");
    const closeBtn  = document.getElementById("\x70\x70\x6e\x43\x6c\x6f\x73\x65\x42\x74\x6e");
    const downloadBtn = document.getElementById("\x70\x70\x6e\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x43\x73\x76\x42\x74\x6e");

    if (!el || !badge) return;
    el.textContent = text;

    if (text === "\x\x34\x34\x\x34\x66\x\x34\x65\x\x34\x35") {
      badge.classList.add("\x64\x6f\x6e\x65");
      bar?.classList.add("\x64\x6f\x6e\x65");
      closeBtn?.classList.add("\x76\x69\x73\x69\x62\x6c\x65");
      downloadBtn?.classList.add("\x76\x69\x73\x69\x62\x6c\x65");
    }
    if (text.startsWith("\x\x34\x35\x\x35\x32\x\x35\x32\x\x34\x66\x\x35\x32")) {
      badge.classList.add("\x65\x72\x72\x6f\x72");
      closeBtn?.classList.add("\x76\x69\x73\x69\x62\x6c\x65");
    }
  }

  function updateCounter() {
    const el = document.getElementById("\x70\x70\x6e\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x43\x6f\x75\x6e\x74");
    if (el) el.textContent = totalDownloaded;
  }

  function updatePageNumber() {
    const el = document.getElementById("\x70\x70\x6e\x50\x61\x67\x65\x4e\x75\x6d\x62\x65\x72");
    if (el) el.textContent = getCurrentPageNumber() || "\u2014";
  }

  createModal();

  /**************************************
   * HELPERS
   **************************************/
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function getRows() {
    return document.querySelectorAll("\x74\x61\x62\x6c\x65\x20\x74\x62\x6f\x64\x79\x20\x74\x72");
  }

  function getCurrentPageNumber() {
    const el = document.querySelector("\x2e\x70\x2d\x70\x61\x67\x69\x6e\x61\x74\x6f\x72\x2d\x62\x6f\x74\x74\x6f\x6d\x20\x2e\x70\x2d\x70\x61\x67\x69\x6e\x61\x74\x6f\x72\x2d\x70\x61\x67\x65\x2e\x70\x2d\x68\x69\x67\x68\x6c\x69\x67\x68\x74");
    return el ? el.textContent.trim() : null;
  }

  function getNextButton() {
    return document.querySelector("\x2e\x70\x2d\x70\x61\x67\x69\x6e\x61\x74\x6f\x72\x2d\x62\x6f\x74\x74\x6f\x6d\x20\x2e\x70\x2d\x70\x61\x67\x69\x6e\x61\x74\x6f\x72\x2d\x6e\x65\x78\x74");
  }

  function hasSpinner() {
    const spinner1 = document.querySelector("\x2e\x70\x2d\x64\x61\x74\x61\x74\x61\x62\x6c\x65\x2d\x6c\x6f\x61\x64\x69\x6e\x67\x2d\x6f\x76\x65\x72\x6c\x61\x79");
    const spinner2 = document.querySelector("\x75\x69\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72");
    const spinner3 = document.querySelector("\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x73\x70\x69\x6e\x6e\x65\x72\x20\x2e\x70\x2d\x70\x72\x6f\x67\x72\x65\x73\x73\x2d\x73\x70\x69\x6e\x6e\x65\x72");
    return !!(spinner1 || spinner2 || spinner3);
  }

  async function waitTableStable(timeoutMs) {
    const effectiveTimeout = timeoutMs || Math.max(GLOBAL_DELAY * 10, 8000);
    const start = Date.now();

    console.log(`⏳ wait spinner only, timeout=${effectiveTimeout}ms`);

    if (hasSpinner()) {
      while (Date.now() - start < effectiveTimeout) {
        if (!hasSpinner()) {
          console.log("\u2705\x20\x73\x70\x69\x6e\x6e\x65\x72\x20\x68\x69\x6c\x61\x6e\x67\x2c\x20\x6c\x61\x6e\x6a\x75\x74\x20\x74\x61\x6e\x70\x61\x20\x63\x65\x6b\x20\x72\x6f\x77\x20\x73\x74\x61\x62\x69\x6c");
          return;
        }
        await sleep(BASE_POLL);
      }
      console.warn("\u26a0\ufe0f\x20\x73\x70\x69\x6e\x6e\x65\x72\x20\x74\x69\x64\x61\x6b\x20\x68\x69\x6c\x61\x6e\x67\x20\x73\x61\x6d\x70\x61\x69\x20\x74\x69\x6d\x65\x6f\x75\x74");
    } else {
      await sleep(Math.min(BASE_POLL * 2, 600));
    }
  }

  /**************************************
   * CLICK "MANUSIA"
   **************************************/
  function humanClick(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    ["\x6d\x6f\x75\x73\x65\x6f\x76\x65\x72", "\x6d\x6f\x75\x73\x65\x64\x6f\x77\x6e", "\x6d\x6f\x75\x73\x65\x75\x70", "\x63\x6c\x69\x63\x6b"].forEach(type => {
      const evt = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX,
        clientY,
        button: 0
      });
      element.dispatchEvent(evt);
    });
  }

  async function clickDownloadButton(row, nomorFaktur) {
    let btn =
      row.querySelector("\x62\x75\x74\x74\x6f\x6e\x23\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x42\x75\x74\x74\x6f\x6e") ||
      row.querySelector("\x62\x75\x74\x74\x6f\x6e\x20\x2e\x70\x69\x2d\x66\x69\x6c\x65\x2d\x70\x64\x66")?.closest("\x62\x75\x74\x74\x6f\x6e") ||
      row.querySelector("\x62\x75\x74\x74\x6f\x6e\x5b\x69\x64\x3d\x27\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x42\x75\x74\x74\x6f\x6e\x27\x5d");

    if (!btn) {
      console.warn(`⚠️ [${nomorFaktur}] Download button tidak ditemukan di row ini`);
      return false;
    }

    console.log(`⬇ [${nomorFaktur}] humanClick pada tombol`, btn);
    humanClick(btn);

    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_AFTER_CLICK) {
      if (hasSpinner()) {
        await waitTableStable();
        break;
      }
      await sleep(BASE_POLL);
    }

    return true;
  }

  /**************************************
   * PROCESS CURRENT PAGE
   **************************************/
  async function processCurrentPage() {
    updatePageNumber();
    const page = getCurrentPageNumber();
    console.log(`📄 Proses Page ${page}`);
    updateStatus(`Page ${page} - memindai faktur...`);

    await waitTableStable();

    while (true) {
      const rows = Array.from(getRows());
      if (!rows.length) {
        console.log(`⚠️ Page ${page}: tidak ada row.`);
        break;
      }

      let found = false;

      for (const row of rows) {
        const nomorFaktur = row.children[5]?.textContent?.trim();
        if (!nomorFaktur) continue;

        if (downloaded.has(nomorFaktur)) continue;

        found = true;
        downloaded.add(nomorFaktur);

        console.log(`⬇ Page ${page}: ${nomorFaktur}`);
        updateStatus(`Downloading...`);

        let ok = false;
        for (let i = 0; i < DOWNLOAD_RETRY; i++) {
          ok = await clickDownloadButton(row, nomorFaktur);
          if (ok) break;
          console.warn(`🔁 Retry download [${nomorFaktur}] ke-${i + 2}`);
          await sleep(GLOBAL_DELAY);
        }

        if (ok) {
          totalDownloaded++;
          updateCounter();

          successfulDownloads.push({
            nomor_faktur: nomorFaktur,
            page: getCurrentPageNumber() || "",
            downloaded_at: new Date().toISOString(),
          });
        } else {
          console.error(`❌ Gagal download [${nomorFaktur}] setelah retry`);
        }

        await sleep(GLOBAL_DELAY);
        break;
      }

      if (!found) {
        console.log(`✅ Selesai Page ${page}, semua faktur di-scan`);
        updateStatus(`Page ${page} selesai. Total: ${totalDownloaded}`);
        break;
      }
    }
  }

  /**************************************
   * EXPORT KE EXCEL (CSV)
   **************************************/
  function downloadCSVOfSuccess() {
    if (!successfulDownloads.length) {
      console.warn("\x54\x69\x64\x61\x6b\x20\x61\x64\x61\x20\x64\x61\x74\x61\x20\x73\x75\x6b\x73\x65\x73\x20\x75\x6e\x74\x75\x6b\x20\x64\x69\x65\x78\x70\x6f\x72\x74\x2e");
      alert("\x54\x69\x64\x61\x6b\x20\x61\x64\x61\x20\x64\x61\x74\x61\x20\x6e\x6f\x6d\x6f\x72\x20\x66\x61\x6b\x74\x75\x72\x20\x79\x61\x6e\x67\x20\x62\x65\x72\x68\x61\x73\x69\x6c\x20\x64\x69\x2d\x64\x6f\x77\x6e\x6c\x6f\x61\x64\x2e");
      return;
    }

    const headers = ["\x4e\x6f\x6d\x6f\x72\x20\x46\x61\x6b\x74\x75\x72", "\x50\x61\x67\x65", "\x44\x6f\x77\x6e\x6c\x6f\x61\x64\x65\x64\x20\x41\x74"];

    const rows = successfulDownloads.map(item => {
      let nomorBersih = item.nomor_faktur || "";
      nomorBersih = nomorBersih.toString()
        .trim()
        .replace(/^\s*Nomor\s+Faktur\s+Pajak\s*/i, "");
      return [
        `'${nomorBersih}`,
        item.page,
        item.downloaded_at,
      ];
    });

    const escapeCSV = (value) => {
      if (value == null) return "";
      const str = String(value);
      if (/["\x2c\n\x3b\x5d\x2f\x2e\x74\x65\x73\x74\x28\x73\x74\x72\x29\x29\x20\x7b
\x20\x20\x20\x20\x20\x20\x20\x20\x72\x65\x74\x75\x72\x6e\x20\x60"${str.replace(/"\x2f\x67\x2c\x20\x27""\x27\x29\x7d"`;
      }
      return str;
    };

    const csvContent =
      [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");
    const filename = `ppn_faktur_downloaded_${timestamp}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("📁 CSV downloaded (PPN):", filename);
  }

  /**************************************
   * NEXT PAGE
   **************************************/
  async function goToNextPage() {
    const nextBtn = getNextButton();
    if (!nextBtn || nextBtn.classList.contains("\x70\x2d\x64\x69\x73\x61\x62\x6c\x65\x64")) {
      console.log("⛔ Next button tidak ada / disabled => stop.");
      return false;
    }

    const oldPage = getCurrentPageNumber();
    const oldRowCount = getRows().length;

    console.log(`➡ Klik Next dari Page ${oldPage}, rows=${oldRowCount}`);
    humanClick(nextBtn);

    let attempts = 0;
    const maxAttempts = Math.max(40, Math.floor((GLOBAL_DELAY || 5000) / BASE_POLL));
    let moved = false;

    while (attempts < maxAttempts) {
      await sleep(BASE_POLL);
      const newPage = getCurrentPageNumber();
      const newRowCount = getRows().length;

      if (newPage && newPage !== oldPage) {
        console.log(`✅ Page berubah: ${oldPage} -> ${newPage}`);
        moved = true;
        break;
      }

      if (newRowCount !== oldRowCount && newRowCount > 0) {
        console.log(`✅ Jumlah row berubah. old=${oldRowCount}, new=${newRowCount}`);
        moved = true;
        break;
      }

      attempts++;
    }

    if (!moved) {
      console.warn("⚠️ Tidak yakin page pindah. Anggap sudah terakhir.");
      return false;
    }

    await waitTableStable();
    updatePageNumber();
    console.log("📄 Sekarang di Page", getCurrentPageNumber(), "rows:", getRows().length);
    return true;
  }

  /**************************************
   * RUN
   **************************************/
  async function run() {
    console.log("🚀 STARTING AUTOMATION PPN");
    updateStatus("Starting automation...");

    let tries = 0;
    while (tries < 40) {
      const rows = getRows();
      const paginator = document.querySelector(".p-paginator-bottom");
      if (rows.length > 0 && paginator) break;
      await sleep(BASE_POLL);
      tries++;
    }

    updatePageNumber();

    while (true) {
      await processCurrentPage();
      const moved = await goToNextPage();
      if (!moved) break;
    }

    console.log("🎉 DONE ALL PAGES. Total downloaded:", totalDownloaded);
    updateStatus("\x44\x4f\x4e\x45");
  }

  try {
    await run();
  } catch (e) {
    console.error("💥 ERROR di script auto_downloader PPN:", e);
    updateStatus("ERROR ❌ Cek console (F12).");
  }
})();