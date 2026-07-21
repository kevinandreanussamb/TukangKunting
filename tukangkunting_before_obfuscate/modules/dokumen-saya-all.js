(async function () {
  const MODULE_NAME = "Dokumen Saya";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  function getNomorDokumen(row, mapped) {
    return (
      mapped["Nomor Dokumen"] ||
      mapped["Nomor"] ||
      row.children?.[0]?.textContent?.replace(/^Nomor Dokumen/i, "").trim() ||
      ""
    );
  }

  function getDownloadButton(row) {
    return row.querySelector("button#ActionDownloadButton, #ActionDownloadButton");
  }

  await TK.DownloadEngine.run({
    title: MODULE_NAME,
    subtitle: "Download Semua Dokumen",
    delayKey: "delay_dokumen_all",
    csvPrefix: "dokumen_saya_all",
    retry: 3,
    autoExportCsv: false,

    fallbackHeaders: [
      "Nomor Dokumen",
      "Tanggal Dokumen",
      "Jenis Dokumen",
      "Status",
    ],

    mapRow(row, headers) {
      return TK.Table.rowToObject(row, headers);
    },

    getKey(row, mapped) {
      return getNomorDokumen(row, mapped);
    },

    getDownloadButton,
  });
})();