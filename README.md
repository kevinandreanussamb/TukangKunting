# TukangKunting

Kumpulan Chrome Extension untuk otomasi e-Faktur Pajak, dilengkapi sistem lisensi berbasis machine code.

---

## Struktur Repositori

```
TukangKunting/
├── tukangkunting_commerce_edition/   # Extension utama (versi Commerce)
├── tukangkunting_private_kevin/      # Extension versi privat
└── tukangkunting_code_generator/     # Tool generate & verifikasi lisensi
```

---

## tukangkunting_commerce_edition

Extension Chrome untuk otomasi berbagai operasi di aplikasi e-Faktur Pajak.

### Fitur

| Modul | Keterangan |
|---|---|
| `faktur_pajak_keluaran` | Otomasi pengisian faktur pajak keluaran |
| `faktur_pajak_masukan` | Otomasi pengisian faktur pajak masukan |
| `faktur_pajak_retur_masukan_keluaran` | Proses retur faktur masukan & keluaran |
| `pembatalan_faktur` | Pembatalan faktur pajak |
| `pengkreditan_faktur` | Pengkreditan faktur pajak |
| `bppu_bpnr` | Operasi BPPU dan BPNR |
| `dokumen_saya_all` | Pengelolaan semua dokumen |
| `dokumen_saya_bold` | Highlight / bold dokumen tertentu |

### Keamanan & Obfuskasi

File JS yang didistribusikan telah melalui proses obfuskasi dengan teknik:
- **Anti-debug** — `setInterval` + debugger trap untuk mendeteksi DevTools
- **Base64 string table** — String sensitif di-encode via `atob()`
- **Hex-escaped strings** — Selector dan teks UI di-encode ke `\x` hex escape
- **Minified variable names** — Semua fungsi & variabel di-rename
- **Inlined logic** — Callback chain di-flatten agar sulit di-trace

Lihat [`file_obfuscated_guide.MD`](tukangkunting_commerce_edition/file_obfuscated_guide.MD) untuk pemetaan nama file asli ke nama file obfuscated.

### Instalasi

1. Buka Chrome → `chrome://extensions/`
2. Aktifkan **Developer mode**
3. Klik **Load unpacked** → pilih folder `tukangkunting_commerce_edition`

---

## tukangkunting_private_kevin

Versi privat dari extension dengan konfigurasi yang sama seperti Commerce Edition.

### Instalasi

1. Buka Chrome → `chrome://extensions/`
2. Aktifkan **Developer mode**
3. Klik **Load unpacked** → pilih folder `tukangkunting_private_kevin`

---

## tukangkunting_code_generator

Extension Chrome khusus **owner/admin** untuk mengelola lisensi pengguna.

### Fitur

- **Generate Token** — Buat token lisensi berdasarkan machine code user dan durasi yang ditentukan (7 hari, 30 hari, 90 hari, 6 bulan, 1 tahun, atau custom)
- **Verify Token** — Validasi token: cek kesesuaian machine code, tanda tangan, dan masa berlaku
- **History** — Riwayat semua token yang pernah di-generate

### Enkripsi

Token menggunakan **AES-256-GCM** dengan secret key yang dikonfigurasi di extension. Pastikan secret key di generator **sama persis** dengan secret key yang tertanam di extension pengguna.

### Instalasi

1. Buka Chrome → `chrome://extensions/`
2. Aktifkan **Developer mode**
3. Klik **Load unpacked** → pilih folder `tukangkunting_code_generator`

### Cara Pakai

1. Minta **machine code** (32 karakter hex) dari pengguna melalui extension mereka
2. Buka extension **Tukang License**
3. Di tab **Generate**: masukkan machine code, atur durasi, klik *Generate Token*
4. Salin token dan berikan ke pengguna
5. Pengguna memasukkan token di extension mereka untuk mengaktifkan lisensi

---

## Persyaratan

- Google Chrome (atau browser berbasis Chromium)
- Manifest V3

---

## Lisensi

Hak cipta © Kevin Andreanussamb. Seluruh kode bersifat proprietary dan tidak untuk didistribusikan ulang tanpa izin.


---

## Automasi Obfuscation

Untuk generate ulang folder `tukangkunting_commerce_edition` dari source `tukangkunting_before_obfuscate`:

1. Install dependency:
   - `npm install`
2. Jalankan obfuscation:
   - `npm run obfuscate`

Script akan:
- Obfuscate semua file JS (kecuali `libs/*.js`)
- Rename file modul ke format `m0d_*.js` (mengikuti mapping commerce edition yang ada)
- Update referensi modul di `background.js`
- Generate `file_obfuscated_guide.MD` otomatis

Opsional custom path via environment variable:
- `OBFUSCATE_SOURCE=/path/source OBFUSCATE_OUTPUT=/path/output npm run obfuscate`
