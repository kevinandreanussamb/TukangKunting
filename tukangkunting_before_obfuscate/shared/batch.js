(function () {
  const TK = window;

  function createBatchState() {
    return {
      paused: false,
      cancelled: false,
      success: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };
  }

  async function waitIfPaused(state, ui) {
    while (state.paused && !state.cancelled) {
      ui?.setStatus?.("Paused", "paused");
      await TK.DOM.sleep(400);
    }
  }

  function pushResult(state, result) {
    state.results.push({
      ...result,
      waktuProses: result.waktuProses || new Date().toLocaleString("id-ID"),
    });

    if (result.status === "BERHASIL") state.success += 1;
    else if (result.status === "GAGAL") state.failed += 1;
    else if (result.status === "SKIP") state.skipped += 1;
  }

  function getFailedItems(state, mapper) {
    return state.results
      .filter((item) => item.status === "GAGAL")
      .map((item) => (mapper ? mapper(item) : item));
  }

  function exportRekapCsv({ filename, headers, rows }) {
    TK.CSV.download({
      filename,
      headers,
      rows,
    });
  }

  TK.Batch = {
    createBatchState,
    waitIfPaused,
    pushResult,
    getFailedItems,
    exportRekapCsv,
  };
})();
