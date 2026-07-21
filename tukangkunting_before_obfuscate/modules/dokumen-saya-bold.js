(async function () {
  const MODULE_NAME = "Dokumen Saya — Bold Only";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  function isRowBold(row) {
    const weight = window.getComputedStyle(row).fontWeight;
    return weight === "700" || weight === "bold";
  }

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
    subtitle: "Download Dokumen Bold",
    delayKey: "delay_dokumen_all",
    csvPrefix: "dokumen_saya_bold",
    retry: 3,
    autoExportCsv: false,

    fallbackHeaders: [
      "Nomor Dokumen",
      "Tanggal Dokumen",
      "Jenis Dokumen",
      "Status",
    ],

    shouldProcessRow(row) {
      return isRowBold(row);
    },

    mapRow(row, headers) {
      return TK.Table.rowToObject(row, headers);
    },

    getKey(row, mapped) {
      return getNomorDokumen(row, mapped);
    },

    getDownloadButton,
  });
})();