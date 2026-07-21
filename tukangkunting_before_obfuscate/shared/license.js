(function () {
  const TK = (window.TK = window.TK || {});

  async function check() {
    return new Promise((resolve) => {
      if (!chrome?.runtime?.sendMessage) {
        resolve({ ok: false, reason: "no_runtime" });
        return;
      }

      chrome.runtime.sendMessage({ action: "checkLicense" }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            ok: false,
            reason: chrome.runtime.lastError.message,
          });
          return;
        }

        resolve(response || { ok: false, reason: "no_response" });
      });
    });
  }

  function humanReason(reason) {
    if (reason === "lisensi sudah expired") {
      return "Lisensi Anda sudah expired. Hubungi owner untuk perpanjangan.";
    }

    if (reason === "machine code tidak cocok") {
      return "Token tidak cocok dengan perangkat ini.";
    }

    if (reason === "no_license") {
      return "Belum ada lisensi aktif. Klik icon extension untuk aktivasi.";
    }

    if (reason === "no_runtime") {
      return "Chrome runtime tidak tersedia di halaman ini.";
    }

    if (reason === "no_response") {
      return "Tidak ada respons dari service worker.";
    }

    return reason || "Lisensi tidak ditemukan.";
  }

  function showInvalidNotice(reason, moduleName = "Tukangkunting") {
    document.getElementById("tukang-license-notice")?.remove();

    const notice = document.createElement("div");
    notice.id = "tukang-license-notice";
    notice.style.cssText = `
      position:fixed;
      bottom:24px;
      right:24px;
      width:320px;
      background:#0f1117;
      border:1px solid rgba(239,68,68,.3);
      border-radius:16px;
      padding:18px 20px;
      z-index:999999;
      font-family:'DM Sans',system-ui,sans-serif;
      color:#e2e8f0;
      box-shadow:0 16px 48px rgba(0,0,0,.5);
    `;

    notice.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:32px;height:32px;background:rgba(239,68,68,.12);border-radius:8px;display:flex;align-items:center;justify-content:center;">🔒</div>
        <div>
          <div style="font-size:13px;font-weight:700;color:#f87171;">Lisensi Tidak Aktif</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">${moduleName}</div>
        </div>
      </div>
      <div style="font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:14px;">${humanReason(reason)}</div>
      <button id="tukang-license-close" style="
        width:100%;
        padding:9px;
        border:1px solid rgba(255,255,255,.09);
        background:rgba(255,255,255,.04);
        border-radius:8px;
        color:#a0aec0;
        font-size:12px;
        font-weight:600;
        cursor:pointer;
        font-family:'DM Sans',system-ui,sans-serif;
      ">Tutup</button>
    `;

    document.body.appendChild(notice);
    document.getElementById("tukang-license-close").onclick = () => notice.remove();
  }

  async function ensure(moduleName) {
    const result = await check();

    if (!result.ok) {
      console.error("❌ Lisensi tidak valid:", result.reason);
      showInvalidNotice(result.reason, moduleName);
      return false;
    }

    if (result.expiry) {
      const daysLeft = Math.ceil((result.expiry - Date.now()) / 86_400_000);
      const expDate = new Date(result.expiry).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      console.log(`✅ Lisensi aktif — berlaku hingga ${expDate} (${daysLeft} hari lagi)`);
    }

    return true;
  }

  TK.License = {
    check,
    ensure,
    showInvalidNotice,
    humanReason,
  };
})();