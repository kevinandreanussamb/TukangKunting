(function () {
  const TK = (window.TK = window.TK || {});
  const DOM = TK.DOM;
  const Constants = TK.Constants || {};

  function getCurrentPageNumber() {
    const selector = Constants.SELECTORS?.pageHighlight ||
      ".p-paginator-bottom .p-paginator-page.p-highlight, .p-paginator .p-paginator-page.p-highlight, .p-paginator-bottom .p-highlight, .p-paginator .p-highlight";

    const el = document.querySelector(selector);
    return el?.textContent?.trim() || null;
  }

  function getAllNextButtons() {
    return Array.from(document.querySelectorAll(Constants.SELECTORS?.nextButton || ".p-paginator-next"));
  }

  function getNextButton() {
    const buttons = getAllNextButtons();

    return (
      buttons.find((btn) => DOM.isVisible(btn) && !DOM.isDisabled(btn)) ||
      buttons.find((btn) => DOM.isVisible(btn)) ||
      buttons[0] ||
      null
    );
  }

  function getNextButtonState() {
    const btn = getNextButton();

    return {
      exists: !!btn,
      visible: btn ? DOM.isVisible(btn) : false,
      disabled: btn ? DOM.isDisabled(btn) : true,
      className: btn?.className || "",
      ariaDisabled: btn?.getAttribute("aria-disabled") || null,
      html: btn?.outerHTML || "",
    };
  }

  async function waitForPaginatorReady(timeoutMs = 8000, pollMs = 300) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const paginator = document.querySelector(Constants.SELECTORS?.paginator || ".p-paginator, .p-paginator-bottom");
      const rows = document.querySelectorAll(Constants.SELECTORS?.tableRows || "table tbody tr");

      if (paginator && rows.length > 0 && !DOM.hasSpinner()) {
        await DOM.sleep(Math.min(pollMs, 400));
        return true;
      }

      await DOM.sleep(pollMs);
    }

    return false;
  }

  async function waitUntilNextButtonSettles(timeoutMs = 6000, pollMs = 300) {
    const start = Date.now();
    let lastKey = "";
    let stableCount = 0;

    while (Date.now() - start < timeoutMs) {
      const state = getNextButtonState();

      const key = JSON.stringify({
        exists: state.exists,
        visible: state.visible,
        disabled: state.disabled,
        className: state.className,
        ariaDisabled: state.ariaDisabled,
      });

      if (key === lastKey) {
        stableCount += 1;
      } else {
        stableCount = 0;
        lastKey = key;
      }

      if (state.exists && state.visible && stableCount >= 3) {
        return state;
      }

      await DOM.sleep(pollMs);
    }

    return getNextButtonState();
  }

  async function goToNextPage(options = {}) {
    const pollMs = options.pollMs || 300;
    const timeoutMs = options.timeoutMs || 10000;

    await DOM.waitSpinnerGone(timeoutMs, pollMs);
    await waitForPaginatorReady(timeoutMs, pollMs);

    const beforeState = await waitUntilNextButtonSettles(timeoutMs, pollMs);

    if (!beforeState.exists || !beforeState.visible || beforeState.disabled) {
      return false;
    }

    const nextBtn = getNextButton();
    if (!nextBtn) return false;

    const oldPage = getCurrentPageNumber();
    const oldRowsText = Array.from(document.querySelectorAll(Constants.SELECTORS?.tableRows || "table tbody tr"))
      .map((row) => row.innerText.trim())
      .join("||");

    DOM.humanClick(nextBtn);

    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      await DOM.sleep(pollMs);

      if (DOM.hasSpinner()) {
        await DOM.waitSpinnerGone(timeoutMs, pollMs);
      }

      const newPage = getCurrentPageNumber();
      const newRowsText = Array.from(document.querySelectorAll(Constants.SELECTORS?.tableRows || "table tbody tr"))
        .map((row) => row.innerText.trim())
        .join("||");

      if (oldPage && newPage && newPage !== oldPage) {
        await DOM.waitSpinnerGone(timeoutMs, pollMs);
        return true;
      }

      if (newRowsText && newRowsText !== oldRowsText) {
        await DOM.waitSpinnerGone(timeoutMs, pollMs);
        return true;
      }
    }

    return false;
  }

  TK.Pagination = {
    getCurrentPageNumber,
    getNextButton,
    getNextButtonState,
    waitForPaginatorReady,
    waitUntilNextButtonSettles,
    goToNextPage,
  };
})();