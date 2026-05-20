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
          <div style="font-size:11px;color:#4e5668;margin-top:2px;">Bukti Potong Downloader</div>
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
    return;
  }

  if (license.expiry) {
    const daysLeft = Math.ceil((license.expiry - Date.now()) / 86_400_000);
    const expDate = new Date(license.expiry).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });
    console.log(`✅ Lisensi aktif — berlaku hingga ${expDate} (${daysLeft} hari lagi)`);
  }

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
  const GLOBAL_DELAY = await getDelay("delay_tax_withholding_slips", DEFAULT_DELAY);
  const DOWNLOAD_RETRY = 3;
  const BASE_POLL = Math.max(GLOBAL_DELAY, 300);
  const WAIT_STABLE_TIMEOUT = Math.max(GLOBAL_DELAY * 10, 8000);
  const EXT_ICON = chrome.runtime.getURL("icon.png");

  console.log("⏳ BUKTI POTONG DELAY:", GLOBAL_DELAY);

  /**************************************
   * MODAL
   **************************************/
  function createModal() {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

      #autoDownloaderBupotModal {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 300px;
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
        animation: bupot-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes bupot-slideIn {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .bupot-top-bar {
        height: 3px;
        background: linear-gradient(90deg, #3882f6, #2563eb, #7c3aed, #3882f6);
        background-size: 300% 100%;
        animation: bupot-shimmer 2s linear infinite;
      }

      .bupot-top-bar.done {
        background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #16a34a);
      }

      @keyframes bupot-shimmer {
        0%   { background-position: 100% 0; }
        100% { background-position: -200% 0; }
      }

      .bupot-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .bupot-header-icon {
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

      .bupot-header-icon img {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }

      .bupot-header-title {
        font-size: 13px;
        font-weight: 600;
        color: #f0f2f8;
      }

      .bupot-header-subtitle {
        font-size: 10.5px;
        color: #4e5668;
        margin-top: 1px;
      }

      #bupotCloseBtn {
        margin-left: auto;
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
      }

      #bupotCloseBtn.visible { display: flex; }

      .bupot-status-badge {
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
      }

      .bupot-status-dot {
        width: 6px;height: 6px;border-radius: 50%;
        background: #3882f6;
        animation: bupot-pulse 1.6s ease-in-out infinite;
      }

      .bupot-status-badge.done {
        background: rgba(34,197,94,0.08);
        border-color: rgba(34,197,94,0.2);
        color: #4ade80;
      }

      .bupot-status-badge.done .bupot-status-dot {
        background: #22c55e;
        animation: none;
      }

      .bupot-status-badge.error {
        background: rgba(239,68,68,0.08);
        border-color: rgba(239,68,68,0.2);
        color: #f87171;
      }

      .bupot-status-badge.error .bupot-status-dot {
        background: #ef4444;
        animation: none;
      }

      @keyframes bupot-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: .4; transform: scale(.85); }
      }

      .bupot-metrics {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        padding:12px 16px;
      }

      .bupot-metric {
        background: rgba(255,255,255,.03);
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 9px;
        padding: 9px 11px;
      }

      .bupot-metric-label {
        font-size:10px;color:#4e5668;font-weight:500;
        letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px;
      }

      .bupot-metric-value {
        font-family:'DM Mono',monospace;
        font-size:16px;font-weight:500;color:#e2e8f0;line-height:1;
      }

      .bupot-metric-value.accent { color:#3882f6; }
      .bupot-metric-value.small { font-size:13px; }

      .bupot-footer {
        padding:10px 16px 14px;
        border-top:1px solid rgba(255,255,255,.05);
        display:flex;align-items:center;gap:6px;
      }

      .bupot-footer-text {
        font-size:10.5px;color:#4e5668;line-height:1.4;font-style:italic;
      }

      #bupotDownloadCsvBtn {
        margin-left:auto;
        padding:4px 10px;
        font-size:11px;
        border-radius:999px;
        border:1px solid rgba(56,130,246,0.6);
        background:rgba(37,99,235,0.1);
        color:#93c5fd;
        cursor:pointer;
        display:none;
      }

      #bupotDownloadCsvBtn.visible { display:inline-flex; align-items:center; gap:4px; }
    `;
    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "autoDownloaderBupotModal";

    modal.innerHTML = `
      <div class="bupot-top-bar" id="bupotTopBar"></div>

      <div class="bupot-header">
        <div class="bupot-header-icon"><img src="${EXT_ICON}" /></div>
        <div>
          <div class="bupot-header-title">Tukang Kunting</div>
          <div class="bupot-header-subtitle">Downloader Bukti Potong Saya</div>
        </div>
        <button id="bupotCloseBtn" title="Close">✕</button>
      </div>

      <div class="bupot-status-badge" id="statusBadge">
        <div class="bupot-status-dot"></div>
        <span id="autoStatus">Starting...</span>
      </div>

      <div class="bupot-metrics">
        <div class="bupot-metric">
          <div class="bupot-metric-label">Page</div>
          <div class="bupot-metric-value accent" id="pageNumber">—</div>
        </div>
        <div class="bupot-metric">
          <div class="bupot-metric-label">Downloaded</div>
          <div class="bupot-metric-value" id="downloadCount">0</div>
        </div>
        <div class="bupot-metric" style="grid-column:1/-1">
          <div class="bupot-metric-label">Delay</div>
          <div class="bupot-metric-value small">${GLOBAL_DELAY} ms</div>
        </div>
      </div>

      <div class="bupot-footer">
        <span>⚠️</span>
        <span class="bupot-footer-text">Jangan klik apa-apa sampai selesai.</span>
        <button id="bupotDownloadCsvBtn">⬇ CSV</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("bupotCloseBtn").onclick = () => modal.remove();
    document.getElementById("bupotDownloadCsvBtn")?.addEventListener("click", () => {
      try { downloadCSVOfSuccess(); } catch (e) { console.error("Gagal export CSV:", e); }
    });
  }

  function updateStatus(text) {
    const el = document.getElementById("autoStatus");
    const badge = document.getElementById("statusBadge");
    const bar = document.getElementById("bupotTopBar");
    const closeBtn = document.getElementById("bupotCloseBtn");
    const csvBtn = document.getElementById("bupotDownloadCsvBtn");
    if (!el || !badge) return;
    el.textContent = text;

    if (text === "DONE") {
      badge.classList.add("done");
      bar?.classList.add("done");
      closeBtn?.classList.add("visible");
      csvBtn?.classList.add("visible");
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

  // Tidak pakai spinner — tunggu tabel stabil
  async function waitTableStable(timeoutMs = WAIT_STABLE_TIMEOUT) {
    const start = Date.now();
    let lastSig = "";
    let stableTicks = 0;

    while (Date.now() - start < timeoutMs) {
      const rows = Array.from(getRows());
      const sig = rows.map(r => (r.children[2]?.textContent || "").trim()).join("|"); // kolom nomor pemotongan
      if (sig && sig === lastSig) {
        stableTicks++;
        if (stableTicks >= 3) return;
      } else {
        stableTicks = 0;
        lastSig = sig;
      }
      await sleep(BASE_POLL);
    }
  }

  function humanClick(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    ["mouseover", "mousedown", "mouseup", "click"].forEach(type => {
      element.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window, clientX, clientY, button: 0
      }));
    });
  }

  async function clickDownloadButton(row, nomorPemotongan) {
    const btn =
      row.querySelector("button#DownloadButton") ||
      row.querySelector("button .pi-file-pdf")?.closest("button");

    if (!btn) {
      console.warn(`⚠️ [${nomorPemotongan}] Tombol download tidak ditemukan`);
      return false;
    }

    humanClick(btn);
    await sleep(Math.max(GLOBAL_DELAY, 450)); // beri waktu request jalan
    return true;
  }

  /**************************************
   * PROCESS CURRENT PAGE
   **************************************/
  async function processCurrentPage() {
    updatePageNumber();
    const page = getCurrentPageNumber() || "1";
    updateStatus(`Page ${page} scanning...`);

    await waitTableStable();

    while (true) {
      const rows = Array.from(getRows());
      if (!rows.length) break;

      let found = false;

      for (const row of rows) {
        // mapping kolom sesuai HTML:
        // 0 aksi, 1 masa pajak, 2 nomor pemotongan, 3 status, 4 npwp, 5 nama
        const nomorCell = row.children[2];
        const masaCell = row.children[1];
        const statusCell = row.children[3];
        const npwpCell = row.children[4];
        const namaCell = row.children[5];

        const nomorPemotongan = nomorCell?.textContent?.replace("Nomor Pemotongan", "").trim();
        if (!nomorPemotongan) continue;

        if (downloaded.has(nomorPemotongan)) continue;

        found = true;
        downloaded.add(nomorPemotongan);

        updateStatus("Downloading...");

        let ok = false;
        for (let i = 0; i < DOWNLOAD_RETRY; i++) {
          ok = await clickDownloadButton(row, nomorPemotongan);
          if (ok) break;
          await sleep(GLOBAL_DELAY);
        }

        if (ok) {
          totalDownloaded++;
          updateCounter();

          successfulDownloads.push({
            nomor_pemotongan: nomorPemotongan,
            masa_pajak: masaCell?.textContent?.replace("Masa Pajak", "").trim() || "",
            status: statusCell?.textContent?.replace("Status", "").trim() || "",
            npwp_pemotong: npwpCell?.textContent?.replace("NPWP Pemotong", "").trim() || "",
            nama_pemotong: namaCell?.textContent?.replace("Nama Pemotong", "").trim() || "",
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
   * EXPORT CSV
   **************************************/
  function downloadCSVOfSuccess() {
    if (!successfulDownloads.length) {
      alert("Tidak ada data bukti potong yang berhasil di-download.");
      return;
    }

    const headers = [
      "Nomor Pemotongan",
      "Masa Pajak",
      "Status",
      "NPWP Pemotong",
      "Nama Pemotong",
      "Page",
      "Downloaded At"
    ];

    const rows = successfulDownloads.map(item => [
      `'${item.nomor_pemotongan}`,
      item.masa_pajak,
      item.status,
      `'${item.npwp_pemotong}`,
      item.nama_pemotong,
      item.page,
      item.downloaded_at
    ]);

    const escapeCSV = (value) => {
      if (value == null) return "";
      const str = String(value);
      if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const csvContent = [headers, ...rows]
      .map(r => r.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `tax_withholding_downloaded_${ts}.csv`;

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
    if (!nextBtn || nextBtn.classList.contains("p-disabled")) return false;

    const oldPage = getCurrentPageNumber();
    const oldFirst = getRows()[0]?.children?.[2]?.textContent?.trim() || "";

    humanClick(nextBtn);

    let moved = false;
    for (let i = 0; i < 50; i++) {
      await sleep(BASE_POLL);

      const newPage = getCurrentPageNumber();
      const newFirst = getRows()[0]?.children?.[2]?.textContent?.trim() || "";

      if ((newPage && newPage !== oldPage) || (newFirst && newFirst !== oldFirst)) {
        moved = true;
        break;
      }
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
    while (tries < 50) {
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
    console.log("🎉 DONE BUKTI POTONG. Total:", totalDownloaded);
  }

  try {
    await run();
  } catch (e) {
    console.error("💥 ERROR:", e);
    updateStatus("ERROR ❌ Cek console.");
  }
})();