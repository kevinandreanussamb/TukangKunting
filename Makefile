# ==============================================================================
# Makefile — TukangKunting Commerce Edition Builder
#
# Obfuscates source files from tukangkunting_private_kevin/ → dist_commerce/
#
# Usage:
#   make           → install deps + build obfuscated extension
#   make build     → build only (assumes javascript-obfuscator is installed)
#   make install   → install javascript-obfuscator locally
#   make clean     → remove output directory
# ==============================================================================

SRC := tukangkunting_private_kevin
OUT := dist_commerce

OBFUSCATOR     := npx javascript-obfuscator
OBFUSCATOR_NPM := javascript-obfuscator

# Obfuscation flags — safe for Chrome Extension Manifest V3 (no eval / CSP issues)
OBFUSCATOR_OPTS := \
  --compact true \
  --string-array true \
  --string-array-rotate true \
  --string-array-shuffle true \
  --string-array-encoding base64 \
  --identifier-names-generator hexadecimal \
  --rename-globals false \
  --self-defending false \
  --debug-protection false \
  --dead-code-injection false

# File mapping: <source_name> → <obfuscated_name>
# Based on tukangkunting_private_kevin/file_obfuscated_guide.MD
MOD_dokumen_saya_bold                    := m0d_a3f8c1.js
MOD_dokumen_saya_all                     := m0d_b7d2e4.js
MOD_faktur_pajak_keluaran                := m0d_c8ad8s.js
MOD_faktur_pajak_masukan                 := m0d_c9a1f6.js
MOD_faktur_pajak_retur_masukan_keluaran  := m0d_d4b5e8.js
MOD_bppu_bpnr                            := m0d_e2c7a0.js
MOD_pengkreditan_faktur                  := m0d_f5e3b2.js
MOD_pembatalan_faktur                    := m0d_g8d4c7.js

# Alternate source names used in older private builds for e-Faktur modules
MOD_ppn      := $(MOD_faktur_pajak_keluaran)
MOD_ppn_retur := $(MOD_faktur_pajak_retur_masukan_keluaran)

.PHONY: all build install clean

# ------------------------------------------------------------------------------
all: install build

# ------------------------------------------------------------------------------
install:
	@echo "==> Checking javascript-obfuscator..."
	@if [ ! -f "node_modules/.bin/javascript-obfuscator" ]; then \
	  echo "==> Installing javascript-obfuscator (local dev dependency)..."; \
	  npm install --save-dev javascript-obfuscator; \
	else \
	  echo "    javascript-obfuscator already available."; \
	fi

# ------------------------------------------------------------------------------
build: $(OUT)/background.js
	@echo ""
	@echo "✓ Build selesai! Folder output: $(OUT)/"
	@echo "  Load sebagai unpacked extension di Chrome:"
	@echo "  chrome://extensions → Load unpacked → pilih folder $(OUT)/"

# Set up output directory and copy static assets
$(OUT):
	@echo "==> Membuat output directory: $(OUT)/"
	@mkdir -p $(OUT)/libs
	@echo "==> Menyalin static assets..."
	@cp $(SRC)/manifest.json $(OUT)/manifest.json
	@cp $(SRC)/icon.png      $(OUT)/icon.png
	@cp $(SRC)/libs/jquery-3.7.0.min.js $(OUT)/libs/jquery-3.7.0.min.js
	@cp $(SRC)/content.js    $(OUT)/content.js

# Build background.js: rename module references first, then obfuscate
$(OUT)/background.js: $(SRC)/background.js | $(OUT)
	@echo "==> Obfuscating background.js (pre-processing file references)..."
	@sed \
	  -e 's|"dokumen_saya_bold\.js"|"$(MOD_dokumen_saya_bold)"|g' \
	  -e 's|"dokumen_saya_all\.js"|"$(MOD_dokumen_saya_all)"|g' \
	  -e 's|"bppu_bpnr\.js"|"$(MOD_bppu_bpnr)"|g' \
	  -e 's|"pengkreditan_faktur\.js"|"$(MOD_pengkreditan_faktur)"|g' \
	  -e 's|"pembatalan_faktur\.js"|"$(MOD_pembatalan_faktur)"|g' \
	  -e 's|"ppn\.js"|"$(MOD_ppn)"|g' \
	  -e 's|"ppn_retur\.js"|"$(MOD_ppn_retur)"|g' \
	  -e 's|"faktur_pajak_keluaran\.js"|"$(MOD_faktur_pajak_keluaran)"|g' \
	  -e 's|"faktur_pajak_masukan\.js"|"$(MOD_faktur_pajak_masukan)"|g' \
	  -e 's|"faktur_pajak_retur_masukan_keluaran\.js"|"$(MOD_faktur_pajak_retur_masukan_keluaran)"|g' \
	  $(SRC)/background.js > /tmp/_tk_background_renamed.js
	@$(OBFUSCATOR) /tmp/_tk_background_renamed.js \
	  --output $(OUT)/background.js \
	  $(OBFUSCATOR_OPTS)
	@rm -f /tmp/_tk_background_renamed.js
	@echo "    ✓ background.js"
	@$(MAKE) --no-print-directory _modules

# Obfuscate all module files
.PHONY: _modules
_modules:
	@echo "==> Obfuscating module files..."
	@$(MAKE) --no-print-directory \
	  $(OUT)/$(MOD_dokumen_saya_bold) \
	  $(OUT)/$(MOD_dokumen_saya_all) \
	  $(OUT)/$(MOD_bppu_bpnr) \
	  $(OUT)/$(MOD_pengkreditan_faktur) \
	  $(OUT)/$(MOD_pembatalan_faktur)
	@$(MAKE) --no-print-directory _modules_optional

# Required modules
$(OUT)/$(MOD_dokumen_saya_bold): $(SRC)/dokumen_saya_bold.js | $(OUT)
	@$(OBFUSCATOR) $< --output $@ $(OBFUSCATOR_OPTS)
	@echo "    ✓ dokumen_saya_bold.js → $(notdir $@)"

$(OUT)/$(MOD_dokumen_saya_all): $(SRC)/dokumen_saya_all.js | $(OUT)
	@$(OBFUSCATOR) $< --output $@ $(OBFUSCATOR_OPTS)
	@echo "    ✓ dokumen_saya_all.js → $(notdir $@)"

$(OUT)/$(MOD_bppu_bpnr): $(SRC)/bppu_bpnr.js | $(OUT)
	@$(OBFUSCATOR) $< --output $@ $(OBFUSCATOR_OPTS)
	@echo "    ✓ bppu_bpnr.js → $(notdir $@)"

$(OUT)/$(MOD_pengkreditan_faktur): $(SRC)/pengkreditan_faktur.js | $(OUT)
	@$(OBFUSCATOR) $< --output $@ $(OBFUSCATOR_OPTS)
	@echo "    ✓ pengkreditan_faktur.js → $(notdir $@)"

$(OUT)/$(MOD_pembatalan_faktur): $(SRC)/pembatalan_faktur.js | $(OUT)
	@$(OBFUSCATOR) $< --output $@ $(OBFUSCATOR_OPTS)
	@echo "    ✓ pembatalan_faktur.js → $(notdir $@)"

# Optional modules (may not exist in every branch of the source)
.PHONY: _modules_optional
_modules_optional:
	@if [ -f "$(SRC)/faktur_pajak_keluaran.js" ]; then \
	  $(OBFUSCATOR) $(SRC)/faktur_pajak_keluaran.js \
	    --output $(OUT)/$(MOD_faktur_pajak_keluaran) $(OBFUSCATOR_OPTS) && \
	  echo "    ✓ faktur_pajak_keluaran.js → $(MOD_faktur_pajak_keluaran)"; \
	elif [ -f "$(SRC)/ppn.js" ]; then \
	  $(OBFUSCATOR) $(SRC)/ppn.js \
	    --output $(OUT)/$(MOD_faktur_pajak_keluaran) $(OBFUSCATOR_OPTS) && \
	  echo "    ✓ ppn.js → $(MOD_faktur_pajak_keluaran)"; \
	else \
	  echo "    ! Skipping $(MOD_faktur_pajak_keluaran) (source not found)"; \
	fi
	@if [ -f "$(SRC)/faktur_pajak_masukan.js" ]; then \
	  $(OBFUSCATOR) $(SRC)/faktur_pajak_masukan.js \
	    --output $(OUT)/$(MOD_faktur_pajak_masukan) $(OBFUSCATOR_OPTS) && \
	  echo "    ✓ faktur_pajak_masukan.js → $(MOD_faktur_pajak_masukan)"; \
	else \
	  echo "    ! Skipping $(MOD_faktur_pajak_masukan) (source not found)"; \
	fi
	@if [ -f "$(SRC)/faktur_pajak_retur_masukan_keluaran.js" ]; then \
	  $(OBFUSCATOR) $(SRC)/faktur_pajak_retur_masukan_keluaran.js \
	    --output $(OUT)/$(MOD_faktur_pajak_retur_masukan_keluaran) $(OBFUSCATOR_OPTS) && \
	  echo "    ✓ faktur_pajak_retur_masukan_keluaran.js → $(MOD_faktur_pajak_retur_masukan_keluaran)"; \
	elif [ -f "$(SRC)/ppn_retur.js" ]; then \
	  $(OBFUSCATOR) $(SRC)/ppn_retur.js \
	    --output $(OUT)/$(MOD_faktur_pajak_retur_masukan_keluaran) $(OBFUSCATOR_OPTS) && \
	  echo "    ✓ ppn_retur.js → $(MOD_faktur_pajak_retur_masukan_keluaran)"; \
	else \
	  echo "    ! Skipping $(MOD_faktur_pajak_retur_masukan_keluaran) (source not found)"; \
	fi

# ------------------------------------------------------------------------------
clean:
	@echo "==> Menghapus $(OUT)/..."
	@rm -rf $(OUT)
	@echo "✓ Clean selesai."
