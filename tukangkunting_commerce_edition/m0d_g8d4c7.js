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
        if (license.reason === "\x6c\x69\x73\x65\x6e\x73\x69\x20\x73\x75\x64\x61\x68\x20\x65\x78\x70\x69\x72\x65\x64") reasonText = "Lisensi Anda sudah expired. Hubungi owner untuk perpanjangan."; else if (license.reason === "\x6d\x61\x63\x68\x69\x6e\x65\x20\x63\x6f\x64\x65\x20\x74\x69\x64\x61\x6b\x20\x63\x6f\x63\x6f\x6b") reasonText = "Token tidak cocok dengan perangkat ini."; else if (license.reason === "\x6e\x6f\x5f\x6c\x69\x63\x65\x6e\x73\x65") reasonText = "Belum ada lisensi aktif. Klik icon extension untuk aktivasi.";
        notice.innerHTML = `\n      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">\n        <div style="width:32px;height:32px;background:rgba(239,68,68,.12);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🔒</div>\n        <div>\n          <div style="font-size:13px;font-weight:600;color:#f87171;">Lisensi Tidak Aktif</div>\n          <div style="font-size:11px;color:#4e5668;margin-top:2px;">Pembatalan Faktur</div>\n        </div>\n      </div>\n      <div style="font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:14px;">${reasonText}</div>\n      <button id="tukang-license-close" style="\n        width:100%;padding:9px;border:1px solid rgba(255,255,255,.09);\n        background:rgba(255,255,255,.04);border-radius:8px;\n        color:#a0aec0;font-size:12px;font-weight:500;cursor:pointer;\n        font-family:'DM Sans',sans-serif;transition:background .15s;\n      ">Tutup</button>\n    `;
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
    const values = window.__pembatalanFakturList;
    const kataSandi = window.__pembatalanPassphrase;
    delete window.__pembatalanFakturList;
    delete window.__pembatalanPassphrase;
    if (!values || values.length === 0) {
        console.error("[Pembatalan Faktur] Tidak ada data faktur untuk diproses.");
        return;
    }
    if (!kataSandi) {
        console.error("[Pembatalan Faktur] Passphrase tidak ditemukan.");
        return;
    }
    let delay = 1500;
    try {
        const res = await chrome.storage.local.get("\x64\x65\x6c\x61\x79\x5f\x70\x65\x6d\x62\x61\x74\x61\x6c\x61\x6e");
        if (res.delay_pembatalan) delay = parseInt(res.delay_pembatalan) || 1500;
    } catch {}
    const BASE_POLL = 300;
    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    function setAngularInputValue(inputEl, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(inputEl, value);
        inputEl.dispatchEvent(new Event("input", {
            bubbles: true
        }));
        inputEl.dispatchEvent(new Event("change", {
            bubbles: true
        }));
    }
    function hasSpinner() {
        const modal = document.querySelector("ui-progress-spinner .modal");
        if (modal && modal.offsetParent !== null) return true;
        const dtLoading = document.querySelector(".p-datatable-loading-overlay");
        if (dtLoading) return true;
        const spinner2 = document.querySelector("ui-progress-spinner .p-progress-spinner");
        const spinner3 = document.querySelector("p-progressspinner .p-progress-spinner");
        if (spinner2 || spinner3) return true;
        return false;
    }
    async function waitSpinnerGone(timeoutMs = 3e4) {
        if (!hasSpinner()) {
            await sleep(Math.min(BASE_POLL, 300));
            return true;
        }
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (!hasSpinner()) return true;
            await sleep(BASE_POLL);
        }
        console.warn("[Spinner] Timeout — spinner tidak hilang");
        return false;
    }
    async function waitForAction(startWindowMs = 1500, finishTimeoutMs = 3e4) {
        const start = Date.now();
        while (Date.now() - start < startWindowMs) {
            if (hasSpinner()) {
                return await waitSpinnerGone(finishTimeoutMs);
            }
            await sleep(50);
        }
        return true;
    }
    function waitForElement(selector, timeoutMs = 2e4) {
        return new Promise(resolve => {
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
    function waitForConfirmDialog(timeoutMs = 2e4) {
        return new Promise(resolve => {
            const start = Date.now();
            const interval = setInterval(() => {
                const dialog = document.querySelector(".p-confirm-dialog");
                if (dialog && dialog.offsetParent !== null) {
                    const acceptBtn = dialog.querySelector(".p-confirm-dialog-accept");
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
    function waitForSigningModal(timeoutMs = 3e4) {
        return new Promise(resolve => {
            const start = Date.now();
            const interval = setInterval(() => {
                const passwordInput = document.getElementById("SignerPassword-input");
                const closeBtn = document.getElementById("button-close");
                if (passwordInput && closeBtn) {
                    clearInterval(interval);
                    resolve({
                        passwordInput: passwordInput,
                        closeBtn: closeBtn
                    });
                    return;
                }
                if (Date.now() - start > timeoutMs) {
                    clearInterval(interval);
                    resolve(null);
                }
            }, 300);
        });
    }
    async function selectSignerProvider(timeoutMs = 1e4) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const dropdown = document.querySelector("#select-SignerProvider .p-dropdown");
            if (dropdown && !dropdown.classList.contains("\x70\x2d\x64\x69\x73\x61\x62\x6c\x65\x64")) {
                const label = dropdown.querySelector(".p-dropdown-label");
                if (label && !label.classList.contains("p-placeholder")) {
                    return true;
                }
                dropdown.click();
                await sleep(500);
                const items = document.querySelectorAll(".p-dropdown-items .p-dropdown-item");
                if (items.length > 0) {
                    items[0].click();
                    await sleep(300);
                    return true;
                }
            }
            await sleep(300);
        }
        return false;
    }
    function waitForToastAppearAndDisappear(timeoutMs = 3e4) {
        return new Promise(resolve => {
            const start = Date.now();
            let toastAppeared = false;
            const interval = setInterval(() => {
                const toastItems = document.querySelectorAll("p-toast p-toastitem");
                const visibleToast = Array.from(toastItems).some(item => item.offsetParent !== null);
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
    function waitForSigningModalClose(timeoutMs = 3e4) {
        return new Promise(resolve => {
            const start = Date.now();
            const interval = setInterval(() => {
                const passwordInput = document.getElementById("SignerPassword-input");
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
        const tbody = document.querySelector("p-table .p-datatable-tbody");
        if (tbody) return tbody;
        const tables = document.querySelectorAll("[id$='-table'] > .p-datatable-tbody");
        return tables.length > 0 ? tables[0] : null;
    }
    function waitForGridPage(timeoutMs = 2e4) {
        return new Promise(resolve => {
            const start = Date.now();
            const interval = setInterval(() => {
                if (document.getElementById("filterTaxInvoiceNumber")) {
                    clearInterval(interval);
                    resolve(true);
                }
                if (Date.now() - start > timeoutMs) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 100);
        });
    }
    const rekapResults = [];
    function downloadRekapCSV() {
        const header = "Nomor Faktur,Status,Keterangan,Waktu Proses";
        const rows = rekapResults.map(r => {
            const fields = [ `'${r.nomorFaktur}`, r.status, `"${(r.keterangan || "").replace(/"/g, '""')}"`, r.waktuProses ];
            return fields.join(",");
        });
        const csvContent = "\ufeff" + header + "\n" + rows.join("\n") + "\n";
        const blob = new Blob([ csvContent ], {
            type: "text/csv;charset=utf-8;"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const now = new Date;
        const timestamp = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "_" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
        a.href = url;
        a.download = `rekap_pembatalan_faktur_${timestamp}.csv`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
    const progressPanel = document.createElement("div");
    progressPanel.id = "tukang-pembatalan-progress";
    progressPanel.style.cssText = `\n    position:fixed;bottom:24px;right:24px;width:360px;\n    background:#0f1117;border:1px solid rgba(255,255,255,.08);\n    border-radius:14px;padding:18px 20px;z-index:999999;\n    font-family:'DM Sans',system-ui,sans-serif;\n    box-shadow:0 16px 48px rgba(0,0,0,.5);color:#e2e8f0;\n  `;
    progressPanel.innerHTML = `\n    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">\n      <div style="width:32px;height:32px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🚫</div>\n      <div>\n        <div style="font-size:13px;font-weight:600;color:#f0f2f8;">Pembatalan Faktur</div>\n        <div id="tkbf-subtitle" style="font-size:11px;color:#4e5668;margin-top:2px;">Memulai proses...</div>\n      </div>\n    </div>\n    <div style="margin-bottom:10px;">\n      <div style="display:flex;justify-content:space-between;font-size:11px;color:#4e5668;margin-bottom:4px;">\n        <span id="tkbf-status">0 / ${values.length}</span>\n        <span id="tkbf-percent">0%</span>\n      </div>\n      <div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;">\n        <div id="tkbf-bar" style="height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#ef4444,#dc2626);transition:width .5s cubic-bezier(.4,0,.2,1);"></div>\n      </div>\n    </div>\n    <div id="tkbf-current" style="font-size:12px;color:#94a3b8;font-family:'DM Mono',monospace;word-break:break-all;margin-bottom:8px;">—</div>\n  `;
    document.body.appendChild(progressPanel);
    const elSubtitle = document.getElementById("tkbf-subtitle");
    const elStatus = document.getElementById("tkbf-status");
    const elPercent = document.getElementById("tkbf-percent");
    const elBar = document.getElementById("tkbf-bar");
    const elCurrent = document.getElementById("tkbf-current");
    function updateProgress(index, total, text, color) {
        const pct = Math.round((index + 1) / total * 100);
        elStatus.textContent = `${index + 1} / ${total}`;
        elPercent.textContent = `${pct}%`;
        elBar.style.width = `${pct}%`;
        elCurrent.textContent = text;
        elCurrent.style.color = color || "#94a3b8";
    }
    const invoiceInput = document.querySelector("#filterTaxInvoiceNumber input");
    if (!invoiceInput) {
        console.error("[Pembatalan Faktur] Input nomor faktur tidak ditemukan pada halaman.");
        elCurrent.textContent = "❌ Input nomor faktur tidak ditemukan pada halaman.";
        elCurrent.style.color = "#f87171";
        return;
    }
    let successCount = 0;
    let failCount = 0;
    console.log(`[Pembatalan Faktur] Memulai proses pembatalan ${values.length} faktur...`);
    console.log(`[Pembatalan Faktur] Delay: ${delay}ms`);
    elSubtitle.textContent = `Memproses ${values.length} faktur...`;
    for (let i = 0; i < values.length; i++) {
        let nomorFaktur = values[i].nomorFaktur;
        nomorFaktur = nomorFaktur.replace(/^'+/, "").trim();
        const processStartTime = (new Date).toLocaleString("\x69\x64\x2d\x49\x44");
        if (!nomorFaktur) {
            console.warn(`[Pembatalan Faktur] (${i + 1}/${values.length}) Nomor faktur kosong, skip.`);
            rekapResults.push({
                nomorFaktur: "(kosong)",
                status: "SKIP",
                keterangan: "Nomor faktur kosong",
                waktuProses: processStartTime
            });
            continue;
        }
        console.log(`[Pembatalan Faktur] (${i + 1}/${values.length}) Memproses: ${nomorFaktur}`);
        updateProgress(i, values.length, nomorFaktur, "#fca5a5");
        elSubtitle.textContent = `Memproses ${i + 1} dari ${values.length}...`;
        try {
            const onGrid = await waitForGridPage(5e3);
            if (!onGrid) throw new Error("Tidak berada di halaman grid");
            await waitSpinnerGone();
            invoiceInput.focus();
            setAngularInputValue(invoiceInput, nomorFaktur);
            invoiceInput.blur();
            console.log(`  ✓ Input filled: ${nomorFaktur}`);
            const refreshBtn = document.querySelector('button[ptooltip="Refresh"]');
            if (refreshBtn) {
                refreshBtn.click();
                console.log(`  ✓ Refresh clicked`);
            } else {
                throw new Error("Tombol Refresh tidak ditemukan");
            }
            await waitForAction(2e3, 3e4);
            console.log(`  ✓ Spinner gone after refresh`);
            await sleep(delay);
            const cancelBtn = document.getElementById("CancelButton");
            if (!cancelBtn || cancelBtn.offsetParent === null) {
                throw new Error("Tombol Cancel tidak ditemukan atau tidak terlihat");
            }
            cancelBtn.click();
            console.log(`  ✓ Cancel clicked`);
            const confirmAcceptBtn = await waitForConfirmDialog(15e3);
            if (!confirmAcceptBtn) {
                throw new Error("Dialog konfirmasi pembatalan tidak muncul");
            }
            console.log(`  ✓ Confirmation dialog appeared`);
            confirmAcceptBtn.click();
            console.log(`  ✓ Clicked "Ya" on confirmation`);
            await waitForAction(2e3, 3e4);
            const signingModal = await waitForSigningModal(3e4);
            if (!signingModal) {
                throw new Error("Modal Tanda Tangan Dokumen tidak muncul");
            }
            console.log(`  ✓ Signing modal appeared`);
            const {passwordInput: passwordInput, closeBtn: closeBtn} = signingModal;
            const providerSelected = await selectSignerProvider(1e4);
            if (!providerSelected) {
                console.warn(`  ⚠ Signer Provider mungkin tidak terpilih, melanjutkan...`);
            } else {
                console.log(`  ✓ Signer Provider selected`);
            }
            await sleep(500);
            passwordInput.focus();
            setAngularInputValue(passwordInput, kataSandi);
            passwordInput.blur();
            console.log(`  ✓ Passphrase filled`);
            const simpanBtn = closeBtn.previousElementSibling;
            if (simpanBtn) {
                simpanBtn.removeAttribute("disabled");
                await sleep(300);
                simpanBtn.click();
                console.log(`  ✓ Simpan clicked`);
            } else {
                throw new Error("Tombol Simpan tidak ditemukan");
            }
            await waitForAction(2e3, 3e4);
            await sleep(delay);
            const confirmSignBtn = document.getElementById("button-close");
            if (confirmSignBtn && confirmSignBtn.offsetParent !== null) {
                confirmSignBtn.click();
                console.log(`  ✓ Konfirmasi Tanda Tangan clicked`);
            }
            await waitForAction(2e3, 3e4);
            await waitForSigningModalClose(15e3);
            await waitForToastAppearAndDisappear(15e3);
            const backToGrid = await waitForGridPage(1e4);
            if (!backToGrid) {
                console.warn(`  ⚠ Mungkin tidak kembali ke grid, melanjutkan...`);
            }
            await waitSpinnerGone(1e4);
            successCount++;
            console.log(`  ✅ Faktur ${nomorFaktur} berhasil dibatalkan`);
            updateProgress(i, values.length, `✓ ${nomorFaktur}`, "#22c55e");
            rekapResults.push({
                nomorFaktur: nomorFaktur,
                status: "BERHASIL",
                keterangan: "Sukses dibatalkan",
                waktuProses: processStartTime
            });
        } catch (err) {
            console.error(`  ❌ Error pada faktur ${nomorFaktur}:`, err.message);
            updateProgress(i, values.length, `✗ ${nomorFaktur}: ${err.message}`, "#f87171");
            failCount++;
            rekapResults.push({
                nomorFaktur: nomorFaktur,
                status: "GAGAL",
                keterangan: err.message,
                waktuProses: processStartTime
            });
            try {
                const rejectBtn = document.querySelector(".p-confirm-dialog-reject");
                if (rejectBtn && rejectBtn.offsetParent !== null) rejectBtn.click();
            } catch {}
            try {
                const dialogClose = document.querySelector(".p-dialog-header-close");
                if (dialogClose && dialogClose.offsetParent !== null) dialogClose.click();
            } catch {}
            const onGrid = document.getElementById("filterTaxInvoiceNumber");
            if (!onGrid) {
                await sleep(1e3);
                await waitForGridPage(1e4);
                await waitSpinnerGone(1e4);
            }
        }
        await sleep(delay);
    }
    const totalMsg = `Selesai: ${successCount} berhasil, ${failCount} gagal`;
    console.log(`\n══════════════════════════════════════════`);
    console.log(`[Pembatalan Faktur] ${totalMsg}`);
    console.log(`  ✅ Berhasil: ${successCount}`);
    console.log(`  ❌ Gagal: ${failCount}`);
    console.log(`  📊 Total: ${values.length}`);
    console.log(`══════════════════════════════════════════\n`);
    elSubtitle.textContent = "Selesai!";
    elCurrent.textContent = totalMsg;
    elCurrent.style.color = "#22c55e";
    elBar.style.background = "linear-gradient(90deg,#22c55e,#16a34a)";
    elBar.style.width = "100%";
    const rekapSummary = document.createElement("div");
    rekapSummary.style.cssText = `\n    margin-top:12px;padding:12px 14px;\n    background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);\n    border-radius:10px;font-size:11px;color:#94a3b8;line-height:1.7;\n  `;
    rekapSummary.innerHTML = `\n    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">\n      <span>✅ Berhasil</span>\n      <span style="color:#22c55e;font-weight:600;font-family:'DM Mono',monospace;">${successCount}</span>\n    </div>\n    <div style="display:flex;justify-content:space-between;">\n      <span>❌ Gagal</span>\n      <span style="color:#f87171;font-weight:600;font-family:'DM Mono',monospace;">${failCount}</span>\n    </div>\n  `;
    progressPanel.appendChild(rekapSummary);
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "📥 Download Rekap CSV";
    downloadBtn.style.cssText = `\n    width:100%;padding:10px;margin-top:10px;\n    border:none;\n    background:linear-gradient(135deg,#ef4444,#dc2626);\n    border-radius:8px;color:#fff;font-size:12px;font-weight:600;\n    cursor:pointer;font-family:'DM Sans',sans-serif;\n    box-shadow:0 3px 10px rgba(239,68,68,.3);\n    transition:opacity .15s,transform .12s;\n  `;
    downloadBtn.onmouseover = () => {
        downloadBtn.style.opacity = "0.9";
        downloadBtn.style.transform = "translateY(-1px)";
    };
    downloadBtn.onmouseout = () => {
        downloadBtn.style.opacity = "1";
        downloadBtn.style.transform = "none";
    };
    downloadBtn.onclick = () => {
        downloadRekapCSV();
        downloadBtn.textContent = "✅ Rekap Terdownload!";
        downloadBtn.style.background = "linear-gradient(135deg,#22c55e,#16a34a)";
        setTimeout(() => {
            downloadBtn.textContent = "📥 Download Rekap CSV";
            downloadBtn.style.background = "linear-gradient(135deg,#ef4444,#dc2626)";
        }, 2e3);
    };
    progressPanel.appendChild(downloadBtn);
    const closePanelBtn = document.createElement("button");
    closePanelBtn.textContent = "Tutup";
    closePanelBtn.style.cssText = `\n    width:100%;padding:9px;margin-top:8px;\n    border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);\n    border-radius:8px;color:#a0aec0;font-size:12px;font-weight:500;\n    cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;\n  `;
    closePanelBtn.onmouseover = () => {
        closePanelBtn.style.background = "rgba(255,255,255,.1)";
    };
    closePanelBtn.onmouseout = () => {
        closePanelBtn.style.background = "rgba(255,255,255,.04)";
    };
    closePanelBtn.onclick = () => progressPanel.remove();
    progressPanel.appendChild(closePanelBtn);
})();