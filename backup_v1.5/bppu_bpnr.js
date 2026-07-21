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

  const successfulDownloads = [];

  // Data CSV all columns, dipakai oleh mode download dan export-only
  const capturedRows = [];
  let capturedHeaders = [];
  let isExportOnlyMode = false;

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
  const GLOBAL_DELAY = await getDelay("delay_bppu", DEFAULT_DELAY);
  const DOWNLOAD_RETRY = 3;
  const MAX_WAIT_AFTER_CLICK = Math.max(GLOBAL_DELAY * 16, 8000);
  const BASE_POLL = Math.max(GLOBAL_DELAY, 300);
  const EXT_ICON = chrome.runtime.getURL("icon.png");


const capturedRows = [];
let capturedHeaders = [];
let isExportOnlyMode = false;

const META_HEADERS = ["Page", "ExportedAt", "DownloadedAt"];

function cleanText(text) {
  return (text || "")
    .toString()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeaderText(text) {
  return cleanText(text)
    .replace(/\s+/g, " ")
    .trim();
}

function isBadHeader(header) {
  if (!header) return true;

  return (
    /^pilih\b/i.test(header) ||
    /^filter\b/i.test(header) ||
    /^search\b/i.test(header) ||
    /^aksi$/i.test(header) ||
    /^action$/i.test(header) ||
    /^download$/i.test(header) ||
    /^lihat$/i.test(header) ||
    /^detail$/i.test(header) ||
    /^[<>«»]+$/.test(header)
  );
}

function getTableHeaders() {
  const table = document.querySelector("table");
  if (!table) return [];

  // Ambil row header pertama yang punya kolom paling relevan.
  const headerRows = Array.from(table.querySelectorAll("thead tr"));

  let bestHeaders = [];

  for (const tr of headerRows) {
    const headers = Array.from(tr.querySelectorAll("th"))
      .map(th => {
        // Clone supaya bisa buang input/dropdown/filter di dalam th
        const clone = th.cloneNode(true);

        clone
          .querySelectorAll("input, select, button, .p-column-filter, .p-dropdown, .p-calendar")
          .forEach(el => el.remove());

        return normalizeHeaderText(clone.textContent);
      })
      .filter(h => !isBadHeader(h));

    if (headers.length > bestHeaders.length) {
      bestHeaders = headers;
    }
  }

  // Fallback manual kalau header tabel tidak kebaca bersih
  if (!bestHeaders.length) {
    bestHeaders = [
      "Masa Pajak",
      "Nomor Pemotongan",
      "Status",
      "Status Tanda Tangan Elektronik",
      "NITKU/Nomor Identitas Sub Unit Organisasi",
      "Jenis Pajak",
      "Kode Objek Pajak",
      "Nomor Identitas WP",
      "Nama",
      "Dasar Pengenaan Pajak (Rp)",
      "Pajak Penghasilan (Rp)",
      "Fasilitas Pajak",
      "Dilaporkan Dalam SPT",
      "Dalam Proses Keberatan",
      "Selesai Proses Keberatan",
      "Keberatan tidak memenuhi persyaratan (Tolak Formal)",
      "Dalam Proses Reviu Pencabutan Permohonan Keberatan",
      "Pencabutan Keberatan Diterima",
      "SPT Telah/Sedang Diperiksa",
      "SPT Dalam Penanganan Hukum",
      "Sedang Dalam Proses Pengembalian"
    ];
  }

  return bestHeaders;
}

function captureTableHeadersIfNeeded() {
  const headers = getTableHeaders();

  if (headers.length) {
    capturedHeaders = headers;
  }

  return capturedHeaders;
}

function cleanCellValueByHeader(rawValue, header) {
  let value = cleanText(rawValue);
  const h = cleanText(header);

  if (!value || !h) return value;

  // Hapus prefix label responsive: "Nomor Pemotongan 2604RKI4R" -> "2604RKI4R"
  if (value.toLowerCase().startsWith(h.toLowerCase() + " ")) {
    value = value.slice(h.length).trim();
  }

  // Beberapa label bisa beda tipis
  const aliases = {
    "Nomor Pemotongan": ["Nomor Bukti Potong", "Nomor Pemotongan"],
    "NITKU/Nomor Identitas Sub Unit Organisasi": [
      "NITKU/Nomor Identitas Sub Unit Organisasi",
      "NITKU",
      "Nomor Identitas Sub Unit Organisasi"
    ],
    "Dasar Pengenaan Pajak (Rp)": ["Dasar Pengenaan Pajak (Rp)", "Dasar Pengenaan Pajak"],
    "Pajak Penghasilan (Rp)": ["Pajak Penghasilan (Rp)", "Pajak Penghasilan"]
  };

  const possibleLabels = aliases[h] || [h];

  for (const label of possibleLabels) {
    const l = cleanText(label);
    if (value.toLowerCase().startsWith(l.toLowerCase() + " ")) {
      value = value.slice(l.length).trim();
      break;
    }
  }

  return value;
}

function getRealDataCells(row) {
  const tds = Array.from(row.children);

  // Buang kolom kosong/action kalau jumlah td lebih banyak dari header.
  // Tapi tetap jangan agresif; kita nanti align dari kanan/kiri sesuai jumlah header.
  return tds.map(td => {
    const clone = td.cloneNode(true);

    // Hilangkan tombol/icon/action agar tidak masuk CSV
    clone
      .querySelectorAll("button, svg, i, .pi, .p-button, .p-checkbox")
      .forEach(el => el.remove());

    return cleanText(clone.textContent);
  });
}

function extractRowAllColumns(row) {
  const headers = captureTableHeadersIfNeeded();
  let cells = getRealDataCells(row);

  // Buang leading cell kosong / action cell jika tabel punya kolom ekstra di depan
  while (cells.length > headers.length && !cells[0]) {
    cells.shift();
  }

  // Kalau masih lebih banyak, ambil sebanyak jumlah header dari belakang/posisi data utama.
  // Dari CSV Anda, 2 kolom awal kosong lalu data mulai di kolom "Masa Pajak". Jadi ini penting.
  if (cells.length > headers.length) {
    const firstMeaningfulIdx = cells.findIndex(v =>
      /^Masa Pajak\b/i.test(v) ||
      /^Nomor Pemotongan\b/i.test(v)
    );

    if (firstMeaningfulIdx >= 0) {
      cells = cells.slice(firstMeaningfulIdx, firstMeaningfulIdx + headers.length);
    } else {
      cells = cells.slice(0, headers.length);
    }
  }

  const obj = {};

  headers.forEach((header, i) => {
    obj[header] = cleanCellValueByHeader(cells[i] || "", header);
  });

  return obj;
}

function getNomorFromRow(row) {
  const data = extractRowAllColumns(row);

  return (
    data["Nomor Pemotongan"] ||
    data["Nomor Bukti Potong"] ||
    ""
  );
}

function makeRowKey(row) {
  const data = extractRowAllColumns(row);
  return data["Nomor Pemotongan"] || data["Nomor Bukti Potong"] || JSON.stringify(data);
}

function pushCapturedRow(row, extra = {}) {
  const data = extractRowAllColumns(row);
  const key = data["Nomor Pemotongan"] || data["Nomor Bukti Potong"] || JSON.stringify(data);

  if (downloaded.has(key)) return false;

  downloaded.add(key);

  capturedRows.push({
    ...data,
    ...extra
  });

  return true;
}

  /**********************
   * MODAL
   **********************/
  function createModal() {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

      #autoDownloaderBPPUModal {
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
        animation: bppu-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes bppu-slideIn {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .bppu-top-bar {
        height: 3px;
        background: linear-gradient(90deg, #3882f6, #2563eb, #7c3aed, #3882f6);
        background-size: 300% 100%;
        animation: bppu-shimmer 2s linear infinite;
      }

      .bppu-top-bar.done {
        background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #16a34a);
        background-size: 300% 100%;
        animation: bppu-shimmer 2s linear infinite;
      }

      @keyframes bppu-shimmer {
        0%   { background-position: 100% 0; }
        100% { background-position: -200% 0; }
      }

      .bppu-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .bppu-header-icon {
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

      .bppu-header-icon img {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }

      .bppu-header-text {
        flex: 1;
        min-width: 0;
      }

      .bppu-header-title {
        font-size: 13px;
        font-weight: 600;
        color: #f0f2f8;
        letter-spacing: -0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bppu-header-subtitle {
        font-size: 10.5px;
        color: #4e5668;
        margin-top: 1px;
        letter-spacing: 0.02em;
      }

      #bppuCloseBtn {
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

      #bppuCloseBtn.visible {
        display: flex;
      }

      #bppuCloseBtn:hover {
        background: rgba(239, 68, 68, 0.12);
        color: #f87171;
      }

      .bppu-status-badge {
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

      .bppu-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #3882f6;
        flex-shrink: 0;
        animation: bppu-pulse 1.6s ease-in-out infinite;
      }

      .bppu-status-badge.done .bppu-status-dot {
        background: #22c55e;
        box-shadow: 0 0 6px rgba(34,197,94,0.5);
        animation: none;
      }

      .bppu-status-badge.done {
        background: rgba(34,197,94,0.08);
        border-color: rgba(34,197,94,0.2);
        color: #4ade80;
      }

      .bppu-status-badge.error {
        background: rgba(239,68,68,0.08);
        border-color: rgba(239,68,68,0.2);
        color: #f87171;
      }

      .bppu-status-badge.error .bppu-status-dot {
        background: #ef4444;
        box-shadow: 0 0 6px rgba(239,68,68,0.5);
        animation: none;
      }

      @keyframes bppu-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.4; transform: scale(0.85); }
      }

      #autoStatus {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .bppu-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 12px 16px;
      }

      .bppu-metric {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 9px;
        padding: 9px 11px;
      }

      .bppu-metric-label {
        font-size: 10px;
        color: #4e5668;
        font-weight: 500;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .bppu-metric-value {
        font-family: 'DM Mono', monospace;
        font-size: 16px;
        font-weight: 500;
        color: #e2e8f0;
        line-height: 1;
      }

      .bppu-metric-value.accent {
        color: #3882f6;
      }

      .bppu-metric-value.small {
        font-size: 13px;
      }

      .bppu-footer {
        padding: 10px 16px 14px;
        border-top: 1px solid rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .bppu-footer-icon {
        font-size: 11px;
        opacity: 0.5;
      }

      .bppu-footer-text {
        font-size: 10.5px;
        color: #4e5668;
        line-height: 1.4;
        font-style: italic;
      }

      #bppuDownloadCsvBtn {
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

      #bppuDownloadCsvBtn.visible {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      #bppuDownloadCsvBtn:hover {
        background: rgba(37,99,235,0.2);
      }
    `;

    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "autoDownloaderBPPUModal";

    modal.innerHTML = `
      <div class="bppu-top-bar" id="bppuTopBar"></div>

      <div class="bppu-header">
        <div class="bppu-header-icon">
          <img src="${EXT_ICON}" />
        </div>
        <div class="bppu-header-text">
          <div class="bppu-header-title">Tukang Kunting</div>
          <div class="bppu-header-subtitle">Sedia Tukang Sebelum Hujan.</div>
        </div>
        <button id="bppuCloseBtn" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="bppu-status-badge" id="statusBadge">
        <div class="bppu-status-dot"></div>
        <span id="autoStatus">Starting...</span>
      </div>

      <div class="bppu-metrics">
        <div class="bppu-metric">
          <div class="bppu-metric-label">Page</div>
          <div class="bppu-metric-value accent" id="pageNumber">—</div>
        </div>
        <div class="bppu-metric">
          <div class="bppu-metric-label">Downloaded</div>
          <div class="bppu-metric-value" id="downloadCount">0</div>
        </div>
        <div class="bppu-metric" style="grid-column:1/-1">
          <div class="bppu-metric-label">Delay</div>
          <div class="bppu-metric-value small">
            ${GLOBAL_DELAY}
            <span style="font-size:10px;color:#4e5668;font-family:'DM Sans',sans-serif;">ms</span>
          </div>
        </div>
      </div>

      <div class="bppu-footer">
        <span class="bppu-footer-icon">⚠️</span>
        <span class="bppu-footer-text">Jangan klik apa-apa sampai selesai.</span>
        <button id="bppuExportOnlyBtn" title="Export semua kolom tanpa download PDF" style="
          margin-left:auto;
          padding:4px 10px;
          font-size:11px;
          border-radius:999px;
          border:1px solid rgba(34,197,94,0.6);
          background:rgba(22,163,74,0.1);
          color:#86efac;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          gap:4px;
          font-family:'DM Sans', system-ui, sans-serif;
        ">
          📄 Export
        </button>

        <button id="bppuDownloadCsvBtn" title="Download CSV hasil proses" style="
          padding:4px 10px;
          font-size:11px;
          border-radius:999px;
          border:1px solid rgba(56,130,246,0.6);
          background:rgba(37,99,235,0.1);
          color:#93c5fd;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          gap:4px;
          font-family:'DM Sans', system-ui, sans-serif;
        ">
          ⬇ CSV
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("bppuCloseBtn").onclick = () => modal.remove();

    const btn = document.getElementById("bppuDownloadCsvBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        try {
          downloadCSVOfSuccess();
        } catch (err) {
          console.error("Gagal membuat CSV:", err);
        }
      });
    }

    const exportBtn = document.getElementById("bppuExportOnlyBtn");

    if (exportBtn) {
      exportBtn.addEventListener("click", async () => {
        try {
          await runExportOnly();
        } catch (err) {
          console.error("Gagal export-only:", err);
          updateStatus("ERROR ❌ Cek console.");
        }
      });
    }
  }

  function updateStatus(t) {
    const el       = document.getElementById("autoStatus");
    const badge    = document.getElementById("statusBadge");
    const bar      = document.getElementById("bppuTopBar");
    const closeBtn = document.getElementById("bppuCloseBtn");
    const csvBtn   = document.getElementById("bppuDownloadCsvBtn");

    if (!el || !badge) return;
    el.textContent = t;

    if (t === "DONE") {
      badge.classList.add("done");
      bar?.classList.add("done");
      closeBtn?.classList.add("visible");
      csvBtn?.classList.add("visible");
    }
    if (t === "ERROR ❌ Cek console.") {
      badge.classList.add("error");
      closeBtn?.classList.add("visible");
    }
  }

  function updateCounter() {
    const el = document.getElementById("downloadCount");
    if (el) el.textContent = totalDownloaded;
  }

  function updatePage() {
    const el = document.getElementById("pageNumber");
    if (el) el.textContent = getPage() || "—";
  }

  createModal();

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function getRows() {
    return document.querySelectorAll("table tbody tr");
  }

  function getPage() {
    return document.querySelector(".p-paginator-bottom .p-highlight")?.textContent?.trim();
  }

  function getNext() {
    return document.querySelector(".p-paginator-bottom .p-paginator-next");
  }

  function hasSpinner() {
    return !!(
      document.querySelector(".p-datatable-loading-overlay") ||
      document.querySelector(".p-progress-spinner")
    );
  }

  async function waitSpinner(timeout) {
    const start = Date.now();
    const max = timeout || Math.max(GLOBAL_DELAY * 10, 8000);

    if (hasSpinner()) {
      while (Date.now() - start < max) {
        if (!hasSpinner()) return;
        await sleep(BASE_POLL);
      }
    } else {
      await sleep(Math.min(BASE_POLL * 2, 600));
    }
  }

  function humanClick(el) {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;

    ["mouseover", "mousedown", "mouseup", "click"].forEach(t => {
      el.dispatchEvent(new MouseEvent(t, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button: 0
      }));
    });
  }

  async function clickDownload(row, nomor) {
    const btn = row.querySelector("button#DownloadButton")
      || row.querySelector("button .pi-file-pdf")?.closest("button");

    if (!btn) return false;

    humanClick(btn);

    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_AFTER_CLICK) {
      if (hasSpinner()) {
        await waitSpinner();
        break;
      }
      await sleep(BASE_POLL);
    }

    return true;
  }

  async function processPage() {
    updatePage();

    const page = getPage();

    updateStatus(
      isExportOnlyMode
        ? `Page ${page} exporting...`
        : `Page ${page} scanning...`
    );

    await waitSpinner();

    while (true) {
      const rows = Array.from(getRows());
      if (!rows.length) break;

      let found = false;

      for (const row of rows) {
        const nomor = getNomorFromRow(row);
        if (!nomor) continue;

        // Kalau sudah pernah diproses, skip
        if (downloaded.has(nomor)) continue;

        found = true;

        if (isExportOnlyMode) {
          // Mode export saja: tidak klik download
          const pushed = pushCapturedRow(row, {
            Page: getPage() || "",
            ExportedAt: new Date().toISOString()
          });

          if (pushed) {
            totalDownloaded++;
            updateCounter();
          }

          await sleep(Math.max(GLOBAL_DELAY / 2, 150));
          continue;
        }

        // Mode download normal
        updateStatus("Downloading...");

        let ok = false;

        for (let i = 0; i < DOWNLOAD_RETRY; i++) {
          ok = await clickDownload(row, nomor);
          if (ok) break;
          await sleep(GLOBAL_DELAY);
        }

        if (ok) {
          const pushed = pushCapturedRow(row, {
            Page: getPage() || "",
            DownloadedAt: new Date().toISOString()
          });

          if (pushed) {
            totalDownloaded++;
            updateCounter();
          }

          successfulDownloads.push({
            nomor_bukti_potong: nomor,
            page: getPage() || "",
            downloaded_at: new Date().toISOString()
          });
        }

        await sleep(GLOBAL_DELAY);
        break;
      }

      if (!found) break;

      // Di mode export-only, semua rows di page bisa langsung diproses dalam 1 loop.
      // Karena for-loop pakai continue, dia akan lanjut sampai row terakhir.
      if (isExportOnlyMode) break;
    }
  }

  async function runExportOnly() {
    isExportOnlyMode = true;

    downloaded.clear();
    capturedRows.length = 0;
    successfulDownloads.length = 0;
    capturedHeaders = [];
    totalDownloaded = 0;

    updateCounter();
    updateStatus("Starting export...");

    let tries = 0;

    while (tries < 40) {
      if (getRows().length > 0 && document.querySelector(".p-paginator-bottom")) break;
      await sleep(BASE_POLL);
      tries++;
    }

    updatePage();
    captureTableHeadersIfNeeded();

    while (true) {
      await processPage();

      const moved = await nextPage();
      if (!moved) break;
    }

    updateStatus("DONE");

    console.log("📄 DONE EXPORT BPPU. Total:", totalDownloaded);

    downloadCSVOfSuccess();

    try {
      chrome.runtime.sendMessage({
        action: "batchComplete",
        module: "BPPU & BPNR Export",
        summary: `${totalDownloaded} data berhasil diexport`,
        failCount: 0
      });

      chrome.runtime.sendMessage({
        action: "saveActivityLog",
        entry: {
          module: "BPPU & BPNR Export",
          total: totalDownloaded,
          success: totalDownloaded,
          failed: 0,
          skipped: 0,
          timestamp: Date.now(),
          url: window.location.href
        }
      });
    } catch (e) {
      // non-critical
    }
  }

  async function nextPage() {
    const next = getNext();
    if (!next || next.classList.contains("p-disabled")) return false;

    const old = getPage();
    humanClick(next);

    let tries = 0;
    while (tries < 40) {
      await sleep(BASE_POLL);
      if (getPage() !== old) break;
      tries++;
    }

    await waitSpinner();
    updatePage();
    return true;
  }

  async function run() {
    isExportOnlyMode = false;
    downloaded.clear();
    capturedRows.length = 0;
    successfulDownloads.length = 0;
    capturedHeaders = [];
    totalDownloaded = 0;
    updateStatus("Starting...");

    let tries = 0;
    while (tries < 40) {
      if (getRows().length > 0 && document.querySelector(".p-paginator-bottom")) break;
      await sleep(BASE_POLL);
      tries++;
    }

    updatePage();

    while (true) {
      await processPage();
      const moved = await nextPage();
      if (!moved) break;
    }

    updateStatus("DONE");
    console.log("🎉 DONE BPPU. Total:", totalDownloaded);
    const notifSummary = `${totalDownloaded} berhasil, 0 gagal`;
    try {
      chrome.runtime.sendMessage({ action: "batchComplete", module: "BPPU & BPNR", summary: notifSummary, failCount: 0 });
      chrome.runtime.sendMessage({ action: "saveActivityLog", entry: { module: "BPPU & BPNR", total: totalDownloaded, success: totalDownloaded, failed: 0, skipped: 0, timestamp: Date.now(), url: window.location.href } });
    } catch (e) { /* non-critical */ }
  }

function downloadCSVOfSuccess() {
  const rows = capturedRows;

  if (!rows.length) {
    alert("Tidak ada data.");
    return;
  }

  let headers = capturedHeaders.length
    ? [...capturedHeaders]
    : Object.keys(rows[0]).filter(h => !isBadHeader(h));

  // Tambahkan metadata hanya kalau memang ada
  for (const meta of META_HEADERS) {
    if (rows.some(r => r[meta] !== undefined) && !headers.includes(meta)) {
      headers.push(meta);
    }
  }

  const escapeCSV = (value) => {
    if (value == null) return "";

    let str = String(value).trim();

    // Biar NPWP/NITKU/nomor panjang tidak berubah jadi scientific notation di Excel
    if (/^\d{10,}$/.test(str)) {
      str = `'${str}`;
    }

    if (/[",\n;]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  };

  const csv = [
    headers,
    ...rows.map(row => headers.map(header => row[header] ?? ""))
  ]
    .map(cols => cols.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const mode = isExportOnlyMode ? "export_only" : "downloaded";
  const filename = `bppu_${mode}_${timestamp}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);

  console.log("📁 CSV downloaded:", filename);
}

  try {
    await run();
  } catch (e) {
    console.error("💥 ERROR:", e);
    updateStatus("ERROR ❌ Cek console.");
  }

})();
