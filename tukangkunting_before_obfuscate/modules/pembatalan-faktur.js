(async function () {
  const MODULE_NAME = "Pembatalan Faktur";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  const list = window.__pembatalanFakturList || [];
  const passphrase = window.__pembatalanPassphrase || "";

  delete window.__pembatalanFakturList;
  delete window.__pembatalanPassphrase;

  if (!list.length) {
    console.warn("[Pembatalan Faktur] Tidak ada data faktur untuk diproses.");
    return;
  }

  if (!passphrase) {
    console.error("[Pembatalan Faktur] Passphrase tidak ditemukan.");
    return;
  }

  const delay = await TK.Storage.getDelay("delay_pembatalan", 1500);

  const ui = TK.UI.createProgressPanel({
    title: MODULE_NAME,
    subtitle: `Memproses ${list.length} faktur`,
    delay,
    total: list.length,
  });

  await TK.Power?.start?.("display", ui);

  const state = TK.Batch.createBatchState();

  async function ensureSession() {
    if (TK.Session?.ensureActive) {
      await TK.Session.ensureActive(ui);
    }
  }

  async function handleSessionError(err) {
    if (!TK.Session?.isSessionError?.(err)) {
      return false;
    }

    ui.log("Sesi Coretax berakhir. Menunggu login ulang...");

    if (
      err?.message !== "SESSION_RELOAD_REQUIRED" &&
      err?.message !== "SESSION_LOGIN_TIMEOUT"
    ) {
      await TK.Session.handleExpired(ui);
    }

    return true;
  }

  ui.onCancel(() => {
    state.cancelled = true;
  });

  ui.onPauseToggle((paused) => {
    state.paused = paused;
  });

  function setAngularInputValue(inputEl, value) {
    return TK.DOM.setAngularInputValue(inputEl, value);
  }

  function waitForGridPage(timeoutMs = 20000) {
    return TK.DOM.waitForElement("#filterTaxInvoiceNumber", timeoutMs, false);
  }

  function waitForConfirmDialog(timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();

      const timer = setInterval(() => {
        const dialog = document.querySelector(".p-confirm-dialog");
        const acceptBtn = dialog?.querySelector(".p-confirm-dialog-accept");

        if (
          dialog &&
          TK.DOM.isVisible(dialog) &&
          acceptBtn &&
          TK.DOM.isVisible(acceptBtn)
        ) {
          clearInterval(timer);
          resolve(acceptBtn);
          return;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          resolve(null);
        }
      }, 200);
    });
  }

  function waitForSigningModal(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();

      const timer = setInterval(() => {
        const passwordInput = document.getElementById("SignerPassword-input");
        const closeBtn = document.getElementById("button-close");

        if (passwordInput && closeBtn) {
          clearInterval(timer);
          resolve({
            passwordInput,
            closeBtn,
          });
          return;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          resolve(null);
        }
      }, 300);
    });
  }

  async function selectSignerProvider(timeoutMs = 10000) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      await ensureSession();

      const dropdown = document.querySelector("#select-SignerProvider .p-dropdown");

      if (dropdown && !dropdown.classList.contains("p-disabled")) {
        const label = dropdown.querySelector(".p-dropdown-label");

        if (label && !label.classList.contains("p-placeholder")) {
          return true;
        }

        dropdown.click();

        await TK.DOM.sleep(500);

        const items = document.querySelectorAll(".p-dropdown-items .p-dropdown-item");

        if (items.length > 0) {
          items[0].click();

          await TK.DOM.sleep(300);

          return true;
        }
      }

      await TK.DOM.sleep(300);
    }

    return false;
  }

  async function waitForToastAppearAndDisappear(timeoutMs = 30000) {
    const start = Date.now();
    let appeared = false;

    while (Date.now() - start < timeoutMs) {
      await ensureSession();

      const toastItems = document.querySelectorAll("p-toast p-toastitem");

      const visibleToast = Array.from(toastItems).some((item) =>
        TK.DOM.isVisible(item)
      );

      if (visibleToast) appeared = true;

      if (appeared && !visibleToast) return true;

      await TK.DOM.sleep(100);
    }

    return appeared;
  }

  function waitForSigningModalClose(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();

      const timer = setInterval(() => {
        const passwordInput = document.getElementById("SignerPassword-input");

        if (!passwordInput) {
          clearInterval(timer);
          resolve(true);
          return;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          resolve(false);
        }
      }, 300);
    });
  }

  function buildRekapRows() {
    return state.results.map((item) => ({
      "Nomor Faktur": item.nomorFaktur,
      Status: item.status,
      Keterangan: item.keterangan,
      "Waktu Proses": item.waktuProses,
    }));
  }

  function downloadRekapCSV() {
    const rows = buildRekapRows();

    TK.CSV.download({
      filename: `rekap_pembatalan_faktur_${TK.CSV.timestamp()}.xlsx`,
      headers: TK.CSV.inferHeaders(rows),
      rows,
      sheetName: "Rekap Pembatalan",
    });
  }

  ui.onExport(downloadRekapCSV);
  ui.setStatus("Starting...");

  const invoiceInput = document.querySelector("#filterTaxInvoiceNumber input");

  if (!invoiceInput) {
    ui.error("Input nomor faktur tidak ditemukan.");
    return;
  }

  for (let i = 0; i < list.length; i++) {
    if (state.cancelled) break;

    await TK.Batch.waitIfPaused(state, ui);
    await ensureSession();

    let nomorFaktur = String(list[i].nomorFaktur || "")
      .replace(/^'+/, "")
      .replace(/[.\-\s]/g, "")
      .trim();

    const waktuProses = new Date().toLocaleString("id-ID");
    const pct = Math.round(((i + 1) / list.length) * 100);

    ui.setStatus(`Processing ${nomorFaktur || "(kosong)"}`);

    ui.setMetrics({
      progress: pct,
      success: state.success,
      failed: state.failed,
    });

    if (!nomorFaktur) {
      TK.Batch.pushResult(state, {
        nomorFaktur: "(kosong)",
        status: "SKIP",
        keterangan: "Nomor faktur kosong",
        waktuProses,
      });

      continue;
    }

    try {
      await ensureSession();

      const onGrid = await waitForGridPage(5000);

      if (!onGrid) throw new Error("Tidak berada di halaman grid");

      await TK.DOM.waitSpinnerGone();
      await ensureSession();

      invoiceInput.focus();
      setAngularInputValue(invoiceInput, nomorFaktur);
      invoiceInput.blur();

      await ensureSession();

      const refreshBtn = document.querySelector('button[ptooltip="Refresh"]');

      if (!refreshBtn) {
        throw new Error("Tombol Refresh tidak ditemukan");
      }

      refreshBtn.click();

      await TK.DOM.waitForAction(2000, 30000);
      await ensureSession();

      await TK.DOM.sleep(delay);
      await ensureSession();

      const cancelBtn = document.getElementById("CancelButton");

      if (!cancelBtn || !TK.DOM.isVisible(cancelBtn)) {
        throw new Error("Tombol Cancel tidak ditemukan atau tidak terlihat");
      }

      await ensureSession();

      cancelBtn.click();

      const confirmAcceptBtn = await waitForConfirmDialog(15000);

      if (!confirmAcceptBtn) {
        throw new Error("Dialog konfirmasi pembatalan tidak muncul");
      }

      await ensureSession();

      confirmAcceptBtn.click();

      await TK.DOM.waitForAction(2000, 30000);
      await ensureSession();

      const signingModal = await waitForSigningModal(30000);

      if (!signingModal) {
        throw new Error("Modal Tanda Tangan Dokumen tidak muncul");
      }

      await ensureSession();

      const { passwordInput, closeBtn } = signingModal;

      await selectSignerProvider(10000);

      await TK.DOM.sleep(500);
      await ensureSession();

      passwordInput.focus();
      setAngularInputValue(passwordInput, passphrase);
      passwordInput.blur();

      const simpanBtn = closeBtn.previousElementSibling;

      if (!simpanBtn) {
        throw new Error("Tombol Simpan tidak ditemukan");
      }

      simpanBtn.removeAttribute("disabled");

      await TK.DOM.sleep(300);
      await ensureSession();

      simpanBtn.click();

      await TK.DOM.waitForAction(2000, 30000);
      await ensureSession();

      await TK.DOM.sleep(delay);
      await ensureSession();

      const confirmSignBtn = document.getElementById("button-close");

      if (confirmSignBtn && TK.DOM.isVisible(confirmSignBtn)) {
        confirmSignBtn.click();
      }

      await TK.DOM.waitForAction(2000, 30000);
      await ensureSession();

      await waitForSigningModalClose(15000);
      await ensureSession();

      await waitForToastAppearAndDisappear(15000);
      await ensureSession();

      await waitForGridPage(10000);
      await TK.DOM.waitSpinnerGone(10000);
      await ensureSession();

      TK.Batch.pushResult(state, {
        nomorFaktur,
        status: "BERHASIL",
        keterangan: "Sukses dibatalkan",
        waktuProses,
      });

      ui.log(`✓ ${nomorFaktur}`);
    } catch (err) {
      if (await handleSessionError(err)) {
        i -= 1;
        continue;
      }

      TK.Batch.pushResult(state, {
        nomorFaktur,
        status: "GAGAL",
        keterangan: err.message,
        waktuProses,
      });

      ui.log(`✗ ${nomorFaktur}: ${err.message}`);

      try {
        const rejectBtn = document.querySelector(".p-confirm-dialog-reject");

        if (rejectBtn && TK.DOM.isVisible(rejectBtn)) rejectBtn.click();
      } catch {}

      try {
        const dialogClose = document.querySelector(".p-dialog-header-close");

        if (dialogClose && TK.DOM.isVisible(dialogClose)) dialogClose.click();
      } catch {}

      if (!document.getElementById("filterTaxInvoiceNumber")) {
        await waitForGridPage(10000);
        await TK.DOM.waitSpinnerGone(10000);
      }
    }

    ui.setMetrics({
      success: state.success,
      failed: state.failed,
      progress: Math.round(((i + 1) / list.length) * 100),
    });

    await TK.DOM.sleep(delay);
  }

  const total = state.success + state.failed + state.skipped;

  ui.done("DONE");

  ui.log(
    `Selesai: ${state.success} berhasil, ${state.failed} gagal, ${state.skipped} dilewati`
  );

  TK.Activity.finish({
    module: MODULE_NAME,
    total,
    success: state.success,
    failed: state.failed,
    skipped: state.skipped,
  });
})();