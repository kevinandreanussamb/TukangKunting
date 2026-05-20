/**
 * Tukang License — Admin Tool (Owner Side)
 * 
 * Crypto logic di sini IDENTIK dengan license_activation.js:
 *   1. deriveKey: sha256(secret) → hex string → hexToBytes → AES key
 *   2. Token format: iv(12) | tag(16) | ciphertext → base64url
 *   3. machineCode: 32-char UPPERCASE hex
 *   4. Payload: { machineCode, expiry }
 */

// ═══════════════════════════════════════════════════════════
// CRYPTO — IDENTIK DENGAN license_activation.js
// ═══════════════════════════════════════════════════════════

/**
 * SHA-256 → hex string (sama persis dgn license_activation.js)
 */
async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hex string → Uint8Array (sama persis dgn license_activation.js)
 */
function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++)
    arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr;
}

/**
 * Derive AES key — HARUS IDENTIK dgn license_activation.js
 *
 * license_activation.js:
 *   const rawKey = await sha256(SHARED_SECRET);          // 64-char hex
 *   const keyBytes = hexToBytes(rawKey.substring(0, 64));
 *   return crypto.subtle.importKey("raw", keyBytes, {name:"AES-GCM"}, false, ["decrypt"]);
 *
 * Di sini kita tambah "encrypt" di usage supaya bisa generate token.
 */
async function deriveKey(secret, usage) {
  const rawKey = await sha256(secret); // 64-char hex string
  const keyBytes = hexToBytes(rawKey.substring(0, 64)); // 32 bytes
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    usage
  );
}

// ─── Base64url ────────────────────────────────────────────

/**
 * Uint8Array → base64url (untuk generate token)
 */
function bytesToBase64url(u8) {
  let bin = "";
  for (const b of u8) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * base64url → Uint8Array (sama dgn license_activation.js: base64urlToBytes)
 */
function base64urlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ═══════════════════════════════════════════════════════════
// GENERATE TOKEN (Owner side — encrypt)
// ═══════════════════════════════════════════════════════════

/**
 * Generate license token.
 *
 * Menghasilkan token yang bisa di-decrypt oleh
 * verifyLicenseToken() di license_activation.js
 *
 * Format packed: iv(12) | tag(16) | ciphertext → base64url
 *
 * @param {string} machineCode - 32-char UPPERCASE hex dari user
 * @param {number} days        - durasi lisensi
 * @param {string} secret      - SHARED_SECRET (harus sama dgn client)
 */
async function generateToken(machineCode, days, secret) {
  const key = await deriveKey(secret, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  const expiry = Date.now() + days * 86_400_000;
  const payload = JSON.stringify({ machineCode, expiry });

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    new TextEncoder().encode(payload)
  );

  // Web Crypto returns: ciphertext + tag (concatenated)
  const encBytes = new Uint8Array(encrypted);
  const ciphertext = encBytes.slice(0, encBytes.length - 16);
  const tag = encBytes.slice(encBytes.length - 16);

  // Pack ke format yang sama: iv(12) | tag(16) | ciphertext
  // Ini yang di-unpack oleh license_activation.js:
  //   iv         = packed.slice(0, 12);
  //   tag        = packed.slice(12, 28);
  //   ciphertext = packed.slice(28);
  const packed = new Uint8Array(12 + 16 + ciphertext.length);
  packed.set(iv, 0); //  0..11 = iv
  packed.set(tag, 12); // 12..27 = tag
  packed.set(ciphertext, 28); // 28..   = ciphertext

  return { token: bytesToBase64url(packed), expiry };
}

// ═══════════════════════════════════════════════════════════
// VERIFY TOKEN (Owner side — decrypt, cek token valid)
// Sama persis dgn verifyLicenseToken di license_activation.js
// ═══════════════════════════════════════════════════════════

async function verifyToken(token, machineCode, secret) {
  try {
    const packed = base64urlToBytes(token);
    if (packed.length < 28)
      return { ok: false, reason: "token terlalu pendek" };

    const iv = packed.slice(0, 12);
    const tag = packed.slice(12, 28);
    const ciphertext = packed.slice(28);

    // WebCrypto AES-GCM expects: ciphertext + tag concatenated
    const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
    ciphertextWithTag.set(ciphertext);
    ciphertextWithTag.set(tag, ciphertext.length);

    const key = await deriveKey(secret, ["decrypt"]);
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

    return { ok: true, expiry: payload.expiry };
  } catch {
    return { ok: false, reason: "token tidak valid / tampered" };
  }
}

// ═══════════════════════════════════════════════════════════
// UI LOGIC
// ═══════════════════════════════════════════════════════════

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ─── TABS ─────────────────────────────────────────────────
const tabs = $$(".tab");
const panels = $$(".panel");
const indicator = $(".tab-indicator");

tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`#panel-${tab.dataset.tab}`).classList.add("active");
    indicator.style.transform = `translateX(${i * 100}%)`;
  });
});

// ─── TOAST ────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = "success") {
  const t = $("#toast");
  $("#toastIcon").textContent = type === "success" ? "✅" : "❌";
  $("#toastMsg").textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ─── MACHINE CODE INPUT ──────────────────────────────��────
// User machine code = 32-char UPPERCASE hex
const machineInput = $("#genMachineCode");
const charCount = $("#charCount");

machineInput.addEventListener("input", () => {
  // Hanya hex, auto UPPERCASE (sesuai license_activation.js)
  machineInput.value = machineInput.value
    .replace(/[^a-fA-F0-9]/g, "")
    .toUpperCase();
  const len = machineInput.value.length;
  charCount.textContent = `${len}/32`;
  charCount.className =
    "char-count" + (len === 32 ? " full" : len > 32 ? " error" : "");
});

// ─── DURATION ─────────────────────────────────────────────
let selectedDays = 30;
const durBtns = $$(".dur-btn");
const customWrap = $("#customDurWrap");
const customDays = $("#customDays");

durBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    durBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (btn.dataset.days === "custom") {
      customWrap.classList.remove("hidden");
      customDays.focus();
      selectedDays = parseInt(customDays.value) || 30;
    } else {
      customWrap.classList.add("hidden");
      selectedDays = parseInt(btn.dataset.days);
    }
  });
});
customDays.addEventListener("input", () => {
  selectedDays = Math.max(1, parseInt(customDays.value) || 1);
});

// ─── SECRET TOGGLE ────────────────────────────────────────
$("#toggleSecret").addEventListener("click", () => {
  const inp = $("#genSecret");
  const isPass = inp.type === "password";
  inp.type = isPass ? "text" : "password";
  $(".eye-open").classList.toggle("hidden", isPass);
  $(".eye-closed").classList.toggle("hidden", !isPass);
});

// ─── GENERATE ─────────────────────────────────────────────
$("#generateBtn").addEventListener("click", async () => {
  const mc = machineInput.value.trim();
  const secret = $("#genSecret").value;
  const label = ($("#genLabel")?.value || "").trim();

  // Validasi: harus 32 char UPPERCASE hex
  if (!mc || mc.length !== 32) {
    showToast("Machine code harus 32 karakter!", "error");
    machineInput.focus();
    return;
  }
  if (!/^[A-F0-9]{32}$/.test(mc)) {
    showToast("Machine code harus UPPERCASE hex (0-9, A-F)!", "error");
    machineInput.focus();
    return;
  }
  if (!secret || secret.length < 8) {
    showToast("Secret key terlalu pendek!", "error");
    return;
  }

  // Loading
  const content = $("#generateBtn .btn-content");
  const loader = $("#generateBtn .btn-loader");
  content.classList.add("hidden");
  loader.classList.remove("hidden");
  $("#generateBtn").disabled = true;

  await new Promise((r) => setTimeout(r, 500));

  try {
    const { token, expiry } = await generateToken(mc, selectedDays, secret);
    const expDate = new Date(expiry);

    // Tampilkan result
    $("#resMachine").textContent = mc;
    // Label
    if (label) {
      $("#resLabel").textContent = label;
      $("#resLabelWrap").style.display = "";
    } else {
      $("#resLabelWrap").style.display = "none";
    }
    $("#resDuration").textContent =
      selectedDays >= 365
        ? `${Math.floor(selectedDays / 365)} tahun`
        : selectedDays >= 30
        ? `${Math.floor(selectedDays / 30)} bulan`
        : `${selectedDays} hari`;
    $("#resExpiry").textContent = expDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    $("#resToken").textContent = token;

    $("#resultCard").classList.remove("hidden");
    $("#resultCard").scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Save history
    saveHistory({
      machineCode: mc,
      label: label || "",
      days: selectedDays,
      token,
      expiry,
      createdAt: Date.now(),
    });

    showToast("Token berhasil di-generate! 🎉");
  } catch (err) {
    showToast("Gagal: " + err.message, "error");
  }

  content.classList.remove("hidden");
  loader.classList.add("hidden");
  $("#generateBtn").disabled = false;
});

// ─── CLOSE RESULT ─────────────────────────────────────────
$("#closeResult").addEventListener("click", () => {
  $("#resultCard").classList.add("hidden");
});

// ─── COPY TOKEN ───────────────────────────────────────────
$("#copyToken").addEventListener("click", async () => {
  const token = $("#resToken").textContent;
  try {
    await navigator.clipboard.writeText(token);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = token;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  showToast("Token disalin ke clipboard!");
});

// ─── DOWNLOAD TOKEN ───────────────────────────────────────
$("#downloadToken").addEventListener("click", () => {
  const mc = $("#resMachine").textContent;
  const lbl = $("#resLabel")?.textContent || "";
  const dur = $("#resDuration").textContent;
  const exp = $("#resExpiry").textContent;
  const token = $("#resToken").textContent;

  const txt = [
    "═══════════════════════════════════════",
    "  TUKANG LICENSE — TOKEN AKTIVASI",
    "═══════════════════════════════════════",
    "",
    `Machine Code : ${mc}`,
    ...(lbl && lbl !== "-" ? [`Nama User    : ${lbl}`] : []),
    `Durasi       : ${dur}`,
    `Berlaku s/d  : ${exp}`,
    `Generated    : ${new Date().toLocaleString("id-ID")}`,
    "",
    "── TOKEN (paste di extension) ─────────",
    token,
    "",
    "═══════════════════════════════════════",
  ].join("\n");

  const blob = new Blob([txt], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `license_${mc.slice(0, 8)}_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("File token diunduh!");
});

// ═══════════════════════════════════════════════════════════
// VERIFY TAB
// ═══════════════════════════════════════════════════════════

$("#verifyBtn").addEventListener("click", async () => {
  const token = $("#verToken").value.trim();
  const mc = $("#verMachineCode").value.trim().toUpperCase();
  const secret = $("#verSecret").value;

  if (!token) {
    showToast("Masukkan token!", "error");
    return;
  }
  if (!mc || mc.length !== 32) {
    showToast("Machine code harus 32 karakter hex!", "error");
    return;
  }

  const result = await verifyToken(token, mc, secret);
  const container = $("#verifyResult");
  const status = $("#verifyStatus");
  container.classList.remove("hidden");

  if (result.ok) {
    const exp = new Date(result.expiry);
    const daysLeft = Math.ceil((result.expiry - Date.now()) / 86_400_000);
    status.className = "verify-status valid";
    status.innerHTML = `
      <span class="v-icon">✅</span>
      <div class="v-info">
        <h3>Token Valid</h3>
        <p>Berlaku hingga ${exp.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })} (${daysLeft} hari lagi)</p>
      </div>`;
  } else {
    status.className = "verify-status invalid";
    status.innerHTML = `
      <span class="v-icon">❌</span>
      <div class="v-info">
        <h3>Token Tidak Valid</h3>
        <p>${result.reason}</p>
      </div>`;
  }

  container.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

// ═══════════════════════════════════════════════════════════
// HISTORY — localStorage + revocation + search + export + stats
// ═══════════════════════════════════════════════════════════

const MAX_HISTORY_SIZE          = 200;
const EXPIRING_SOON_THRESHOLD_MS = 7 * 86_400_000;
const MACHINE_CODE_LENGTH       = 32;
const MAX_LICENSE_DAYS          = 3650;

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("tukang_history") || "[]");
  } catch {
    return [];
  }
}

function getRevokedList() {
  try {
    return JSON.parse(localStorage.getItem("tukang_revoked") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY_SIZE) history.length = MAX_HISTORY_SIZE;
  localStorage.setItem("tukang_history", JSON.stringify(history));
  renderHistory();
  renderStats();
}

function toggleRevoke(token) {
  const revoked = getRevokedList();
  const idx = revoked.indexOf(token);
  if (idx >= 0) {
    revoked.splice(idx, 1);
    showToast("Token dipulihkan");
  } else {
    revoked.push(token);
    showToast("Token dicabut");
  }
  localStorage.setItem("tukang_revoked", JSON.stringify(revoked));
  renderHistory();
  renderStats();
}

function renderStats() {
  const history = getHistory();
  const revoked = getRevokedList();
  const now = Date.now();
  const total = history.length;
  const active = history.filter(h => now <= h.expiry && !revoked.includes(h.token)).length;
  const expiringSoon = history.filter(h => now <= h.expiry && !revoked.includes(h.token) && (h.expiry - now) <= EXPIRING_SOON_THRESHOLD_MS).length;
  const expired = history.filter(h => now > h.expiry).length;
  const revokedCount = history.filter(h => revoked.includes(h.token)).length;

  const el = (id) => document.getElementById(id);
  if (el("stat-total"))    el("stat-total").textContent    = total;
  if (el("stat-active"))   el("stat-active").textContent   = active;
  if (el("stat-expiring")) el("stat-expiring").textContent = expiringSoon;
  if (el("stat-expired"))  el("stat-expired").textContent  = expired;
  if (el("stat-revoked"))  el("stat-revoked").textContent  = revokedCount;
}

function renderHistory(searchQuery = "") {
  const list = $("#historyList");
  const history = getHistory();
  const revoked = getRevokedList();

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? history.filter(h =>
        (h.machineCode || "").toLowerCase().includes(q) ||
        (h.label || "").toLowerCase().includes(q)
      )
    : history;

  if (filtered.length === 0) {
    if (history.length === 0) {
      list.innerHTML = `<div class="history-empty"><span>📭</span><p>Belum ada riwayat generate token</p></div>`;
    } else {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "history-empty";
      emptyMsg.innerHTML = `<span>🔍</span>`;
      const p = document.createElement("p");
      p.textContent = `Tidak ada hasil untuk "${searchQuery}"`;
      emptyMsg.appendChild(p);
      list.innerHTML = "";
      list.appendChild(emptyMsg);
    }
    return;
  }

  const now = Date.now();
  list.innerHTML = filtered
    .map((h, i) => {
      const isRevoked = revoked.includes(h.token);
      const isExpired = now > h.expiry;
      const statusIcon = isRevoked ? "🚫 Revoked" : (isExpired ? "🔴 Expired" : "🟢 Active");
      const daysLeft = isExpired ? 0 : Math.ceil((h.expiry - now) / 86400000);
      const daysInfo = isExpired ? "Sudah expired" : `${daysLeft} hari tersisa`;
      const safeMachine = escapeHtml(h.machineCode || "");
      const safeDays    = parseInt(h.days) || 0;
      const safeDate    = new Date(h.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      const expiryColor = (h.expiry - now) <= EXPIRING_SOON_THRESHOLD_MS ? "var(--orange)" : "var(--text-muted)";
      return `
    <div class="history-item${isRevoked ? " is-revoked" : ""}">
      <div class="hi-info">
        ${h.label ? `<div class="hi-label"><span class="hi-label-icon">👤</span>${escapeHtml(h.label)}${isRevoked ? '<span class="hi-revoked-badge">Dicabut</span>' : ""}</div>` : (isRevoked ? '<div class="hi-label"><span class="hi-revoked-badge">Dicabut</span></div>' : "")}
        <div class="hi-machine">${safeMachine}</div>
        <div class="hi-meta">
          <span>📅 ${safeDate}</span>
          <span>⏱️ ${safeDays} hari</span>
          <span>${statusIcon}</span>
          ${!isExpired && !isRevoked ? `<span title="${escapeHtml(daysInfo)}" style="color:${expiryColor}">⏳ ${escapeHtml(daysInfo)}</span>` : ""}
        </div>
      </div>
      <div class="hi-actions">
        <button class="btn btn-secondary btn-sm" data-copy-idx="${i}" title="Copy Token">📋</button>
        <button class="btn btn-secondary btn-sm" data-revoke-idx="${i}" title="${isRevoked ? "Pulihkan Token" : "Cabut Token"}" style="${isRevoked ? "color:var(--green)" : "color:var(--text-muted)"}">${isRevoked ? "🔓" : "🔒"}</button>
      </div>
    </div>`;
    })
    .join("");

  // copy buttons
  list.querySelectorAll("[data-copy-idx]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = parseInt(btn.dataset.copyIdx);
      const h = filtered[idx];
      if (h) {
        try {
          await navigator.clipboard.writeText(h.token);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = h.token;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        showToast("Token disalin!");
      }
    });
  });

  // revoke buttons
  list.querySelectorAll("[data-revoke-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.revokeIdx);
      const h = filtered[idx];
      if (h) {
        const isRevoked = getRevokedList().includes(h.token);
        if (!isRevoked || confirm("Pulihkan token ini?")) {
          toggleRevoke(h.token);
        }
      }
    });
  });
}

function escapeHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ─── SEARCH ───────────────────────────────────────────────
const historySearch = document.getElementById("historySearch");
if (historySearch) {
  historySearch.addEventListener("input", () => {
    renderHistory(historySearch.value);
  });
}

// ─── EXPORT HISTORY CSV ───────────────────────────────────
function exportHistoryCSV() {
  const history = getHistory();
  const revoked = getRevokedList();
  if (history.length === 0) { showToast("Tidak ada data untuk diekspor"); return; }

  const headers = ["Label", "Machine Code", "Durasi (hari)", "Berlaku Hingga", "Dibuat", "Status"];
  const rows = history.map(h => {
    const isRevoked = revoked.includes(h.token);
    const status = isRevoked ? "Dicabut" : (Date.now() > h.expiry ? "Expired" : "Aktif");
    return [
      `"${(h.label || "").replace(/"/g, '""')}"`,
      h.machineCode,
      h.days,
      new Date(h.expiry).toLocaleDateString("id-ID"),
      new Date(h.createdAt).toLocaleDateString("id-ID"),
      status,
    ].join(",");
  });

  const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tukang_license_history_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✅ History berhasil diekspor!");
}

$("#exportHistory").addEventListener("click", exportHistoryCSV);

// ─── CLEAR HISTORY ────────────────────────────────────────
$("#clearHistory").addEventListener("click", () => {
  if (confirm("Hapus semua riwayat?")) {
    localStorage.removeItem("tukang_history");
    localStorage.removeItem("tukang_revoked");
    renderHistory();
    renderStats();
    showToast("Riwayat dihapus");
  }
});

// ═══════════════════════════════════════════════════════════
// BULK GENERATE FROM CSV
// ═══════════════════════════════════════════════════════════

let bulkRows = [];

const bulkDownloadTemplate = document.getElementById("bulkDownloadTemplate");
const bulkUploadBtn = document.getElementById("bulkUploadBtn");
const bulkFileInput = document.getElementById("bulkFileInput");
const bulkStatus = document.getElementById("bulkStatus");
const bulkGenerateBtn = document.getElementById("bulkGenerateBtn");

if (bulkDownloadTemplate) {
  bulkDownloadTemplate.addEventListener("click", () => {
    const csv = "machine_code,label,days\nAABBCCDDEEFF00112233445566778899,User A,365\n11223344556677889900AABBCCDDEEFF,User B,180\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_bulk_generate.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

if (bulkUploadBtn) {
  bulkUploadBtn.addEventListener("click", () => bulkFileInput && bulkFileInput.click());
}

if (bulkFileInput) {
  bulkFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseBulkCSV(ev.target.result, file.name);
    reader.readAsText(file);
    bulkFileInput.value = "";
  });
}

function parseBulkCSV(text, filename) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) {
    showBulkStatus("❌ CSV harus memiliki header dan minimal 1 baris data.", "red");
    return;
  }
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const reqHeaders = ["machine_code", "label", "days"];
  const missing = reqHeaders.filter(h => !headers.includes(h));
  if (missing.length > 0) {
    showBulkStatus(`❌ Kolom tidak ditemukan: ${missing.join(", ")}`, "red");
    return;
  }

  const rows = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(sep).map(v => v.trim().replace(/^["']|["']$/g, ""));
    if (vals.every(v => !v)) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });
    const mc = (obj.machine_code || "").toUpperCase().replace(/[^A-F0-9]/g, "");
    const days = parseInt(obj.days);
    if (mc.length !== MACHINE_CODE_LENGTH) { errors.push(`Baris ${i + 1}: machine code tidak valid (${mc.length} karakter)`); continue; }
    if (!days || days < 1 || days > MAX_LICENSE_DAYS) { errors.push(`Baris ${i + 1}: durasi tidak valid (harus 1-${MAX_LICENSE_DAYS})`); continue; }
    rows.push({ machine_code: mc, label: obj.label, days });
  }

  bulkRows = rows;
  const mainText = `✅ ${escapeHtml(filename)} — ${rows.length} baris valid${errors.length > 0 ? `, ${errors.length} dilewati` : ""}`;
  const errorText = errors.length > 0 ? errors.slice(0, 3).map(escapeHtml).join("\n") : "";
  showBulkStatus(mainText, rows.length > 0 ? "green" : "red", errorText);
  if (bulkGenerateBtn) bulkGenerateBtn.style.display = rows.length > 0 ? "block" : "none";
}

function showBulkStatus(msg, color, errorDetail) {
  if (!bulkStatus) return;
  bulkStatus.style.display = "block";
  bulkStatus.style.color = color === "red" ? "var(--red)" : color === "green" ? "var(--green)" : "var(--text-dim)";
  // Use textContent to avoid XSS; show error detail separately as plain text
  bulkStatus.textContent = msg;
  if (errorDetail) {
    const detail = document.createElement("div");
    detail.style.cssText = "color:var(--red);font-size:11px;margin-top:4px;white-space:pre-wrap;";
    detail.textContent = errorDetail;
    bulkStatus.appendChild(detail);
  }
}

if (bulkGenerateBtn) {
  bulkGenerateBtn.addEventListener("click", async () => {
    if (bulkRows.length === 0) return;
    const secret = $("#secretKey").value.trim();
    if (!secret) { showToast("Secret key belum diisi!"); return; }

    const btnContent = bulkGenerateBtn.querySelector(".btn-content");
    const btnLoader = bulkGenerateBtn.querySelector(".btn-loader");
    btnContent.classList.add("hidden");
    btnLoader.classList.remove("hidden");
    bulkGenerateBtn.disabled = true;

    try {
      const results = [];
      for (const row of bulkRows) {
        const token = await generateToken(row.machine_code, row.days, secret);
        const expiry = Date.now() + row.days * 86400000;
        results.push({ machine_code: row.machine_code, label: row.label, days: row.days, token, expiry });
        saveHistory({ machineCode: row.machine_code, label: row.label, days: row.days, token, expiry, createdAt: Date.now() });
      }

      // Download results CSV
      const headers = ["Label", "Machine Code", "Durasi (hari)", "Berlaku Hingga", "Token"];
      const rows = results.map(r => [
        `"${(r.label || "").replace(/"/g, '""')}"`,
        r.machine_code,
        r.days,
        new Date(r.expiry).toLocaleDateString("id-ID"),
        `"${r.token}"`,
      ].join(","));
      const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk_tokens_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      showBulkStatus(`✅ ${results.length} token berhasil digenerate dan disimpan ke history. File CSV terdownload!`, "green");
      bulkRows = [];
      if (bulkGenerateBtn) bulkGenerateBtn.style.display = "none";
      showToast(`✅ ${results.length} token berhasil digenerate!`);
    } catch (err) {
      showBulkStatus("❌ Error: " + escapeHtml(err.message), "red");
      showToast("Gagal generate bulk token", "error");
    } finally {
      btnContent.classList.remove("hidden");
      btnLoader.classList.add("hidden");
      bulkGenerateBtn.disabled = false;
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────
renderHistory();
renderStats();