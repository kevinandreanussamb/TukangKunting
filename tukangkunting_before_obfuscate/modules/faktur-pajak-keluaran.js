(async function () {
  const MODULE_NAME = "Faktur Pajak Keluaran";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  function getNomorFaktur(row, mapped) {
    return (
      mapped["Nomor Faktur Pajak"] ||
      mapped["Nomor Faktur"] ||
      row.children?.[5]?.textContent?.replace(/^Nomor Faktur Pajak/i, "").trim() ||
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
    subtitle: "Download Faktur Pajak Keluaran",
    delayKey: "delay_ppn",
    csvPrefix: "faktur_pajak_keluaran",
    retry: 3,
    autoExportCsv: false,

    fallbackHeaders: [
      "Masa Pajak",
      "Tanggal Faktur",
      "Jenis Faktur",
      "Status",
      "Nomor Faktur Pajak",
      "NPWP Pembeli",
      "Nama Pembeli",
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