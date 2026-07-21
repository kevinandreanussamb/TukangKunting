(function () {
  const { SHARED_SECRET } = self.TK_CONSTANTS;

  async function sha256(str) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(str)
    );

    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function hexToBytes(hex) {
    const arr = new Uint8Array(hex.length / 2);

    for (let i = 0; i < arr.length; i++) {
      arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    }

    return arr;
  }

  function base64urlToBytes(b64url) {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);

    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }

  async function deriveKey() {
    const rawKey = await sha256(SHARED_SECRET);
    const keyBytes = hexToBytes(rawKey.substring(0, 64));

    return crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
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

      if (packed.length < 28) {
        return { ok: false, reason: "token terlalu pendek" };
      }

      const iv = packed.slice(0, 12);
      const tag = packed.slice(12, 28);
      const ciphertext = packed.slice(28);

      const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
      ciphertextWithTag.set(ciphertext);
      ciphertextWithTag.set(tag, ciphertext.length);

      const key = await deriveKey();

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        key,
        ciphertextWithTag
      );

      const payload = JSON.parse(new TextDecoder().decode(decrypted));

      if (payload.machineCode !== machineCode) {
        return { ok: false, reason: "machine code tidak cocok" };
      }

      if (Date.now() > payload.expiry) {
        return { ok: false, reason: "lisensi sudah expired" };
      }

      return {
        ok: true,
        expiry: payload.expiry,
      };
    } catch {
      return {
        ok: false,
        reason: "token tidak valid",
      };
    }
  }

  async function checkStoredLicense(machineCode) {
    const { license_token } = await chrome.storage.local.get("license_token");

    if (!license_token) {
      return { ok: false, reason: "no_license" };
    }

    return verifyLicenseToken(license_token, machineCode);
  }

  function formatExpiry(ts) {
    return new Date(ts).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function daysLeft(ts) {
    return Math.max(0, Math.ceil((ts - Date.now()) / 86_400_000));
  }

  async function runLicenseCheck() {
    const machineCode = await generateMachineCode();
    const { license_token } = await chrome.storage.local.get("license_token");

    if (!license_token) {
      return { ok: false, reason: "no_license" };
    }

    return verifyLicenseToken(license_token, machineCode);
  }

  async function ensureActivation(tab) {
    const machineCode = await generateMachineCode();
    const licenseCheck = await checkStoredLicense(machineCode);

    if (licenseCheck.ok) {
      return {
        activated: true,
        expiry: licenseCheck.expiry,
      };
    }

    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          args: [machineCode],
          func: (machineCode) => {
            if (document.getElementById("tukang-activation-modal")) {
              return null;
            }

            return new Promise((resolvePrompt) => {
              if (!document.getElementById("tukang-activation-style")) {
                const style = document.createElement("style");
                style.id = "tukang-activation-style";
                style.textContent = `
                  #tukang-act-overlay{
                    position:fixed;inset:0;background:rgba(8,10,18,.75);
                    backdrop-filter:blur(6px);z-index:10050;
                  }

                  #tukang-activation-modal{
                    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                    width:420px;background:#0f1117;border:1px solid rgba(255,255,255,.08);
                    border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);
                    z-index:10051;font-family:'DM Sans',system-ui,sans-serif;
                    color:#e2e8f0;overflow:hidden;
                  }

                  .tka-header{
                    display:flex;align-items:center;justify-content:space-between;
                    padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06)
                  }

                  .tka-title{font-size:14px;font-weight:700;color:#f0f2f8}
                  .tka-close{
                    width:30px;height:30px;border:none;background:transparent;cursor:pointer;
                    border-radius:7px;color:#64748b;font-size:14px
                  }
                  .tka-close:hover{background:rgba(239,68,68,.12);color:#f87171}

                  .tka-body{padding:18px 20px 20px}
                  .tka-desc{font-size:12px;line-height:1.6;color:#94a3b8;margin-bottom:14px}
                  .tka-label{
                    font-size:11px;font-weight:600;color:#64748b;letter-spacing:.07em;
                    text-transform:uppercase;margin-bottom:6px;display:block
                  }

                  .tka-codebox{
                    width:100%;padding:11px 13px;background:rgba(255,255,255,.04);
                    border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#7dd3fc;
                    font-family:'DM Mono',monospace;font-size:13px;box-sizing:border-box;
                    word-break:break-all;margin-bottom:14px;user-select:all
                  }

                  .tka-input{
                    width:100%;padding:10px 13px;background:rgba(255,255,255,.04);
                    border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#e2e8f0;
                    font-family:'DM Mono',monospace;font-size:13px;outline:none;box-sizing:border-box
                  }

                  .tka-input:focus{
                    border-color:rgba(56,130,246,.5);
                    box-shadow:0 0 0 3px rgba(56,130,246,.1)
                  }

                  .tka-expiry-info{font-size:11px;color:#64748b;margin-top:8px;font-style:italic}
                  .tka-actions{margin-top:16px;display:flex;gap:8px;justify-content:flex-end}

                  .tka-btn-sec{
                    padding:9px 18px;background:rgba(255,255,255,.06);
                    border:1px solid rgba(255,255,255,.09);border-radius:8px;color:#a0aec0;
                    font-family:'DM Sans',system-ui,sans-serif;font-size:13px;font-weight:600;cursor:pointer
                  }

                  .tka-btn-pri{
                    padding:9px 18px;background:linear-gradient(135deg,#3882f6,#2563eb);
                    border:none;border-radius:8px;color:#fff;font-family:'DM Sans',system-ui,sans-serif;
                    font-size:13px;font-weight:700;cursor:pointer
                  }

                  .tka-btn-pri:disabled{opacity:.5;cursor:not-allowed}
                  .tka-error{margin-top:10px;font-size:12px;color:#f87171;display:none}

                  .tka-success{
                    margin-top:14px;padding:14px 16px;background:rgba(34,197,94,.08);
                    border:1px solid rgba(34,197,94,.2);border-radius:10px;display:none
                  }

                  .tka-success-title{
                    font-size:14px;font-weight:700;color:#22c55e;margin-bottom:8px
                  }

                  .tka-success-row{
                    display:flex;justify-content:space-between;align-items:center;
                    padding:6px 0;font-size:12px
                  }

                  .tka-success-label{color:#64748b}
                  .tka-success-value{color:#e2e8f0;font-weight:600;font-family:'DM Mono',monospace}
                  .tka-success-value.green{color:#22c55e}
                  .tka-success-value.orange{color:#f59e0b}
                  .tka-success-value.red{color:#ef4444}
                `;

                document.head.appendChild(style);
              }

              const overlay = document.createElement("div");
              overlay.id = "tukang-act-overlay";

              const modal = document.createElement("div");
              modal.id = "tukang-activation-modal";

              const header = document.createElement("div");
              header.className = "tka-header";

              const title = document.createElement("div");
              title.className = "tka-title";
              title.textContent = "🔑 Aktivasi Lisensi";

              const closeBtn = document.createElement("button");
              closeBtn.className = "tka-close";
              closeBtn.textContent = "✕";
              closeBtn.onclick = () => {
                rm();
                resolvePrompt(null);
              };

              header.append(title, closeBtn);

              const body = document.createElement("div");
              body.className = "tka-body";

              const desc = document.createElement("div");
              desc.className = "tka-desc";
              desc.textContent =
                "Salin Machine Code di bawah lalu kirim ke pemilik extension. Masukkan License Token yang diterima pada kolom aktivasi.";

              const mcLabel = document.createElement("label");
              mcLabel.className = "tka-label";
              mcLabel.textContent = "Machine Code";

              const mcBox = document.createElement("div");
              mcBox.className = "tka-codebox";
              mcBox.textContent = machineCode;

              const formWrap = document.createElement("div");
              formWrap.id = "tka-form-wrap";

              const inputLabel = document.createElement("label");
              inputLabel.className = "tka-label";
              inputLabel.textContent = "License Token";

              const input = document.createElement("input");
              input.className = "tka-input";
              input.placeholder = "Paste token dari owner di sini...";

              const expiryInfo = document.createElement("div");
              expiryInfo.className = "tka-expiry-info";
              expiryInfo.textContent = "Token berisi informasi masa berlaku lisensi.";

              const errorText = document.createElement("div");
              errorText.className = "tka-error";

              const actions = document.createElement("div");
              actions.className = "tka-actions";

              const copyBtn = document.createElement("button");
              copyBtn.className = "tka-btn-sec";
              copyBtn.textContent = "Copy Machine Code";
              copyBtn.onclick = async () => {
                try {
                  await navigator.clipboard.writeText(machineCode);
                  copyBtn.textContent = "✓ Copied!";
                  setTimeout(() => {
                    copyBtn.textContent = "Copy Machine Code";
                  }, 1500);
                } catch {}
              };

              const submitBtn = document.createElement("button");
              submitBtn.className = "tka-btn-pri";
              submitBtn.textContent = "Aktivasi";
              submitBtn.onclick = () => {
                const token = input.value.trim();

                if (!token) {
                  errorText.textContent = "Masukkan license token terlebih dahulu.";
                  errorText.style.display = "block";
                  return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = "Memverifikasi...";
                errorText.style.display = "none";

                resolvePrompt({ machineCode, token });
              };

              actions.append(copyBtn, submitBtn);
              formWrap.append(inputLabel, input, expiryInfo, errorText, actions);

              const successPanel = document.createElement("div");
              successPanel.className = "tka-success";
              successPanel.id = "tka-success-panel";

              body.append(desc, mcLabel, mcBox, formWrap, successPanel);
              modal.append(header, body);
              document.body.append(overlay, modal);

              window.__tukangActivationShowSuccess = (expiry, daysRemaining) => {
                formWrap.style.display = "none";
                desc.style.display = "none";
                mcLabel.style.display = "none";
                mcBox.style.display = "none";

                title.textContent = "✅ Aktivasi Berhasil!";

                let colorClass = "green";
                if (daysRemaining <= 3) colorClass = "red";
                else if (daysRemaining <= 7) colorClass = "orange";

                const expDate = new Date(expiry).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });

                successPanel.innerHTML = "";
                successPanel.style.display = "block";

                const successTitle = document.createElement("div");
                successTitle.className = "tka-success-title";
                successTitle.textContent = "🎉 Lisensi Aktif";
                successPanel.appendChild(successTitle);

                [
                  { label: "Berlaku hingga", value: expDate, cls: "" },
                  { label: "Sisa waktu", value: `${daysRemaining} hari`, cls: colorClass },
                ].forEach((item) => {
                  const row = document.createElement("div");
                  row.className = "tka-success-row";

                  const label = document.createElement("span");
                  label.className = "tka-success-label";
                  label.textContent = item.label;

                  const value = document.createElement("span");
                  value.className = `tka-success-value ${item.cls || ""}`;
                  value.textContent = item.value;

                  row.append(label, value);
                  successPanel.appendChild(row);
                });

                const continueBtn = document.createElement("button");
                continueBtn.className = "tka-btn-pri";
                continueBtn.style.marginTop = "14px";
                continueBtn.textContent = "Lanjutkan →";
                continueBtn.onclick = () => rm();

                successPanel.appendChild(continueBtn);
              };

              function rm() {
                overlay.remove();
                modal.remove();
                delete window.__tukangActivationShowSuccess;
              }
            });
          },
        },
        async (results) => {
          if (!results?.[0]?.result) {
            resolve({ activated: false });
            return;
          }

          const { machineCode: mc, token } = results[0].result;
          const result = await verifyLicenseToken(token, mc);

          if (!result.ok) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              args: [result.reason],
              func: (reason) => {
                const errorEl = document.querySelector("#tukang-activation-modal .tka-error");
                if (errorEl) {
                  errorEl.textContent = "❌ " + reason;
                  errorEl.style.display = "block";
                }

                const btn = document.querySelector("#tukang-activation-modal .tka-btn-pri");
                if (btn) {
                  btn.disabled = false;
                  btn.textContent = "Aktivasi";
                }
              },
            });

            resolve({ activated: false });
            return;
          }

          await chrome.storage.local.set({ license_token: token });

          const remaining = daysLeft(result.expiry);

          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [result.expiry, remaining],
            func: (expiry, daysRemaining) => {
              if (typeof window.__tukangActivationShowSuccess === "function") {
                window.__tukangActivationShowSuccess(expiry, daysRemaining);
              }
            },
          });

          resolve({
            activated: true,
            expiry: result.expiry,
          });
        }
      );
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.action) return;

    if (msg.action === "checkLicense") {
      (async () => {
        try {
          const result = await runLicenseCheck();
          sendResponse(result);
        } catch (err) {
          sendResponse({
            ok: false,
            reason: "error: " + err.message,
          });
        }
      })();

      return true;
    }
  });

  self.TK_LICENSE = {
    sha256,
    generateMachineCode,
    verifyLicenseToken,
    checkStoredLicense,
    ensureActivation,
    formatExpiry,
    daysLeft,
    runLicenseCheck,
  };
})();