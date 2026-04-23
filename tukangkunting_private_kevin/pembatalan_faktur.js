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
    if (license.reason === "lisensi sudah expired") reasonText = "Lisensi Anda sudah expired. Hubungi owner untuk perpanjangan.";
    else if (license.reason === "machine code tidak cocok") reasonText = "Token tidak cocok dengan perangkat ini.";
    else if (license.reason === "no_license") reasonText = "Belum ada lisensi aktif. Klik icon extension untuk aktivasi.";
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
    document.getElementById("tukang-license-close").onclick = () => notice.remove();
    return;
  }

  if (license.expiry) {
    const daysLeft = Math.ceil((license.expiry - Date.now()) / 86_400_000);
    const expDate = new Date(license.expiry).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    console.log(`✅ Lisensi aktif — berlaku hingga ${expDate} (${daysLeft} hari lagi)`);
  }

  const values = window.__pembatalanFakturList;
  const kataSandi = window.__pembatalanPassphrase;

  // Cleanup global variables immediately
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

  // Get delay setting from storage
  let delay = 1500;
  try {
    const res = await chrome.storage.local.get("delay_pembatalan");
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
      window.HTMLInputElement.prototype, "value"
    ).set;
    nativeInputValueSetter.call(inputEl, value);
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /**
   * Check if any loading spinner/overlay is currently visible.
   */
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
    console.warn("[Spinner] Timeout — spinner tidak hilang");
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

  /**
   * Wait for the "Tanda Tangan Dokumen" signing modal to appear.
   * This modal contains SignerPassword-input and button-close.
   */
  function waitForSigningModal(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const passwordInput = document.getElementById("SignerPassword-input");
        const closeBtn = document.getElementById("button-close");
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
      const dropdown = document.querySelector("#select-SignerProvider .p-dropdown");
      if (dropdown && !dropdown.classList.contains("p-disabled")) {
        // Check if already has a value selected (not placeholder)
        const label = dropdown.querySelector(".p-dropdown-label");
        if (label && !label.classList.contains("p-placeholder")) {
          return true; // Already selected
        }

        // Click to open dropdown
        dropdown.click();
        await sleep(500);

        // Find dropdown items
        const items = document.querySelectorAll(".p-dropdown-items .p-dropdown-item");
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
   * Returns an object: { appeared: boolean, isError: boolean }
   * isError is true when the visible toast has a "p-toast-message-error" or "p-toast-message-warn" class,
   * which indicates the server returned a failure response.
   */
  function waitForToastAppearAndDisappear(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();
      let toastAppeared = false;
      let isError = false;

      const interval = setInterval(() => {
        const toastItems = document.querySelectorAll("p-toast p-toastitem");
        const visibleItems = Array.from(toastItems).filter(
          item => item.offsetParent !== null
        );
        const visibleToast = visibleItems.length > 0;

        if (visibleToast) {
          toastAppeared = true;
          // Capture whether any visible toast is an error or warning
          isError = visibleItems.some(
            item =>
              item.querySelector(".p-toast-message-error") !== null ||
              item.querySelector(".p-toast-message-warn") !== null
          );
        }

        if (toastAppeared && !visibleToast) {
          clearInterval(interval);
          resolve({ appeared: true, isError });
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve({ appeared: toastAppeared, isError });
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

  /**
   * After clicking Simpan, the signing modal may show "Sign status is In Progress,
   * Please wait!" while the server processes the signing request asynchronously.
   * This function waits until that message disappears (or the modal closes entirely).
   *
   * Returns:
   *   "ready"   – modal still open, In Progress message is gone → safe to click button-close
   *   "closed"  – modal closed by itself (signing completed automatically)
   *   "timeout" – In Progress message never resolved within timeoutMs
   */
  function waitUntilSigningReady(timeoutMs = 90000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const passwordInput = document.getElementById("SignerPassword-input");

        // Modal closed on its own
        if (!passwordInput) {
          clearInterval(interval);
          resolve("closed");
          return;
        }

        // Look for the "In Progress" paragraph anywhere inside the signing dialog
        const dialog = passwordInput.closest(".p-dialog") ||
                       document.querySelector(".p-dialog[style*='display']") ||
                       document.querySelector("p-dialog .p-dialog-content");
        const searchRoot = dialog || document;
        const paragraphs = searchRoot.querySelectorAll("p");
        const inProgress = Array.from(paragraphs).some(
          p => p.textContent.includes("In Progress") && p.textContent.includes("Please wait")
        );

        if (!inProgress) {
          clearInterval(interval);
          resolve("ready");
          return;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve("timeout");
        }
      }, 1000);
    });
  }

  function getDataTableTbody() {
    const tbody = document.querySelector("p-table .p-datatable-tbody");
    if (tbody) return tbody;
    const tables = document.querySelectorAll("[id$='-table'] > .p-datatable-tbody");
    return tables.length > 0 ? tables[0] : null;
  }

  function waitForGridPage(timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (document.getElementById("filterTaxInvoiceNumber")) {
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
    const header = "Nomor Faktur,Status,Keterangan,Waktu Proses";
    const rows = rekapResults.map(r => {
      const fields = [
        `'${r.nomorFaktur}`,
        r.status,
        `"${(r.keterangan || "").replace(/"/g, '""')}"`,
        r.waktuProses
      ];
      return fields.join(",");
    });

    const csvContent = "\uFEFF" + header + "\n" + rows.join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") + "_" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");
    a.href = url;
    a.download = `rekap_pembatalan_faktur_${timestamp}.csv`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ══════════════════════════════════════════════════════════════
  //  PROGRESS PANEL UI
  // ══════════════════════════════════════════════════════════════

  const progressPanel = document.createElement("div");
  progressPanel.id = "tukang-pembatalan-progress";
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

  const elSubtitle = document.getElementById("tkbf-subtitle");
  const elStatus = document.getElementById("tkbf-status");
  const elPercent = document.getElementById("tkbf-percent");
  const elBar = document.getElementById("tkbf-bar");
  const elCurrent = document.getElementById("tkbf-current");

  function updateProgress(index, total, text, color) {
    const pct = Math.round(((index + 1) / total) * 100);
    elStatus.textContent = `${index + 1} / ${total}`;
    elPercent.textContent = `${pct}%`;
    elBar.style.width = `${pct}%`;
    elCurrent.textContent = text;
    elCurrent.style.color = color || "#94a3b8";
  }

  // ══════════════════════════════════════════════════════════════
  //  MAIN PROCESSING LOOP
  // ══════════════════════════════════════════════════════════════

  const invoiceInput = document.querySelector('#filterTaxInvoiceNumber input');

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
    // ── Escape leading apostrophe from CSV ──
    let nomorFaktur = values[i].nomorFaktur;
    nomorFaktur = nomorFaktur.replace(/^'+/, "").trim();

    const processStartTime = new Date().toLocaleString("id-ID");

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
      // ── Step 1: Ensure we're on grid page ──
      const onGrid = await waitForGridPage(5000);
      if (!onGrid) throw new Error("Tidak berada di halaman grid");
      await waitSpinnerGone();

      // ── Step 2: Fill invoice input ──
      invoiceInput.focus();
      setAngularInputValue(invoiceInput, nomorFaktur);
      invoiceInput.blur();
      console.log(`  ✓ Input filled: ${nomorFaktur}`);

      // ── Step 3: Click Refresh ──
      const refreshBtn = document.querySelector('button[ptooltip="Refresh"]');
      if (refreshBtn) {
        refreshBtn.click();
        console.log(`  ✓ Refresh clicked`);
      } else {
        throw new Error("Tombol Refresh tidak ditemukan");
      }

      // ── Step 4: Wait for spinner to disappear after refresh ──
      await waitForAction(2000, 30000);
      console.log(`  ✓ Spinner gone after refresh`);

      // Small additional wait for DOM to settle
      await sleep(delay);

      // ── Step 5: Find and click Cancel button ──
      const cancelBtn = document.getElementById('CancelButton');
      if (!cancelBtn || cancelBtn.offsetParent === null) {
        throw new Error("Tombol Cancel tidak ditemukan atau tidak terlihat");
      }
      cancelBtn.click();
      console.log(`  ✓ Cancel clicked`);

      // ── Step 6: Wait for confirmation dialog to appear ──
      const confirmAcceptBtn = await waitForConfirmDialog(15000);
      if (!confirmAcceptBtn) {
        throw new Error("Dialog konfirmasi pembatalan tidak muncul");
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
        throw new Error("Modal Tanda Tangan Dokumen tidak muncul");
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
        simpanBtn.removeAttribute('disabled');
        await sleep(300);
        simpanBtn.click();
        console.log(`  ✓ Simpan clicked`);
      } else {
        throw new Error("Tombol Simpan tidak ditemukan");
      }

      // ── Step 13: Wait for spinner after Simpan ──
      await waitForAction(2000, 30000);

      // ── Step 14: Wait for "Sign status is In Progress" to resolve before confirming ──
      // The server processes the signing request asynchronously. We must not click
      // button-close while the modal still shows the "In Progress" message, otherwise
      // the cancellation is not completed but the script would incorrectly count it as success.
      console.log(`  ⏳ Menunggu proses signing selesai (In Progress)...`);
      const signProgressResult = await waitUntilSigningReady(90000);

      if (signProgressResult === "timeout") {
        throw new Error("Signing timeout — Sign status masih In Progress setelah 90 detik");
      }

      if (signProgressResult === "closed") {
        // Modal closed by itself — signing completed automatically, no further action needed
        console.log(`  ✓ Signing modal tertutup otomatis setelah In Progress selesai`);
      } else {
        // signProgressResult === "ready" — In Progress resolved, modal still open → click Konfirmasi
        await sleep(300);
        const confirmSignBtn = document.getElementById("button-close");
        if (confirmSignBtn && confirmSignBtn.offsetParent !== null) {
          confirmSignBtn.click();
          console.log(`  ✓ Konfirmasi Tanda Tangan clicked`);
        } else {
          throw new Error("Tombol Konfirmasi Tanda Tangan tidak ditemukan setelah In Progress selesai");
        }
      }

      // ── Step 15: Wait for the signing modal to close ──
      await waitForAction(2000, 30000);
      const modalClosed = await waitForSigningModalClose(20000);
      if (!modalClosed) {
        throw new Error("Modal Tanda Tangan Dokumen tidak tertutup setelah konfirmasi");
      }

      // ── Step 16: Wait for toast notification ──
      const toastResult = await waitForToastAppearAndDisappear(15000);
      if (toastResult.isError) {
        throw new Error("Server mengembalikan notifikasi error saat proses pembatalan");
      }

      // ── Step 17: Ensure back on grid ──
      const backToGrid = await waitForGridPage(10000);
      if (!backToGrid) {
        console.warn(`  ⚠ Mungkin tidak kembali ke grid, melanjutkan...`);
      }
      await waitSpinnerGone(10000);

      successCount++;
      console.log(`  ✅ Faktur ${nomorFaktur} berhasil dibatalkan`);
      updateProgress(i, values.length, `✓ ${nomorFaktur}`, "#22c55e");

      rekapResults.push({
        nomorFaktur,
        status: "BERHASIL",
        keterangan: "Sukses dibatalkan",
        waktuProses: processStartTime
      });

    } catch (err) {
      console.error(`  ❌ Error pada faktur ${nomorFaktur}:`, err.message);
      updateProgress(i, values.length, `✗ ${nomorFaktur}: ${err.message}`, "#f87171");
      failCount++;

      rekapResults.push({
        nomorFaktur,
        status: "GAGAL",
        keterangan: err.message,
        waktuProses: processStartTime
      });

      // Try to close any open modal/dialog
      try {
        const rejectBtn = document.querySelector(".p-confirm-dialog-reject");
        if (rejectBtn && rejectBtn.offsetParent !== null) rejectBtn.click();
      } catch {}
      try {
        const dialogClose = document.querySelector(".p-dialog-header-close");
        if (dialogClose && dialogClose.offsetParent !== null) dialogClose.click();
      } catch {}

      // Ensure we're back on grid
      const onGrid = document.getElementById("filterTaxInvoiceNumber");
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

  elSubtitle.textContent = "Selesai!";
  elCurrent.textContent = totalMsg;
  elCurrent.style.color = "#22c55e";
  elBar.style.background = "linear-gradient(90deg,#22c55e,#16a34a)";
  elBar.style.width = "100%";

  // Rekap summary
  const rekapSummary = document.createElement("div");
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
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "📥 Download Rekap CSV";
  downloadBtn.style.cssText = `
    width:100%;padding:10px;margin-top:10px;
    border:none;
    background:linear-gradient(135deg,#ef4444,#dc2626);
    border-radius:8px;color:#fff;font-size:12px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;
    box-shadow:0 3px 10px rgba(239,68,68,.3);
    transition:opacity .15s,transform .12s;
  `;
  downloadBtn.onmouseover = () => { downloadBtn.style.opacity = "0.9"; downloadBtn.style.transform = "translateY(-1px)"; };
  downloadBtn.onmouseout = () => { downloadBtn.style.opacity = "1"; downloadBtn.style.transform = "none"; };
  downloadBtn.onclick = () => {
    downloadRekapCSV();
    downloadBtn.textContent = "✅ Rekap Terdownload!";
    downloadBtn.style.background = "linear-gradient(135deg,#22c55e,#16a34a)";
    setTimeout(() => {
      downloadBtn.textContent = "📥 Download Rekap CSV";
      downloadBtn.style.background = "linear-gradient(135deg,#ef4444,#dc2626)";
    }, 2000);
  };
  progressPanel.appendChild(downloadBtn);

  // Close button
  const closePanelBtn = document.createElement("button");
  closePanelBtn.textContent = "Tutup";
  closePanelBtn.style.cssText = `
    width:100%;padding:9px;margin-top:8px;
    border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);
    border-radius:8px;color:#a0aec0;font-size:12px;font-weight:500;
    cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;
  `;
  closePanelBtn.onmouseover = () => { closePanelBtn.style.background = "rgba(255,255,255,.1)"; };
  closePanelBtn.onmouseout = () => { closePanelBtn.style.background = "rgba(255,255,255,.04)"; };
  closePanelBtn.onclick = () => progressPanel.remove();
  progressPanel.appendChild(closePanelBtn);

})();