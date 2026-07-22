(async function () {
  const MODULE_NAME = "Pengkreditan Faktur";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  const list = window.__pengkreditanFakturList || [];
  delete window.__pengkreditanFakturList;

  if (!list.length) {
    console.warn("[Pengkreditan Faktur] Tidak ada data untuk diproses.");
    return;
  }

  const delay = await TK.Storage.getDelay("delay_pengkreditan", 1500);

  const BULAN_NAMES = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const ui = TK.UI.createProgressPanel({
    title: MODULE_NAME,
    subtitle: `Memproses ${list.length} faktur`,
    delay,
    total: list.length,
  });

  const state = TK.Batch.createBatchState();

  async function ensureSession() {
    if (TK.Session?.ensureActive) {
      await TK.Session.ensureActive(ui);
    }
  }

  async function handleSessionError(err, index) {
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

  function progress(index, text, type) {
    const pct = Math.round(((index + 1) / list.length) * 100);

    ui.setMetrics({
      progress: pct,
      success: state.success,
      failed: state.failed,
    });

    ui.setStatus(text, type || "running");
  }

  function setAngularInputValue(inputEl, value) {
    return TK.DOM.setAngularInputValue(inputEl, value);
  }

  function getFilterNomorFaktur() {
    return document.querySelector("#filterTaxInvoiceNumber input");
  }

  function getFilterTahun() {
    return document.querySelector("#filterTaxInvoiceYear input");
  }

  function getDataTableTbody() {
    return (
      document.querySelector("p-table .p-datatable-tbody") ||
      document.querySelector("[id$='-table'] > .p-datatable-tbody")
    );
  }

  function waitForGridPage(timeoutMs = 20000) {
    return TK.DOM.waitForElement("#filterTaxInvoiceNumber", timeoutMs, false);
  }

  function waitForEditPage(timeoutMs = 20000) {
    return TK.DOM.waitForElement("#TaxInvoiceNumber", timeoutMs, false);
  }

  function waitForButton(textOrLabel, timeoutMs = 10000) {
    return new Promise((resolve) => {
      const start = Date.now();

      const timer = setInterval(() => {
        const buttons = Array.from(document.querySelectorAll("button"));

        const found = buttons.find((btn) => {
          const text = btn.textContent.trim();
          const aria = btn.getAttribute("aria-label") || "";

          return (
            (text === textOrLabel || aria === textOrLabel) &&
            TK.DOM.isVisible(btn) &&
            !btn.disabled
          );
        });

        if (found) {
          clearInterval(timer);
          resolve(found);
          return;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          resolve(null);
        }
      }, 150);
    });
  }

  function waitForFilteredRows(searchText, timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();

      const timer = setInterval(() => {
        const tbody = getDataTableTbody();

        if (tbody) {
          const rows = Array.from(tbody.querySelectorAll("tr"));

          if (rows.some((row) => row.textContent.includes(searchText))) {
            clearInterval(timer);
            resolve(rows);
            return;
          }
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          resolve(null);
        }
      }, 200);
    });
  }

  async function selectPrimeNGDropdown(dropdownContainer, optionText, timeoutMs = 5000) {
    await ensureSession();

    dropdownContainer.click();
    await TK.DOM.sleep(250);

    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      await ensureSession();

      const items = Array.from(
        document.querySelectorAll(".p-dropdown-items .p-dropdown-item")
      );

      const target = items.find((item) => item.textContent.trim() === optionText);

      if (target) {
        target.click();
        return true;
      }

      await TK.DOM.sleep(100);
    }

    return false;
  }

  async function selectMasaPajakFilter(bulanName) {
    await ensureSession();

    const multiSelects = document.querySelectorAll("p-columnfilter p-multiselect");
    const multiSelect = multiSelects[0];

    if (!multiSelect) return false;

    const trigger = multiSelect.querySelector(".p-multiselect-trigger") || multiSelect;

    trigger.click();

    let panel = null;

    for (let i = 0; i < 20; i++) {
      await ensureSession();

      panel = document.querySelector(".p-multiselect-panel");

      if (panel && TK.DOM.isVisible(panel)) break;

      await TK.DOM.sleep(100);
    }

    if (!panel) return false;

    const highlighted = panel.querySelectorAll("p-multiselectitem li.p-highlight");

    for (const item of highlighted) {
      item.click();
      await TK.DOM.sleep(50);
    }

    const items = Array.from(panel.querySelectorAll("p-multiselectitem li"));

    const target = items.find((item) => {
      const label = item.getAttribute("aria-label") || item.textContent.trim();
      return label === bulanName;
    });

    if (target) target.click();

    const closeBtn = panel.querySelector(".p-multiselect-close");

    if (closeBtn) closeBtn.click();
    else trigger.click();

    await TK.DOM.sleep(150);

    return !!target;
  }

  function clickRefreshButton() {
    const selectors = [
      "#RefreshButton",
      "button[id*='Refresh']",
      "button[id*='refresh']",
      'button[ptooltip="Refresh"]',
    ];

    for (const selector of selectors) {
      const btn = document.querySelector(selector);

      if (btn && TK.DOM.isVisible(btn)) {
        btn.click();
        return true;
      }
    }

    const buttons = Array.from(document.querySelectorAll("button"));

    const byIcon = buttons.find((btn) => {
      return btn.querySelector(".pi-refresh, .pi-search") && TK.DOM.isVisible(btn);
    });

    if (byIcon) {
      byIcon.click();
      return true;
    }

    return false;
  }

  function clearAllFilters() {
    const nfInput = getFilterNomorFaktur();

    if (nfInput) setAngularInputValue(nfInput, "");

    const yearInput = getFilterTahun();

    if (yearInput) setAngularInputValue(yearInput, "");
  }

  async function applyGridFilters(masaPajak, tahun, nomorFaktur) {
    await ensureSession();

    const bulanName = BULAN_NAMES[masaPajak] || "";

    if (bulanName) {
      await selectMasaPajakFilter(bulanName);
    }

    await ensureSession();

    const yearInput = getFilterTahun();

    if (yearInput && tahun) {
      yearInput.focus();
      setAngularInputValue(yearInput, tahun);
    }

    const nfInput = getFilterNomorFaktur();

    if (nfInput && nomorFaktur) {
      nfInput.focus();
      setAngularInputValue(nfInput, nomorFaktur);
    }

    await ensureSession();

    const refreshed = clickRefreshButton();

    if (!refreshed && nfInput) {
      nfInput.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          bubbles: true,
        })
      );
    }

    await TK.DOM.waitForAction(1500, 30000);
    await ensureSession();
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

  function buildRekapRows() {
    return state.results.map((item) => ({
      "Nomor Faktur": item.nomorFaktur,
      "Masa Pajak Faktur": BULAN_NAMES[item.masaPajakFaktur] || item.masaPajakFaktur,
      "Tahun Pajak Faktur": item.tahunPajakFaktur,
      "Masa Pajak Pengkreditan":
        BULAN_NAMES[item.masaPajakPengkreditan] || item.masaPajakPengkreditan,
      "Tahun Pajak Pengkreditan": item.tahunPajakPengkreditan,
      Status: item.status,
      Keterangan: item.keterangan,
      "Waktu Proses": item.waktuProses,
    }));
  }

  function downloadRekapCSV() {
    const rows = buildRekapRows();

    TK.CSV.download({
      filename: `rekap_pengkreditan_faktur_${TK.CSV.timestamp()}.xlsx`,
      sheetName: "Rekap Pengkreditan",
      headers: TK.CSV.inferHeaders(rows),
      rows,
    });
  }

  ui.onExport(downloadRekapCSV);
  ui.setStatus("Starting...");

  for (let i = 0; i < list.length; i++) {
    if (state.cancelled) break;

    await TK.Batch.waitIfPaused(state, ui);
    await ensureSession();

    const item = list[i];

    const noFaktur = String(item.nomorFaktur || "")
      .replace(/^'+/, "")
      .trim();

    const masaPajakFaktur = Number(item.masaPajakFaktur);
    const tahunPajakFaktur = String(item.tahunPajakFaktur || "").trim();
    const masaPajakPengkreditan = Number(item.masaPajakPengkreditan);
    const tahunPajakPengkreditan = String(item.tahunPajakPengkreditan || "").trim();
    const waktuProses = new Date().toLocaleString("id-ID");

    progress(i, `Processing ${noFaktur || "(kosong)"}`);

    if (!noFaktur) {
      TK.Batch.pushResult(state, {
        nomorFaktur: "(kosong)",
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan,
        tahunPajakPengkreditan,
        status: "SKIP",
        keterangan: "Nomor faktur kosong",
        waktuProses,
      });

      continue;
    }

    try {
      await ensureSession();

      const onGrid = await waitForGridPage(8000);

      if (!onGrid) throw new Error("Tidak berada di halaman grid");

      await TK.DOM.waitSpinnerGone();
      await ensureSession();

      await applyGridFilters(masaPajakFaktur, tahunPajakFaktur, noFaktur);

      const rows = await waitForFilteredRows(noFaktur, 20000);

      if (!rows) throw new Error("Data tidak ditemukan setelah filter");

      await ensureSession();

      const targetRow = rows.find((row) => row.textContent.includes(noFaktur));

      if (!targetRow) throw new Error("Nomor faktur tidak ditemukan di tabel");

      const editBtn = targetRow.querySelector("#EditButton");

      if (!editBtn) throw new Error("Tombol Edit tidak ditemukan");

      await ensureSession();

      editBtn.click();

      await TK.DOM.waitForAction(1500, 30000);
      await ensureSession();

      const editPage = await waitForEditPage(20000);

      if (!editPage) throw new Error("Halaman edit gagal dimuat");

      await TK.DOM.waitSpinnerGone(10000);
      await ensureSession();

      const formItems = document.querySelectorAll("einv-doc-form-item");

      let periodCreditDropdown = null;
      let yearCreditInput = null;

      for (const formItem of formItems) {
        const label = formItem.querySelector("label");

        if (!label) continue;

        const labelText = label.textContent.trim();

        if (labelText.includes("Masa Pajak Dikreditkan")) {
          periodCreditDropdown = formItem.querySelector(".p-dropdown");
        }

        if (labelText.includes("Tahun Pajak Dikreditkan")) {
          yearCreditInput = formItem.querySelector("input[type='text']");
        }
      }

      if (!periodCreditDropdown) {
        throw new Error("Dropdown Masa Pajak Dikreditkan tidak ditemukan");
      }

      if (periodCreditDropdown.classList.contains("p-disabled")) {
        throw new Error("Dropdown Masa Pajak Dikreditkan disabled");
      }

      const bulanKreditName = BULAN_NAMES[masaPajakPengkreditan] || "";

      await ensureSession();

      const monthOk = await selectPrimeNGDropdown(periodCreditDropdown, bulanKreditName);

      if (!monthOk) {
        throw new Error(`Gagal memilih bulan '${bulanKreditName}'`);
      }

      if (!yearCreditInput) {
        throw new Error("Input Tahun Pajak Dikreditkan tidak ditemukan");
      }

      if (yearCreditInput.disabled) {
        throw new Error("Input Tahun Pajak Dikreditkan disabled");
      }

      yearCreditInput.focus();
      setAngularInputValue(yearCreditInput, tahunPajakPengkreditan);

      await ensureSession();

      let kreditBtn = await waitForButton("Credit", 8000);

      if (!kreditBtn) kreditBtn = await waitForButton("Kredit", 3000);

      if (!kreditBtn) throw new Error("Tombol Kredit tidak ditemukan");

      await ensureSession();

      kreditBtn.click();

      await TK.DOM.waitForAction(1500, 30000);
      await ensureSession();

      const confirmBtn = document.querySelector(".p-confirm-dialog-accept");

      if (confirmBtn && TK.DOM.isVisible(confirmBtn)) {
        await ensureSession();

        confirmBtn.click();

        await TK.DOM.waitForAction(1500, 30000);
        await ensureSession();
      }

      await waitForToastAppearAndDisappear(15000);

      await ensureSession();

      if (document.getElementById("TaxInvoiceNumber")) {
        window.history.back();
      }

      await waitForGridPage(15000);
      await TK.DOM.waitSpinnerGone(10000);
      await ensureSession();

      TK.Batch.pushResult(state, {
        nomorFaktur: noFaktur,
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan,
        tahunPajakPengkreditan,
        status: "BERHASIL",
        keterangan: "Sukses dikreditkan",
        waktuProses,
      });

      ui.log(`✓ ${noFaktur}`);
    } catch (err) {
      if (await handleSessionError(err, i)) {
        i -= 1;
        continue;
      }

      TK.Batch.pushResult(state, {
        nomorFaktur: noFaktur,
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan,
        tahunPajakPengkreditan,
        status: "GAGAL",
        keterangan: err.message,
        waktuProses,
      });

      ui.log(`✗ ${noFaktur}: ${err.message}`);

      if (!document.getElementById("filterTaxInvoiceNumber")) {
        window.history.back();

        await waitForGridPage(15000);
        await TK.DOM.waitSpinnerGone(10000);
      }
    }

    try {
      await ensureSession();
      clearAllFilters();
    } catch {}

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