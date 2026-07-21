(function () {
  const TK = (window.TK = window.TK || {});
  const Constants = TK.Constants || {};

  function clean(text) {
    return (text || "")
      .toString()
      .replace(/\s+/g, " ")
      .trim();
  }

  function isBadHeader(header) {
    if (!header) return true;

    return (
      /^pilih\b/i.test(header) ||
      /^filter\b/i.test(header) ||
      /^search\b/i.test(header) ||
      /^aksi$/i.test(header) ||
      /^action$/i.test(header) ||
      /^download$/i.test(header) ||
      /^lihat$/i.test(header) ||
      /^detail$/i.test(header) ||
      /^[<>«»]+$/.test(header)
    );
  }

  function getRows() {
    return Array.from(document.querySelectorAll(Constants.SELECTORS?.tableRows || "table tbody tr"));
  }

  function getHeaders(fallbackHeaders = []) {
    const table = document.querySelector("table");
    if (!table) return fallbackHeaders;

    const headerRows = Array.from(table.querySelectorAll("thead tr"));
    let bestHeaders = [];

    for (const tr of headerRows) {
      const headers = Array.from(tr.querySelectorAll("th"))
        .map((th) => {
          const clone = th.cloneNode(true);

          clone
            .querySelectorAll("input, select, button, .p-column-filter, .p-dropdown, .p-calendar")
            .forEach((el) => el.remove());

          return clean(clone.textContent);
        })
        .filter((h) => !isBadHeader(h));

      if (headers.length > bestHeaders.length) {
        bestHeaders = headers;
      }
    }

    return bestHeaders.length ? bestHeaders : fallbackHeaders;
  }

  function cleanCellByHeader(value, header) {
    let output = clean(value);
    const h = clean(header);

    if (!output || !h) return output;

    if (output.toLowerCase().startsWith(h.toLowerCase() + " ")) {
      output = output.slice(h.length).trim();
    }

    const aliases = {
      "Nomor Pemotongan": ["Nomor Bukti Potong", "Nomor Pemotongan"],
      "Nomor Faktur": ["Nomor Faktur", "Nomor Faktur Pajak"],
      "Nomor Faktur Pajak": ["Nomor Faktur", "Nomor Faktur Pajak"],
      "Nomor Retur": ["Nomor Retur"],
      "Nomor Dokumen": ["Nomor Dokumen"],
      "Dasar Pengenaan Pajak (Rp)": ["Dasar Pengenaan Pajak (Rp)", "Dasar Pengenaan Pajak"],
      "Pajak Penghasilan (Rp)": ["Pajak Penghasilan (Rp)", "Pajak Penghasilan"],
      "NITKU/Nomor Identitas Sub Unit Organisasi": [
        "NITKU/Nomor Identitas Sub Unit Organisasi",
        "NITKU",
        "Nomor Identitas Sub Unit Organisasi",
      ],
    };

    const possibleLabels = aliases[h] || [h];

    for (const label of possibleLabels) {
      const l = clean(label);

      if (output.toLowerCase().startsWith(l.toLowerCase() + " ")) {
        output = output.slice(l.length).trim();
        break;
      }
    }

    return output;
  }

  function getCellTexts(row) {
    return Array.from(row.children).map((td) => {
      const clone = td.cloneNode(true);

      clone
        .querySelectorAll("button, svg, i, .pi, .p-button, .p-checkbox")
        .forEach((el) => el.remove());

      return clean(clone.textContent);
    });
  }

  function rowToObject(row, headers = getHeaders()) {
    let cells = getCellTexts(row);

    while (cells.length > headers.length && !cells[0]) {
      cells.shift();
    }

    if (cells.length > headers.length) {
      const firstMeaningfulIdx = cells.findIndex((value) => {
        return (
          /^Masa Pajak\b/i.test(value) ||
          /^Nomor Pemotongan\b/i.test(value) ||
          /^Nomor Faktur\b/i.test(value) ||
          /^Nomor Retur\b/i.test(value) ||
          /^Nomor Dokumen\b/i.test(value)
        );
      });

      if (firstMeaningfulIdx >= 0) {
        cells = cells.slice(firstMeaningfulIdx, firstMeaningfulIdx + headers.length);
      } else {
        cells = cells.slice(cells.length - headers.length);
      }
    }

    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = cleanCellByHeader(cells[index] || "", header);
    });

    return obj;
  }

  function findValueByHeaders(row, possibleHeaders = [], headers = getHeaders()) {
    const data = rowToObject(row, headers);

    for (const header of possibleHeaders) {
      if (data[header]) return data[header];
    }

    return "";
  }

  TK.Table = {
    clean,
    isBadHeader,
    getRows,
    getHeaders,
    getCellTexts,
    cleanCellByHeader,
    rowToObject,
    findValueByHeaders,
  };
})();