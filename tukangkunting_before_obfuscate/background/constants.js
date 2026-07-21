(function () {
  const CHANGELOG_VERSION = "1.5.5";
  const CHANGELOG_TITLE = "Yang Baru di Tukangkunting";
  const CHANGELOG_DATE = "2026-07-21";

  const BADGE_CLEAR_TIMEOUT_MS = 60_000;
  const MAX_ACTIVITY_LOG_SIZE = 200;

  const SHARED_SECRET = "GANTI_DENGAN_SECRET_AMAN_MINIMAL_32_CHAR!!";

  const SHARED_CONTENT_FILES = [
    "libs/jquery-3.7.0.min.js",
    "libs/xlsx.full.min.js",

    "shared/constants.js",
    "shared/storage.js",
    "shared/license.js",
    "shared/dom.js",
    "shared/pagination.js",
    "shared/table.js",
    "shared/csv.js",
    "shared/activity.js",
    "shared/ui.js",
    "shared/batch.js",
    "shared/download-engine.js",
  ];

    const CHANGELOG_ITEMS = [
    "Export data sekarang menggunakan XLSX",
    "Nomor panjang seperti NPWP, nomor faktur, dan NITKU lebih aman saat dibuka di Excel",
    "BPPU & BPNR punya mode Export XLSX tanpa download PDF",
    "Hasil export BPPU mengambil semua kolom tabel",
    "Progress panel, activity log, dan timeout download dibuat lebih konsisten",
    ];

  const MODULES = {
    FAKTUR_KELUARAN: {
      key: "faktur_keluaran",
      label: "Faktur Pajak Keluaran",
      file: "modules/faktur-pajak-keluaran.js",
      type: "download",
    },

    FAKTUR_MASUKAN: {
      key: "faktur_masukan",
      label: "Faktur Pajak Masukan",
      file: "modules/faktur-pajak-masukan.js",
      type: "download",
    },

    FAKTUR_RETUR: {
      key: "faktur_retur",
      label: "Faktur Pajak Retur",
      file: "modules/faktur-pajak-retur.js",
      type: "download",
    },

    BPPU_DOWNLOAD: {
      key: "bppu_download",
      label: "BPPU & BPNR — Download PDF",
      file: "modules/bppu-bpnr.js",
      type: "download",
      pageVars: {
        __TUKANG_BPPU_MODE: "download",
      },
    },

    BPPU_EXPORT: {
      key: "bppu_export",
      label: "BPPU & BPNR — Export CSV",
      file: "modules/bppu-bpnr.js",
      type: "export",
      pageVars: {
        __TUKANG_BPPU_MODE: "export",
      },
    },

    BUKTI_POTONG_SAYA: {
      key: "bukti_potong_saya",
      label: "Bukti Potong Saya",
      file: "modules/bukti-potong-saya.js",
      type: "download",
    },

    DOKUMEN_SAYA_ALL: {
      key: "dokumen_saya_all",
      label: "Dokumen Saya — Semua",
      file: "modules/dokumen-saya-all.js",
      type: "download",
    },

    DOKUMEN_SAYA_BOLD: {
      key: "dokumen_saya_bold",
      label: "Dokumen Saya — Bold Only",
      file: "modules/dokumen-saya-bold.js",
      type: "download",
    },

    PENGKREDITAN: {
      key: "pengkreditan",
      label: "Pengkreditan Faktur",
      file: "modules/pengkreditan-faktur.js",
      type: "csv_batch",
    },

    PEMBATALAN: {
      key: "pembatalan",
      label: "Pembatalan Faktur",
      file: "modules/pembatalan-faktur.js",
      type: "csv_batch",
    },
  };

  const MODULE_OPTIONS = Object.values(MODULES).map((moduleItem) => moduleItem.label);

  const DELAY_SETTINGS = [
    {
      key: "delay_ppn",
      label: "Delay Faktur Pajak (ms)",
      defaultValue: 500,
    },
    {
      key: "delay_ppn_retur",
      label: "Delay Faktur Pajak Retur (ms)",
      defaultValue: 500,
    },
    {
      key: "delay_bppu",
      label: "Delay BPPU & BPNR (ms)",
      defaultValue: 500,
    },
    {
      key: "delay_tax_withholding_slips",
      label: "Delay Bukti Potong Saya (ms)",
      defaultValue: 500,
    },
    {
      key: "delay_dokumen_all",
      label: "Delay Dokumen Saya (ms)",
      defaultValue: 500,
    },
    {
      key: "delay_pengkreditan",
      label: "Delay Pengkreditan Faktur (ms)",
      defaultValue: 1500,
    },
    {
      key: "delay_pembatalan",
      label: "Delay Pembatalan Faktur (ms)",
      defaultValue: 1500,
    },
  ];

  function getModuleByLabel(label) {
    return Object.values(MODULES).find((moduleItem) => moduleItem.label === label) || null;
  }

  self.TK_CONSTANTS = {
    SHARED_SECRET,
    SHARED_CONTENT_FILES,

    CHANGELOG_VERSION,
    CHANGELOG_TITLE,
    CHANGELOG_DATE,
    CHANGELOG_ITEMS,

    BADGE_CLEAR_TIMEOUT_MS,
    MAX_ACTIVITY_LOG_SIZE,

    MODULES,
    MODULE_OPTIONS,
    DELAY_SETTINGS,

    getModuleByLabel,
  };
})();