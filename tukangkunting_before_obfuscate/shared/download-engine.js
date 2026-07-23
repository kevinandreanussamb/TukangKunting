(function () {
  const TK = (window.TK = window.TK || {});

  async function ensureSession(ui) {
    if (TK.Session?.ensureActive) {
      await TK.Session.ensureActive(ui);
    }
  }

  async function waitForTableReady(basePoll = 300, maxTries = 120, ui = null) {
    for (let i = 0; i < maxTries; i++) {
      await ensureSession(ui);

      const rows = TK.Table.getRows();
      const paginator =
        document.querySelector(".p-paginator-bottom") ||
        document.querySelector(".p-paginator") ||
        document.querySelector("p-paginator");

      if (rows.length > 0 && paginator && !TK.DOM.hasSpinner()) {
        return true;
      }

      await TK.DOM.sleep(basePoll);
    }

    console.warn("[TK.DownloadEngine] Table not ready", {
      rows: TK.Table.getRows().length,
      paginatorBottom: !!document.querySelector(".p-paginator-bottom"),
      paginator: !!document.querySelector(".p-paginator"),
      primePaginator: !!document.querySelector("p-paginator"),
      spinner: TK.DOM.hasSpinner(),
      url: location.href,
    });

    return false;
  }

  function defaultFindDownloadButton(row) {
    return (
      row.querySelector("button#DownloadButton") ||
      row.querySelector("button .pi-file-pdf")?.closest("button") ||
      row.querySelector("button[id='DownloadButton']") ||
      row.querySelector("button#ActionDownloadButton, #ActionDownloadButton")
    );
  }

  function buildHeaders(rows, preferredHeaders = []) {
    return TK.CSV.inferHeaders(rows, preferredHeaders).filter((header, index, arr) => {
      return arr.indexOf(header) === index;
    });
  }

  function hasNewVisibleError(beforeBodyText) {
    const currentBodyText = document.body.innerText || "";

    if (currentBodyText === beforeBodyText) {
      return false;
    }

    const lower = currentBodyText.toLowerCase();

    const errorKeywords = [
      "gagal",
      "error",
      "timeout",
      "tidak dapat",
      "tidak berhasil",
      "terjadi kesalahan",
      "failed",
      "failure",
    ];

    return errorKeywords.some((word) => lower.includes(word));
  }

  function isActionableElement(el) {
    return (
      el &&
      document.body.contains(el) &&
      TK.DOM.isVisible(el) &&
      !TK.DOM.isDisabled(el)
    );
  }

  async function tryDownloadRow({ row, mapped, key, config, waitTimeout, basePoll, ui }) {
    await ensureSession(ui);

    if (!row || !document.body.contains(row)) {
      return {
        ok: false,
        retriable: true,
        reason: "stale_row_before_click",
      };
    }

    const button = config.getDownloadButton
      ? config.getDownloadButton(row, mapped)
      : defaultFindDownloadButton(row);

    if (!button) {
      return {
        ok: false,
        retriable: false,
        reason: "download_button_not_found",
      };
    }

    if (!isActionableElement(button)) {
      return {
        ok: false,
        retriable: true,
        reason: "download_button_not_actionable",
      };
    }

    const beforeBodyText = document.body.innerText || "";

    await ensureSession(ui);

    TK.DOM.humanClick(button);

    const actionResult = await TK.DOM.waitForAction(
      config.actionStartWindow || 1500,
      waitTimeout,
      basePoll
    );

    await ensureSession(ui);

    if (!actionResult.ok) {
      return {
        ok: false,
        retriable: false,
        reason: actionResult.reason || "action_timeout",
      };
    }

    if (actionResult.spinnerSeen && !actionResult.timedOut) {
      return {
        ok: true,
        reason: "spinner_completed",
      };
    }

    await TK.DOM.sleep(Math.min(Math.max(basePoll * 2, 600), 1500));

    await ensureSession(ui);

    if (TK.DOM.hasSpinner()) {
      const gone = await TK.DOM.waitSpinnerGone(waitTimeout, basePoll);

      await ensureSession(ui);

      if (!gone) {
        return {
          ok: false,
          retriable: false,
          reason: "spinner_timeout_after_click",
        };
      }

      return {
        ok: true,
        reason: "late_spinner_completed",
      };
    }

    if (hasNewVisibleError(beforeBodyText)) {
      return {
        ok: false,
        retriable: true,
        reason: "visible_error_after_click",
      };
    }

    return {
      ok: true,
      reason: "no_spinner_assumed",
    };
  }

  async function run(config) {
    const moduleName = config.title || "Tukangkunting";

    const delay = await TK.Storage.getDelay(
      config.delayKey,
      config.defaultDelay || 500
    );

    const retry = config.retry || 3;
    const basePoll = Math.max(delay, 300);
    const waitTimeout = config.waitTimeout || Math.max(delay * 20, 30000);

    const ui = TK.UI.createProgressPanel({
      title: moduleName,
      subtitle: config.subtitle || "Document Automation",
      delay,
      total: config.total || 0,
    });

    await TK.Power?.start?.("display", ui);

    const state = {
      processedKeys: new Set(),
      rows: [],
      headers: [],
      success: 0,
      failed: 0,
    };

    function exportFile() {
      if (!state.rows.length) {
        alert("Tidak ada data untuk diexport.");
        return;
      }

      const headers = buildHeaders(state.rows, state.headers);
      const filename = `${config.csvPrefix || "tukang_export"}_${TK.CSV.timestamp()}.xlsx`;

      TK.CSV.download({
        filename,
        headers,
        rows: state.rows,
        sheetName: config.sheetName || "Data",
      });
    }

    ui.onExport(exportFile);

    ui.onCancel(() => {
      ui.log("Proses dibatalkan user.");
    });

    ui.onPauseToggle((paused) => {
      ui.log(paused ? "Paused." : "Resumed.");
    });

    ui.setStatus("Starting...");
    ui.setMetrics({
      delay,
      success: 0,
      failed: 0,
    });

    ui.log("Runtime loaded.");
    ui.log(`Mode: ${config.mode || "download"}`);
    ui.log(`Delay: ${delay}ms`);
    ui.log(`Timeout: ${waitTimeout}ms`);

    try {
      await ensureSession(ui);

      const ready = await waitForTableReady(basePoll, 120, ui);

      if (!ready) {
        ui.error("Table not ready");
        ui.log("Tabel/paginator tidak ditemukan. Pastikan halaman data sudah terbuka.");
        return state;
      }

      ui.log("Table ready.");

      await ensureSession(ui);
      await TK.DOM.waitSpinnerGone(waitTimeout, basePoll);
      await ensureSession(ui);
      await TK.Pagination.waitForPaginatorReady(waitTimeout, basePoll);

      state.headers = config.getHeaders?.() || TK.Table.getHeaders(config.fallbackHeaders || []);

      let safetyPageLoop = 0;

      while (!ui.state.cancelled && safetyPageLoop < (config.maxPageLoop || 1000)) {
        await ensureSession(ui);

        await TK.DOM.waitSpinnerGone(waitTimeout, basePoll);

        await ensureSession(ui);

        const currentPage = TK.Pagination.getCurrentPageNumber() || "—";

        ui.setStatus(`Page ${currentPage} scanning...`);
        ui.setMetrics({
          page: currentPage,
          success: state.success,
          failed: state.failed,
        });

        let pageScanLoop = 0;

        while (!ui.state.cancelled && pageScanLoop < (config.maxRowLoopPerPage || 1000)) {
          while (ui.state.paused && !ui.state.cancelled) {
            await TK.DOM.sleep(400);
          }

          if (ui.state.cancelled) break;

          await ensureSession(ui);

          await TK.DOM.waitSpinnerGone(waitTimeout, basePoll);

          await ensureSession(ui);

          const freshRows = TK.Table.getRows();

          if (!freshRows.length) {
            ui.log(`Page ${currentPage}: tidak ada row.`);
            break;
          }

          let target = null;
          let targetMapped = null;
          let targetKey = "";

          for (const freshRow of freshRows) {
            if (config.shouldProcessRow && !config.shouldProcessRow(freshRow)) {
              continue;
            }

            const mapped = config.mapRow
              ? config.mapRow(freshRow, state.headers)
              : TK.Table.rowToObject(freshRow, state.headers);

            const key = config.getKey
              ? config.getKey(freshRow, mapped, state.headers)
              : JSON.stringify(mapped);

            if (!key || state.processedKeys.has(key)) {
              continue;
            }

            target = freshRow;
            targetMapped = mapped;
            targetKey = key;
            break;
          }

          if (!target || !targetKey) {
            ui.log(`Page ${currentPage}: semua row selesai diproses.`);
            break;
          }

          await ensureSession(ui);

          if (config.mode === "export") {
            state.processedKeys.add(targetKey);
            state.success += 1;

            state.rows.push({
              ...targetMapped,
              Page: TK.Pagination.getCurrentPageNumber() || "",
              ExportedAt: new Date().toISOString(),
              Status: "BERHASIL",
              Keterangan: "",
            });

            ui.setStatus("Exporting...");
            ui.setMetrics({
              page: TK.Pagination.getCurrentPageNumber() || "",
              success: state.success,
              failed: state.failed,
            });

            ui.log(`Captured ${targetKey}`);
            pageScanLoop += 1;
            await TK.DOM.sleep(Math.max(delay / 2, 150));
            continue;
          }

          ui.setStatus("Downloading...");
          ui.log(`Downloading ${targetKey}`);

          let ok = false;
          let failReason = "";

          for (let attemptIndex = 0; attemptIndex < retry; attemptIndex++) {
            try {
              await ensureSession(ui);

              if (!target || !document.body.contains(target)) {
                failReason = "stale_row_before_attempt";
                ui.log(`Attempt ${attemptIndex + 1}/${retry} failed ${targetKey}: ${failReason}`);
                break;
              }

              const attempt = await tryDownloadRow({
                row: target,
                mapped: targetMapped,
                key: targetKey,
                config,
                waitTimeout,
                basePoll,
                ui,
              });

              if (attempt.ok) {
                ok = true;
                failReason = "";
                ui.log(`Attempt ${attemptIndex + 1}/${retry} success ${targetKey}: ${attempt.reason}`);
                break;
              }

              failReason = attempt.reason || "unknown_error";
              ui.log(`Attempt ${attemptIndex + 1}/${retry} failed ${targetKey}: ${failReason}`);

              if (attempt.retriable === false) {
                break;
              }

              if (attemptIndex < retry - 1) {
                await TK.DOM.sleep(delay);
              }
            } catch (err) {
              if (TK.Session?.isSessionError?.(err)) {
                ui.log(`Session expired saat memproses ${targetKey}. Menunggu login ulang...`);
                await TK.Session.handleExpired(ui);

                // ulangi attempt yang sama setelah login
                attemptIndex -= 1;
                continue;
              }

              throw err;
            }
          }

          state.processedKeys.add(targetKey);

          if (ok) {
            state.success += 1;

            state.rows.push({
              ...targetMapped,
              Page: TK.Pagination.getCurrentPageNumber() || "",
              DownloadedAt: new Date().toISOString(),
              Status: "BERHASIL",
              Keterangan: "",
            });

            ui.log(`Downloaded ${targetKey}`);
          } else {
            state.failed += 1;

            state.rows.push({
              ...targetMapped,
              Page: TK.Pagination.getCurrentPageNumber() || "",
              DownloadedAt: "",
              Status: "GAGAL",
              Keterangan: failReason || "download_failed",
            });

            ui.log(`Failed ${targetKey}: ${failReason || "download_failed"}`);
          }

          ui.setMetrics({
            page: TK.Pagination.getCurrentPageNumber() || "",
            success: state.success,
            failed: state.failed,
          });

          pageScanLoop += 1;

          await TK.DOM.sleep(delay);
        }

        if (ui.state.cancelled) break;

        await ensureSession(ui);

        const moved = await TK.Pagination.goToNextPage({
          pollMs: basePoll,
          timeoutMs: waitTimeout,
        });

        await ensureSession(ui);

        if (!moved) break;

        safetyPageLoop += 1;
        await TK.DOM.sleep(Math.max(delay, 300));
      }

      if (ui.state.cancelled) {
        ui.error("Cancelled");

        TK.Activity.finish({
          module: moduleName,
          total: state.success + state.failed,
          success: state.success,
          failed: state.failed,
          skipped: 0,
        });

        return state;
      }

      ui.done("DONE");
      ui.log(`Selesai. Success: ${state.success}, Failed: ${state.failed}`);

      if (config.autoExportCsv) {
        exportFile();
      }

      TK.Activity.finish({
        module: moduleName,
        total: state.success + state.failed,
        success: state.success,
        failed: state.failed,
        skipped: 0,
      });

      return state;
    } catch (err) {
      if (TK.Session?.isSessionError?.(err)) {
        ui.error("Session interrupted");
        ui.log("Proses berhenti karena halaman perlu reload setelah login ulang. Jalankan module lagi bila tab diarahkan ulang.");
        return state;
      }

      ui.error("ERROR");
      ui.log(err.message || String(err));
      console.error("[TK.DownloadEngine] fatal error:", err);
      return state;
    }
  }

  TK.DownloadEngine = {
    run,
  };
})();