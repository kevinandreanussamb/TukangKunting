(async function() {
    async function checkLicense() {
        return new Promise(resolve => {
            if (!chrome?.runtime?.sendMessage) {
                resolve({
                    ok: false,
                    reason: "\x6e\x6f\x5f\x72\x75\x6e\x74\x69\x6d\x65"
                });
                return;
            }
            chrome.runtime.sendMessage({
                action: "\x63\x68\x65\x63\x6b\x4c\x69\x63\x65\x6e\x73\x65"
            }, response => {
                if (chrome.runtime.lastError) {
                    resolve({
                        ok: false,
                        reason: chrome.runtime.lastError.message
                    });
                    return;
                }
                resolve(response || {
                    ok: false,
                    reason: "\x6e\x6f\x5f\x72\x65\x73\x70\x6f\x6e\x73\x65"
                });
            });
        });
    }
    const license = await checkLicense();
    if (!license.ok) {
        console.error("❌ Lisensi tidak valid:", license.reason);
        const notice = document.createElement("div");
        notice.id = "tukang-license-notice";
        notice.style.cssText = `\n      position:fixed;bottom:24px;right:24px;width:300px;\n      background:#0f1117;border:1px solid rgba(239,68,68,.3);\n      border-radius:14px;padding:18px 20px;z-index:999999;\n      font-family:'DM Sans',system-ui,sans-serif;\n      box-shadow:0 16px 48px rgba(0,0,0,.5);\n      animation:tka-slideup .3s cubic-bezier(.16,1,.3,1);\n    `;
        let reasonText = "Lisensi tidak ditemukan.";
        if (license.reason === "\x6c\x69\x73\x65\x6e\x73\x69\x20\x73\x75\x64\x61\x68\x20\x65\x78\x70\x69\x72\x65\x64") {
            reasonText = "Lisensi Anda sudah expired. Hubungi owner untuk perpanjangan.";
        } else if (license.reason === "\x6d\x61\x63\x68\x69\x6e\x65\x20\x63\x6f\x64\x65\x20\x74\x69\x64\x61\x6b\x20\x63\x6f\x63\x6f\x6b") {
            reasonText = "Token tidak cocok dengan perangkat ini.";
        } else if (license.reason === "\x6e\x6f\x5f\x6c\x69\x63\x65\x6e\x73\x65") {
            reasonText = "Belum ada lisensi aktif. Klik icon extension untuk aktivasi.";
        }
        notice.innerHTML = `\n      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">\n        <div style="width:32px;height:32px;background:rgba(239,68,68,.12);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🔒</div>\n        <div>\n          <div style="font-size:13px;font-weight:600;color:#f87171;">Lisensi Tidak Aktif</div>\n          <div style="font-size:11px;color:#4e5668;margin-top:2px;">e-Faktur Downloader</div>\n        </div>\n      </div>\n      <div style="font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:14px;">${reasonText}</div>\n      <button id="tukang-license-close" style="\n        width:100%;padding:9px;border:1px solid rgba(255,255,255,.09);\n        background:rgba(255,255,255,.04);border-radius:8px;\n        color:#a0aec0;font-size:12px;font-weight:500;cursor:pointer;\n        font-family:'DM Sans',sans-serif;transition:background .15s;\n      ">Tutup</button>\n    `;
        document.body.appendChild(notice);
        document.getElementById("tukang-license-close").onclick = () => notice.remove();
        return;
    }
    if (license.expiry) {
        const daysLeft = Math.ceil((license.expiry - Date.now()) / 864e5);
        const expDate = new Date(license.expiry).toLocaleDateString("\x69\x64\x2d\x49\x44", {
            day: "\x6e\x75\x6d\x65\x72\x69\x63",
            month: "\x6c\x6f\x6e\x67",
            year: "\x6e\x75\x6d\x65\x72\x69\x63"
        });
        console.log(`✅ Lisensi aktif — berlaku hingga ${expDate} (${daysLeft} hari lagi)`);
    }
    const downloaded = new Set;
    let totalDownloaded = 0;
    const successfulDownloads = [];
    function getDelay(key, defaultValue = 0) {
        return new Promise(resolve => {
            if (!chrome?.storage?.local) return resolve(defaultValue);
            chrome.storage.local.get([ key ], res => {
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
    const GLOBAL_DELAY = await getDelay("\x64\x65\x6c\x61\x79\x5f\x62\x70\x70\x75", DEFAULT_DELAY);
    const DOWNLOAD_RETRY = 3;
    const MAX_WAIT_AFTER_CLICK = Math.max(GLOBAL_DELAY * 16, 8e3);
    const BASE_POLL = Math.max(GLOBAL_DELAY, 300);
    const EXT_ICON = chrome.runtime.getURL("icon.png");
    function createModal() {
        const style = document.createElement("style");
        style.textContent = `\n      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');\n\n      #autoDownloaderBPPUModal {\n        position: fixed;\n        bottom: 24px;\n        right: 24px;\n        width: 280px;\n        background: #0f1117;\n        border: 1px solid rgba(255,255,255,0.08);\n        border-radius: 16px;\n        box-shadow:\n          0 0 0 1px rgba(255,255,255,0.04),\n          0 24px 48px rgba(0,0,0,0.6),\n          0 0 60px rgba(56,130,246,0.07);\n        z-index: 999999;\n        font-family: 'DM Sans', system-ui, sans-serif;\n        overflow: hidden;\n        animation: bppu-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n      }\n\n      @keyframes bppu-slideIn {\n        from { opacity: 0; transform: translateY(16px) scale(0.97); }\n        to   { opacity: 1; transform: translateY(0) scale(1); }\n      }\n\n      .bppu-top-bar {\n        height: 3px;\n        background: linear-gradient(90deg, #3882f6, #2563eb, #7c3aed, #3882f6);\n        background-size: 300% 100%;\n        animation: bppu-shimmer 2s linear infinite;\n      }\n\n      .bppu-top-bar.done {\n        background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #16a34a);\n        background-size: 300% 100%;\n        animation: bppu-shimmer 2s linear infinite;\n      }\n\n      @keyframes bppu-shimmer {\n        0%   { background-position: 100% 0; }\n        100% { background-position: -200% 0; }\n      }\n\n      .bppu-header {\n        display: flex;\n        align-items: center;\n        gap: 10px;\n        padding: 14px 16px 10px;\n        border-bottom: 1px solid rgba(255,255,255,0.06);\n      }\n\n      .bppu-header-icon {\n        width: 30px;\n        height: 30px;\n        background: linear-gradient(135deg, #f6ece1, #f6ece1);\n        border-radius: 8px;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-shrink: 0;\n        box-shadow: 0 3px 10px rgba(56,130,246,0.3);\n      }\n\n      .bppu-header-icon img {\n        width: 18px;\n        height: 18px;\n        object-fit: contain;\n      }\n\n      .bppu-header-text {\n        flex: 1;\n        min-width: 0;\n      }\n\n      .bppu-header-title {\n        font-size: 13px;\n        font-weight: 600;\n        color: #f0f2f8;\n        letter-spacing: -0.01em;\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis;\n      }\n\n      .bppu-header-subtitle {\n        font-size: 10.5px;\n        color: #4e5668;\n        margin-top: 1px;\n        letter-spacing: 0.02em;\n      }\n\n      #bppuCloseBtn {\n        width: 26px;\n        height: 26px;\n        border: none;\n        background: transparent;\n        cursor: pointer;\n        border-radius: 7px;\n        display: none;\n        align-items: center;\n        justify-content: center;\n        color: #4e5668;\n        flex-shrink: 0;\n        transition: background 0.15s, color 0.15s;\n        padding: 0;\n      }\n\n      #bppuCloseBtn.visible {\n        display: flex;\n      }\n\n      #bppuCloseBtn:hover {\n        background: rgba(239, 68, 68, 0.12);\n        color: #f87171;\n      }\n\n      .bppu-status-badge {\n        display: inline-flex;\n        align-items: center;\n        gap: 5px;\n        background: rgba(56,130,246,0.1);\n        border: 1px solid rgba(56,130,246,0.2);\n        border-radius: 20px;\n        padding: 4px 10px;\n        font-size: 11.5px;\n        color: #7aa8f5;\n        font-weight: 500;\n        margin: 12px 16px 0;\n        max-width: calc(100% - 32px);\n        box-sizing: border-box;\n        min-height: 26px;\n        transition: background 0.4s, border-color 0.4s, color 0.4s;\n      }\n\n      .bppu-status-dot {\n        width: 6px;\n        height: 6px;\n        border-radius: 50%;\n        background: #3882f6;\n        flex-shrink: 0;\n        animation: bppu-pulse 1.6s ease-in-out infinite;\n      }\n\n      .bppu-status-badge.done .bppu-status-dot {\n        background: #22c55e;\n        box-shadow: 0 0 6px rgba(34,197,94,0.5);\n        animation: none;\n      }\n\n      .bppu-status-badge.done {\n        background: rgba(34,197,94,0.08);\n        border-color: rgba(34,197,94,0.2);\n        color: #4ade80;\n      }\n\n      .bppu-status-badge.error {\n        background: rgba(239,68,68,0.08);\n        border-color: rgba(239,68,68,0.2);\n        color: #f87171;\n      }\n\n      .bppu-status-badge.error .bppu-status-dot {\n        background: #ef4444;\n        box-shadow: 0 0 6px rgba(239,68,68,0.5);\n        animation: none;\n      }\n\n      @keyframes bppu-pulse {\n        0%, 100% { opacity: 1; transform: scale(1); }\n        50%       { opacity: 0.4; transform: scale(0.85); }\n      }\n\n      #autoStatus {\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        max-width: 100%;\n      }\n\n      .bppu-metrics {\n        display: grid;\n        grid-template-columns: 1fr 1fr;\n        gap: 8px;\n        padding: 12px 16px;\n      }\n\n      .bppu-metric {\n        background: rgba(255,255,255,0.03);\n        border: 1px solid rgba(255,255,255,0.06);\n        border-radius: 9px;\n        padding: 9px 11px;\n      }\n\n      .bppu-metric-label {\n        font-size: 10px;\n        color: #4e5668;\n        font-weight: 500;\n        letter-spacing: 0.07em;\n        text-transform: uppercase;\n        margin-bottom: 4px;\n      }\n\n      .bppu-metric-value {\n        font-family: 'DM Mono', monospace;\n        font-size: 16px;\n        font-weight: 500;\n        color: #e2e8f0;\n        line-height: 1;\n      }\n\n      .bppu-metric-value.accent {\n        color: #3882f6;\n      }\n\n      .bppu-metric-value.small {\n        font-size: 13px;\n      }\n\n      .bppu-footer {\n        padding: 10px 16px 14px;\n        border-top: 1px solid rgba(255,255,255,0.05);\n        display: flex;\n        align-items: center;\n        gap: 6px;\n      }\n\n      .bppu-footer-icon {\n        font-size: 11px;\n        opacity: 0.5;\n      }\n\n      .bppu-footer-text {\n        font-size: 10.5px;\n        color: #4e5668;\n        line-height: 1.4;\n        font-style: italic;\n      }\n\n      #bppuDownloadCsvBtn {\n        margin-left: auto;\n        padding: 4px 10px;\n        font-size: 11px;\n        border-radius: 999px;\n        border: 1px solid rgba(56,130,246,0.6);\n        background: rgba(37,99,235,0.1);\n        color: #93c5fd;\n        cursor: pointer;\n        display: none;\n        font-family: 'DM Sans', system-ui, sans-serif;\n      }\n\n      #bppuDownloadCsvBtn.visible {\n        display: inline-flex;\n        align-items: center;\n        gap: 4px;\n      }\n\n      #bppuDownloadCsvBtn:hover {\n        background: rgba(37,99,235,0.2);\n      }\n    `;
        document.head.appendChild(style);
        const modal = document.createElement("div");
        modal.id = "autoDownloaderBPPUModal";
        modal.innerHTML = `\n      <div class="bppu-top-bar" id="bppuTopBar"></div>\n\n      <div class="bppu-header">\n        <div class="bppu-header-icon">\n          <img src="${EXT_ICON}" />\n        </div>\n        <div class="bppu-header-text">\n          <div class="bppu-header-title">Tukang Kunting</div>\n          <div class="bppu-header-subtitle">Sedia Tukang Sebelum Hujan.</div>\n        </div>\n        <button id="bppuCloseBtn" title="Close">\n          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>\n          </svg>\n        </button>\n      </div>\n\n      <div class="bppu-status-badge" id="statusBadge">\n        <div class="bppu-status-dot"></div>\n        <span id="autoStatus">Starting...</span>\n      </div>\n\n      <div class="bppu-metrics">\n        <div class="bppu-metric">\n          <div class="bppu-metric-label">Page</div>\n          <div class="bppu-metric-value accent" id="pageNumber">—</div>\n        </div>\n        <div class="bppu-metric">\n          <div class="bppu-metric-label">Downloaded</div>\n          <div class="bppu-metric-value" id="downloadCount">0</div>\n        </div>\n        <div class="bppu-metric" style="grid-column:1/-1">\n          <div class="bppu-metric-label">Delay</div>\n          <div class="bppu-metric-value small">\n            ${GLOBAL_DELAY}\n            <span style="font-size:10px;color:#4e5668;font-family:'DM Sans',sans-serif;">ms</span>\n          </div>\n        </div>\n      </div>\n\n      <div class="bppu-footer">\n        <span class="bppu-footer-icon">⚠️</span>\n        <span class="bppu-footer-text">Jangan klik apa-apa sampai selesai.</span>\n        <button id="bppuDownloadCsvBtn" title="Download daftar nomor bukti potong">\n          ⬇ CSV\n        </button>\n      </div>\n    `;
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
    }
    function updateStatus(t) {
        const el = document.getElementById("autoStatus");
        const badge = document.getElementById("statusBadge");
        const bar = document.getElementById("bppuTopBar");
        const closeBtn = document.getElementById("bppuCloseBtn");
        const csvBtn = document.getElementById("bppuDownloadCsvBtn");
        if (!el || !badge) return;
        el.textContent = t;
        if (t === "\x44\x4f\x4e\x45") {
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
        return !!(document.querySelector(".p-datatable-loading-overlay") || document.querySelector(".p-progress-spinner"));
    }
    async function waitSpinner(timeout) {
        const start = Date.now();
        const max = timeout || Math.max(GLOBAL_DELAY * 10, 8e3);
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
        [ "mouseover", "mousedown", "mouseup", "click" ].forEach(t => {
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
        const btn = row.querySelector("button#DownloadButton") || row.querySelector("button .pi-file-pdf")?.closest("button");
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
        updateStatus(`Page ${page} scanning...`);
        await waitSpinner();
        while (true) {
            const rows = Array.from(getRows());
            if (!rows.length) break;
            let found = false;
            for (const row of rows) {
                const nomor = row.children[3]?.textContent?.trim();
                if (!nomor) continue;
                if (downloaded.has(nomor)) continue;
                found = true;
                downloaded.add(nomor);
                updateStatus("Downloading...");
                let ok = false;
                for (let i = 0; i < DOWNLOAD_RETRY; i++) {
                    ok = await clickDownload(row, nomor);
                    if (ok) break;
                    await sleep(GLOBAL_DELAY);
                }
                if (ok) {
                    totalDownloaded++;
                    updateCounter();
                    successfulDownloads.push({
                        nomor_bukti_potong: nomor,
                        page: getPage() || "",
                        downloaded_at: (new Date).toISOString()
                    });
                }
                await sleep(GLOBAL_DELAY);
                break;
            }
            if (!found) break;
        }
    }
    async function nextPage() {
        const next = getNext();
        if (!next || next.classList.contains("\x70\x2d\x64\x69\x73\x61\x62\x6c\x65\x64")) return false;
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
        updateStatus("\x44\x4f\x4e\x45");
        console.log("🎉 DONE BPPU. Total:", totalDownloaded);
    }
    function downloadCSVOfSuccess() {
        if (!successfulDownloads.length) {
            alert("Tidak ada data.");
            return;
        }
        const headers = [ "Nomor Bukti Potong", "Page", "Downloaded At" ];
        const rows = successfulDownloads.map(i => {
            let nomorBersih = i.nomor_bukti_potong || "";
            nomorBersih = nomorBersih.toString().trim().replace(/^\s*Nomor\s+Pemotongan\s*/i, "");
            return [ `'${nomorBersih}`, i.page, i.downloaded_at ];
        });
        const escapeCSV = value => {
            if (value == null) return "";
            const str = String(value);
            if (/[",\n;]/.test(str)) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const csv = [ headers, ...rows ].map(r => r.map(escapeCSV).join(",")).join("\r\n");
        const blob = new Blob([ csv ], {
            type: "text/csv;charset=utf-8;"
        });
        const url = URL.createObjectURL(blob);
        const timestamp = (new Date).toISOString().replace(/[:.]/g, "-");
        const filename = `bppu_downloaded_${timestamp}.csv`;
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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