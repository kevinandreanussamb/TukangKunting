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
    const GLOBAL_DELAY = await getDelay("\x64\x65\x6c\x61\x79\x5f\x70\x70\x6e\x5f\x72\x65\x74\x75\x72", DEFAULT_DELAY);
    const DOWNLOAD_RETRY = 3;
    const MAX_WAIT_AFTER_CLICK = Math.max(GLOBAL_DELAY * 16, 8e3);
    const BASE_POLL = Math.max(GLOBAL_DELAY, 300);
    const EXT_ICON = chrome.runtime.getURL("icon.png");
    console.log("⏳ PPN RETUR DELAY:", GLOBAL_DELAY);
    function createModal() {
        const style = document.createElement("style");
        style.textContent = `\n      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');\n\n      #autoDownloaderReturModal {\n        position: fixed;\n        bottom: 24px;\n        right: 24px;\n        width: 280px;\n        background: #0f1117;\n        border: 1px solid rgba(255,255,255,0.08);\n        border-radius: 16px;\n        box-shadow:\n          0 0 0 1px rgba(255,255,255,0.04),\n          0 24px 48px rgba(0,0,0,0.6),\n          0 0 60px rgba(56,130,246,0.07);\n        z-index: 999999;\n        font-family: 'DM Sans', system-ui, sans-serif;\n        overflow: hidden;\n        animation: retur-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n      }\n\n      @keyframes retur-slideIn {\n        from { opacity: 0; transform: translateY(16px) scale(0.97); }\n        to   { opacity: 1; transform: translateY(0) scale(1); }\n      }\n\n      .retur-top-bar {\n        height: 3px;\n        background: linear-gradient(90deg, #3882f6, #2563eb, #7c3aed, #3882f6);\n        background-size: 300% 100%;\n        animation: retur-shimmer 2s linear infinite;\n      }\n\n      .retur-top-bar.done {\n        background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #16a34a);\n        background-size: 300% 100%;\n        animation: retur-shimmer 2s linear infinite;\n      }\n\n      @keyframes retur-shimmer {\n        0%   { background-position: 100% 0; }\n        100% { background-position: -200% 0; }\n      }\n\n      .retur-header {\n        display: flex;\n        align-items: center;\n        gap: 10px;\n        padding: 14px 16px 10px;\n        border-bottom: 1px solid rgba(255,255,255,0.06);\n      }\n\n      .retur-header-icon {\n        width: 30px;\n        height: 30px;\n        background: linear-gradient(135deg, #f6ece1, #f6ece1);\n        border-radius: 8px;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-shrink: 0;\n        box-shadow: 0 3px 10px rgba(56,130,246,0.3);\n      }\n\n      .retur-header-icon img {\n        width: 18px;\n        height: 18px;\n        object-fit: contain;\n      }\n\n      .retur-header-text {\n        flex: 1;\n        min-width: 0;\n      }\n\n      .retur-header-title {\n        font-size: 13px;\n        font-weight: 600;\n        color: #f0f2f8;\n        letter-spacing: -0.01em;\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis;\n      }\n\n      .retur-header-subtitle {\n        font-size: 10.5px;\n        color: #4e5668;\n        margin-top: 1px;\n        letter-spacing: 0.02em;\n      }\n\n      #returCloseBtn {\n        width: 26px;\n        height: 26px;\n        border: none;\n        background: transparent;\n        cursor: pointer;\n        border-radius: 7px;\n        display: none;\n        align-items: center;\n        justify-content: center;\n        color: #4e5668;\n        flex-shrink: 0;\n        transition: background 0.15s, color 0.15s;\n        padding: 0;\n      }\n\n      #returCloseBtn.visible {\n        display: flex;\n      }\n\n      #returCloseBtn:hover {\n        background: rgba(239, 68, 68, 0.12);\n        color: #f87171;\n      }\n\n      .retur-status-badge {\n        display: inline-flex;\n        align-items: center;\n        gap: 5px;\n        background: rgba(56,130,246,0.1);\n        border: 1px solid rgba(56,130,246,0.2);\n        border-radius: 20px;\n        padding: 4px 10px;\n        font-size: 11.5px;\n        color: #7aa8f5;\n        font-weight: 500;\n        margin: 12px 16px 0;\n        max-width: calc(100% - 32px);\n        box-sizing: border-box;\n        min-height: 26px;\n        transition: background 0.4s, border-color 0.4s, color 0.4s;\n      }\n\n      .retur-status-dot {\n        width: 6px;\n        height: 6px;\n        border-radius: 50%;\n        background: #3882f6;\n        flex-shrink: 0;\n        animation: retur-pulse 1.6s ease-in-out infinite;\n      }\n\n      .retur-status-badge.done .retur-status-dot {\n        background: #22c55e;\n        box-shadow: 0 0 6px rgba(34,197,94,0.5);\n        animation: none;\n      }\n\n      .retur-status-badge.done {\n        background: rgba(34,197,94,0.08);\n        border-color: rgba(34,197,94,0.2);\n        color: #4ade80;\n      }\n\n      .retur-status-badge.error {\n        background: rgba(239,68,68,0.08);\n        border-color: rgba(239,68,68,0.2);\n        color: #f87171;\n      }\n\n      .retur-status-badge.error .retur-status-dot {\n        background: #ef4444;\n        box-shadow: 0 0 6px rgba(239,68,68,0.5);\n        animation: none;\n      }\n\n      @keyframes retur-pulse {\n        0%, 100% { opacity: 1; transform: scale(1); }\n        50%       { opacity: 0.4; transform: scale(0.85); }\n      }\n\n      #autoStatus {\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        max-width: 100%;\n      }\n\n      .retur-metrics {\n        display: grid;\n        grid-template-columns: 1fr 1fr;\n        gap: 8px;\n        padding: 12px 16px;\n      }\n\n      .retur-metric {\n        background: rgba(255,255,255,0.03);\n        border: 1px solid rgba(255,255,255,0.06);\n        border-radius: 9px;\n        padding: 9px 11px;\n      }\n\n      .retur-metric-label {\n        font-size: 10px;\n        color: #4e5668;\n        font-weight: 500;\n        letter-spacing: 0.07em;\n        text-transform: uppercase;\n        margin-bottom: 4px;\n      }\n\n      .retur-metric-value {\n        font-family: 'DM Mono', monospace;\n        font-size: 16px;\n        font-weight: 500;\n        color: #e2e8f0;\n        line-height: 1;\n      }\n\n      .retur-metric-value.accent {\n        color: #3882f6;\n      }\n\n      .retur-metric-value.small {\n        font-size: 13px;\n      }\n\n      .retur-footer {\n        padding: 10px 16px 14px;\n        border-top: 1px solid rgba(255,255,255,0.05);\n        display: flex;\n        align-items: center;\n        gap: 6px;\n      }\n\n      .retur-footer-icon {\n        font-size: 11px;\n        opacity: 0.5;\n      }\n\n      .retur-footer-text {\n        font-size: 10.5px;\n        color: #4e5668;\n        line-height: 1.4;\n        font-style: italic;\n      }\n\n      /* 🔹 Tombol Download CSV */\n      #returDownloadCsvBtn {\n        margin-left: auto;\n        padding: 4px 10px;\n        font-size: 11px;\n        border-radius: 999px;\n        border: 1px solid rgba(56,130,246,0.6);\n        background: rgba(37,99,235,0.1);\n        color: #93c5fd;\n        cursor: pointer;\n        display: none;\n        font-family: 'DM Sans', system-ui, sans-serif;\n      }\n\n      #returDownloadCsvBtn.visible {\n        display: inline-flex;\n        align-items: center;\n        gap: 4px;\n      }\n\n      #returDownloadCsvBtn:hover {\n        background: rgba(37,99,235,0.2);\n      }\n    `;
        document.head.appendChild(style);
        const modal = document.createElement("div");
        modal.id = "autoDownloaderReturModal";
        modal.innerHTML = `\n      <div class="retur-top-bar" id="returTopBar"></div>\n\n      <div class="retur-header">\n        <div class="retur-header-icon">\n          <img src="${EXT_ICON}" />\n        </div>\n        <div class="retur-header-text">\n          <div class="retur-header-title">Tukang Kunting</div>\n          <div class="retur-header-subtitle">Sedia Tukang Sebelum Hujan.</div>\n        </div>\n        <button id="returCloseBtn" title="Close">\n          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>\n          </svg>\n        </button>\n      </div>\n\n      <div class="retur-status-badge" id="statusBadge">\n        <div class="retur-status-dot"></div>\n        <span id="autoStatus">Starting...</span>\n      </div>\n\n      <div class="retur-metrics">\n        <div class="retur-metric">\n          <div class="retur-metric-label">Page</div>\n          <div class="retur-metric-value accent" id="pageNumber">—</div>\n        </div>\n        <div class="retur-metric">\n          <div class="retur-metric-label">Downloaded</div>\n          <div class="retur-metric-value" id="downloadCount">0</div>\n        </div>\n        <div class="retur-metric" style="grid-column:1/-1">\n          <div class="retur-metric-label">Delay</div>\n          <div class="retur-metric-value small">\n            ${GLOBAL_DELAY}\n            <span style="font-size:10px;color:#4e5668;font-family:'DM Sans',sans-serif;">ms</span>\n          </div>\n        </div>\n      </div>\n\n      <div class="retur-footer">\n        <span class="retur-footer-icon">⚠️</span>\n        <span class="retur-footer-text">Jangan klik apa-apa sampai selesai.</span>\n        <button id="returDownloadCsvBtn" title="Download daftar nomor retur">\n          ⬇ CSV\n        </button>\n      </div>\n    `;
        document.body.appendChild(modal);
        document.getElementById("returCloseBtn").onclick = () => modal.remove();
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
        const el = document.getElementById("autoStatus");
        const badge = document.getElementById("statusBadge");
        const bar = document.getElementById("returTopBar");
        const closeBtn = document.getElementById("returCloseBtn");
        const downloadBtn = document.getElementById("returDownloadCsvBtn");
        if (!el || !badge) return;
        el.textContent = text;
        if (text === "\x44\x4f\x4e\x45") {
            badge.classList.add("done");
            bar?.classList.add("done");
            closeBtn?.classList.add("visible");
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
        return !!(document.querySelector(".p-datatable-loading-overlay") || document.querySelector("ui-progress-spinner .p-progress-spinner") || document.querySelector("p-progressspinner .p-progress-spinner"));
    }
    async function waitTableStable(timeoutMs) {
        const effectiveTimeout = timeoutMs || Math.max(GLOBAL_DELAY * 10, 8e3);
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
        [ "mouseover", "mousedown", "mouseup", "click" ].forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: clientX,
                clientY: clientY,
                button: 0
            }));
        });
    }
    async function clickDownloadButton(row, nomorRetur) {
        let btn = row.querySelector("button#DownloadButton") || row.querySelector("button .pi-file-pdf")?.closest("button");
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
        return true;
    }
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
                const nomorReturCell = row.children[6];
                let nomorReturRaw = nomorReturCell?.textContent?.trim();
                if (!nomorReturRaw) continue;
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
                        nomor_retur: nomorReturRaw,
                        page: getCurrentPageNumber() || "",
                        downloaded_at: (new Date).toISOString()
                    });
                }
                await sleep(GLOBAL_DELAY);
                break;
            }
            if (!found) break;
        }
    }
    function downloadCSVOfSuccess() {
        if (!successfulDownloads.length) {
            console.warn("Tidak ada data sukses untuk diexport.");
            alert("Tidak ada data nomor retur yang berhasil di-download.");
            return;
        }
        const headers = [ "Nomor Retur", "Page", "Downloaded At" ];
        const rows = successfulDownloads.map(item => {
            let nomorBersih = item.nomor_retur || "";
            nomorBersih = nomorBersih.toString().trim().replace(/^\s*Nomor\s+Retur\s*/i, "");
            return [ `'${nomorBersih}`, item.page, item.downloaded_at ];
        });
        const escapeCSV = value => {
            if (value == null) return "";
            const str = String(value);
            if (/[",\n;]/.test(str)) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const csvContent = [ headers, ...rows ].map(row => row.map(escapeCSV).join(",")).join("\r\n");
        const blob = new Blob([ csvContent ], {
            type: "text/csv;charset=utf-8;"
        });
        const url = URL.createObjectURL(blob);
        const timestamp = (new Date).toISOString().replace(/[:.]/g, "-");
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
    async function goToNextPage() {
        const nextBtn = getNextButton();
        if (!nextBtn || nextBtn.classList.contains("\x70\x2d\x64\x69\x73\x61\x62\x6c\x65\x64")) {
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
        updateStatus("\x44\x4f\x4e\x45");
        console.log("🎉 DONE PPN RETUR. Total:", totalDownloaded);
    }
    try {
        await run();
    } catch (e) {
        console.error("💥 ERROR:", e);
        updateStatus("ERROR ❌ Cek console.");
    }
})();