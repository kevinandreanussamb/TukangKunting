// pengkreditan_faktur.js
// Processes each row from CSV: filter grid → edit → change period/year → click Kredit
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
          <div style="font-size:11px;color:#4e5668;margin-top:2px;">Pengkreditan Faktur</div>
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

  const fakturList = window.__pengkreditanFakturList || [];
  delete window.__pengkreditanFakturList;

  if (fakturList.length === 0) {
    console.warn("[Pengkreditan Faktur] Tidak ada data untuk diproses.");
    return;
  }

  const BULAN_NAMES = ["","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  const rekapResults = [];

  // ══════════════════════════════════════════════════════════════
  //  UTILITY FUNCTIONS — Spinner detection matching PPN downloader
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
   * Matches the PPN downloader's hasSpinner() approach — checks multiple
   * possible spinner selectors used by the E-Invoice portal.
   */
  function hasSpinner() {
    // Primary: the modal overlay from ui-progress-spinner
    const modal = document.querySelector("ui-progress-spinner .modal");
    if (modal && modal.offsetParent !== null) return true;
    // Secondary: PrimeNG datatable loading overlay
    const dtLoading = document.querySelector(".p-datatable-loading-overlay");
    if (dtLoading) return true;
    // Tertiary: generic PrimeNG progress spinners
    const spinner2 = document.querySelector("ui-progress-spinner .p-progress-spinner");
    const spinner3 = document.querySelector("p-progressspinner .p-progress-spinner");
    if (spinner2 || spinner3) return true;
    return false;
  }

  /**
   * Wait until spinner is gone. Only polls while spinner is visible.
   * Matches PPN downloader's waitTableStable() — fast, no unnecessary timeout.
   */
  async function waitSpinnerGone(timeoutMs = 30000) {
    if (!hasSpinner()) {
      // No spinner visible — give a tiny buffer for DOM to settle, then return
      await sleep(Math.min(BASE_POLL, 300));
      return true;
    }
    // Spinner is visible — poll until it's gone
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!hasSpinner()) {
        return true;
      }
      await sleep(BASE_POLL);
    }
    console.warn("[Spinner] Timeout — spinner tidak hilang");
    return false;
  }

  /**
   * After an action that triggers a server call (click Refresh, click Edit, etc.),
   * briefly wait for spinner to appear, then wait for it to disappear.
   * If spinner never appears within a short window, assume fast response and move on.
   * This prevents the old bug of waiting the full startTimeout when the portal responds instantly.
   */
  async function waitForAction(startWindowMs = 1500, finishTimeoutMs = 30000) {
    // Brief window to see if spinner appears
    const start = Date.now();
    while (Date.now() - start < startWindowMs) {
      if (hasSpinner()) {
        // Spinner appeared — now wait for it to disappear
        return await waitSpinnerGone(finishTimeoutMs);
      }
      await sleep(50);
    }
    // Spinner never appeared — fast response, move on
    return true;
  }

  /**
   * Wait for toast notification to appear then disappear.
   */
  function waitForToastAppearAndDisappear(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();
      let toastAppeared = false;

      const interval = setInterval(() => {
        const toastItems = document.querySelectorAll("p-toast p-toastitem");
        const visibleToast = Array.from(toastItems).some(
          item => item.offsetParent !== null
        );

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

  function waitForButton(textOrLabel, timeoutMs = 10000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const allButtons = document.querySelectorAll("button");
        for (const btn of allButtons) {
          const btnText = btn.textContent.trim();
          const ariaLabel = btn.getAttribute("aria-label") || "";
          if (
            (btnText === textOrLabel || ariaLabel === textOrLabel) &&
            btn.offsetParent !== null &&
            !btn.disabled
          ) {
            clearInterval(interval);
            resolve(btn);
            return;
          }
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });
  }

  function getDataTableTbody() {
    const tbody = document.querySelector("p-table .p-datatable-tbody");
    if (tbody) return tbody;
    const tables = document.querySelectorAll("[id$='-table'] > .p-datatable-tbody");
    return tables.length > 0 ? tables[0] : null;
  }

  function waitForFilteredRows(searchText, timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const tbody = getDataTableTbody();
        if (!tbody) {
          if (Date.now() - start > timeoutMs) { clearInterval(interval); resolve(null); }
          return;
        }
        const rows = tbody.querySelectorAll("tr");
        for (const row of rows) {
          if (row.textContent && row.textContent.includes(searchText)) {
            clearInterval(interval);
            resolve(rows);
            return;
          }
        }
        if (Date.now() - start > timeoutMs) { clearInterval(interval); resolve(null); }
      }, 200);
    });
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

  function waitForEditPage(timeoutMs = 20000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (document.getElementById("TaxInvoiceNumber")) {
          clearInterval(interval);
          resolve(true);
        }
        if (Date.now() - start > timeoutMs) { clearInterval(interval); resolve(false); }
      }, 100);
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  GRID FILTER FUNCTIONS
  // ══════════════════════════════════════════════════════════════

  function getFilterNomorFaktur() {
    const container = document.getElementById("filterTaxInvoiceNumber");
    return container ? container.querySelector("input") : null;
  }

  function getFilterTahun() {
    const container = document.getElementById("filterTaxInvoiceYear");
    return container ? container.querySelector("input") : null;
  }

  async function selectMasaPajakFilter(bulanName) {
    const multiSelects = document.querySelectorAll("p-columnfilter p-multiselect");
    if (multiSelects.length === 0) {
      console.warn("[Filter] p-multiselect untuk Masa Pajak tidak ditemukan");
      return false;
    }

    const multiSelect = multiSelects[0];
    const trigger = multiSelect.querySelector(".p-multiselect-trigger") || multiSelect;
    trigger.click();

    let panel = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      panel = document.querySelector(".p-multiselect-panel");
      if (panel && panel.offsetParent !== null) break;
      await sleep(100);
    }
    if (!panel) {
      console.warn("[Filter] Panel multiselect tidak muncul");
      return false;
    }

    // Uncheck all currently selected items
    const highlightedItems = panel.querySelectorAll("p-multiselectitem li.p-highlight");
    for (const item of highlightedItems) {
      item.click();
      await sleep(50);
    }

    // Select the target month
    const allItems = panel.querySelectorAll("p-multiselectitem li");
    let found = false;
    for (const item of allItems) {
      const label = item.getAttribute("aria-label") || item.textContent.trim();
      if (label === bulanName) {
        item.click();
        found = true;
        break;
      }
    }

    // Close the panel
    const closeBtn = panel.querySelector(".p-multiselect-close");
    if (closeBtn) closeBtn.click();
    else trigger.click();
    await sleep(100);

    return found;
  }

  function clickRefreshButton() {
    const selectors = [
      "#RefreshButton",
      "button[id*='Refresh']",
      "button[id*='refresh']",
    ];
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) { btn.click(); return true; }
    }
    const allBtns = document.querySelectorAll("button");
    for (const btn of allBtns) {
      const icon = btn.querySelector(".pi-refresh, .pi-search");
      if (icon && btn.offsetParent !== null) { btn.click(); return true; }
    }
    return false;
  }

  function clearAllFilters() {
    const nfInput = getFilterNomorFaktur();
    if (nfInput) setAngularInputValue(nfInput, "");
    const yearInput = getFilterTahun();
    if (yearInput) setAngularInputValue(yearInput, "");
  }

  async function applyGridFilters(bulanNumber, tahun, nomorFaktur) {
    const bulanName = BULAN_NAMES[bulanNumber] || "";

    if (bulanName) {
      await selectMasaPajakFilter(bulanName);
    }

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

    // Click Refresh to apply all filters
    const refreshed = clickRefreshButton();
    if (!refreshed && nfInput) {
      nfInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
    }

    // Wait for spinner to appear → disappear (fast, like PPN downloader)
    await waitForAction(1500, 30000);
  }

  // ══════════════════════════════════════════════════════════════
  //  EDIT PAGE FUNCTIONS
  // ══════════════════════════════════════════════════════════════

  async function selectPrimeNGDropdown(dropdownContainer, optionText, timeoutMs = 5000) {
    dropdownContainer.click();
    await sleep(200);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const items = document.querySelectorAll(".p-dropdown-items .p-dropdown-item");
      for (const item of items) {
        if (item.textContent.trim() === optionText) {
          item.click();
          return true;
        }
      }
      await sleep(100);
    }
    return false;
  }

  // ══════════════════════════════════════════════════════════════
  //  CSV REKAP DOWNLOAD
  // ══════════════════════════════════════════════════════════════

  function downloadRekapCSV() {
    const header = "Nomor Faktur,Masa Pajak Faktur,Tahun Pajak Faktur,Masa Pajak Pengkreditan,Tahun Pajak Pengkreditan,Status,Keterangan,Waktu Proses";
    const rows = rekapResults.map(r => {
      const masaFaktur = BULAN_NAMES[r.masaPajakFaktur] || r.masaPajakFaktur;
      const masaKredit = BULAN_NAMES[r.masaPajakPengkreditan] || r.masaPajakPengkreditan;
      const fields = [
        `'${r.nomorFaktur}`,
        masaFaktur,
        r.tahunPajakFaktur,
        masaKredit,
        r.tahunPajakPengkreditan,
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
    a.download = `rekap_pengkreditan_faktur_${timestamp}.csv`;
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
  progressPanel.id = "tukang-pengkreditan-progress";
  progressPanel.style.cssText = `
    position:fixed;bottom:24px;right:24px;width:360px;
    background:#0f1117;border:1px solid rgba(255,255,255,.08);
    border-radius:14px;padding:18px 20px;z-index:999999;
    font-family:'DM Sans',system-ui,sans-serif;
    box-shadow:0 16px 48px rgba(0,0,0,.5);color:#e2e8f0;
  `;
  progressPanel.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🧾</div>
      <div>
        <div style="font-size:13px;font-weight:600;color:#f0f2f8;">Pengkreditan Faktur</div>
        <div id="tkpf-subtitle" style="font-size:11px;color:#4e5668;margin-top:2px;">Memulai proses...</div>
      </div>
    </div>
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#4e5668;margin-bottom:4px;">
        <span id="tkpf-status">0 / ${fakturList.length}</span>
        <span id="tkpf-percent">0%</span>
      </div>
      <div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;">
        <div id="tkpf-bar" style="height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#8b5cf6,#7c3aed);transition:width .5s cubic-bezier(.4,0,.2,1);"></div>
      </div>
    </div>
    <div id="tkpf-current" style="font-size:12px;color:#94a3b8;font-family:'DM Mono',monospace;word-break:break-all;margin-bottom:8px;">—</div>
  `;
  document.body.appendChild(progressPanel);

  const elSubtitle = document.getElementById("tkpf-subtitle");
  const elStatus = document.getElementById("tkpf-status");
  const elPercent = document.getElementById("tkpf-percent");
  const elBar = document.getElementById("tkpf-bar");
  const elCurrent = document.getElementById("tkpf-current");

  function updateProgress(index, total, text, status, color) {
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

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  console.log(`[Pengkreditan Faktur] Memulai proses ${fakturList.length} faktur...`);
  elSubtitle.textContent = `Memproses ${fakturList.length} faktur...`;

  for (let i = 0; i < fakturList.length; i++) {
    const item = fakturList[i];
    const noFaktur = item.nomorFaktur.trim();
    const masaPajakFaktur = item.masaPajakFaktur;
    const tahunPajakFaktur = item.tahunPajakFaktur;
    const masaPajakKredit = item.masaPajakPengkreditan;
    const tahunPajakKredit = item.tahunPajakPengkreditan;
    const bulanKreditName = BULAN_NAMES[masaPajakKredit] || "";
    const processStartTime = new Date().toLocaleString("id-ID");

    if (!noFaktur) {
      skipCount++;
      rekapResults.push({
        nomorFaktur: noFaktur || "(kosong)",
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan: masaPajakKredit,
        tahunPajakPengkreditan: tahunPajakKredit,
        status: "SKIP",
        keterangan: "Nomor faktur kosong",
        waktuProses: processStartTime
      });
      continue;
    }

    console.log(`[Pengkreditan Faktur] (${i + 1}/${fakturList.length}) ${noFaktur}`);
    elCurrent.textContent = noFaktur;
    elCurrent.style.color = "#c4b5fd";
    elSubtitle.textContent = `Memproses ${i + 1} dari ${fakturList.length}...`;

    try {
      // ── Step 1: Ensure grid page ──
      const onGrid = await waitForGridPage(5000);
      if (!onGrid) throw new Error("Tidak berada di halaman grid");
      await waitSpinnerGone();

      // ── Step 2: Apply filters & refresh ──
      await applyGridFilters(masaPajakFaktur, tahunPajakFaktur, noFaktur);

      // ── Step 3: Find matching row ──
      const rows = await waitForFilteredRows(noFaktur, 20000);
      if (!rows) throw new Error("Data tidak ditemukan setelah filter");

      const tbody = getDataTableTbody();
      const allRows = tbody ? tbody.querySelectorAll("tr") : [];
      let targetRow = null;
      for (const row of allRows) {
        if (row.textContent && row.textContent.includes(noFaktur)) {
          targetRow = row;
          break;
        }
      }
      if (!targetRow) throw new Error("Nomor faktur tidak ditemukan di tabel");

      // ── Step 4: Click Edit button ──
      const editBtn = targetRow.querySelector("#EditButton");
      if (!editBtn) throw new Error("Tombol Edit tidak ditemukan");
      editBtn.click();

      // Wait for spinner (fast — like PPN downloader)
      await waitForAction(1500, 30000);
      const editLoaded = await waitForEditPage(20000);
      if (!editLoaded) throw new Error("Halaman edit gagal dimuat");
      // Wait for any secondary spinner on the edit page
      await waitSpinnerGone(10000);

      // ── Step 5: Change "Masa Pajak Dikreditkan" dropdown ──
      const allFormItems = document.querySelectorAll("einv-doc-form-item");
      let periodCreditDropdown = null;
      let yearCreditInput = null;

      for (const formItem of allFormItems) {
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

      if (!periodCreditDropdown) throw new Error("Dropdown Masa Pajak Dikreditkan tidak ditemukan");
      if (periodCreditDropdown.classList.contains("p-disabled")) throw new Error("Dropdown Masa Pajak Dikreditkan disabled");

      const monthOk = await selectPrimeNGDropdown(periodCreditDropdown, bulanKreditName);
      if (!monthOk) throw new Error(`Gagal memilih bulan '${bulanKreditName}'`);

      // ── Step 6: Change "Tahun Pajak Dikreditkan" ──
      if (!yearCreditInput) throw new Error("Input Tahun Pajak Dikreditkan tidak ditemukan");
      if (yearCreditInput.disabled) throw new Error("Input Tahun Pajak Dikreditkan disabled");
      yearCreditInput.focus();
      setAngularInputValue(yearCreditInput, tahunPajakKredit);

      // ── Step 7: Click "Kredit" button ──
      let kreditBtn = await waitForButton("Credit", 8000);
      if (!kreditBtn) kreditBtn = await waitForButton("Kredit", 3000);
      if (!kreditBtn) throw new Error("Tombol Kredit tidak ditemukan");

      kreditBtn.click();

      // ── Step 8: Wait for spinner + toast notification ──
      await waitForAction(1500, 30000);

      // Check for confirmation dialog and accept it
      const confirmBtn = document.querySelector(".p-confirm-dialog-accept");
      if (confirmBtn && confirmBtn.offsetParent !== null) {
        confirmBtn.click();
        await waitForAction(1500, 30000);
      }

      // Wait for toast to appear and disappear
      await waitForToastAppearAndDisappear(15000);

      // ── Step 9: Navigate back to grid ──
      const stillOnEdit = document.getElementById("TaxInvoiceNumber");
      if (stillOnEdit) {
        window.history.back();
      }

      const backToGrid = await waitForGridPage(15000);
      if (!backToGrid) {
        window.history.back();
        await waitForGridPage(10000);
      }
      await waitSpinnerGone(10000);

      console.log(`[Pengkreditan Faktur] ✓ Berhasil: ${noFaktur}`);
      updateProgress(i, fakturList.length, noFaktur, "✓", "#22c55e");
      successCount++;

      rekapResults.push({
        nomorFaktur: noFaktur,
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan: masaPajakKredit,
        tahunPajakPengkreditan: tahunPajakKredit,
        status: "BERHASIL",
        keterangan: "Sukses dikreditkan",
        waktuProses: processStartTime
      });

    } catch (err) {
      console.error(`[Pengkreditan Faktur] ✗ Gagal: ${noFaktur}`, err.message);
      updateProgress(i, fakturList.length, noFaktur, `✗ ${err.message}`, "#f87171");
      failCount++;

      rekapResults.push({
        nomorFaktur: noFaktur,
        masaPajakFaktur,
        tahunPajakFaktur,
        masaPajakPengkreditan: masaPajakKredit,
        tahunPajakPengkreditan: tahunPajakKredit,
        status: "GAGAL",
        keterangan: err.message,
        waktuProses: processStartTime
      });

      const onGrid = document.getElementById("filterTaxInvoiceNumber");
      if (!onGrid) {
        window.history.back();
        await waitForGridPage(15000);
        await waitSpinnerGone(10000);
      }
    }

    try { clearAllFilters(); } catch (e) { /* ignore */ }
  }

  // ══════════════════════════════════════════════════════════════
  //  DONE — Show summary + download rekap button
  // ══════════════════════════════════════════════════════════════

  const totalMsg = `Selesai: ${successCount} berhasil, ${failCount} gagal, ${skipCount} dilewati`;
  console.log(`[Pengkreditan Faktur] ${totalMsg}`);
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
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span>❌ Gagal</span>
      <span style="color:#f87171;font-weight:600;font-family:'DM Mono',monospace;">${failCount}</span>
    </div>
    <div style="display:flex;justify-content:space-between;">
      <span>⏭️ Dilewati</span>
      <span style="color:#f59e0b;font-weight:600;font-family:'DM Mono',monospace;">${skipCount}</span>
    </div>
  `;
  progressPanel.appendChild(rekapSummary);

  // Download Rekap CSV button
  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "📥 Download Rekap CSV";
  downloadBtn.style.cssText = `
    width:100%;padding:10px;margin-top:10px;
    border:none;
    background:linear-gradient(135deg,#8b5cf6,#7c3aed);
    border-radius:8px;color:#fff;font-size:12px;font-weight:600;
    cursor:pointer;font-family:'DM Sans',sans-serif;
    box-shadow:0 3px 10px rgba(139,92,246,.3);
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
      downloadBtn.style.background = "linear-gradient(135deg,#8b5cf6,#7c3aed)";
    }, 2000);
  };
  progressPanel.appendChild(downloadBtn);

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Tutup";
  closeBtn.style.cssText = `
    width:100%;padding:9px;margin-top:8px;
    border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);
    border-radius:8px;color:#a0aec0;font-size:12px;font-weight:500;
    cursor:pointer;font-family:'DM Sans',sans-serif;transition:background .15s;
  `;
  closeBtn.onmouseover = () => { closeBtn.style.background = "rgba(255,255,255,.1)"; };
  closeBtn.onmouseout = () => { closeBtn.style.background = "rgba(255,255,255,.04)"; };
  closeBtn.onclick = () => progressPanel.remove();
  progressPanel.appendChild(closeBtn);

})();