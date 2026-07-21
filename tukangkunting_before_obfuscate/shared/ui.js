(function () {
  const TK = (window.TK = window.TK || {});
  const Constants = TK.Constants || {};

  const STYLE_ID = "tk-shared-ui-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

      #tk-panel {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 340px;
        background: #0f1117;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 18px;
        color: #e2e8f0;
        font-family: 'DM Sans', system-ui, sans-serif;
        box-shadow: 0 0 0 1px rgba(255,255,255,.04), 0 24px 64px rgba(0,0,0,.6);
        z-index: 999999;
        overflow: hidden;
      }

      .tk-panel-bar {
        height: 3px;
        background: linear-gradient(90deg,#3882f6,#2563eb,#7c3aed,#3882f6);
        background-size: 260% 100%;
        animation: tk-panel-shimmer 2s linear infinite;
      }

      .tk-panel-bar.done {
        background: linear-gradient(90deg,#16a34a,#22c55e,#4ade80,#16a34a);
      }

      .tk-panel-bar.error {
        background: linear-gradient(90deg,#ef4444,#dc2626,#f87171,#ef4444);
      }

      .tk-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 12px;
        border-bottom: 1px solid rgba(255,255,255,.06);
      }

      .tk-panel-title {
        font-size: 13px;
        font-weight: 700;
        color: #f8fafc;
      }

      .tk-panel-subtitle {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }

      .tk-panel-close {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: #64748b;
        border-radius: 8px;
        cursor: pointer;
      }

      .tk-panel-close:hover {
        background: rgba(239,68,68,.12);
        color: #f87171;
      }

      .tk-panel-body {
        padding: 14px 16px;
      }

      .tk-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
        min-height: 26px;
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(56,130,246,.1);
        border: 1px solid rgba(56,130,246,.2);
        color: #93c5fd;
        font-size: 12px;
        font-weight: 600;
      }

      .tk-status.done {
        background: rgba(34,197,94,.08);
        border-color: rgba(34,197,94,.2);
        color: #4ade80;
      }

      .tk-status.error {
        background: rgba(239,68,68,.08);
        border-color: rgba(239,68,68,.2);
        color: #f87171;
      }

      .tk-status.paused {
        background: rgba(245,158,11,.08);
        border-color: rgba(245,158,11,.22);
        color: #f59e0b;
      }

      .tk-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: currentColor;
      }

      .tk-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 12px;
      }

      .tk-metric {
        background: rgba(255,255,255,.03);
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 10px;
        padding: 10px;
      }

      .tk-metric-label {
        font-size: 10px;
        color: #64748b;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .07em;
      }

      .tk-metric-value {
        margin-top: 4px;
        font-family: 'DM Mono', monospace;
        font-size: 16px;
        color: #e2e8f0;
      }

      .tk-progress-track {
        height: 7px;
        background: rgba(255,255,255,.06);
        border-radius: 99px;
        overflow: hidden;
        margin-top: 12px;
      }

      .tk-progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg,#3882f6,#2563eb);
        border-radius: 99px;
        transition: width .25s ease;
      }

      .tk-log {
        margin-top: 12px;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.06);
        background: rgba(255,255,255,.025);
        color: #94a3b8;
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        line-height: 1.5;
        max-height: 84px;
        overflow: auto;
      }

      .tk-panel-footer {
        display: flex;
        gap: 8px;
        padding: 12px 16px 14px;
        border-top: 1px solid rgba(255,255,255,.06);
      }

      .tk-panel-btn {
        padding: 7px 10px;
        border-radius: 9px;
        border: 1px solid rgba(255,255,255,.09);
        background: rgba(255,255,255,.04);
        color: #cbd5e1;
        font-family: 'DM Sans', system-ui, sans-serif;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }

      .tk-panel-btn:hover {
        background: rgba(255,255,255,.08);
      }

      .tk-panel-btn:disabled {
        opacity: .45;
        cursor: not-allowed;
      }

      .tk-panel-btn.primary {
        margin-left: auto;
        border-color: rgba(56,130,246,.5);
        background: rgba(37,99,235,.14);
        color: #93c5fd;
      }

      .tk-panel-btn.primary:hover {
        background: rgba(37,99,235,.22);
      }

      .tk-panel-btn.danger {
        border-color: rgba(239,68,68,.35);
        color: #f87171;
      }

      .tk-panel-btn.danger:hover {
        background: rgba(239,68,68,.1);
      }

      @keyframes tk-panel-shimmer {
        from { background-position: 100% 0; }
        to { background-position: -200% 0; }
      }
    `;

    document.head.appendChild(style);
  }

  function createProgressPanel(config = {}) {
    injectStyle();

    document.getElementById("tk-panel")?.remove();

    const panel = document.createElement("div");
    panel.id = "tk-panel";

    panel.innerHTML = `
      <div class="tk-panel-bar" id="tkPanelBar"></div>

      <div class="tk-panel-header">
        <div>
          <div class="tk-panel-title">${config.title || Constants.BRAND_TITLE || "Tukang Kunting"}</div>
          <div class="tk-panel-subtitle">${config.subtitle || Constants.BRAND_SUBTITLE || ""}</div>
        </div>
        <button class="tk-panel-close" id="tkCloseBtn" type="button">✕</button>
      </div>

      <div class="tk-panel-body">
        <div class="tk-status" id="tkStatusBadge">
          <span class="tk-status-dot"></span>
          <span id="tkStatusText">Starting...</span>
        </div>

        <div class="tk-metrics">
          <div class="tk-metric">
            <div class="tk-metric-label">Page</div>
            <div class="tk-metric-value" id="tkPage">—</div>
          </div>

          <div class="tk-metric">
            <div class="tk-metric-label">Success</div>
            <div class="tk-metric-value" id="tkSuccess">0</div>
          </div>

          <div class="tk-metric">
            <div class="tk-metric-label">Failed</div>
            <div class="tk-metric-value" id="tkFailed">0</div>
          </div>

          <div class="tk-metric">
            <div class="tk-metric-label">Delay</div>
            <div class="tk-metric-value" id="tkDelay">${config.delay || 0}ms</div>
          </div>
        </div>

        <div class="tk-progress-track" style="${config.total ? "" : "display:none"}">
          <div class="tk-progress-fill" id="tkProgressFill"></div>
        </div>

        <div class="tk-log" id="tkLog">Ready.</div>
      </div>

      <div class="tk-panel-footer">
        <button class="tk-panel-btn" id="tkPauseBtn" type="button">Pause</button>
        <button class="tk-panel-btn danger" id="tkCancelBtn" type="button">Cancel</button>
        <button class="tk-panel-btn primary" id="tkExportBtn" type="button">Export XLSX</button>
      </div>
    `;

    document.body.appendChild(panel);

    const state = {
      paused: false,
      cancelled: false,
      done: false,
      error: false,
    };

    function getEl(id) {
      return document.getElementById(id);
    }

    function setRunningControlsVisible(visible) {
      const pauseBtn = getEl("tkPauseBtn");
      const cancelBtn = getEl("tkCancelBtn");

      [pauseBtn, cancelBtn].forEach((btn) => {
        if (!btn) return;

        btn.style.display = visible ? "inline-flex" : "none";
        btn.disabled = !visible;
      });
    }

    function setExportVisible(visible) {
      const exportBtn = getEl("tkExportBtn");

      if (!exportBtn) return;

      exportBtn.style.display = visible ? "inline-flex" : "none";
      exportBtn.disabled = !visible;
    }

    function setStatusClass(type) {
      const status = getEl("tkStatusBadge");
      const bar = getEl("tkPanelBar");

      if (!status || !bar) return;

      status.classList.remove("done", "error", "paused");
      bar.classList.remove("done", "error");

      if (type === "done") {
        status.classList.add("done");
        bar.classList.add("done");
      } else if (type === "error") {
        status.classList.add("error");
        bar.classList.add("error");
      } else if (type === "paused") {
        status.classList.add("paused");
      }
    }

    const api = {
      state,

      setStatus(text, type = "running") {
        const statusText = getEl("tkStatusText");

        if (statusText) {
          statusText.textContent = text;
        }

        setStatusClass(type);

        if (type === "done") {
          state.done = true;
        }

        if (type === "error") {
          state.error = true;
        }
      },

      setMetrics(metrics = {}) {
        if (metrics.page !== undefined) {
          const pageEl = getEl("tkPage");
          if (pageEl) pageEl.textContent = metrics.page || "—";
        }

        if (metrics.success !== undefined) {
          const successEl = getEl("tkSuccess");
          if (successEl) successEl.textContent = metrics.success;
        }

        if (metrics.failed !== undefined) {
          const failedEl = getEl("tkFailed");
          if (failedEl) failedEl.textContent = metrics.failed;
        }

        if (metrics.delay !== undefined) {
          const delayEl = getEl("tkDelay");
          if (delayEl) delayEl.textContent = `${metrics.delay}ms`;
        }

        if (metrics.progress !== undefined) {
          const fill = getEl("tkProgressFill");
          if (fill) {
            fill.style.width = `${Math.max(0, Math.min(100, metrics.progress))}%`;
          }
        }
      },

      log(text) {
        const log = getEl("tkLog");

        if (!log) return;

        const ts = new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const safeText = String(text ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        log.innerHTML = `[${ts}] ${safeText}<br>` + log.innerHTML;
      },

      done(text = "DONE") {
        state.done = true;
        state.paused = false;
        state.cancelled = false;

        api.setStatus(text, "done");

        setRunningControlsVisible(false);
        setExportVisible(true);
      },

      error(text = "ERROR ❌ Cek console.") {
        state.error = true;
        state.paused = false;

        api.setStatus(text, "error");

        setRunningControlsVisible(false);
        setExportVisible(true);
      },

      close() {
        panel.remove();
      },

      onExport(fn) {
        const exportBtn = getEl("tkExportBtn");

        if (!exportBtn) return;

        exportBtn.onclick = () => {
          try {
            fn?.();
          } catch (err) {
            console.error("[TK.UI] Export error:", err);
            api.error("Export error");
          }
        };
      },

      onCancel(fn) {
        const cancelBtn = getEl("tkCancelBtn");

        if (!cancelBtn) return;

        cancelBtn.onclick = () => {
          state.cancelled = true;
          state.paused = false;

          api.setStatus("Cancelled", "error");

          setRunningControlsVisible(false);
          setExportVisible(true);

          fn?.();
        };
      },

      onPauseToggle(fn) {
        const pauseBtn = getEl("tkPauseBtn");

        if (!pauseBtn) return;

        pauseBtn.onclick = () => {
          if (state.done || state.cancelled || state.error) return;

          state.paused = !state.paused;

          pauseBtn.textContent = state.paused ? "Resume" : "Pause";

          api.setStatus(
            state.paused ? "Paused" : "Running",
            state.paused ? "paused" : "running"
          );

          fn?.(state.paused);
        };
      },

      setRunningControlsVisible,
      setExportVisible,
    };

    const closeBtn = getEl("tkCloseBtn");
    if (closeBtn) {
      closeBtn.onclick = api.close;
    }

    // Default: Export CSV hanya muncul setelah DONE / ERROR / CANCELLED.
    // Kalau module butuh export saat running, bisa panggil api.setExportVisible(true).
    setExportVisible(false);
    setRunningControlsVisible(true);

    return api;
  }

  TK.UI = {
    injectStyle,
    createProgressPanel,
  };
})();