(function () {
  const TK = (window.TK = window.TK || {});
  const Constants = TK.Constants || {};

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isVisible(el) {
    return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  }

  function isDisabled(el) {
    if (!el) return true;

    return (
      el.disabled === true ||
      el.classList.contains("p-disabled") ||
      el.getAttribute("aria-disabled") === "true" ||
      el.getAttribute("disabled") !== null
    );
  }

  function humanClick(el) {
    if (!el) return false;

    try {
      const rect = el.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;

      ["mouseover", "mousedown", "mouseup", "click"].forEach((type) => {
        el.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX,
            clientY,
            button: 0,
          })
        );
      });

      return true;
    } catch (err) {
      console.warn("[TK.DOM] humanClick gagal, fallback click()", err);
      el.click?.();
      return true;
    }
  }

  function hasSpinner() {
    const selector =
      Constants.SELECTORS?.spinner ||
      ".p-datatable-loading-overlay, ui-progress-spinner .p-progress-spinner, p-progressspinner .p-progress-spinner, .p-progress-spinner, ui-progress-spinner .modal";

    return Array.from(document.querySelectorAll(selector)).some((el) => {
      if (el.classList.contains("modal")) {
        return el.offsetParent !== null;
      }

      return true;
    });
  }

  async function waitSpinnerGone(timeoutMs = 30000, pollMs = 300) {
    const start = Date.now();

    if (!hasSpinner()) {
      await sleep(Math.min(pollMs, 300));
      return true;
    }

    while (Date.now() - start < timeoutMs) {
      if (!hasSpinner()) {
        await sleep(Math.min(pollMs, 300));
        return true;
      }

      await sleep(pollMs);
    }

    console.warn("[TK.DOM] spinner timeout");
    return false;
  }

  async function waitForAction(startWindowMs = 1500, finishTimeoutMs = 30000, pollMs = 300) {
    const start = Date.now();
    let spinnerSeen = false;

    while (Date.now() - start < startWindowMs) {
      if (hasSpinner()) {
        spinnerSeen = true;
        break;
      }

      await sleep(50);
    }

    if (!spinnerSeen) {
      return {
        ok: true,
        spinnerSeen: false,
        timedOut: false,
        reason: "no_spinner",
      };
    }

    const gone = await waitSpinnerGone(finishTimeoutMs, pollMs);

    if (!gone) {
      return {
        ok: false,
        spinnerSeen: true,
        timedOut: true,
        reason: "spinner_timeout",
      };
    }

    return {
      ok: true,
      spinnerSeen: true,
      timedOut: false,
      reason: "spinner_done",
    };
  }

  function waitForElement(selector, timeoutMs = 20000, visibleOnly = true) {
    return new Promise((resolve) => {
      const start = Date.now();

      const timer = setInterval(() => {
        const el = document.querySelector(selector);

        if (el && (!visibleOnly || isVisible(el))) {
          clearInterval(timer);
          resolve(el);
          return;
        }

        if (Date.now() - start > timeoutMs) {
          clearInterval(timer);
          resolve(null);
        }
      }, 200);
    });
  }

  function setAngularInputValue(inputEl, value) {
    if (!inputEl) return false;

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;

    if (setter) {
      setter.call(inputEl, value);
    } else {
      inputEl.value = value;
    }

    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));

    return true;
  }

  TK.DOM = {
    sleep,
    isVisible,
    isDisabled,
    humanClick,
    hasSpinner,
    waitSpinnerGone,
    waitForAction,
    waitForElement,
    setAngularInputValue,
  };
})();