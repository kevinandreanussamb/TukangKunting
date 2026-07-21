(async function () {
  const MODULE_NAME = "Faktur Pajak Retur";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  function getNomorRetur(row, mapped) {
    return (
      mapped["Nomor Retur"] ||
      mapped["Nomor Dokumen Retur"] ||
      row.children?.[6]?.textContent?.replace(/^Nomor Retur/i, "").trim() ||
      ""
    );
  }

  function getDownloadButton(row) {
    return (
      row.querySelector("button#DownloadButton") ||
      row.querySelector("button .pi-file-pdf")?.closest("button") ||
      row.querySelector("button[id='DownloadButton']")
    );
  }

  await TK.DownloadEngine.run({
    title: MODULE_NAME,
    subtitle: "Download Faktur Pajak Retur",
    delayKey: "delay_ppn_retur",
    csvPrefix: "faktur_pajak_retur",
    retry: 3,
    autoExportCsv: false,

    fallbackHeaders: [
      "Masa Pajak",
      "Tanggal Retur",
      "Status",
      "Nomor Faktur Pajak",
      "Nomor Retur",
      "NPWP",
      "Nama",
      "DPP",
      "PPN",
    ],

    mapRow(row, headers) {
      return TK.Table.rowToObject(row, headers);
    },

    getKey(row, mapped) {
      return getNomorRetur(row, mapped);
    },

    getDownloadButton,
  });
})();