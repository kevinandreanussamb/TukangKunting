(async function () {
  const MODULE_NAME = "BPPU & BPNR";

  if (!(await TK.License.ensure(MODULE_NAME))) return;

  const mode = window.__TUKANG_BPPU_MODE === "export" ? "export" : "download";

  delete window.__TUKANG_BPPU_MODE;

  const isExportMode = mode === "export";

  const fallbackHeaders = [
    "Masa Pajak",
    "Nomor Pemotongan",
    "Status",
    "Status Tanda Tangan Elektronik",
    "NITKU/Nomor Identitas Sub Unit Organisasi",
    "Jenis Pajak",
    "Kode Objek Pajak",
    "Nomor Identitas WP",
    "Nama",
    "Dasar Pengenaan Pajak (Rp)",
    "Pajak Penghasilan (Rp)",
    "Fasilitas Pajak",
    "Dilaporkan Dalam SPT",
    "Dalam Proses Keberatan",
    "Selesai Proses Keberatan",
    "Keberatan tidak memenuhi persyaratan (Tolak Formal)",
    "Dalam Proses Reviu Pencabutan Permohonan Keberatan",
    "Pencabutan Keberatan Diterima",
    "SPT Telah/Sedang Diperiksa",
    "SPT Dalam Penanganan Hukum",
    "Sedang Dalam Proses Pengembalian",
  ];

  function getNomorPemotongan(row, mapped) {
    return (
      mapped["Nomor Pemotongan"] ||
      mapped["Nomor Bukti Potong"] ||
      row.children?.[3]?.textContent?.replace(/^Nomor Pemotongan/i, "").trim() ||
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
    title: isExportMode ? "BPPU & BPNR — Export CSV" : "BPPU & BPNR",
    subtitle: isExportMode
      ? "Export semua kolom tanpa download PDF"
      : "Download PDF dan rekam CSV",
    delayKey: "delay_bppu",
    csvPrefix: isExportMode ? "bppu_export_only" : "bppu_downloaded",
    retry: 3,
    mode,
    waitTimeout: 30000,
    actionStartWindow: 2000,
    autoExportCsv: isExportMode,
    fallbackHeaders,

    mapRow(row, headers) {
      return TK.Table.rowToObject(row, headers);
    },

    getKey(row, mapped) {
      return getNomorPemotongan(row, mapped);
    },

    getDownloadButton,
  });
})();