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
// HISTORY (localStorage — karena ini bukan extension)
// ═══════════════════════════════════════════════════════════

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("tukang_history") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > 50) history.length = 50;
  localStorage.setItem("tukang_history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = $("#historyList");
  const history = getHistory();

  if (history.length === 0) {
    list.innerHTML = `
      <div class="history-empty">
        <span>📭</span>
        <p>Belum ada riwayat generate token</p>
      </div>`;
    return;
  }

  list.innerHTML = history
    .map(
      (h, i) => `
    <div class="history-item">
      <div class="hi-info">
        ${h.label ? `<div class="hi-label"><span class="hi-label-icon">👤</span>${h.label}</div>` : ""}
        <div class="hi-machine">${h.machineCode}</div>
        <div class="hi-meta">
          <span>📅 ${new Date(h.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}</span>
          <span>⏱️ ${h.days} hari</span>
          <span>${Date.now() > h.expiry ? "🔴 Expired" : "🟢 Active"}</span>
        </div>
      </div>
      <div class="hi-actions">
        <button class="btn btn-secondary btn-sm" data-copy-idx="${i}" title="Copy Token">📋</button>
      </div>
    </div>`
    )
    .join("");

  list.querySelectorAll("[data-copy-idx]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = parseInt(btn.dataset.copyIdx);
      const h = getHistory()[idx];
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
}

// ─── CLEAR HISTORY ────────────────────────────────────────
$("#clearHistory").addEventListener("click", () => {
  if (confirm("Hapus semua riwayat?")) {
    localStorage.removeItem("tukang_history");
    renderHistory();
    showToast("Riwayat dihapus");
  }
});

// ─── INIT ─────────────────────────────────────────────────
renderHistory();