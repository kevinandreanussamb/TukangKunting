(async function () {
  const MODULE_NAME = "Faktur Pajak Masukan";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  function getNomorFaktur(row, mapped) {
    return (
      mapped["Nomor Faktur Pajak"] ||
      mapped["Nomor Faktur"] ||
      row.children?.[4]?.textContent?.replace(/^Nomor Faktur Pajak/i, "").trim() ||
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
    subtitle: "Download Faktur Pajak Masukan",
    delayKey: "delay_ppn",
    csvPrefix: "faktur_pajak_masukan",
    retry: 3,
    autoExportCsv: false,

    fallbackHeaders: [
      "Masa Pajak",
      "Tanggal Faktur",
      "Status",
      "Nomor Faktur Pajak",
      "NPWP Penjual",
      "Nama Penjual",
      "DPP",
      "PPN",
    ],

    mapRow(row, headers) {
      return TK.Table.rowToObject(row, headers);
    },

    getKey(row, mapped) {
      return getNomorFaktur(row, mapped);
    },

    getDownloadButton,
  });
})();