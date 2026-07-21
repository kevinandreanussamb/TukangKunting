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
    return Array.from(
      document.querySelectorAll(Constants.SELECTORS?.tableRows || "table tbody tr")
    );
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
            .querySelectorAll(
              "input, select, button, .p-column-filter, .p-dropdown, .p-calendar, .p-checkbox"
            )
            .forEach((el) => el.remove());

          return clean(clone.textContent);
        })
        .filter((header) => !isBadHeader(header));

      if (headers.length > bestHeaders.length) {
        bestHeaders = headers;
      }
    }

    return bestHeaders.length ? bestHeaders : fallbackHeaders;
  }

  function normalizeBooleanValue(value) {
    return value ? "TRUE" : "FALSE";
  }

  function hasCheckboxLikeElement(cell) {
    if (!cell) return false;

    return !!(
      cell.querySelector("input[type='checkbox']") ||
      cell.querySelector("p-checkbox") ||
      cell.querySelector(".p-checkbox") ||
      cell.querySelector(".p-checkbox-box") ||
      cell.querySelector("[role='checkbox']")
    );
  }

  function isCheckedByAria(el) {
    if (!el) return null;

    const ariaChecked = el.getAttribute("aria-checked");
    if (ariaChecked === "true") return true;
    if (ariaChecked === "false") return false;

    const ariaSelected = el.getAttribute("aria-selected");
    if (ariaSelected === "true") return true;
    if (ariaSelected === "false") return false;

    return null;
  }

  function isCheckedByClass(el) {
    if (!el) return false;

    return (
      el.classList.contains("p-highlight") ||
      el.classList.contains("p-checkbox-checked") ||
      el.classList.contains("p-checked") ||
      el.classList.contains("checked") ||
      el.classList.contains("active")
    );
  }

  function getCheckboxValue(cell) {
    if (!cell) return null;

    const nativeInput = cell.querySelector("input[type='checkbox']");
    if (nativeInput) {
      if (nativeInput.checked === true) return true;
      if (nativeInput.getAttribute("checked") !== null) return true;

      const aria = isCheckedByAria(nativeInput);
      if (aria !== null) return aria;

      return false;
    }

    const roleCheckbox = cell.querySelector("[role='checkbox']");
    if (roleCheckbox) {
      const aria = isCheckedByAria(roleCheckbox);
      if (aria !== null) return aria;

      if (isCheckedByClass(roleCheckbox)) return true;
    }

    const primeCheckbox =
      cell.querySelector("p-checkbox") ||
      cell.querySelector(".p-checkbox") ||
      cell.querySelector(".p-checkbox-box");

    if (primeCheckbox) {
      const aria = isCheckedByAria(primeCheckbox);
      if (aria !== null) return aria;

      const box =
        primeCheckbox.querySelector?.(".p-checkbox-box") ||
        cell.querySelector(".p-checkbox-box");

      const boxAria = isCheckedByAria(box);
      if (boxAria !== null) return boxAria;

      if (isCheckedByClass(primeCheckbox) || isCheckedByClass(box)) {
        return true;
      }

      if (
        primeCheckbox.querySelector?.(".pi-check") ||
        primeCheckbox.querySelector?.(".p-checkbox-icon.pi-check") ||
        cell.querySelector(".pi-check") ||
        cell.querySelector(".p-checkbox-icon.pi-check")
      ) {
        return true;
      }

      return false;
    }

    if (cell.querySelector(".pi-check")) {
      return true;
    }

    return null;
  }

  function removeResponsiveTitle(clone) {
    clone
      .querySelectorAll(".p-column-title")
      .forEach((el) => el.remove());
  }

  function removeNonDataControls(clone) {
    clone
      .querySelectorAll(
        [
          "button",
          "svg",
          "i",
          ".pi",
          ".p-button",
          ".p-row-toggler",
          ".p-column-filter",
          ".p-dropdown",
          ".p-calendar",
        ].join(",")
      )
      .forEach((el) => el.remove());
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
      "Dasar Pengenaan Pajak (Rp)": [
        "Dasar Pengenaan Pajak (Rp)",
        "Dasar Pengenaan Pajak",
      ],
      "Pajak Penghasilan (Rp)": [
        "Pajak Penghasilan (Rp)",
        "Pajak Penghasilan",
      ],
      "NITKU/Nomor Identitas Sub Unit Organisasi": [
        "NITKU/Nomor Identitas Sub Unit Organisasi",
        "NITKU",
        "Nomor Identitas Sub Unit Organisasi",
      ],
    };

    const possibleLabels = aliases[h] || [h];

    for (const label of possibleLabels) {
      const normalizedLabel = clean(label);

      if (output.toLowerCase().startsWith(normalizedLabel.toLowerCase() + " ")) {
        output = output.slice(normalizedLabel.length).trim();
        break;
      }
    }

    return output;
  }

  function cellToValue(cell, header = "") {
    const checkboxValue = getCheckboxValue(cell);

    if (checkboxValue !== null) {
      return normalizeBooleanValue(checkboxValue);
    }

    const clone = cell.cloneNode(true);

    removeResponsiveTitle(clone);
    removeNonDataControls(clone);

    return cleanCellByHeader(clone.textContent, header);
  }

  function getCellValues(row, headers = []) {
    return Array.from(row.children).map((cell, index) => {
      return cellToValue(cell, headers[index] || "");
    });
  }

  function findFirstMeaningfulCellIndex(cells) {
    return cells.findIndex((value) => {
      return (
        /^Masa Pajak\b/i.test(value) ||
        /^Nomor Pemotongan\b/i.test(value) ||
        /^Nomor Faktur\b/i.test(value) ||
        /^Nomor Retur\b/i.test(value) ||
        /^Nomor Dokumen\b/i.test(value) ||
        /^[A-Za-z]+\s+\d{4}$/i.test(value)
      );
    });
  }

  function alignCellsToHeaders(cells, headers) {
    let aligned = [...cells];

    while (aligned.length > headers.length && !aligned[0]) {
      aligned.shift();
    }

    if (aligned.length > headers.length) {
      const firstMeaningfulIdx = findFirstMeaningfulCellIndex(aligned);

      if (firstMeaningfulIdx >= 0) {
        aligned = aligned.slice(firstMeaningfulIdx, firstMeaningfulIdx + headers.length);
      } else {
        aligned = aligned.slice(aligned.length - headers.length);
      }
    }

    return aligned;
  }

  function rowToObject(row, headers = getHeaders()) {
    const rawCells = getCellValues(row, headers);
    const cells = alignCellsToHeaders(rawCells, headers);

    const obj = {};

    headers.forEach((header, index) => {
      const rawValue = cells[index] || "";
      obj[header] = cleanCellByHeader(rawValue, header);
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
    getCellValues,
    cellToValue,
    getCheckboxValue,
    cleanCellByHeader,
    rowToObject,
    findValueByHeaders,
  };
})();