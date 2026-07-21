(async function () {
  const MODULE_NAME = "Bukti Potong Saya";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  function getNomorPemotongan(row, mapped) {
    return (
      mapped["Nomor Pemotongan"] ||
      mapped["Nomor Bukti Potong"] ||
      row.children?.[2]?.textContent?.replace(/^Nomor Pemotongan/i, "").trim() ||
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
    subtitle: "Download Bukti Potong Saya",
    delayKey: "delay_tax_withholding_slips",
    csvPrefix: "bukti_potong_saya",
    retry: 3,
    autoExportCsv: false,

    fallbackHeaders: [
      "Masa Pajak",
      "Nomor Pemotongan",
      "Status",
      "NPWP Pemotong",
      "Nama Pemotong",
    ],

    mapRow(row, headers) {
      return TK.Table.rowToObject(row, headers);
    },

    getKey(row, mapped) {
      return getNomorPemotongan(row, mapped);
    },

    getDownloadButton,
  });
})();