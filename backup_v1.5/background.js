(function () {

  const SHARED_SECRET = "GANTI_DENGAN_SECRET_AMAN_MINIMAL_32_CHAR!!";

  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function deriveKey() {
    const rawKey = await sha256(SHARED_SECRET);
    const keyBytes = hexToBytes(rawKey.substring(0, 64));
    return crypto.subtle.importKey(
      "raw", keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
  }

  function hexToBytes(hex) {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    return arr;
  }

  function base64urlToBytes(b64url) {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  }

  async function checkStoredLicense(machineCode) {
    const { license_token } = await chrome.storage.local.get("license_token");
    if (!license_token) return { ok: false };
    return await verifyLicenseToken(license_token, machineCode);
  }

  async function generateMachineCode() {
    let { install_id } = await chrome.storage.local.get("install_id");
    if (!install_id) {
      install_id = crypto.randomUUID();
      await chrome.storage.local.set({ install_id });
    }
    const data = [chrome.runtime.id, install_id].join("|");
    const hash = await sha256(data);
    return hash.substring(0, 32).toUpperCase();
  }

  async function verifyLicenseToken(token, machineCode) {
    try {
      const packed = base64urlToBytes(token);
      if (packed.length < 28) return { ok: false, reason: "token terlalu pendek" };
      const iv = packed.slice(0, 12);
      const tag = packed.slice(12, 28);
      const ciphertext = packed.slice(28);
      const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
      ciphertextWithTag.set(ciphertext);
      ciphertextWithTag.set(tag, ciphertext.length);
      const key = await deriveKey();
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, tagLength: 128 }, key, ciphertextWithTag
      );
      const payload = JSON.parse(new TextDecoder().decode(decrypted));
      if (payload.machineCode !== machineCode) return { ok: false, reason: "machine code tidak cocok" };
      if (Date.now() > payload.expiry) return { ok: false, reason: "lisensi sudah expired" };
      return { ok: true, expiry: payload.expiry };
    } catch {
      return { ok: false, reason: "token tidak valid" };
    }
  }

  function formatExpiry(ts) {
    return new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  function daysLeft(ts) {
    return Math.max(0, Math.ceil((ts - Date.now()) / 86_400_000));
  }

  async function ensureActivation(tab) {
    const machineCode = await generateMachineCode();
    const licenseCheck = await checkStoredLicense(machineCode);
    if (licenseCheck.ok) return { activated: true, expiry: licenseCheck.expiry };

    return new Promise((resolve) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [machineCode],
        func: (machineCode) => {
          if (document.getElementById("tukang-activation-modal")) return null;
          return new Promise((resolvePrompt) => {
            if (!document.getElementById("tukang-activation-style")) {
              const s = document.createElement("style");
              s.id = "tukang-activation-style";
              s.textContent = `
                #tukang-act-overlay{position:fixed;inset:0;background:rgba(8,10,18,.75);backdrop-filter:blur(6px);z-index:10050;animation:tka-fadein .2s ease}
                #tukang-activation-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);z-index:10051;font-family:'DM Sans',sans-serif;color:#e2e8f0;overflow:hidden;animation:tka-slideup .25s cubic-bezier(.16,1,.3,1)}
                .tka-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
                .tka-title{font-size:14px;font-weight:600;color:#f0f2f8}
                .tka-close{width:30px;height:30px;border:none;background:transparent;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#4e5668;font-size:14px}
                .tka-close:hover{background:rgba(239,68,68,.12);color:#f87171}
                .tka-body{padding:18px 20px 20px}
                .tka-desc{font-size:12px;line-height:1.6;color:#94a3b8;margin-bottom:14px}
                .tka-label{font-size:11px;font-weight:500;color:#4e5668;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;display:block}
                .tka-codebox{width:100%;padding:11px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#7dd3fc;font-family:'DM Mono',monospace;font-size:13px;box-sizing:border-box;word-break:break-all;margin-bottom:14px;user-select:all}
                .tka-input{width:100%;padding:10px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#e2e8f0;font-family:'DM Mono',monospace;font-size:13px;outline:none;box-sizing:border-box}
                .tka-input:focus{border-color:rgba(56,130,246,.5);box-shadow:0 0 0 3px rgba(56,130,246,.1)}
                .tka-expiry-info{font-size:11px;color:#4e5668;margin-top:8px;font-style:italic}
                .tka-actions{margin-top:16px;display:flex;gap:8px;justify-content:flex-end}
                .tka-btn-sec{padding:9px 18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#a0aec0;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer}
                .tka-btn-sec:hover{background:rgba(255,255,255,.1);color:#e2e8f0}
                .tka-btn-pri{padding:9px 18px;background:linear-gradient(135deg,#3882f6,#2563eb);border:none;border-radius:8px;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s,transform .12s}
                .tka-btn-pri:hover{opacity:.9;transform:translateY(-1px)}
                .tka-btn-pri:disabled{opacity:.5;cursor:not-allowed;transform:none}
                .tka-error{margin-top:10px;font-size:12px;color:#f87171;display:none}
                .tka-success{margin-top:14px;padding:14px 16px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:10px;display:none}
                .tka-success-title{font-size:14px;font-weight:600;color:#22c55e;margin-bottom:8px;display:flex;align-items:center;gap:6px}
                .tka-success-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:12px}
                .tka-success-label{color:#64748b}
                .tka-success-value{color:#e2e8f0;font-weight:500;font-family:'DM Mono',monospace}
                .tka-success-value.green{color:#22c55e}.tka-success-value.orange{color:#f59e0b}.tka-success-value.red{color:#ef4444}
                .tka-success-bar-track{height:6px;background:rgba(255,255,255,.06);border-radius:3px;margin-top:10px;overflow:hidden}
                .tka-success-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#22c55e,#16a34a);transition:width .8s cubic-bezier(.4,0,.2,1)}
                .tka-success-actions{margin-top:14px;display:flex;justify-content:flex-end}
                .tka-spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:tka-spin .6s linear infinite;margin-right:6px;vertical-align:middle}
                @keyframes tka-spin{to{transform:rotate(360deg)}}
                @keyframes tka-fadein{from{opacity:0}to{opacity:1}}
                @keyframes tka-slideup{from{opacity:0;transform:translate(-50%,calc(-50% + 12px)) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
              `;
              document.head.appendChild(s);
            }
            const overlay = document.createElement("div"); overlay.id = "tukang-act-overlay";
            const modal = document.createElement("div"); modal.id = "tukang-activation-modal";
            const header = document.createElement("div"); header.className = "tka-header";
            const title = document.createElement("div"); title.className = "tka-title"; title.textContent = "🔑 Aktivasi Lisensi";
            const closeBtn = document.createElement("button"); closeBtn.className = "tka-close"; closeBtn.textContent = "✕";
            closeBtn.onclick = () => { rm(); resolvePrompt(null); };
            header.append(title, closeBtn);
            const body = document.createElement("div"); body.className = "tka-body";
            const desc = document.createElement("div"); desc.className = "tka-desc";
            desc.textContent = "Salin Machine Code di bawah lalu kirim ke pemilik extension. Masukkan License Token yang diterima pada kolom aktivasi.";
            const mcLabel = document.createElement("label"); mcLabel.className = "tka-label"; mcLabel.textContent = "Machine Code";
            const mcBox = document.createElement("div"); mcBox.className = "tka-codebox"; mcBox.textContent = machineCode;
            const formWrap = document.createElement("div"); formWrap.id = "tka-form-wrap";
            const inputLabel = document.createElement("label"); inputLabel.className = "tka-label"; inputLabel.textContent = "License Token";
            const input = document.createElement("input"); input.className = "tka-input"; input.placeholder = "Paste token dari owner di sini...";
            const expiryInfo = document.createElement("div"); expiryInfo.className = "tka-expiry-info"; expiryInfo.textContent = "Token berisi informasi masa berlaku lisensi.";
            const errorText = document.createElement("div"); errorText.className = "tka-error";
            const actions = document.createElement("div"); actions.className = "tka-actions";
            const copyBtn = document.createElement("button"); copyBtn.className = "tka-btn-sec"; copyBtn.textContent = "Copy Machine Code";
            copyBtn.onclick = async () => { try { await navigator.clipboard.writeText(machineCode); copyBtn.textContent = "✓ Copied!"; setTimeout(() => { copyBtn.textContent = "Copy Machine Code"; }, 1500); } catch {} };
            const submitBtn = document.createElement("button"); submitBtn.className = "tka-btn-pri"; submitBtn.textContent = "Aktivasi";
            submitBtn.onclick = () => {
              const token = input.value.trim();
              if (!token) { showError("Masukkan license token terlebih dahulu."); return; }
              submitBtn.disabled = true; submitBtn.innerHTML = '<span class="tka-spinner"></span>Memverifikasi...'; errorText.style.display = "none";
              resolvePrompt({ machineCode, token });
            };
            actions.append(copyBtn, submitBtn);
            formWrap.append(inputLabel, input, expiryInfo, errorText, actions);
            const successPanel = document.createElement("div"); successPanel.className = "tka-success"; successPanel.id = "tka-success-panel";
            body.append(desc, mcLabel, mcBox, formWrap, successPanel);
            modal.append(header, body); document.body.append(overlay, modal);
            window.__tukangActivationCleanup = rm;
            window.__tukangActivationShowSuccess = (expiry, daysRemaining) => {
              formWrap.style.display = "none"; desc.style.display = "none"; mcLabel.style.display = "none"; mcBox.style.display = "none";
              title.textContent = "✅ Aktivasi Berhasil!";
              let colorClass = "green", barColor = "linear-gradient(90deg,#22c55e,#16a34a)";
              if (daysRemaining <= 3) { colorClass = "red"; barColor = "linear-gradient(90deg,#ef4444,#dc2626)"; }
              else if (daysRemaining <= 7) { colorClass = "orange"; barColor = "linear-gradient(90deg,#f59e0b,#d97706)"; }
              const expDate = new Date(expiry).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
              successPanel.innerHTML = ""; successPanel.style.display = "block";
              const sTitle = document.createElement("div"); sTitle.className = "tka-success-title"; sTitle.textContent = "🎉 Lisensi Aktif"; successPanel.appendChild(sTitle);
              [{ label: "Berlaku hingga", value: expDate, cls: "" }, { label: "Sisa waktu", value: daysRemaining + " hari", cls: colorClass }].forEach(r => {
                const row = document.createElement("div"); row.className = "tka-success-row";
                const lbl = document.createElement("span"); lbl.className = "tka-success-label"; lbl.textContent = r.label;
                const val = document.createElement("span"); val.className = "tka-success-value" + (r.cls ? " " + r.cls : ""); val.textContent = r.value;
                row.append(lbl, val); successPanel.appendChild(row);
              });
              const barTrack = document.createElement("div"); barTrack.className = "tka-success-bar-track";
              const barFill = document.createElement("div"); barFill.className = "tka-success-bar-fill"; barFill.style.width = "0%"; barFill.style.background = barColor;
              barTrack.appendChild(barFill); successPanel.appendChild(barTrack);
              requestAnimationFrame(() => { setTimeout(() => { barFill.style.width = Math.min(100, Math.max(5, (daysRemaining / 365) * 100)) + "%"; }, 100); });
              const sActions = document.createElement("div"); sActions.className = "tka-success-actions";
              const continueBtn = document.createElement("button"); continueBtn.className = "tka-btn-pri"; continueBtn.textContent = "Lanjutkan →"; continueBtn.onclick = () => { rm(); };
              sActions.appendChild(continueBtn); successPanel.appendChild(sActions);
            };
            function rm() { overlay.remove(); modal.remove(); delete window.__tukangActivationCleanup; delete window.__tukangActivationShowSuccess; }
            function showError(msg) { errorText.textContent = msg; errorText.style.display = "block"; }
          });
        }
      }, async (results) => {
        if (!results?.[0]?.result) { resolve({ activated: false }); return; }
        const { machineCode: mc, token } = results[0].result;
        const result = await verifyLicenseToken(token, mc);
        if (!result.ok) {
          chrome.scripting.executeScript({ target: { tabId: tab.id }, args: [result.reason], func: (reason) => {
            const errorEl = document.querySelector("#tukang-activation-modal .tka-error");
            if (errorEl) { errorEl.textContent = "❌ " + reason; errorEl.style.display = "block"; }
            const btn = document.querySelector("#tukang-activation-modal .tka-btn-pri");
            if (btn) { btn.disabled = false; btn.textContent = "Aktivasi"; }
          }});
          resolve({ activated: false }); return;
        }
        await chrome.storage.local.set({ license_token: token });
        const remaining = daysLeft(result.expiry);
        chrome.scripting.executeScript({ target: { tabId: tab.id }, args: [result.expiry, remaining], func: (expiry, daysRemaining) => {
          if (typeof window.__tukangActivationShowSuccess === "function") window.__tukangActivationShowSuccess(expiry, daysRemaining);
        }});
        resolve({ activated: true, expiry: result.expiry });
      });
    });
  }

  const CHANGELOG_VERSION = "1.5";
  const BADGE_CLEAR_TIMEOUT_MS = 60_000;
  const MAX_ACTIVITY_LOG_SIZE  = 200;
  const CHANGELOG_ITEMS = [
    "⏸ Pause / Resume / Cancel proses batch kapan saja",
    "🔄 Retry otomatis untuk faktur yang gagal diproses",
    "🔔 Notifikasi Chrome native saat batch selesai",
    "📊 Activity Log tersimpan di Pengaturan",
    "⌨️ Keyboard shortcut Ctrl+Shift+T untuk membuka extension",
    "⏰ Countdown 3 detik sebelum Pembatalan Faktur dieksekusi",
    "💡 Onboarding tour untuk pengguna baru",
  ];

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "checkLicense") {
      (async () => {
        try {
          const machineCode = await generateMachineCode();
          const { license_token } = await chrome.storage.local.get("license_token");
          if (!license_token) { sendResponse({ ok: false, reason: "no_license" }); return; }
          const result = await verifyLicenseToken(license_token, machineCode);
          sendResponse(result);
        } catch (e) { sendResponse({ ok: false, reason: "error: " + e.message }); }
      })();
      return true;
    }

    if (msg.action === "batchComplete") {
      const { module: modName, summary, failCount } = msg;
      chrome.notifications.create(`tukang_batch_${Date.now()}`, {
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon.png"),
        title: `Tukangkunting — ${modName} Selesai`,
        message: summary,
      });
      if (failCount > 0) {
        chrome.action.setBadgeText({ text: String(failCount) });
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
      } else {
        chrome.action.setBadgeText({ text: "✓" });
        chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
      }
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), BADGE_CLEAR_TIMEOUT_MS);
      sendResponse({ ok: true });
      return true;
    }

    if (msg.action === "saveActivityLog") {
      chrome.storage.local.get({ activity_log: [] }, (data) => {
        const log = data.activity_log;
        log.unshift(msg.entry);
        if (log.length > MAX_ACTIVITY_LOG_SIZE) log.length = MAX_ACTIVITY_LOG_SIZE;
        chrome.storage.local.set({ activity_log: log });
      });
      return;
    }

    if (msg.action === "getActivityLog") {
      chrome.storage.local.get({ activity_log: [] }, (data) => {
        sendResponse({ log: data.activity_log });
      });
      return true;
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  //  PENGKREDITAN FAKTUR — CSV MODAL
  // ══════════════════════════════════════════════════════════════════════
  function showPengkreditanCSVModal(tab) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (document.getElementById("tukang-faktur-modal")) return null;

          return new Promise((resolvePrompt) => {

            if (!document.getElementById("tukang-csv-style")) {
              const s = document.createElement("style");
              s.id = "tukang-csv-style";
              s.textContent = `
                #tukang-faktur-overlay{position:fixed;inset:0;background:rgba(8,10,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:10060;animation:tkcsv-fadein .2s ease}
                #tukang-faktur-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:680px;max-height:85vh;background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);z-index:10061;font-family:'DM Sans',sans-serif;color:#e2e8f0;overflow:hidden;display:flex;flex-direction:column;animation:tkcsv-slideup .25s cubic-bezier(.16,1,.3,1)}
                .tkcsv-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
                .tkcsv-title{font-size:14px;font-weight:600;color:#f0f2f8;display:flex;align-items:center;gap:8px}
                .tkcsv-close{width:30px;height:30px;border:none;background:transparent;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#4e5668;font-size:14px;transition:background .15s,color .15s}
                .tkcsv-close:hover{background:rgba(239,68,68,.12);color:#f87171}
                .tkcsv-body{padding:18px 20px 20px;overflow-y:auto;flex:1}
                .tkcsv-desc{font-size:12px;line-height:1.6;color:#94a3b8;margin-bottom:16px}
                .tkcsv-btn-row{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap}
                .tkcsv-btn{padding:9px 16px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.09);flex-shrink:0}
                .tkcsv-btn-outline{background:rgba(255,255,255,.04);color:#a0aec0}
                .tkcsv-btn-outline:hover{background:rgba(255,255,255,.08);color:#e2e8f0}
                .tkcsv-btn-primary{background:linear-gradient(135deg,#3882f6,#2563eb);color:#fff;border:none;font-weight:600;box-shadow:0 3px 10px rgba(56,130,246,.25)}
                .tkcsv-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
                .tkcsv-btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none}
                .tkcsv-btn-success{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;font-weight:600;box-shadow:0 3px 10px rgba(34,197,94,.25)}
                .tkcsv-btn-success:hover{opacity:.9;transform:translateY(-1px)}
                .tkcsv-btn-success:disabled{opacity:.45;cursor:not-allowed;transform:none}
                .tkcsv-status{padding:12px 16px;border-radius:10px;font-size:12px;line-height:1.6;margin-bottom:16px;display:none}
                .tkcsv-status-ok{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:#22c55e}
                .tkcsv-status-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);color:#f59e0b}
                .tkcsv-status-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171}
                .tkcsv-table-wrap{max-height:280px;overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:10px;margin-bottom:16px;display:none}
                .tkcsv-table-wrap::-webkit-scrollbar{width:5px;height:5px}
                .tkcsv-table-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}
                .tkcsv-table{width:100%;border-collapse:collapse;font-size:12px;font-family:'DM Mono',monospace}
                .tkcsv-table thead{position:sticky;top:0;z-index:1}
                .tkcsv-table th{background:#1a1d27;color:#4e5668;font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10px;padding:8px 10px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap}
                .tkcsv-table td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0;white-space:nowrap}
                .tkcsv-table tr:last-child td{border-bottom:none}
                .tkcsv-table tr:hover td{background:rgba(255,255,255,.03)}
                .tkcsv-table .cell-ok{color:#22c55e}
                .tkcsv-table .cell-err{color:#f87171;font-weight:600}
                .tkcsv-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0}
                .tkcsv-summary{font-size:11px;color:#4e5668;margin-right:auto;display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace}
                .tkcsv-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
                .tkcsv-dot-green{background:#22c55e}
                .tkcsv-dot-red{background:#ef4444}
                @keyframes tkcsv-fadein{from{opacity:0}to{opacity:1}}
                @keyframes tkcsv-slideup{from{opacity:0;transform:translate(-50%,calc(-50% + 12px)) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
              `;
              document.head.appendChild(s);
            }

            const BULAN_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
            const BULAN_MAP = {};
            BULAN_NAMES.forEach((n, i) => { BULAN_MAP[n.toLowerCase()] = i + 1; });
            for (let i = 1; i <= 12; i++) BULAN_MAP[String(i)] = i;
            for (let i = 1; i <= 12; i++) BULAN_MAP[String(i).padStart(2, "0")] = i;

            const HEADERS = ["nomor_faktur","masa_pajak_faktur","tahun_pajak_faktur","masa_pajak_pengkreditan","tahun_pajak_pengkreditan"];
            const HEADER_LABELS = ["Nomor Faktur","Masa Pajak Faktur","Tahun Pajak Faktur","Masa Pajak Pengkreditan","Tahun Pajak Pengkreditan"];

            let parsedRows = [];
            let validCount = 0;
            let errorCount = 0;

            function normaliseBulan(val) {
              if (!val) return null;
              const v = val.toString().trim().toLowerCase();
              if (BULAN_MAP[v] !== undefined) return BULAN_MAP[v];
              for (const name of BULAN_NAMES) {
                if (name.toLowerCase().startsWith(v) && v.length >= 3) return BULAN_MAP[name.toLowerCase()];
              }
              return null;
            }

            function validateRow(row) {
              const errors = [];
              const nf = (row.nomor_faktur || "").trim();
              const nfDigits = nf.replace(/[.\-\s]/g, "");
              if (!nfDigits || !/^\d+$/.test(nfDigits)) {
                errors.push("Nomor faktur harus berisi angka");
              } else if (nfDigits.length < 15 || nfDigits.length > 20) {
                errors.push("Nomor faktur harus 15-20 digit (tanpa titik/strip)");
              }
              if (!normaliseBulan(row.masa_pajak_faktur)) errors.push("Masa pajak faktur tidak valid");
              const tpf = (row.tahun_pajak_faktur || "").toString().trim();
              if (!/^\d{4}$/.test(tpf)) errors.push("Tahun pajak faktur harus 4 digit");
              if (!normaliseBulan(row.masa_pajak_pengkreditan)) errors.push("Masa pajak pengkreditan tidak valid");
              const tpp = (row.tahun_pajak_pengkreditan || "").toString().trim();
              if (!/^\d{4}$/.test(tpp)) errors.push("Tahun pajak pengkreditan harus 4 digit");
              return errors;
            }

            function parseCSV(text) {
              const lines = text.split(/\r?\n/).filter(l => l.trim());
              if (lines.length < 2) return { rows: [], error: "CSV harus memiliki header dan minimal 1 baris data." };
              const headerLine = lines[0];
              const sep = headerLine.includes(";") ? ";" : ",";
              const headers = headerLine.split(sep).map(h => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/['"]/g, ""));
              const missing = HEADERS.filter(h => !headers.includes(h));
              if (missing.length > 0) return { rows: [], error: `Kolom berikut tidak ditemukan: ${missing.join(", ")}. Pastikan header CSV sesuai template.` };
              const rows = [];
              for (let i = 1; i < lines.length; i++) {
                const vals = lines[i].split(sep).map(v => v.trim().replace(/^["']|["']$/g, ""));
                if (vals.every(v => !v)) continue;
                const obj = {};
                headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });
                rows.push(obj);
              }
              return { rows, error: null };
            }

            function generateTemplateCSV() {
              const header = HEADER_LABELS.join(",");
              const example1 = "'040123456789,Januari,2025,Maret,2025";
              const example2 = "'040123456789,Februari,2025,Februari,2025";
              return header + "\n" + example1 + "\n" + example2 + "\n";
            }

            function downloadCSV(content, filename) {
              const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = filename; a.style.display = "none";
              document.body.appendChild(a); a.click(); a.remove();
              URL.revokeObjectURL(url);
            }

            const overlay = document.createElement("div"); overlay.id = "tukang-faktur-overlay";
            const modal = document.createElement("div"); modal.id = "tukang-faktur-modal";

            const header = document.createElement("div"); header.className = "tkcsv-header";
            const title = document.createElement("div"); title.className = "tkcsv-title"; title.textContent = "🧾 Pengkreditan Faktur";
            const closeBtn = document.createElement("button"); closeBtn.className = "tkcsv-close"; closeBtn.textContent = "✕";
            closeBtn.onclick = () => { rm(); resolvePrompt(null); };
            header.append(title, closeBtn);

            const body = document.createElement("div"); body.className = "tkcsv-body";
            const desc = document.createElement("div"); desc.className = "tkcsv-desc";
            desc.innerHTML = `Upload file CSV berisi daftar nomor faktur untuk diproses. Download template terlebih dahulu jika belum memiliki format yang sesuai.<br><br>
            <strong style="color:#e2e8f0;">Kolom yang dibutuhkan:</strong> Nomor Faktur, Masa Pajak Faktur, Tahun Pajak Faktur, Masa Pajak Pengkreditan, Tahun Pajak Pengkreditan<br>
            <span style="color:#64748b;">• Nomor faktur: format 010.006-25.12345678 (15-20 digit angka)</span><br>
            <span style="color:#64748b;">• Masa pajak: nama bulan (Januari-Desember) atau angka (1-12)</span><br>
            <span style="color:#64748b;">• Tahun: 4 digit angka (contoh: 2025)</span>`;

            const btnRow = document.createElement("div"); btnRow.className = "tkcsv-btn-row";
            const dlBtn = document.createElement("button"); dlBtn.className = "tkcsv-btn tkcsv-btn-outline"; dlBtn.innerHTML = "📥 Download Template";
            dlBtn.onclick = () => { downloadCSV(generateTemplateCSV(), "template_pengkreditan_faktur.csv"); };
            const uploadBtn = document.createElement("button"); uploadBtn.className = "tkcsv-btn tkcsv-btn-outline"; uploadBtn.innerHTML = "📎 Upload CSV";
            uploadBtn.onclick = () => {
              const fi = document.createElement("input"); fi.type = "file"; fi.accept = ".csv,.txt";
              fi.onchange = (e) => {
                const file = e.target.files[0]; if (!file) return;
                uploadBtn.innerHTML = "⏳ Membaca...";
                const reader = new FileReader();
                reader.onload = (ev) => { uploadBtn.innerHTML = "📎 Upload CSV"; processCSVText(ev.target.result, file.name); };
                reader.onerror = () => { uploadBtn.innerHTML = "📎 Upload CSV"; showStatus("Gagal membaca file.", "err"); };
                reader.readAsText(file);
              };
              fi.click();
            };
            btnRow.append(dlBtn, uploadBtn);

            const statusBox = document.createElement("div"); statusBox.className = "tkcsv-status";
            const tableWrap = document.createElement("div"); tableWrap.className = "tkcsv-table-wrap";
            body.append(desc, btnRow, statusBox, tableWrap);

            const footer = document.createElement("div"); footer.className = "tkcsv-footer";
            const summary = document.createElement("div"); summary.className = "tkcsv-summary"; summary.style.display = "none";
            const cancelBtn = document.createElement("button"); cancelBtn.className = "tkcsv-btn tkcsv-btn-outline"; cancelBtn.textContent = "Batal";
            cancelBtn.onclick = () => { rm(); resolvePrompt(null); };
            const processBtn = document.createElement("button"); processBtn.className = "tkcsv-btn tkcsv-btn-success"; processBtn.textContent = "🚀 Proses Semua"; processBtn.disabled = true;
            processBtn.onclick = () => {
              if (validCount === 0) return;
              rm();
              const output = parsedRows.filter(r => r._errors.length === 0).map(r => ({
                nomorFaktur: r.nomor_faktur.trim(),
                masaPajakFaktur: normaliseBulan(r.masa_pajak_faktur),
                tahunPajakFaktur: r.tahun_pajak_faktur.toString().trim(),
                masaPajakPengkreditan: normaliseBulan(r.masa_pajak_pengkreditan),
                tahunPajakPengkreditan: r.tahun_pajak_pengkreditan.toString().trim(),
              }));
              resolvePrompt(output);
            };
            footer.append(summary, cancelBtn, processBtn);
            modal.append(header, body, footer);
            document.body.append(overlay, modal);

            function showStatus(msg, type) {
              statusBox.style.display = "block";
              statusBox.className = "tkcsv-status tkcsv-status-" + type;
              statusBox.textContent = msg;
            }

            function processCSVText(text, filename) {
              const { rows, error } = parseCSV(text);
              if (error) { showStatus("❌ " + error, "err"); tableWrap.style.display = "none"; summary.style.display = "none"; processBtn.disabled = true; return; }
              if (rows.length === 0) { showStatus("❌ File CSV tidak berisi data.", "err"); tableWrap.style.display = "none"; summary.style.display = "none"; processBtn.disabled = true; return; }

              validCount = 0; errorCount = 0;
              parsedRows = rows.map(r => {
                const errs = validateRow(r);
                if (errs.length === 0) validCount++; else errorCount++;
                return { ...r, _errors: errs };
              });

              tableWrap.style.display = "block"; tableWrap.innerHTML = "";
              const table = document.createElement("table"); table.className = "tkcsv-table";
              const thead = document.createElement("thead");
              const headTr = document.createElement("tr");
              ["#", ...HEADER_LABELS, "Status"].forEach(h => { const th = document.createElement("th"); th.textContent = h; headTr.appendChild(th); });
              thead.appendChild(headTr); table.appendChild(thead);

              const tbody = document.createElement("tbody");
              parsedRows.forEach((r, idx) => {
                const tr = document.createElement("tr");
                const tdNum = document.createElement("td"); tdNum.textContent = idx + 1; tdNum.style.color = "#4e5668"; tr.appendChild(tdNum);
                HEADERS.forEach(h => {
                  const td = document.createElement("td"); td.textContent = r[h] || "—";
                  const cellErrors = [];
                  if (h === "nomor_faktur") { const digits = (r[h] || "").replace(/[.\-\s]/g, ""); if (!/^\d+$/.test(digits) || digits.length < 15 || digits.length > 20) cellErrors.push(1); }
                  if (h === "masa_pajak_faktur" && !normaliseBulan(r[h])) cellErrors.push(1);
                  if (h === "tahun_pajak_faktur" && !/^\d{4}$/.test((r[h] || "").trim())) cellErrors.push(1);
                  if (h === "masa_pajak_pengkreditan" && !normaliseBulan(r[h])) cellErrors.push(1);
                  if (h === "tahun_pajak_pengkreditan" && !/^\d{4}$/.test((r[h] || "").trim())) cellErrors.push(1);
                  td.className = cellErrors.length > 0 ? "cell-err" : "cell-ok"; tr.appendChild(td);
                });
                const tdStatus = document.createElement("td");
                if (r._errors.length === 0) { tdStatus.textContent = "✓ Valid"; tdStatus.className = "cell-ok"; }
                else { tdStatus.textContent = "✗ " + r._errors[0]; tdStatus.className = "cell-err"; tdStatus.title = r._errors.join("\n"); }
                tr.appendChild(tdStatus); tbody.appendChild(tr);
              });
              table.appendChild(tbody); tableWrap.appendChild(table);

              summary.style.display = "flex";
              summary.innerHTML = `<span class="tkcsv-dot tkcsv-dot-green"></span> ${validCount} valid` + (errorCount > 0 ? ` &nbsp; <span class="tkcsv-dot tkcsv-dot-red"></span> ${errorCount} error` : "");

              if (errorCount === 0) { showStatus(`✅ <strong>${filename}</strong> — ${validCount} baris terdeteksi, semua valid. Siap diproses!`, "ok"); processBtn.disabled = false; }
              else if (validCount > 0) { showStatus(`⚠️ <strong>${filename}</strong> — ${validCount} baris valid, <strong>${errorCount} baris bermasalah</strong> (akan dilewati).`, "warn"); processBtn.disabled = false; }
              else { showStatus(`❌ <strong>${filename}</strong> — Semua ${errorCount} baris bermasalah. Perbaiki CSV dan upload ulang.`, "err"); processBtn.disabled = true; }
            }

            function rm() { overlay.remove(); modal.remove(); }
          });
        }
      }, (results) => {
        if (!results?.[0]?.result) { resolve(null); return; }
        resolve(results[0].result);
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PEMBATALAN FAKTUR — CSV MODAL  (NEW)
  //  Shows a modal with: Download Template, Upload CSV, Validate,
  //  Preview table, then Process.
  //  Returns array of { nomorFaktur }
  // ══════════════════════════════════════════════════════════════════════
  function showPembatalanCSVModal(tab) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (document.getElementById("tukang-batal-modal")) return null;

          return new Promise((resolvePrompt) => {

            // Reuse tkcsv styles (already injected by pengkreditan or inject here)
            if (!document.getElementById("tukang-csv-style")) {
              const s = document.createElement("style");
              s.id = "tukang-csv-style";
              s.textContent = `
                #tukang-faktur-overlay,#tukang-batal-overlay{position:fixed;inset:0;background:rgba(8,10,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:10060;animation:tkcsv-fadein .2s ease}
                #tukang-faktur-modal,#tukang-batal-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:680px;max-height:85vh;background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);z-index:10061;font-family:'DM Sans',sans-serif;color:#e2e8f0;overflow:hidden;display:flex;flex-direction:column;animation:tkcsv-slideup .25s cubic-bezier(.16,1,.3,1)}
                .tkcsv-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
                .tkcsv-title{font-size:14px;font-weight:600;color:#f0f2f8;display:flex;align-items:center;gap:8px}
                .tkcsv-close{width:30px;height:30px;border:none;background:transparent;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#4e5668;font-size:14px;transition:background .15s,color .15s}
                .tkcsv-close:hover{background:rgba(239,68,68,.12);color:#f87171}
                .tkcsv-body{padding:18px 20px 20px;overflow-y:auto;flex:1}
                .tkcsv-desc{font-size:12px;line-height:1.6;color:#94a3b8;margin-bottom:16px}
                .tkcsv-btn-row{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap}
                .tkcsv-btn{padding:9px 16px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.09);flex-shrink:0}
                .tkcsv-btn-outline{background:rgba(255,255,255,.04);color:#a0aec0}
                .tkcsv-btn-outline:hover{background:rgba(255,255,255,.08);color:#e2e8f0}
                .tkcsv-btn-primary{background:linear-gradient(135deg,#3882f6,#2563eb);color:#fff;border:none;font-weight:600;box-shadow:0 3px 10px rgba(56,130,246,.25)}
                .tkcsv-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
                .tkcsv-btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none}
                .tkcsv-btn-success{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;font-weight:600;box-shadow:0 3px 10px rgba(34,197,94,.25)}
                .tkcsv-btn-success:hover{opacity:.9;transform:translateY(-1px)}
                .tkcsv-btn-success:disabled{opacity:.45;cursor:not-allowed;transform:none}
                .tkcsv-btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;font-weight:600;box-shadow:0 3px 10px rgba(239,68,68,.25)}
                .tkcsv-btn-danger:hover{opacity:.9;transform:translateY(-1px)}
                .tkcsv-btn-danger:disabled{opacity:.45;cursor:not-allowed;transform:none}
                .tkcsv-status{padding:12px 16px;border-radius:10px;font-size:12px;line-height:1.6;margin-bottom:16px;display:none}
                .tkcsv-status-ok{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);color:#22c55e}
                .tkcsv-status-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);color:#f59e0b}
                .tkcsv-status-err{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171}
                .tkcsv-table-wrap{max-height:280px;overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:10px;margin-bottom:16px;display:none}
                .tkcsv-table-wrap::-webkit-scrollbar{width:5px;height:5px}
                .tkcsv-table-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}
                .tkcsv-table{width:100%;border-collapse:collapse;font-size:12px;font-family:'DM Mono',monospace}
                .tkcsv-table thead{position:sticky;top:0;z-index:1}
                .tkcsv-table th{background:#1a1d27;color:#4e5668;font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10px;padding:8px 10px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap}
                .tkcsv-table td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.04);color:#e2e8f0;white-space:nowrap}
                .tkcsv-table tr:last-child td{border-bottom:none}
                .tkcsv-table tr:hover td{background:rgba(255,255,255,.03)}
                .tkcsv-table .cell-ok{color:#22c55e}
                .tkcsv-table .cell-err{color:#f87171;font-weight:600}
                .tkcsv-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0}
                .tkcsv-summary{font-size:11px;color:#4e5668;margin-right:auto;display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace}
                .tkcsv-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
                .tkcsv-dot-green{background:#22c55e}
                .tkcsv-dot-red{background:#ef4444}
                .tkcsv-password-wrap{margin-bottom:16px}
                .tkcsv-password-label{font-size:11px;font-weight:500;color:#4e5668;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;display:block}
                .tkcsv-password-input{width:100%;padding:10px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#e2e8f0;font-family:'DM Mono',monospace;font-size:13px;outline:none;box-sizing:border-box;transition:border-color .15s,box-shadow .15s}
                .tkcsv-password-input:focus{border-color:rgba(56,130,246,.5);box-shadow:0 0 0 3px rgba(56,130,246,.1)}
                .tkcsv-password-hint{font-size:11px;color:#4e5668;margin-top:6px;font-style:italic}
                @keyframes tkcsv-fadein{from{opacity:0}to{opacity:1}}
                @keyframes tkcsv-slideup{from{opacity:0;transform:translate(-50%,calc(-50% + 12px)) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
              `;
              document.head.appendChild(s);
            }

            const HEADERS = ["nomor_faktur"];
            const HEADER_LABELS = ["Nomor Faktur"];

            let parsedRows = [];
            let validCount = 0;
            let errorCount = 0;

            function validateRow(row) {
              const errors = [];
              const nf = (row.nomor_faktur || "").trim();
              const nfDigits = nf.replace(/[.\-\s]/g, "");
              if (!nfDigits || !/^\d+$/.test(nfDigits)) {
                errors.push("Nomor faktur harus berisi angka");
              } else if (nfDigits.length < 15 || nfDigits.length > 20) {
                errors.push("Nomor faktur harus 15-20 digit (tanpa titik/strip)");
              }
              return errors;
            }

            function parseCSV(text) {
              const lines = text.split(/\r?\n/).filter(l => l.trim());
              if (lines.length < 2) return { rows: [], error: "CSV harus memiliki header dan minimal 1 baris data." };
              const headerLine = lines[0];
              const sep = headerLine.includes(";") ? ";" : ",";
              const headers = headerLine.split(sep).map(h => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/['"]/g, ""));
              const missing = HEADERS.filter(h => !headers.includes(h));
              if (missing.length > 0) return { rows: [], error: `Kolom berikut tidak ditemukan: ${missing.join(", ")}. Pastikan header CSV sesuai template.` };
              const rows = [];
              for (let i = 1; i < lines.length; i++) {
                const vals = lines[i].split(sep).map(v => v.trim().replace(/^["']|["']$/g, ""));
                if (vals.every(v => !v)) continue;
                const obj = {};
                headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });
                rows.push(obj);
              }
              return { rows, error: null };
            }

            function generateTemplateCSV() {
              return "Nomor Faktur\n'04009012689713953\n'04009012689713954\n'04009012689713404\n";
            }

            function downloadCSV(content, filename) {
              const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = filename; a.style.display = "none";
              document.body.appendChild(a); a.click(); a.remove();
              URL.revokeObjectURL(url);
            }

            // ── Build Modal ──
            const overlay = document.createElement("div"); overlay.id = "tukang-batal-overlay";
            const modal = document.createElement("div"); modal.id = "tukang-batal-modal";

            const header = document.createElement("div"); header.className = "tkcsv-header";
            const title = document.createElement("div"); title.className = "tkcsv-title"; title.textContent = "🚫 Pembatalan Faktur";
            const closeBtn = document.createElement("button"); closeBtn.className = "tkcsv-close"; closeBtn.textContent = "✕";
            closeBtn.onclick = () => { rm(); resolvePrompt(null); };
            header.append(title, closeBtn);

            const body = document.createElement("div"); body.className = "tkcsv-body";

            const desc = document.createElement("div"); desc.className = "tkcsv-desc";
            desc.innerHTML = `Upload file CSV berisi daftar nomor faktur yang akan <strong style="color:#f87171;">dibatalkan</strong>. Download template terlebih dahulu jika belum memiliki format yang sesuai.<br><br>
            <strong style="color:#e2e8f0;">Kolom yang dibutuhkan:</strong> Nomor Faktur<br>
            <span style="color:#64748b;">• Nomor faktur: 15-20 digit angka (contoh: 04009012689713953)</span><br>
            <span style="color:#64748b;">• Passphrase akan digunakan untuk menandatangani pembatalan</span>`;

            // Passphrase input
            const passWrap = document.createElement("div"); passWrap.className = "tkcsv-password-wrap";
            const passLabel = document.createElement("label"); passLabel.className = "tkcsv-password-label"; passLabel.textContent = "Passphrase";
            const passInput = document.createElement("input"); passInput.type = "password"; passInput.className = "tkcsv-password-input"; passInput.placeholder = "Masukkan passphrase sertifikat...";
            const passHint = document.createElement("div"); passHint.className = "tkcsv-password-hint"; passHint.textContent = "Passphrase digunakan untuk proses penandatanganan pembatalan faktur. (Passphrase tidak disimpan atau dikirim ke mana pun, hanya digunakan secara lokal di browser Anda saat memproses faktur yang valid)";
            passWrap.append(passLabel, passInput, passHint);

            const btnRow = document.createElement("div"); btnRow.className = "tkcsv-btn-row";
            const dlBtn = document.createElement("button"); dlBtn.className = "tkcsv-btn tkcsv-btn-outline"; dlBtn.innerHTML = "📥 Download Template";
            dlBtn.onclick = () => { downloadCSV(generateTemplateCSV(), "template_pembatalan_faktur.csv"); };
            const uploadBtn = document.createElement("button"); uploadBtn.className = "tkcsv-btn tkcsv-btn-outline"; uploadBtn.innerHTML = "📎 Upload CSV";
            uploadBtn.onclick = () => {
              const fi = document.createElement("input"); fi.type = "file"; fi.accept = ".csv,.txt";
              fi.onchange = (e) => {
                const file = e.target.files[0]; if (!file) return;
                uploadBtn.innerHTML = "⏳ Membaca...";
                const reader = new FileReader();
                reader.onload = (ev) => { uploadBtn.innerHTML = "📎 Upload CSV"; processCSVText(ev.target.result, file.name); };
                reader.onerror = () => { uploadBtn.innerHTML = "📎 Upload CSV"; showStatus("Gagal membaca file.", "err"); };
                reader.readAsText(file);
              };
              fi.click();
            };
            btnRow.append(dlBtn, uploadBtn);

            const statusBox = document.createElement("div"); statusBox.className = "tkcsv-status";
            const tableWrap = document.createElement("div"); tableWrap.className = "tkcsv-table-wrap";
            body.append(desc, passWrap, btnRow, statusBox, tableWrap);

            const footer = document.createElement("div"); footer.className = "tkcsv-footer";
            const summary = document.createElement("div"); summary.className = "tkcsv-summary"; summary.style.display = "none";
            const cancelBtn = document.createElement("button"); cancelBtn.className = "tkcsv-btn tkcsv-btn-outline"; cancelBtn.textContent = "Batal";
            cancelBtn.onclick = () => { rm(); resolvePrompt(null); };
            const processBtn = document.createElement("button"); processBtn.className = "tkcsv-btn tkcsv-btn-danger"; processBtn.textContent = "🚫 Batalkan Semua Faktur"; processBtn.disabled = true;
            processBtn.onclick = () => {
              if (validCount === 0) return;
              const passphrase = passInput.value.trim();
              if (!passphrase) {
                showStatus("❌ Passphrase harus diisi sebelum memproses pembatalan.", "err");
                passInput.focus();
                return;
              }
              rm();
              const output = parsedRows.filter(r => r._errors.length === 0).map(r => ({
                nomorFaktur: r.nomor_faktur.replace(/[.\-\s]/g, "").trim(),
              }));
              resolvePrompt({ rows: output, passphrase });
            };
            footer.append(summary, cancelBtn, processBtn);
            modal.append(header, body, footer);
            document.body.append(overlay, modal);

            function showStatus(msg, type) {
              statusBox.style.display = "block";
              statusBox.className = "tkcsv-status tkcsv-status-" + type;
              statusBox.textContent = msg;
            }

                        function processCSVText(text, filename) {
              const { rows, error } = parseCSV(text);
              if (error) { showStatus("❌ " + error, "err"); tableWrap.style.display = "none"; summary.style.display = "none"; processBtn.disabled = true; return; }
              if (rows.length === 0) { showStatus("❌ File CSV tidak berisi data.", "err"); tableWrap.style.display = "none"; summary.style.display = "none"; processBtn.disabled = true; return; }

              validCount = 0; errorCount = 0;
              parsedRows = rows.map(r => {
                const errs = validateRow(r);
                if (errs.length === 0) validCount++; else errorCount++;
                return { ...r, _errors: errs };
              });

              tableWrap.style.display = "block"; tableWrap.innerHTML = "";
              const table = document.createElement("table"); table.className = "tkcsv-table";
              const thead = document.createElement("thead");
              const headTr = document.createElement("tr");
              ["#", ...HEADER_LABELS, "Status"].forEach(h => { const th = document.createElement("th"); th.textContent = h; headTr.appendChild(th); });
              thead.appendChild(headTr); table.appendChild(thead);

              const tbody = document.createElement("tbody");
              parsedRows.forEach((r, idx) => {
                const tr = document.createElement("tr");
                const tdNum = document.createElement("td"); tdNum.textContent = idx + 1; tdNum.style.color = "#4e5668"; tr.appendChild(tdNum);
                HEADERS.forEach(h => {
                  const td = document.createElement("td"); td.textContent = r[h] || "—";
                  const cellErrors = [];
                  if (h === "nomor_faktur") {
                    const digits = (r[h] || "").replace(/[.\-\s]/g, "");
                    if (!/^\d+$/.test(digits) || digits.length < 15 || digits.length > 20) cellErrors.push(1);
                  }
                  td.className = cellErrors.length > 0 ? "cell-err" : "cell-ok"; tr.appendChild(td);
                });
                const tdStatus = document.createElement("td");
                if (r._errors.length === 0) { tdStatus.textContent = "✓ Valid"; tdStatus.className = "cell-ok"; }
                else { tdStatus.textContent = "✗ " + r._errors[0]; tdStatus.className = "cell-err"; tdStatus.title = r._errors.join("\n"); }
                tr.appendChild(tdStatus); tbody.appendChild(tr);
              });
              table.appendChild(tbody); tableWrap.appendChild(table);

              summary.style.display = "flex";
              summary.innerHTML = `<span class="tkcsv-dot tkcsv-dot-green"></span> ${validCount} valid` + (errorCount > 0 ? ` &nbsp; <span class="tkcsv-dot tkcsv-dot-red"></span> ${errorCount} error` : "");

              let countdownTimer = null;
              function enableWithCountdown() {
                if (countdownTimer) clearInterval(countdownTimer);
                processBtn.disabled = true;
                let cd = 3;
                processBtn.textContent = `⏳ Siap dalam ${cd}s...`;
                processBtn.style.cursor = "not-allowed";
                countdownTimer = setInterval(() => {
                  cd--;
                  if (cd <= 0) {
                    clearInterval(countdownTimer); countdownTimer = null;
                    processBtn.disabled = false;
                    processBtn.textContent = "🚫 Batalkan Semua Faktur";
                    processBtn.style.cursor = "pointer";
                  } else {
                    processBtn.textContent = `⏳ Siap dalam ${cd}s...`;
                  }
                }, 1000);
              }

              if (errorCount === 0) { showStatus(`✅ <strong>${filename}</strong> — ${validCount} faktur terdeteksi, semua valid. Siap dibatalkan!`, "ok"); enableWithCountdown(); }
              else if (validCount > 0) { showStatus(`⚠️ <strong>${filename}</strong> — ${validCount} faktur valid, <strong>${errorCount} bermasalah</strong> (akan dilewati).`, "warn"); enableWithCountdown(); }
              else { showStatus(`❌ <strong>${filename}</strong> — Semua ${errorCount} baris bermasalah. Perbaiki CSV dan upload ulang.`, "err"); processBtn.disabled = true; }
            }

            function rm() { overlay.remove(); modal.remove(); }
          });
        }
      }, (results) => {
        if (!results?.[0]?.result) { resolve(null); return; }
        resolve(results[0].result); // { rows: [...], passphrase: "..." } or null
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  MAIN CLICK HANDLER
  // ══════════════════════════════════════════════════════════════
  chrome.action.onClicked.addListener(async (tab) => {

    const result = await ensureActivation(tab);
    if (!result.activated) return;

    // Clear badge from previous batch
    chrome.action.setBadgeText({ text: "" });

    const licenseExpiry = result.expiry;
    const remaining = daysLeft(licenseExpiry);

    // Load user preferences
    const prefs = await new Promise(r => chrome.storage.local.get([
      "tukang_last_module", "tukang_onboarded", "tukang_last_version"
    ], r));
    const lastModule = prefs.tukang_last_module || "";
    const showOnboarding = !prefs.tukang_onboarded;
    const showChangelog = !!(prefs.tukang_last_version && prefs.tukang_last_version !== CHANGELOG_VERSION);
    if (prefs.tukang_last_version !== CHANGELOG_VERSION) {
      chrome.storage.local.set({ tukang_last_version: CHANGELOG_VERSION });
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [formatExpiry(licenseExpiry), remaining, lastModule, showOnboarding, showChangelog, CHANGELOG_ITEMS],
      func: (expiryStr, daysRemaining, lastModule, showOnboarding, showChangelog, changelogItems) => {

        if (document.getElementById("doc-select-modal")) return null;

        return new Promise((resolve) => {
          const styleEl = document.createElement("style");
          styleEl.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
            #tukang-overlay{position:fixed;inset:0;background:rgba(8,10,18,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:9998;animation:tukang-fadeIn .2s ease}
            #doc-select-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(1);width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 24px);background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 0 0 1px rgba(255,255,255,.04),0 24px 64px rgba(0,0,0,.6),0 0 80px rgba(56,130,246,.06);z-index:9999;font-family:'DM Sans',sans-serif;overflow:hidden;animation:tukang-slideUp .25s cubic-bezier(.16,1,.3,1)}
            .tukang-header{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
            .tukang-brand{display:flex;align-items:center;gap:10px}
            .tukang-icon{width:32px;height:32px;background:linear-gradient(135deg,#3882f6,#2563eb);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 4px 12px rgba(56,130,246,.35)}
            .tukang-title{font-size:14px;font-weight:600;color:#f0f2f8;letter-spacing:-.01em}
            .tukang-subtitle{font-size:11px;color:#4e5668;font-weight:400;letter-spacing:.02em;margin-top:1px}
            .tukang-header-actions{display:flex;align-items:center;gap:4px}
            .tukang-icon-btn{width:30px;height:30px;border:none;background:transparent;cursor:pointer;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#4e5668;transition:background .15s,color .15s;font-size:15px}
            .tukang-icon-btn:hover{background:rgba(255,255,255,.07);color:#a0aec0}
            .tukang-icon-btn.close-btn:hover{background:rgba(239,68,68,.12);color:#f87171}
            .tukang-body{padding:20px 22px 22px}
            .tukang-label{font-size:11px;font-weight:500;color:#4e5668;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
            .tukang-select{width:100%;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:9px;color:#e2e8f0;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:400;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234e5668' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;background-size:13px;padding-right:36px;transition:border-color .15s,background .15s}
            .tukang-select:hover{border-color:rgba(255,255,255,.16);background-color:rgba(255,255,255,.06)}
            .tukang-select:focus{border-color:rgba(56,130,246,.5);box-shadow:0 0 0 3px rgba(56,130,246,.12)}
            .tukang-select option{background:#1a1d27;color:#e2e8f0}
            .tukang-divider{height:1px;background:rgba(255,255,255,.05);margin:18px 0}
            .tukang-submit{width:100%;padding:11px 18px;background:linear-gradient(135deg,#3882f6,#2563eb);border:none;border-radius:9px;color:#fff;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:600;cursor:pointer;letter-spacing:-.01em;box-shadow:0 4px 14px rgba(56,130,246,.3);transition:opacity .15s,transform .12s,box-shadow .15s;position:relative;overflow:hidden}
            .tukang-submit:hover{opacity:.92;transform:translateY(-1px);box-shadow:0 6px 20px rgba(56,130,246,.4)}
            .tukang-submit:active{transform:translateY(0);opacity:1}
            .tukang-footer{padding:14px 22px;border-top:1px solid rgba(255,255,255,.05)}
            .tukang-license-info{display:flex;align-items:center;justify-content:space-between;gap:8px}
            .tukang-license-left{display:flex;align-items:center;gap:8px}
            .tukang-license-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;animation:tukang-pulse 2s infinite}
            .tukang-license-dot.green{background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6)}
            .tukang-license-dot.orange{background:#f59e0b;box-shadow:0 0 6px rgba(245,158,11,.6)}
            .tukang-license-dot.red{background:#ef4444;box-shadow:0 0 6px rgba(239,68,68,.6)}
            .tukang-license-text{font-size:11px;color:#4e5668;font-family:'DM Mono',monospace}
            .tukang-license-badge{font-size:10px;padding:3px 8px;border-radius:6px;font-weight:600;font-family:'DM Mono',monospace}
            .tukang-license-badge.green{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
            .tukang-license-badge.orange{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2)}
            .tukang-license-badge.red{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
            .tukang-expiry-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.22);border-radius:9px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#f59e0b;line-height:1.5;display:flex;gap:8px;align-items:center}
            .tukang-changelog-banner{background:rgba(56,130,246,.08);border:1px solid rgba(56,130,246,.2);border-radius:9px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:#7aa8f5;line-height:1.6}
            .tukang-changelog-banner ul{margin:6px 0 8px 16px;padding:0}
            .tukang-changelog-banner li{margin-bottom:2px}
            .tukang-changelog-dismiss{font-size:11px;color:#3882f6;cursor:pointer;background:none;border:none;padding:0;font-family:'DM Sans',sans-serif;text-decoration:underline;display:block;margin-top:4px}
            #tukang-settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:10000;animation:tukang-fadeIn .15s ease}
            #settings-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);z-index:10001;width:380px;font-family:'DM Sans',sans-serif;overflow:hidden;animation:tukang-slideUp .2s cubic-bezier(.16,1,.3,1)}
            .settings-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
            .settings-title{font-size:14px;font-weight:600;color:#f0f2f8;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
            .settings-body{padding:18px 20px;max-height:480px;overflow-y:auto}
            .settings-body::-webkit-scrollbar{width:4px}.settings-body::-webkit-scrollbar-track{background:transparent}.settings-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}
            .settings-info-box{background:rgba(56,130,246,.08);border:1px solid rgba(56,130,246,.18);border-radius:8px;padding:10px 13px;font-size:12px;color:#7aa8f5;line-height:1.5;margin-bottom:18px;display:flex;gap:8px}
            .settings-log-item{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;margin-bottom:8px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:6px;border:1px solid rgba(255,255,255,.06)}
            .settings-log-left{display:flex;flex-direction:column;gap:2px}
            .settings-log-module{font-weight:500;color:#e2e8f0}
            .settings-log-ts{color:#64748b;font-size:10px}
            .settings-log-counts{font-family:'DM Mono',monospace;font-size:11px;text-align:right}
            #tukang-log-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:10002;animation:tukang-fadeIn .15s ease}
            #tukang-log-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f1117;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);z-index:10003;width:400px;max-height:80vh;font-family:'DM Sans',sans-serif;overflow:hidden;display:flex;flex-direction:column;animation:tukang-slideUp .2s cubic-bezier(.16,1,.3,1)}
            #tukang-onboarding{position:absolute;inset:0;background:#0f1117;z-index:10010;display:flex;flex-direction:column;justify-content:space-between;padding:24px 22px 20px;animation:tukang-fadeIn .2s ease;overflow-y:auto}
            .onboarding-step{display:none}.onboarding-step.active{display:flex;flex-direction:column;gap:8px;flex:1}
            .onboarding-icon{font-size:28px;margin-bottom:4px}
            .onboarding-title{font-size:15px;font-weight:600;color:#f0f2f8}
            .onboarding-desc{font-size:12px;color:#94a3b8;line-height:1.6}
            .onboarding-dots{display:flex;gap:5px;justify-content:center;margin:8px 0}
            .onboarding-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.15);transition:background .2s}
            .onboarding-dot.active{background:#3882f6}
            .onboarding-nav{display:flex;gap:8px}
            .onboarding-skip{flex:1;padding:9px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);border-radius:8px;color:#4e5668;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif}
            .onboarding-next{flex:2;padding:9px;background:linear-gradient(135deg,#3882f6,#2563eb);border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
            .settings-field{margin-bottom:14px}
            .settings-field-label{font-size:11px;font-weight:500;color:#4e5668;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;display:block}
            .settings-input{width:100%;padding:9px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#e2e8f0;font-family:'DM Mono',monospace;font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
            .settings-input:hover{border-color:rgba(255,255,255,.15)}
            .settings-input:focus{border-color:rgba(56,130,246,.5);box-shadow:0 0 0 3px rgba(56,130,246,.1)}
            .settings-divider{height:1px;background:rgba(255,255,255,.05);margin:18px 0}
            .settings-section-title{font-size:12px;font-weight:600;color:#e2e8f0;margin-bottom:12px;display:flex;align-items:center;gap:6px}
            .settings-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:8px;justify-content:flex-end}
            .btn-secondary{padding:9px 18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#a0aec0;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:background .15s,color .15s}
            .btn-secondary:hover{background:rgba(255,255,255,.1);color:#e2e8f0}
            .btn-primary{padding:9px 18px;background:linear-gradient(135deg,#3882f6,#2563eb);border:none;border-radius:8px;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 3px 10px rgba(56,130,246,.25);transition:opacity .15s,transform .12s}
            .btn-primary:hover{opacity:.9;transform:translateY(-1px)}
            @keyframes tukang-fadeIn{from{opacity:0}to{opacity:1}}
            @keyframes tukang-slideUp{from{opacity:0;transform:translate(-50%,calc(-50% + 12px)) scale(.97)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
            @keyframes tukang-pulse{0%,100%{opacity:1}50%{opacity:.4}}
          `;
          document.head.appendChild(styleEl);

          const overlay = document.createElement("div"); overlay.id = "tukang-overlay";
          const container = document.createElement("div"); container.id = "doc-select-modal";

          // Header
          const header = document.createElement("div"); header.className = "tukang-header";
          const brand = document.createElement("div"); brand.className = "tukang-brand";
          const iconBox = document.createElement("div"); iconBox.className = "tukang-icon"; iconBox.textContent = "📄";
          const brandText = document.createElement("div");
          const titleEl = document.createElement("div"); titleEl.className = "tukang-title"; titleEl.textContent = "Tukang Dokumen";
          const subtitleEl = document.createElement("div"); subtitleEl.className = "tukang-subtitle"; subtitleEl.textContent = "Document Automation Tool";
          brandText.append(titleEl, subtitleEl); brand.append(iconBox, brandText);

          const headerActions = document.createElement("div"); headerActions.className = "tukang-header-actions";

          // Log button (activity log)
          const logBtn = document.createElement("button"); logBtn.className = "tukang-icon-btn"; logBtn.title = "Activity Log";
          logBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

          const settingsBtn = document.createElement("button"); settingsBtn.className = "tukang-icon-btn"; settingsBtn.title = "Settings";
          settingsBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
          const closeBtn = document.createElement("button"); closeBtn.className = "tukang-icon-btn close-btn"; closeBtn.title = "Close";
          closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
          closeBtn.onclick = () => { container.remove(); overlay.remove(); resolve(null); };
          headerActions.append(logBtn, settingsBtn, closeBtn);
          header.append(brand, headerActions);

          // Body
          const body = document.createElement("div"); body.className = "tukang-body";

          // Changelog banner
          if (showChangelog && changelogItems && changelogItems.length) {
            const banner = document.createElement("div"); banner.className = "tukang-changelog-banner";
            const bannerTitle = document.createElement("div"); bannerTitle.style.cssText = "font-weight:600;color:#7aa8f5;margin-bottom:4px;font-size:12px;";
            bannerTitle.textContent = "✨ Yang Baru di Tukangkunting!";
            const bannerList = document.createElement("ul");
            changelogItems.forEach(item => {
              const li = document.createElement("li"); li.textContent = item; bannerList.appendChild(li);
            });
            const bannerDismiss = document.createElement("button"); bannerDismiss.className = "tukang-changelog-dismiss";
            bannerDismiss.textContent = "OK, mengerti";
            bannerDismiss.onclick = () => banner.remove();
            banner.append(bannerTitle, bannerList, bannerDismiss);
            body.appendChild(banner);
          }

          // Expiry warning banner
          if (daysRemaining <= 7) {
            const warnBanner = document.createElement("div"); warnBanner.className = "tukang-expiry-warn";
            warnBanner.innerHTML = `<span style="font-size:16px;flex-shrink:0;">⚠️</span><span>Lisensi Anda berakhir dalam <strong>${daysRemaining} hari</strong>. Segera hubungi owner untuk perpanjangan.</span>`;
            body.appendChild(warnBanner);
          }

          const selectLabel = document.createElement("div"); selectLabel.className = "tukang-label"; selectLabel.textContent = "Jenis Dokumen";
          // ── ADDED "Pembatalan Faktur" to menu ──
          const opts = ["Faktur Pajak Keluaran","Faktur Pajak Masukan","Faktur Pajak Retur (Keluaran & Masukan)","BPPU & BPNR","Bukti Potong Saya","Pengkreditan Faktur","Pembatalan Faktur"];
          const select = document.createElement("select"); select.className = "tukang-select";
          opts.forEach(o => { const op = document.createElement("option"); op.value = o; op.textContent = o; select.appendChild(op); });
          // Restore last selected module
          if (lastModule && opts.includes(lastModule)) select.value = lastModule;
          const divider = document.createElement("div"); divider.className = "tukang-divider";
          const submit = document.createElement("button"); submit.className = "tukang-submit"; submit.textContent = "Jalankan Proses";
          submit.onclick = () => {
            const val = select.value;
            chrome.storage.local.set({ tukang_last_module: val });
            container.remove(); overlay.remove(); resolve(val);
          };
          body.append(selectLabel, select, divider, submit);

          // Footer
          const footer = document.createElement("div"); footer.className = "tukang-footer";
          const licenseInfo = document.createElement("div"); licenseInfo.className = "tukang-license-info";
          const licenseLeft = document.createElement("div"); licenseLeft.className = "tukang-license-left";
          let dotColor = "green"; if (daysRemaining <= 3) dotColor = "red"; else if (daysRemaining <= 7) dotColor = "orange";
          const dot = document.createElement("div"); dot.className = "tukang-license-dot " + dotColor;
          const licText = document.createElement("div"); licText.className = "tukang-license-text"; licText.textContent = "s/d " + expiryStr;
          licenseLeft.append(dot, licText);
          const badge = document.createElement("span"); badge.className = "tukang-license-badge " + dotColor; badge.textContent = daysRemaining + " hari";
          licenseInfo.append(licenseLeft, badge); footer.appendChild(licenseInfo);
          container.append(header, body, footer);
          document.body.append(overlay, container);

          // ── Log button handler ──
          logBtn.onclick = () => {
            if (document.getElementById("tukang-log-overlay")) return;
            chrome.runtime.sendMessage({ action: "getActivityLog" }, (res) => {
              const log = (res && res.log) || [];
              const logOverlay = document.createElement("div"); logOverlay.id = "tukang-log-overlay";
              const logModal = document.createElement("div"); logModal.id = "tukang-log-modal";
              const lHeader = document.createElement("div"); lHeader.className = "settings-header";
              const lTitle = document.createElement("div"); lTitle.className = "settings-title"; lTitle.innerHTML = `<span style="font-size:13px;opacity:.8">📊</span> Activity Log`;
              const lCloseBtn = document.createElement("button"); lCloseBtn.className = "tukang-icon-btn close-btn"; lCloseBtn.title = "Tutup";
              lCloseBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
              lCloseBtn.onclick = () => { logModal.remove(); logOverlay.remove(); };
              lHeader.append(lTitle, lCloseBtn);
              const lBody = document.createElement("div"); lBody.className = "settings-body"; lBody.style.padding = "12px 16px";
              if (log.length === 0) {
                const empty = document.createElement("div"); empty.style.cssText = "text-align:center;color:#4e5668;font-size:12px;padding:24px 0;font-style:italic;"; empty.textContent = "Belum ada aktivitas yang tercatat.";
                lBody.appendChild(empty);
              } else {
                log.forEach(entry => {
                  const item = document.createElement("div"); item.className = "settings-log-item";
                  const left = document.createElement("div"); left.className = "settings-log-left";
                  const mod = document.createElement("div"); mod.className = "settings-log-module"; mod.textContent = entry.module || "–";
                  const ts = document.createElement("div"); ts.className = "settings-log-ts";
                  ts.textContent = new Date(entry.timestamp).toLocaleString("id-ID", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
                  left.append(mod, ts);
                  const counts = document.createElement("div"); counts.className = "settings-log-counts";
                  counts.innerHTML = `<span style="color:#22c55e;">${entry.success || 0}✓</span>` + (entry.failed > 0 ? ` <span style="color:#f87171;margin-left:4px;">${entry.failed}✗</span>` : "");
                  item.append(left, counts); lBody.appendChild(item);
                });
              }
              logModal.append(lHeader, lBody);
              document.body.append(logOverlay, logModal);
            });
          };

          // ── Settings handler (UPDATED with passphrase field + activity log) ──
          settingsBtn.onclick = () => {
            if (document.getElementById("settings-modal")) return;
            const settingsOverlay = document.createElement("div"); settingsOverlay.id = "tukang-settings-overlay";
            const settingsBox = document.createElement("div"); settingsBox.id = "settings-modal";
            const sHeader = document.createElement("div"); sHeader.className = "settings-header";
            const sTitle = document.createElement("div"); sTitle.className = "settings-title"; sTitle.innerHTML = `<span style="font-size:14px;opacity:.7">⚙️</span> Pengaturan`;
            const sCloseBtn = document.createElement("button"); sCloseBtn.className = "tukang-icon-btn close-btn"; sCloseBtn.title = "Close";
            sCloseBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
            sCloseBtn.onclick = () => { settingsBox.remove(); settingsOverlay.remove(); };
            sHeader.append(sTitle, sCloseBtn);
            const sBody = document.createElement("div"); sBody.className = "settings-body";

            // ── Section: Delay ──
            const delaySection = document.createElement("div"); delaySection.className = "settings-section-title"; delaySection.innerHTML = `⏱️ Pengaturan Delay`;
            sBody.appendChild(delaySection);

            const infoBox = document.createElement("div"); infoBox.className = "settings-info-box";
            infoBox.innerHTML = `<span style="flex-shrink:0;margin-top:1px;opacity:.8">ℹ️</span><span>Semakin tinggi delay, semakin tinggi kemungkinan success, namun proses akan semakin lambat.</span>`;
            sBody.appendChild(infoBox);

            const modules = [
              { key: "delay_ppn", label: "Delay Faktur Pajak (ms)" },
              { key: "delay_ppn_retur", label: "Delay Faktur Pajak Retur (ms)" },
              { key: "delay_bppu", label: "Delay BPPU & BPNR (ms)" },
              { key: "delay_pengkreditan", label: "Delay Pengkreditan Faktur (ms)" },
              { key: "delay_pembatalan", label: "Delay Pembatalan Faktur (ms)" }
            ];
            const delayInputs = {};
            modules.forEach(m => {
              const field = document.createElement("div"); field.className = "settings-field";
              const label = document.createElement("label"); label.className = "settings-field-label"; label.textContent = m.label; field.appendChild(label);
              const input = document.createElement("input"); input.type = "number"; input.className = "settings-input"; input.placeholder = "0"; field.appendChild(input);
              sBody.appendChild(field); delayInputs[m.key] = input;
            });

            // Load saved values including passphrase
            chrome.storage.local.get([...modules.map(m => m.key), "passphrase"], (res) => {
              modules.forEach(m => { delayInputs[m.key].value = res[m.key] ?? 0; });
              passInput.value = res.passphrase ?? "";
            });

            // ── Section: Activity Log ──
            const logDivider = document.createElement("div"); logDivider.className = "settings-divider"; sBody.appendChild(logDivider);
            const logSection = document.createElement("div"); logSection.className = "settings-section-title"; logSection.innerHTML = `📊 Aktivitas Terakhir`;
            sBody.appendChild(logSection);
            chrome.runtime.sendMessage({ action: "getActivityLog" }, (res) => {
              const log = (res && res.log) || [];
              if (log.length === 0) {
                const emptyMsg = document.createElement("div"); emptyMsg.style.cssText = "font-size:11px;color:#4e5668;font-style:italic;margin-bottom:14px;"; emptyMsg.textContent = "Belum ada aktivitas tercatat.";
                sBody.insertBefore(emptyMsg, sFooter);
              } else {
                log.slice(0, 5).forEach(entry => {
                  const item = document.createElement("div"); item.className = "settings-log-item";
                  const left = document.createElement("div"); left.className = "settings-log-left";
                  const mod = document.createElement("div"); mod.className = "settings-log-module"; mod.textContent = entry.module || "–";
                  const ts = document.createElement("div"); ts.className = "settings-log-ts"; ts.textContent = new Date(entry.timestamp).toLocaleString("id-ID", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
                  left.append(mod, ts);
                  const cnts = document.createElement("div"); cnts.className = "settings-log-counts";
                  cnts.innerHTML = `<span style="color:#22c55e;">${entry.success || 0}✓</span>` + (entry.failed > 0 ? ` <span style="color:#f87171;margin-left:4px;">${entry.failed}✗</span>` : "");
                  item.append(left, cnts); sBody.insertBefore(item, sFooter);
                });
              }
            });

            const sFooter = document.createElement("div"); sFooter.className = "settings-footer";
            const sCancelBtn = document.createElement("button"); sCancelBtn.className = "btn-secondary"; sCancelBtn.textContent = "Batal";
            sCancelBtn.onclick = () => { settingsBox.remove(); settingsOverlay.remove(); };
            const sSaveBtn = document.createElement("button"); sSaveBtn.className = "btn-primary"; sSaveBtn.textContent = "Simpan";
            sSaveBtn.onclick = () => {
              const saveObj = {};
              modules.forEach(m => { saveObj[m.key] = parseInt(delayInputs[m.key].value) || 0; });
              // Save passphrase
              saveObj.passphrase = passInput.value;
              chrome.storage.local.set(saveObj, () => { alert("Saved!"); settingsBox.remove(); settingsOverlay.remove(); });
            };
            sFooter.append(sCancelBtn, sSaveBtn);
            settingsBox.append(sHeader, sBody, sFooter);
            document.body.append(settingsOverlay, settingsBox);
          };

          // ── Onboarding tour (first run) ──
          if (showOnboarding) {
            const onboardingSteps = [
              { icon: "👋", title: "Selamat Datang di Tukangkunting!", desc: "Extension ini mengotomasi operasi dokumen di portal e-Faktur Pajak. Hemat waktu untuk proses massal yang berulang." },
              { icon: "📋", title: "Pilih Jenis Dokumen", desc: "Gunakan dropdown di bawah untuk memilih modul yang ingin dijalankan. Tersedia berbagai jenis dokumen pajak." },
              { icon: "🚀", title: "Jalankan Proses", desc: "Klik 'Jalankan Proses' dan biarkan extension bekerja otomatis. Pastikan Anda berada di halaman yang sesuai." },
              { icon: "📊", title: "Pantau Progress", desc: "Panel progress akan muncul di kanan bawah layar. Anda bisa Pause, Resume, atau Cancel kapan saja selama proses berlangsung." },
            ];
            const tour = document.createElement("div"); tour.id = "tukang-onboarding";
            let currentStep = 0;
            const stepsContainer = document.createElement("div"); stepsContainer.style.flex = "1";
            onboardingSteps.forEach((s, idx) => {
              const step = document.createElement("div"); step.className = "onboarding-step" + (idx === 0 ? " active" : "");
              step.innerHTML = `<div class="onboarding-icon">${s.icon}</div><div class="onboarding-title">${s.title}</div><div class="onboarding-desc">${s.desc}</div>`;
              stepsContainer.appendChild(step);
            });
            const dotsRow = document.createElement("div"); dotsRow.className = "onboarding-dots";
            onboardingSteps.forEach((_, idx) => {
              const d = document.createElement("div"); d.className = "onboarding-dot" + (idx === 0 ? " active" : ""); dotsRow.appendChild(d);
            });
            const navRow = document.createElement("div"); navRow.className = "onboarding-nav";
            const skipBtn = document.createElement("button"); skipBtn.className = "onboarding-skip"; skipBtn.textContent = "Lewati";
            const nextBtn = document.createElement("button"); nextBtn.className = "onboarding-next"; nextBtn.textContent = "Lanjut →";
            function finishOnboarding() {
              tour.remove();
              chrome.storage.local.set({ tukang_onboarded: true });
            }
            function goStep(n) {
              stepsContainer.querySelectorAll(".onboarding-step").forEach((s, i) => s.classList.toggle("active", i === n));
              dotsRow.querySelectorAll(".onboarding-dot").forEach((d, i) => d.classList.toggle("active", i === n));
              nextBtn.textContent = n === onboardingSteps.length - 1 ? "Mulai ✓" : "Lanjut →";
            }
            skipBtn.onclick = finishOnboarding;
            nextBtn.onclick = () => {
              if (currentStep < onboardingSteps.length - 1) { currentStep++; goStep(currentStep); }
              else finishOnboarding();
            };
            navRow.append(skipBtn, nextBtn);
            tour.append(stepsContainer, dotsRow, navRow);
            container.appendChild(tour);
          }
        });
      }
    }, async (results) => {
      if (!results || !results[0].result) return;
      const sel = results[0].result;

      // ── Handle "Pengkreditan Faktur" — show CSV modal ──
      if (sel === "Pengkreditan Faktur") {
        const csvData = await showPengkreditanCSVModal(tab);
        if (!csvData || csvData.length === 0) return;

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [csvData],
          func: (list) => { window.__pengkreditanFakturList = list; }
        }, () => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["pengkreditan_faktur.js"]
          });
        });
        return;
      }

      // ── Handle "Pembatalan Faktur" — show CSV modal (NEW) ──
      if (sel === "Pembatalan Faktur") {
        const csvResult = await showPembatalanCSVModal(tab);
        if (!csvResult || !csvResult.rows || csvResult.rows.length === 0) return;

        // Pass validated CSV data + passphrase to the content script
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [csvResult.rows, csvResult.passphrase],
          func: (list, passphrase) => {
            window.__pembatalanFakturList = list;
            window.__pembatalanPassphrase = passphrase;
          }
        }, () => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["pembatalan_faktur.js"]
          });
        });
        return;
      }

      // ── Existing menu items ──
      let file = null;
      if (sel === "Faktur Pajak Keluaran") file = "faktur_pajak_keluaran.js";
      if (sel === "Faktur Pajak Masukan") file = "faktur_pajak_masukan.js";
      if (sel === "Faktur Pajak Retur (Keluaran & Masukan)") file = "faktur_pajak_retur_masukan_keluaran.js";
      if (sel === "BPPU & BPNR") file = "bppu_bpnr.js";
      if (sel === "Bukti Potong Saya") file = "bukti_potong_saya.js";

      if (file) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["libs/jquery-3.7.0.min.js", file]
        });
      }
    });
  });

})();
