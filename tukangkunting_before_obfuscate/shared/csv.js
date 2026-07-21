(function () {
  const TK = (window.TK = window.TK || {});

  function timestamp() {
    return new Date().toISOString().replace(/[:.]/g, "-");
  }

  function normalizeFilename(filename, extension = "xlsx") {
    const cleanName = String(filename || `tukang_export_${timestamp()}`)
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "_");

    return cleanName.replace(/\.(csv|xlsx)$/i, `.${extension}`);
  }

  function normalizeCellValue(value) {
    if (value == null) return "";

    const str = String(value).trim();

    // Keep long numeric identifiers safe in Excel:
    // NPWP, nomor faktur, nomor dokumen, NITKU, etc.
    if (/^\d{10,}$/.test(str)) {
      return str;
    }

    return str;
  }

  function normalizeRows(headers, rows) {
    return (rows || []).map((row) => {
      const output = {};

      headers.forEach((header) => {
        output[header] = normalizeCellValue(row?.[header]);
      });

      return output;
    });
  }

  function inferHeaders(rows, preferredHeaders = []) {
    const headers = [...preferredHeaders];

    for (const row of rows || []) {
      Object.keys(row || {}).forEach((key) => {
        if (!headers.includes(key)) {
          headers.push(key);
        }
      });
    }

    return headers;
  }

  function autoFitColumns(headers, rows) {
    return headers.map((header) => {
      let max = String(header || "").length;

      for (const row of rows || []) {
        const value = row?.[header] ?? "";
        max = Math.max(max, String(value).length);
      }

      return {
        wch: Math.min(Math.max(max + 2, 10), 48),
      };
    });
  }

  function downloadXlsx({ filename, headers, rows, sheetName = "Data" }) {
    if (!rows || !rows.length) {
      alert("Tidak ada data untuk diexport.");
      return false;
    }

    if (!window.XLSX) {
      console.error("[TK.XLSX] XLSX library tidak tersedia. Pastikan libs/xlsx.full.min.js sudah di-inject.");
      alert("XLSX library tidak tersedia. Cek injection libs/xlsx.full.min.js.");
      return false;
    }

    const finalHeaders = headers && headers.length ? headers : inferHeaders(rows);
    const safeRows = normalizeRows(finalHeaders, rows);

    const worksheetData = [
      finalHeaders,
      ...safeRows.map((row) => finalHeaders.map((header) => row[header] ?? "")),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = autoFitColumns(finalHeaders, safeRows);

    // Force text format for all populated cells to prevent Excel auto-convert
    // long identifiers into scientific notation.
    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex++) {
      for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex++) {
        const address = XLSX.utils.encode_cell({
          r: rowIndex,
          c: colIndex,
        });

        const cell = worksheet[address];

        if (!cell) continue;

        cell.t = "s";
        cell.z = "@";
      }
    }

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      String(sheetName || "Data").slice(0, 31)
    );

    const outputFilename = normalizeFilename(filename, "xlsx");

    XLSX.writeFile(workbook, outputFilename, {
      bookType: "xlsx",
      compression: true,
    });

    console.log("[TK.XLSX] downloaded:", outputFilename);

    return true;
  }

  // Backward-compatible API.
  // Existing modules can keep calling TK.CSV.download(...)
  // but output is now XLSX.
  function download({ filename, headers, rows, sheetName }) {
    return downloadXlsx({
      filename,
      headers,
      rows,
      sheetName,
    });
  }

  function parse(text) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .filter((line) => line.trim());

    if (lines.length < 2) {
      return [];
    }

    const sep = lines[0].includes(";") ? ";" : ",";

    const headers = lines[0]
      .split(sep)
      .map((header) => header.trim().replace(/^["']|["']$/g, ""));

    return lines.slice(1).map((line) => {
      const values = line
        .split(sep)
        .map((value) => value.trim().replace(/^["']|["']$/g, ""));

      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      return row;
    });
  }

  TK.CSV = {
    timestamp,
    inferHeaders,
    parse,
    download,
    downloadXlsx,
  };

  TK.XLSXExport = {
    timestamp,
    inferHeaders,
    download: downloadXlsx,
  };
})();