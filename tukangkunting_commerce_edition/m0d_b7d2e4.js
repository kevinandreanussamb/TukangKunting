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
    const downloadedSet = new Set;
    const successfulDownloads = [];
    let totalDownloaded = 0;
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
    const GLOBAL_DELAY = await getDelay("\x64\x65\x6c\x61\x79\x5f\x64\x6f\x6b\x75\x6d\x65\x6e\x5f\x61\x6c\x6c", DEFAULT_DELAY);
    const DOWNLOAD_RETRY = 3;
    const BASE_POLL = Math.max(Math.min(GLOBAL_DELAY, 1e3), 250);
    const PAGE_MOVE_TIMEOUT = Math.max(GLOBAL_DELAY * 12, 1e4);
    const PAGINATOR_SETTLE_TIMEOUT = Math.max(GLOBAL_DELAY * 10, 6e3);
    console.log("⏳ PPN ROW DELAY:", GLOBAL_DELAY);
    console.log("⏳ PAGE_MOVE_TIMEOUT:", PAGE_MOVE_TIMEOUT);
    console.log("⏳ PAGINATOR_SETTLE_TIMEOUT:", PAGINATOR_SETTLE_TIMEOUT);
    const EXT_ICON = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL("icon.png") : "";
    createModal();
    function createModal() {
        const style = document.createElement("style");
        style.textContent = `\n      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');\n\n      #rowDownloaderModal {\n        position: fixed;\n        bottom: 24px;\n        right: 24px;\n        width: 280px;\n        background: #0f1117;\n        border: 1px solid rgba(255,255,255,0.08);\n        border-radius: 16px;\n        box-shadow:\n          0 0 0 1px rgba(255,255,255,0.04),\n          0 24px 48px rgba(0,0,0,0.6),\n          0 0 60px rgba(56,130,246,0.07);\n        z-index: 999999;\n        font-family: 'DM Sans', system-ui, sans-serif;\n        overflow: hidden;\n        animation: row-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n      }\n\n      @keyframes row-slideIn {\n        from { opacity: 0; transform: translateY(16px) scale(0.97); }\n        to   { opacity: 1; transform: translateY(0) scale(1); }\n      }\n\n      .row-top-bar {\n        height: 3px;\n        background: linear-gradient(90deg, #3882f6, #2563eb, #7c3aed, #3882f6);\n        background-size: 300% 100%;\n        animation: row-shimmer 2s linear infinite;\n      }\n\n      .row-top-bar.done {\n        background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #16a34a);\n        background-size: 300% 100%;\n        animation: row-shimmer 2s linear infinite;\n      }\n\n      @keyframes row-shimmer {\n        0%   { background-position: 100% 0; }\n        100% { background-position: -200% 0; }\n      }\n\n      .row-header {\n        display: flex;\n        align-items: center;\n        gap: 10px;\n        padding: 14px 16px 10px;\n        border-bottom: 1px solid rgba(255,255,255,0.06);\n      }\n\n      .row-header-icon {\n        width: 30px;\n        height: 30px;\n        background: linear-gradient(135deg, #f6ece1, #f6ece1);\n        border-radius: 8px;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-shrink: 0;\n        box-shadow: 0 3px 10px rgba(56,130,246,0.3);\n      }\n\n      .row-header-icon img {\n        width: 18px;\n        height: 18px;\n        object-fit: contain;\n      }\n\n      .row-header-text {\n        flex: 1;\n        min-width: 0;\n      }\n\n      .row-header-title {\n        font-size: 13px;\n        font-weight: 600;\n        color: #f0f2f8;\n        letter-spacing: -0.01em;\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis;\n      }\n\n      .row-header-subtitle {\n        font-size: 10.5px;\n        color: #4e5668;\n        margin-top: 1px;\n        letter-spacing: 0.02em;\n      }\n\n      #rowCloseBtn {\n        width: 26px;\n        height: 26px;\n        border: none;\n        background: transparent;\n        cursor: pointer;\n        border-radius: 7px;\n        display: none;\n        align-items: center;\n        justify-content: center;\n        color: #4e5668;\n        flex-shrink: 0;\n        transition: background 0.15s, color 0.15s;\n        padding: 0;\n      }\n\n      #rowCloseBtn.visible {\n        display: flex;\n      }\n\n      #rowCloseBtn:hover {\n        background: rgba(239, 68, 68, 0.12);\n        color: #f87171;\n      }\n\n      .row-status-badge {\n        display: inline-flex;\n        align-items: center;\n        gap: 5px;\n        background: rgba(56,130,246,0.1);\n        border: 1px solid rgba(56,130,246,0.2);\n        border-radius: 20px;\n        padding: 4px 10px;\n        font-size: 11.5px;\n        color: #7aa8f5;\n        font-weight: 500;\n        margin: 12px 16px 0;\n        max-width: calc(100% - 32px);\n        box-sizing: border-box;\n        min-height: 26px;\n        transition: background 0.4s, border-color 0.4s, color 0.4s;\n      }\n\n      .row-status-dot {\n        width: 6px;\n        height: 6px;\n        border-radius: 50%;\n        background: #3882f6;\n        flex-shrink: 0;\n        animation: row-pulse 1.6s ease-in-out infinite;\n      }\n\n      .row-status-badge.done .row-status-dot {\n        background: #22c55e;\n        box-shadow: 0 0 6px rgba(34,197,94,0.5);\n        animation: none;\n      }\n\n      .row-status-badge.done {\n        background: rgba(34,197,94,0.08);\n        border-color: rgba(34,197,94,0.2);\n        color: #4ade80;\n      }\n\n      .row-status-badge.error {\n        background: rgba(239,68,68,0.08);\n        border-color: rgba(239,68,68,0.2);\n        color: #f87171;\n      }\n\n      .row-status-badge.error .row-status-dot {\n        background: #ef4444;\n        box-shadow: 0 0 6px rgba(239,68,68,0.5);\n        animation: none;\n      }\n\n      @keyframes row-pulse {\n        0%, 100% { opacity: 1; transform: scale(1); }\n        50%       { opacity: 0.4; transform: scale(0.85); }\n      }\n\n      #rowAutoStatus {\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis;\n        max-width: 100%;\n      }\n\n      .row-metrics {\n        display: grid;\n        grid-template-columns: 1fr 1fr;\n        gap: 8px;\n        padding: 12px 16px;\n      }\n\n      .row-metric {\n        background: rgba(255,255,255,0.03);\n        border: 1px solid rgba(255,255,255,0.06);\n        border-radius: 9px;\n        padding: 9px 11px;\n      }\n\n      .row-metric-label {\n        font-size: 10px;\n        color: #4e5668;\n        font-weight: 500;\n        letter-spacing: 0.07em;\n        text-transform: uppercase;\n        margin-bottom: 4px;\n      }\n\n      .row-metric-value {\n        font-family: 'DM Mono', monospace;\n        font-size: 16px;\n        font-weight: 500;\n        color: #e2e8f0;\n        line-height: 1;\n      }\n\n      .row-metric-value.accent {\n        color: #3882f6;\n      }\n\n      .row-metric-value.small {\n        font-size: 13px;\n      }\n\n      .row-footer {\n        padding: 10px 16px 14px;\n        border-top: 1px solid rgba(255,255,255,0.05);\n        display: flex;\n        align-items: center;\n        gap: 6px;\n      }\n\n      .row-footer-icon {\n        font-size: 11px;\n        opacity: 0.5;\n      }\n\n      .row-footer-text {\n        font-size: 10.5px;\n        color: #4e5668;\n        line-height: 1.4;\n        font-style: italic;\n      }\n\n      #rowDownloadCsvBtn {\n        margin-left: auto;\n        padding: 4px 10px;\n        font-size: 11px;\n        border-radius: 999px;\n        border: 1px solid rgba(56,130,246,0.6);\n        background: rgba(37,99,235,0.1);\n        color: #93c5fd;\n        cursor: pointer;\n        display: none;\n        font-family: 'DM Sans', system-ui, sans-serif;\n      }\n\n      #rowDownloadCsvBtn.visible {\n        display: inline-flex;\n        align-items: center;\n        gap: 4px;\n      }\n\n      #rowDownloadCsvBtn:hover {\n        background: rgba(37,99,235,0.2);\n      }\n    `;
        document.head.appendChild(style);
        const modal = document.createElement("div");
        modal.id = "rowDownloaderModal";
        modal.innerHTML = `\n      <div class="row-top-bar" id="rowTopBar"></div>\n\n      <div class="row-header">\n        <div class="row-header-icon">\n          ${EXT_ICON ? `<img src="${EXT_ICON}" />` : "📄"}\n        </div>\n        <div class="row-header-text">\n          <div class="row-header-title">Tukang Kunting</div>\n          <div class="row-header-subtitle">Sedia Tukang Sebelum Hujan.</div>\n        </div>\n        <button id="rowCloseBtn" title="Close">\n          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">\n            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>\n          </svg>\n        </button>\n      </div>\n\n      <div class="row-status-badge" id="rowStatusBadge">\n        <div class="row-status-dot"></div>\n        <span id="rowAutoStatus">Starting...</span>\n      </div>\n\n      <div class="row-metrics">\n        <div class="row-metric">\n          <div class="row-metric-label">Page</div>\n          <div class="row-metric-value accent" id="rowPageNumber">—</div>\n        </div>\n        <div class="row-metric">\n          <div class="row-metric-label">Downloaded</div>\n          <div class="row-metric-value" id="rowDownloadCount">0</div>\n        </div>\n        <div class="row-metric" style="grid-column:1/-1">\n          <div class="row-metric-label">Delay</div>\n          <div class="row-metric-value small">\n            ${GLOBAL_DELAY}\n            <span style="font-size:10px;color:#4e5668;font-family:'DM Sans',sans-serif;">ms</span>\n          </div>\n        </div>\n      </div>\n\n      <div class="row-footer">\n        <span class="row-footer-icon">⚠️</span>\n        <span class="row-footer-text">Jangan klik apa-apa sampai selesai.</span>\n        <button id="rowDownloadCsvBtn" title="Download daftar dokumen">⬇ CSV</button>\n      </div>\n    `;
        document.body.appendChild(modal);
        document.getElementById("rowCloseBtn").onclick = () => modal.remove();
        const downloadBtn = document.getElementById("rowDownloadCsvBtn");
        if (downloadBtn) {
            downloadBtn.addEventListener("click", () => {
                try {
                    downloadCSVOfSuccess();
                } catch (err) {
                    console.error("Gagal membuat CSV ROW:", err);
                    alert("Terjadi error saat membuat CSV. Cek console.");
                }
            });
        }
    }
    function updateStatus(text) {
        const el = document.getElementById("rowAutoStatus");
        const badge = document.getElementById("rowStatusBadge");
        const bar = document.getElementById("rowTopBar");
        const closeBtn = document.getElementById("rowCloseBtn");
        const downloadBtn = document.getElementById("rowDownloadCsvBtn");
        if (!el || !badge) return;
        el.textContent = text;
        badge.classList.remove("done", "error");
        bar?.classList.remove("done");
        if (text === "\x44\x4f\x4e\x45") {
            badge.classList.add("done");
            bar?.classList.add("done");
            closeBtn?.classList.add("visible");
            downloadBtn?.classList.add("visible");
        } else if (text.startsWith("\x45\x52\x52\x4f\x52")) {
            badge.classList.add("error");
            closeBtn?.classList.add("visible");
            if (successfulDownloads.length > 0) {
                downloadBtn?.classList.add("visible");
            }
        }
    }
    function updateDownloadedCounter() {
        const el = document.getElementById("rowDownloadCount");
        if (el) el.textContent = totalDownloaded;
    }
    function updatePageNumber() {
        const el = document.getElementById("rowPageNumber");
        if (el) el.textContent = getCurrentPageNumber() || "—";
    }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function getRows() {
        return document.querySelectorAll("table tbody tr");
    }
    function getCurrentPageNumber() {
        const selectors = [ ".p-paginator-bottom .p-paginator-page.p-highlight", ".p-paginator .p-paginator-page.p-highlight", ".p-paginator-bottom .p-highlight", ".p-paginator .p-highlight" ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent?.trim()) {
                return el.textContent.trim();
            }
        }
        return null;
    }
    function hasSpinner() {
        const spinner1 = document.querySelector(".p-datatable-loading-overlay");
        const spinner2 = document.querySelector("ui-progress-spinner .p-progress-spinner");
        const spinner3 = document.querySelector("p-progressspinner .p-progress-spinner");
        const spinner4 = document.querySelector(".p-progress-spinner");
        return !!(spinner1 || spinner2 || spinner3 || spinner4);
    }
    function isVisible(el) {
        return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
    }
    function isElementDisabled(el) {
        if (!el) return true;
        return el.disabled === true || el.classList.contains("\x70\x2d\x64\x69\x73\x61\x62\x6c\x65\x64") || el.getAttribute("\x61\x72\x69\x61\x2d\x64\x69\x73\x61\x62\x6c\x65\x64") === "\x74\x72\x75\x65" || el.getAttribute("disabled") !== null;
    }
    function getAllNextButtons() {
        return Array.from(document.querySelectorAll(".p-paginator-next"));
    }
    function getNextButton() {
        const all = getAllNextButtons();
        const visibleAndEnabled = all.find(el => isVisible(el) && !isElementDisabled(el));
        if (visibleAndEnabled) return visibleAndEnabled;
        const visibleAny = all.find(el => isVisible(el));
        if (visibleAny) return visibleAny;
        return all[0] || null;
    }
    function getNextButtonState() {
        const btn = getNextButton();
        return {
            exists: !!btn,
            disabled: btn ? isElementDisabled(btn) : true,
            visible: btn ? isVisible(btn) : false,
            className: btn?.className || "",
            ariaDisabled: btn?.getAttribute("\x61\x72\x69\x61\x2d\x64\x69\x73\x61\x62\x6c\x65\x64") || null,
            html: btn?.outerHTML || ""
        };
    }
    async function waitForNextButton(timeoutMs = 5e3) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const btn = getNextButton();
            if (btn) return btn;
            await sleep(200);
        }
        return null;
    }
    async function waitTableStable(timeoutMs) {
        const effectiveTimeout = timeoutMs || Math.max(GLOBAL_DELAY * 10, 8e3);
        const start = Date.now();
        console.log(`⏳ waitTableStable timeout=${effectiveTimeout}ms`);
        if (hasSpinner()) {
            while (Date.now() - start < effectiveTimeout) {
                if (!hasSpinner()) {
                    console.log("✅ spinner hilang");
                    await sleep(Math.min(BASE_POLL * 2, 700));
                    return;
                }
                await sleep(BASE_POLL);
            }
            console.warn("⚠️ spinner tidak hilang sampai timeout");
        } else {
            await sleep(Math.min(BASE_POLL * 2, 700));
        }
    }
    async function waitForPaginatorReady(timeoutMs = PAGINATOR_SETTLE_TIMEOUT) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const paginator = document.querySelector(".p-paginator");
            const rows = getRows();
            if (paginator && rows.length > 0 && !hasSpinner()) {
                await sleep(Math.min(BASE_POLL, 400));
                return true;
            }
            await sleep(BASE_POLL);
        }
        console.warn("⚠️ waitForPaginatorReady timeout");
        return false;
    }
    async function waitUntilNextButtonSettles(timeoutMs = PAGINATOR_SETTLE_TIMEOUT) {
        const start = Date.now();
        let lastKey = "";
        let stableCount = 0;
        while (Date.now() - start < timeoutMs) {
            const state = getNextButtonState();
            const key = JSON.stringify({
                exists: state.exists,
                disabled: state.disabled,
                visible: state.visible,
                className: state.className,
                ariaDisabled: state.ariaDisabled
            });
            if (key === lastKey) {
                stableCount++;
            } else {
                stableCount = 0;
                lastKey = key;
            }
            if (state.exists && state.visible && stableCount >= 3) {
                console.log("✅ Next button state settled:", state);
                return state;
            }
            await sleep(BASE_POLL);
        }
        const finalState = getNextButtonState();
        console.warn("⚠️ Next button tidak settle sampai timeout, pakai state terakhir:", finalState);
        return finalState;
    }
    function humanClick(element) {
        if (!element) return;
        try {
            const rect = element.getBoundingClientRect();
            const clientX = rect.left + rect.width / 2;
            const clientY = rect.top + rect.height / 2;
            [ "mouseover", "mousedown", "mouseup", "click" ].forEach(type => {
                const evt = new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: clientX,
                    clientY: clientY,
                    button: 0
                });
                element.dispatchEvent(evt);
            });
        } catch (err) {
            console.warn("⚠️ humanClick gagal, fallback ke native click()", err);
            element.click?.();
        }
    }
    async function clickDownloadButton(row, nomorDokumen) {
        const btn = row.querySelector("button#ActionDownloadButton, #ActionDownloadButton");
        if (!btn) {
            console.warn(`⚠️ [${nomorDokumen}] ActionDownloadButton tidak ditemukan di row ini`);
            return false;
        }
        try {
            console.log(`⬇ [${nomorDokumen}] klik tombol download`, btn);
            const beforeHtml = row.innerHTML;
            humanClick(btn);
            const waitMs = Math.max(GLOBAL_DELAY, 500);
            const start = Date.now();
            while (Date.now() - start < waitMs) {
                if (!document.body.contains(row)) {
                    console.log(`✅ [${nomorDokumen}] row hilang / rerender setelah klik`);
                    return true;
                }
                if (row.innerHTML !== beforeHtml) {
                    console.log(`✅ [${nomorDokumen}] row berubah setelah klik`);
                    return true;
                }
                await sleep(150);
            }
            console.log(`ℹ️ [${nomorDokumen}] tidak ada spinner / perubahan DOM, anggap klik sukses`);
            return true;
        } catch (err) {
            console.error(`❌ [${nomorDokumen}] gagal klik tombol download:`, err);
            return false;
        }
    }
    async function processCurrentPage() {
        await waitTableStable();
        await waitForPaginatorReady();
        updatePageNumber();
        const page = getCurrentPageNumber() || "—";
        console.log(`📄 Proses Page ${page}`);
        updateStatus(`Page ${page} - memindai row...`);
        while (true) {
            const rows = Array.from(getRows());
            if (!rows.length) {
                console.log(`⚠️ Page ${page}: tidak ada row.`);
                updateStatus(`Page ${page} kosong.`);
                break;
            }
            let foundNewRow = false;
            for (const row of rows) {
                const nomorDokumen = row.children?.[0]?.textContent?.trim();
                if (!nomorDokumen) continue;
                if (downloadedSet.has(nomorDokumen)) continue;
                foundNewRow = true;
                downloadedSet.add(nomorDokumen);
                console.log(`⬇ Page ${page}: ${nomorDokumen}`);
                updateStatus(`Page ${page} - Downloading...`);
                let ok = false;
                for (let i = 0; i < DOWNLOAD_RETRY; i++) {
                    ok = await clickDownloadButton(row, nomorDokumen);
                    if (ok) break;
                    console.warn(`🔁 Retry download [${nomorDokumen}] ke-${i + 2}`);
                    await sleep(Math.max(GLOBAL_DELAY, 500));
                }
                if (ok) {
                    totalDownloaded++;
                    updateDownloadedCounter();
                    successfulDownloads.push({
                        nomor_dokumen: nomorDokumen,
                        page: getCurrentPageNumber() || page,
                        downloaded_at: (new Date).toISOString()
                    });
                    console.log(`✅ Download dianggap sukses: ${nomorDokumen}`);
                } else {
                    console.error(`❌ Gagal download [${nomorDokumen}] setelah retry`);
                }
                await sleep(Math.max(GLOBAL_DELAY, 400));
                break;
            }
            if (!foundNewRow) {
                console.log(`✅ Selesai Page ${page}, semua dokumen di-scan`);
                updateStatus(`Page ${page} selesai. Total: ${totalDownloaded}`);
                break;
            }
        }
    }
    function downloadCSVOfSuccess() {
        if (!successfulDownloads.length) {
            console.warn("Tidak ada data sukses untuk diexport.");
            alert("Tidak ada dokumen yang berhasil di-download.");
            return;
        }
        const headers = [ "Nomor Dokumen", "Page", "Downloaded At" ];
        const rows = successfulDownloads.map(item => {
            let nomor = item.nomor_dokumen || "";
            nomor = nomor.toString().trim().replace(/^\s*Nomor\s+Dokumen\s*/i, "");
            return [ `'${nomor}`, item.page, item.downloaded_at ];
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
        const filename = `row_dokumen_downloaded_${timestamp}.csv`;
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("📁 CSV downloaded (ROW):", filename);
    }
    async function goToNextPage() {
        await waitTableStable();
        await waitForPaginatorReady();
        updatePageNumber();
        let nextBtn = await waitForNextButton(5e3);
        const currentPage = getCurrentPageNumber() || "—";
        if (!nextBtn) {
            console.log("⛔ Next button tidak ditemukan => stop.");
            return false;
        }
        const preState = await waitUntilNextButtonSettles();
        console.log("🔎 Next button settled BEFORE click:", preState);
        if (!preState.exists || !preState.visible) {
            console.log("⛔ Next button tidak visible => stop.");
            return false;
        }
        if (preState.disabled) {
            console.log("⛔ Next button disabled (final settled state) => stop.");
            return false;
        }
        nextBtn = getNextButton();
        if (!nextBtn) {
            console.log("⛔ Next button hilang sesaat sebelum klik => stop.");
            return false;
        }
        const oldPage = getCurrentPageNumber();
        const oldRows = Array.from(getRows()).map(row => row.innerText.trim()).join("||");
        const oldRowCount = getRows().length;
        console.log(`➡ Klik Next dari Page ${oldPage}, rows=${oldRowCount}`);
        updateStatus(`Page ${oldPage} selesai, pindah page berikutnya...`);
        humanClick(nextBtn);
        const start = Date.now();
        let spinnerSeen = false;
        let moved = false;
        while (Date.now() - start < PAGE_MOVE_TIMEOUT) {
            await sleep(BASE_POLL);
            if (hasSpinner()) {
                spinnerSeen = true;
                console.log("⏳ Spinner terdeteksi saat pindah page");
                await waitTableStable();
                await waitForPaginatorReady();
            }
            const newPage = getCurrentPageNumber();
            const newRows = Array.from(getRows()).map(row => row.innerText.trim()).join("||");
            const newRowCount = getRows().length;
            if (newPage && oldPage && newPage !== oldPage) {
                console.log(`✅ Page berubah: ${oldPage} -> ${newPage}`);
                moved = true;
                break;
            }
            if (newRowCount > 0 && oldRowCount > 0 && newRows !== oldRows) {
                console.log(`✅ Isi row berubah`);
                moved = true;
                break;
            }
            if (newRowCount !== oldRowCount && newRowCount > 0) {
                console.log(`✅ Jumlah row berubah: ${oldRowCount} -> ${newRowCount}`);
                moved = true;
                break;
            }
        }
        if (!spinnerSeen) {
            console.warn("⚠️ Tidak melihat spinner saat klik Next");
        }
        if (!moved) {
            console.warn("⚠️ Tidak mendeteksi perpindahan page setelah klik Next. Anggap stop.");
            return false;
        }
        await waitTableStable();
        await waitForPaginatorReady();
        const postState = await waitUntilNextButtonSettles();
        console.log("🔎 Next button settled AFTER move:", postState);
        updatePageNumber();
        return true;
    }
    async function run() {
        console.log("🚀 STARTING AUTOMATION ROW DOWNLOADER");
        updateStatus("Starting automation...");
        let tries = 0;
        while (tries < 60) {
            const rows = getRows();
            const paginator = document.querySelector(".p-paginator");
            if (rows.length > 0 && paginator) break;
            await sleep(BASE_POLL);
            tries++;
        }
        await waitForPaginatorReady();
        updatePageNumber();
        let safetyPageLoop = 0;
        while (safetyPageLoop < 1e3) {
            await processCurrentPage();
            const moved = await goToNextPage();
            if (!moved) break;
            safetyPageLoop++;
            await sleep(Math.max(GLOBAL_DELAY, 400));
        }
        console.log("🎉 DONE ALL PAGES. Total downloaded:", totalDownloaded);
        updateStatus("\x44\x4f\x4e\x45");
    }
    try {
        await run();
    } catch (e) {
        console.error("💥 ERROR di row_downloader:", e);
        updateStatus("ERROR ❌ Cek console.");
    }
})();