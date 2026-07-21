(async function () {
  
  /**************************************
   * LICENSE CHECK — wajib valid sebelum jalan
   **************************************/
  async function checkLicense() {
    return new Promise((resolve) => {
      if (!chrome?.runtime?.sendMessage) {
        resolve({ ok: false, reason: "no_runtime" });
        return;
      }
      chrome.runtime.sendMessage({ action: "checkLicense" }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, reason: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: false, reason: "no_response" });
      });
    });
  }

  // ── Cek lisensi ──
  const license = await checkLicense();

  if (!license.ok) {
    console.error("❌ Lisensi tidak valid:", license.reason);

    // Tampilkan pesan di halaman
    const notice = document.createElement("div");
    notice.id = "tukang-license-notice";
    notice.style.cssText = `
      position:fixed;bottom:24px;right:24px;width:300px;
      background:#0f1117;border:1px solid rgba(239,68,68,.3);
      border-radius:14px;padding:18px 20px;z-index:999999;
      font-family:'DM Sans',system-ui,sans-serif;
      box-shadow:0 16px 48px rgba(0,0,0,.5);
      animation:tka-slideup .3s cubic-bezier(.16,1,.3,1);
    `;

    let reasonText = "Lisensi tidak ditemukan.";
    if (license.reason === "lisensi sudah expired") {
      reasonText = "Lisensi Anda sudah expired. Hubungi owner untuk perpanjangan.";
    } else if (license.reason === "machine code tidak cocok") {
      reasonText = "Token tidak cocok dengan perangkat ini.";
    } else if (license.reason === "no_license") {
      reasonText = "Belum ada lisensi aktif. Klik icon extension untuk aktivasi.";
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

    document.getElementById("tukang-license-close").onclick = () => notice.remove();

    // ⛔ STOP — tidak lanjut eksekusi
    return;
  }

  // ✅ Lisensi valid — log info
  if (license.expiry) {
    const daysLeft = Math.ceil((license.expiry - Date.now()) / 86_400_000);
    const expDate = new Date(license.expiry).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
    console.log(`✅ Lisensi aktif — berlaku hingga ${expDate} (${daysLeft} hari lagi)`);
  }

  const downloaded = new Set();
  let totalDownloaded = 0;

  // list yang BERHASIL di-download
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
  const GLOBAL_DELAY = await getDelay("delay_ppn_retur", DEFAULT_DELAY);
  const DOWNLOAD_RETRY = 3;
  const MAX_WAIT_AFTER_CLICK = Math.max(GLOBAL_DELAY * 16, 8000);
  const BASE_POLL = Math.max(GLOBAL_DELAY, 300);
  const EXT_ICON = chrome.runtime.getURL("icon.png");

  console.log("⏳ PPN RETUR DELAY:", GLOBAL_DELAY);

  /**************************************
   * MODAL
   **************************************/
  function createModal() {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

      #autoDownloaderReturModal {
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
        animation: retur-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes retur-slideIn {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .retur-top-bar {
        height: 3px;
        background: linear-gradient(90deg, #3882f6, #2563eb, #7c3aed, #3882f6);
        background-size: 300% 100%;
        animation: retur-shimmer 2s linear infinite;
      }

      .retur-top-bar.done {
        background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #16a34a);
        background-size: 300% 100%;
        animation: retur-shimmer 2s linear infinite;
      }

      @keyframes retur-shimmer {
        0%   { background-position: 100% 0; }
        100% { background-position: -200% 0; }
      }

      .retur-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .retur-header-icon {
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

      .retur-header-icon img {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }

      .retur-header-text {
        flex: 1;
        min-width: 0;
      }

      .retur-header-title {
        font-size: 13px;
        font-weight: 600;
        color: #f0f2f8;
        letter-spacing: -0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .retur-header-subtitle {
        font-size: 10.5px;
        color: #4e5668;
        margin-top: 1px;
        letter-spacing: 0.02em;
      }

      #returCloseBtn {
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

      #returCloseBtn.visible {
        display: flex;
      }

      #returCloseBtn:hover {
        background: rgba(239, 68, 68, 0.12);
        color: #f87171;
      }

      .retur-status-badge {
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

      .retur-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #3882f6;
        flex-shrink: 0;
        animation: retur-pulse 1.6s ease-in-out infinite;
      }

      .retur-status-badge.done .retur-status-dot {
        background: #22c55e;
        box-shadow: 0 0 6px rgba(34,197,94,0.5);
        animation: none;
      }

      .retur-status-badge.done {
        background: rgba(34,197,94,0.08);
        border-color: rgba(34,197,94,0.2);
        color: #4ade80;
      }

      .retur-status-badge.error {
        background: rgba(239,68,68,0.08);
        border-color: rgba(239,68,68,0.2);
        color: #f87171;
      }

      .retur-status-badge.error .retur-status-dot {
        background: #ef4444;
        box-shadow: 0 0 6px rgba(239,68,68,0.5);
        animation: none;
      }

      @keyframes retur-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.4; transform: scale(0.85); }
      }

      #autoStatus {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .retur-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 12px 16px;
      }

      .retur-metric {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 9px;
        padding: 9px 11px;
      }

      .retur-metric-label {
        font-size: 10px;
        color: #4e5668;
        font-weight: 500;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .retur-metric-value {
        font-family: 'DM Mono', monospace;
        font-size: 16px;
        font-weight: 500;
        color: #e2e8f0;
        line-height: 1;
      }

      .retur-metric-value.accent {
        color: #3882f6;
      }

      .retur-metric-value.small {
        font-size: 13px;
      }

      .retur-footer {
        padding: 10px 16px 14px;
        border-top: 1px solid rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .retur-footer-icon {
        font-size: 11px;
        opacity: 0.5;
      }

      .retur-footer-text {
        font-size: 10.5px;
        color: #4e5668;
        line-height: 1.4;
        font-style: italic;
      }

      /* 🔹 Tombol Download CSV */
      #returDownloadCsvBtn {
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

      #returDownloadCsvBtn.visible {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      #returDownloadCsvBtn:hover {
        background: rgba(37,99,235,0.2);
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "autoDownloaderReturModal";

    modal.innerHTML = `
      <div class="retur-top-bar" id="returTopBar"></div>

      <div class="retur-header">
        <div class="retur-header-icon">
          <img src="${EXT_ICON}" />
        </div>
        <div class="retur-header-text">
          <div class="retur-header-title">Tukang Kunting</div>
          <div class="retur-header-subtitle">Sedia Tukang Sebelum Hujan.</div>
        </div>
        <button id="returCloseBtn" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="retur-status-badge" id="statusBadge">
        <div class="retur-status-dot"></div>
        <span id="autoStatus">Starting...</span>
      </div>

      <div class="retur-metrics">
        <div class="retur-metric">
          <div class="retur-metric-label">Page</div>
          <div class="retur-metric-value accent" id="pageNumber">—</div>
        </div>
        <div class="retur-metric">
          <div class="retur-metric-label">Downloaded</div>
          <div class="retur-metric-value" id="downloadCount">0</div>
        </div>
        <div class="retur-metric" style="grid-column:1/-1">
          <div class="retur-metric-label">Delay</div>
          <div class="retur-metric-value small">
            ${GLOBAL_DELAY}
            <span style="font-size:10px;color:#4e5668;font-family:'DM Sans',sans-serif;">ms</span>
          </div>
        </div>
      </div>

      <div class="retur-footer">
        <span class="retur-footer-icon">⚠️</span>
        <span class="retur-footer-text">Jangan klik apa-apa sampai selesai.</span>
        <button id="returDownloadCsvBtn" title="Download daftar nomor retur">
          ⬇ CSV
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("returCloseBtn").onclick = () => modal.remove();

    // 🔹 Event tombol Download CSV
    const downloadBtn = document.getElementById("returDownloadCsvBtn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        try {
          downloadCSVOfSuccess();
        } catch (err) {
          console.error("Gagal membuat CSV:", err);
        }
      });
    }
  }

  function updateStatus(text) {
    const el       = document.getElementById("autoStatus");
    const badge    = document.getElementById("statusBadge");
    const bar      = document.getElementById("returTopBar");
    const closeBtn = document.getElementById("returCloseBtn");
    const downloadBtn = document.getElementById("returDownloadCsvBtn");

    if (!el || !badge) return;
    el.textContent = text;

    if (text === "DONE") {
      badge.classList.add("done");
      bar?.classList.add("done");
      closeBtn?.classList.add("visible");
      // 🔹 Tampilkan tombol download CSV ketika DONE
      downloadBtn?.classList.add("visible");
    }
    if (text === "ERROR ❌ Cek console.") {
      badge.classList.add("error");
      closeBtn?.classList.add("visible");
    }
  }

  function updateCounter() {
    const el = document.getElementById("downloadCount");
    if (el) el.textContent = totalDownloaded;
  }

  function updatePageNumber() {
    const el = document.getElementById("pageNumber");
    if (el) el.textContent = getCurrentPageNumber() || "—";
  }

  createModal();

  /**************************************
   * HELPERS
   **************************************/
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function getRows() {
    return document.querySelectorAll("table tbody tr");
  }

  function getCurrentPageNumber() {
    const el = document.querySelector(".p-paginator-bottom .p-paginator-page.p-highlight");
    return el ? el.textContent.trim() : null;
  }

  function getNextButton() {
    return document.querySelector(".p-paginator-bottom .p-paginator-next");
  }

  function hasSpinner() {
    return !!(
      document.querySelector(".p-datatable-loading-overlay") ||
      document.querySelector("ui-progress-spinner .p-progress-spinner") ||
      document.querySelector("p-progressspinner .p-progress-spinner")
    );
  }

  async function waitTableStable(timeoutMs) {
    const effectiveTimeout = timeoutMs || Math.max(GLOBAL_DELAY * 10, 8000);
    const start = Date.now();

    if (hasSpinner()) {
      while (Date.now() - start < effectiveTimeout) {
        if (!hasSpinner()) return;
        await sleep(BASE_POLL);
      }
      console.warn("⚠️ Spinner timeout.");
    } else {
      await sleep(Math.min(BASE_POLL * 2, 600));
    }
  }

  function humanClick(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    ["mouseover", "mousedown", "mouseup", "click"].forEach(type => {
      element.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX,
        clientY,
        button: 0
      }));
    });
  }

  async function clickDownloadButton(row, nomorRetur) {
    let btn =
      row.querySelector("button#DownloadButton") ||
      row.querySelector("button .pi-file-pdf")?.closest("button");

    if (!btn) {
      console.warn(`⚠️ [${nomorRetur}] Tombol download tidak ditemukan`);
      return false;
    }

    humanClick(btn);

    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_AFTER_CLICK) {
      if (hasSpinner()) {
        await waitTableStable();
        break;
      }
      await sleep(BASE_POLL);
    }

    // Di titik ini kita ASUMSI klik sukses (server akan kirim file)
    return true;
  }

  /**************************************
   * PROCESS CURRENT PAGE
   **************************************/
  async function processCurrentPage() {
    updatePageNumber();
    const page = getCurrentPageNumber();
    updateStatus(`Page ${page} scanning...`);

    await waitTableStable();

    while (true) {
      const rows = Array.from(getRows());
      if (!rows.length) break;

      let found = false;

      for (const row of rows) {
        // Nomor Retur di kolom ke-7 (index 6)
        const nomorReturCell = row.children[6];
        let nomorReturRaw = nomorReturCell?.textContent?.trim();
        if (!nomorReturRaw) continue;

        // contoh: "Nomor Retur RET042600008336545"
        // biarkan apa adanya di memory; kita bersihkan saat export
        const nomorReturKey = nomorReturRaw;

        if (downloaded.has(nomorReturKey)) continue;

        found = true;
        downloaded.add(nomorReturKey);

        updateStatus(`Downloading...`);

        let ok = false;
        for (let i = 0; i < DOWNLOAD_RETRY; i++) {
          ok = await clickDownloadButton(row, nomorReturKey);
          if (ok) break;
          await sleep(GLOBAL_DELAY);
        }

        if (ok) {
          totalDownloaded++;
          updateCounter();

          successfulDownloads.push({
            nomor_retur: nomorReturRaw,          // masih "Nomor Retur RET..."
            page: getCurrentPageNumber() || "",
            downloaded_at: new Date().toISOString(),
          });
        }

        await sleep(GLOBAL_DELAY);
        break;
      }

      if (!found) break;
    }
  }

  /**************************************
   * EXPORT KE EXCEL (CSV)
   **************************************/
  function downloadCSVOfSuccess() {
    if (!successfulDownloads.length) {
      console.warn("Tidak ada data sukses untuk diexport.");
      alert("Tidak ada data nomor retur yang berhasil di-download.");
      return;
    }

    // Header CSV
    const headers = ["Nomor Retur", "Page", "Downloaded At"];

    const rows = successfulDownloads.map(item => {
      // Bersihkan prefix "Nomor Retur" di sini saja
      // "Nomor Retur RET042600008336545" -> "RET042600008336545"
      let nomorBersih = item.nomor_retur || "";
      nomorBersih = nomorBersih
        .toString()
        .trim()
        .replace(/^\s*Nomor\s+Retur\s*/i, "");

      return [
         `'${nomorBersih}`,
        item.page,
        item.downloaded_at,
      ];
    });

    const escapeCSV = (value) => {
      if (value == null) return "";
      const str = String(value);
      if (/[",\n;]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
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
    const filename = `ppn_retur_downloaded_${timestamp}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("📁 CSV downloaded:", filename);
  }

  /**************************************
   * NEXT PAGE
   **************************************/
  async function goToNextPage() {
    const nextBtn = getNextButton();
    if (!nextBtn || nextBtn.classList.contains("p-disabled")) {
      return false;
    }

    const oldPage = getCurrentPageNumber();
    const oldRowCount = getRows().length;

    humanClick(nextBtn);

    let attempts = 0;
    let moved = false;

    while (attempts < 40) {
      await sleep(BASE_POLL);

      const newPage = getCurrentPageNumber();
      const newRowCount = getRows().length;

      if (newPage && newPage !== oldPage) {
        moved = true;
        break;
      }

      if (newRowCount !== oldRowCount && newRowCount > 0) {
        moved = true;
        break;
      }

      attempts++;
    }

    if (!moved) return false;

    await waitTableStable();
    updatePageNumber();
    return true;
  }

  /**************************************
   * RUN
   **************************************/
  async function run() {
    updateStatus("Starting...");

    let tries = 0;
    while (tries < 40) {
      if (getRows().length > 0 && document.querySelector(".p-paginator-bottom")) break;
      await sleep(BASE_POLL);
      tries++;
    }

    updatePageNumber();

    while (true) {
      await processCurrentPage();
      const moved = await goToNextPage();
      if (!moved) break;
    }

    updateStatus("DONE");
    console.log("🎉 DONE PPN RETUR. Total:", totalDownloaded);
    const notifSummary = `${totalDownloaded} berhasil, 0 gagal`;
    try {
      chrome.runtime.sendMessage({ action: "batchComplete", module: "Faktur Pajak Retur (Keluaran & Masukan)", summary: notifSummary, failCount: 0 });
      chrome.runtime.sendMessage({ action: "saveActivityLog", entry: { module: "Faktur Pajak Retur (Keluaran & Masukan)", total: totalDownloaded, success: totalDownloaded, failed: 0, skipped: 0, timestamp: Date.now(), url: window.location.href } });
    } catch (e) { /* non-critical */ }
    // Tidak auto-download lagi; user klik tombol CSV di modal
  }

  try {
    await run();
  } catch (e) {
    console.error("💥 ERROR:", e);
    updateStatus("ERROR ❌ Cek console.");
  }

})();
