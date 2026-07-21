(function () {
  const {
    CHANGELOG_VERSION,
    CHANGELOG_ITEMS,
    MODULES,
    MODULE_OPTIONS,
    DELAY_SETTINGS,
    getModuleByLabel,
    CHANGELOG_TITLE,
    CHANGELOG_DATE,
  } = self.TK_CONSTANTS;

  const {
    executeScript,
    setPageVars,
    injectModule,
  } = self.TK_INJECT;

  const {
    ensureActivation,
    formatExpiry,
    daysLeft,
  } = self.TK_LICENSE;

    function getExtensionVersionInfo() {
        const manifest = chrome.runtime.getManifest();

        return {
            name: manifest.name || "Tukangkunting",
            version: manifest.version || "",
            versionName: manifest.version_name || manifest.version || "",
        };
    }

  async function getPrefs() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [
          "tukang_last_module",
          "tukang_onboarded",
          "tukang_last_version",
        ],
        resolve
      );
    });
  }

  async function showMainMenu(tab, context) {
    const results = await executeScript(tab.id, {
        args: [
            context.expiryStr,
            context.daysRemaining,
            context.lastModule,
            context.showOnboarding,
            context.showChangelog,
            CHANGELOG_TITLE,
            CHANGELOG_VERSION,
            CHANGELOG_DATE,
            CHANGELOG_ITEMS,
            MODULE_OPTIONS,
            DELAY_SETTINGS,
            context.versionInfo,
    ],
      func: (
        expiryStr,
        daysRemaining,
        lastModule,
        showOnboarding,
        showChangelog,
        changelogTitle,
        changelogVersion,
        changelogDate,
        changelogItems,
        moduleOptions,
        delaySettings,
        versionInfo
      ) => {
        if (document.getElementById("doc-select-modal")) {
          return null;
        }

        return new Promise((resolve) => {
          const style = document.createElement("style");
          style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

            #tukang-overlay{
              position:fixed;inset:0;background:rgba(8,10,18,.72);
              backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
              z-index:9998;
            }

            #doc-select-modal{
              position:fixed;top:50%;left:50%;
              transform:translate(-50%,-50%);
              width:min(430px,calc(100vw - 24px));
              max-height:calc(100vh - 24px);
              background:#0f1117;border:1px solid rgba(255,255,255,.08);
              border-radius:18px;
              box-shadow:0 24px 64px rgba(0,0,0,.6);
              z-index:9999;font-family:'DM Sans',system-ui,sans-serif;
              overflow:hidden;color:#e2e8f0;
            }

            .tk-header{
              display:flex;align-items:center;justify-content:space-between;
              padding:20px 22px 16px;
              border-bottom:1px solid rgba(255,255,255,.06);
            }

            .tk-brand{display:flex;align-items:center;gap:10px}
            .tk-logo{
              width:34px;height:34px;border-radius:10px;
              display:flex;align-items:center;justify-content:center;
              background:linear-gradient(135deg,#3882f6,#2563eb);
              box-shadow:0 4px 14px rgba(56,130,246,.32);
            }

            .tk-title{font-size:14px;font-weight:700;color:#f8fafc}
            .tk-subtitle{font-size:11px;color:#64748b;margin-top:2px}

            .tk-actions{display:flex;align-items:center;gap:4px}
            .tk-icon-btn{
              width:30px;height:30px;border:none;background:transparent;
              border-radius:8px;color:#64748b;cursor:pointer;font-size:14px;
            }
            .tk-icon-btn:hover{background:rgba(255,255,255,.07);color:#cbd5e1}
            .tk-icon-btn.danger:hover{background:rgba(239,68,68,.12);color:#f87171}

            .tk-body{padding:20px 22px 22px}

            .tk-label{
              font-size:11px;font-weight:700;color:#64748b;
              letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;
            }

            .tk-select{
              width:100%;padding:11px 14px;padding-right:36px;
              border-radius:10px;border:1px solid rgba(255,255,255,.09);
              background:rgba(255,255,255,.04);color:#e2e8f0;
              font-family:'DM Sans',system-ui,sans-serif;font-size:13.5px;
              outline:none;cursor:pointer;
            }

            .tk-select option{background:#1a1d27;color:#e2e8f0}

            .tk-divider{height:1px;background:rgba(255,255,255,.05);margin:18px 0}

            .tk-submit{
              width:100%;padding:12px 18px;border:none;border-radius:10px;
              color:#fff;background:linear-gradient(135deg,#3882f6,#2563eb);
              font-family:'DM Sans',system-ui,sans-serif;font-size:13.5px;
              font-weight:700;cursor:pointer;
              box-shadow:0 4px 14px rgba(56,130,246,.28);
            }

            .tk-submit:hover{opacity:.92}

            .tk-footer{
              padding:14px 22px;border-top:1px solid rgba(255,255,255,.05);
            }

            .tk-license{
              display:flex;align-items:center;justify-content:space-between;gap:8px;
            }

            .tk-version-card {
                background: rgba(255,255,255,.035);
                border: 1px solid rgba(255,255,255,.07);
                border-radius: 12px;
                padding: 12px 14px;
                margin-bottom: 14px;
                }

                .tk-version-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                }

                .tk-version-title {
                font-size: 12px;
                font-weight: 700;
                color: #e2e8f0;
                }

                .tk-version-badge {
                font-family: 'DM Mono', monospace;
                font-size: 10px;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 999px;
                background: rgba(56,130,246,.12);
                color: #93c5fd;
                border: 1px solid rgba(56,130,246,.25);
                white-space: nowrap;
                }

                .tk-version-meta {
                margin-top: 6px;
                font-size: 11px;
                color: #64748b;
                line-height: 1.5;
                }

                .tk-changelog-toggle {
                margin-top: 10px;
                padding: 0;
                border: none;
                background: transparent;
                color: #3882f6;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                font-family: 'DM Sans', system-ui, sans-serif;
                }

                .tk-changelog-list {
                display: none;
                margin-top: 10px;
                padding-left: 16px;
                color: #94a3b8;
                font-size: 11.5px;
                line-height: 1.65;
                }

                .tk-changelog-list.visible {
                display: block;
                }

                .tk-changelog-list li {
                margin-bottom: 3px;
                }

            .tk-license-left{display:flex;align-items:center;gap:8px}
            .tk-dot{width:6px;height:6px;border-radius:99px}
            .tk-dot.green{background:#22c55e}
            .tk-dot.orange{background:#f59e0b}
            .tk-dot.red{background:#ef4444}
            .tk-license-text{font-size:11px;color:#64748b;font-family:'DM Mono',monospace}
            .tk-badge{
              font-size:10px;padding:3px 8px;border-radius:6px;
              font-family:'DM Mono',monospace;font-weight:700;
            }
            .tk-badge.green{background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
            .tk-badge.orange{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.2)}
            .tk-badge.red{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2)}

            .tk-banner{
              border-radius:10px;padding:12px 14px;margin-bottom:14px;
              font-size:12px;line-height:1.6;
            }
            .tk-banner.info{
              background:rgba(56,130,246,.08);border:1px solid rgba(56,130,246,.2);
              color:#93c5fd;
            }
            .tk-banner.warn{
              background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.22);
              color:#f59e0b;
            }

            #tk-settings-overlay,
            #tk-log-overlay{
              position:fixed;inset:0;background:rgba(0,0,0,.58);
              backdrop-filter:blur(4px);z-index:10000;
            }

            #tk-settings-modal,
            #tk-log-modal{
              position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
              width:min(430px,calc(100vw - 24px));
              max-height:80vh;background:#0f1117;border:1px solid rgba(255,255,255,.08);
              border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.6);
              z-index:10001;color:#e2e8f0;font-family:'DM Sans',system-ui,sans-serif;
              overflow:hidden;display:flex;flex-direction:column;
            }

            .tk-modal-header{
              display:flex;align-items:center;justify-content:space-between;
              padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);
            }

            .tk-modal-title{font-size:14px;font-weight:700;color:#f8fafc}
            .tk-modal-body{padding:18px 20px;overflow:auto}
            .tk-field{margin-bottom:14px}
            .tk-field-label{
              font-size:11px;font-weight:700;color:#64748b;
              letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;
            }
            .tk-input{
              width:100%;box-sizing:border-box;padding:9px 13px;
              background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);
              border-radius:8px;color:#e2e8f0;font-family:'DM Mono',monospace;
              outline:none;
            }
            .tk-modal-footer{
              padding:14px 20px;border-top:1px solid rgba(255,255,255,.06);
              display:flex;justify-content:flex-end;gap:8px;
            }
            .tk-btn{
              padding:9px 16px;border-radius:8px;border:1px solid rgba(255,255,255,.09);
              background:rgba(255,255,255,.04);color:#cbd5e1;
              font-family:'DM Sans',system-ui,sans-serif;font-size:13px;font-weight:600;cursor:pointer;
            }
            .tk-btn.primary{border:none;background:linear-gradient(135deg,#3882f6,#2563eb);color:#fff}
            .tk-log-item{
              padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.06);
              background:rgba(255,255,255,.03);font-size:11px;margin-bottom:8px;
              display:flex;align-items:center;justify-content:space-between;gap:12px;
            }
            .tk-log-module{font-weight:700;color:#e2e8f0}
            .tk-log-time{font-size:10px;color:#64748b;margin-top:2px}
          `;

          document.head.appendChild(style);

          const overlay = document.createElement("div");
          overlay.id = "tukang-overlay";

          const modal = document.createElement("div");
          modal.id = "doc-select-modal";

          const header = document.createElement("div");
          header.className = "tk-header";

          const brand = document.createElement("div");
          brand.className = "tk-brand";

          const logo = document.createElement("div");
          logo.className = "tk-logo";
          logo.textContent = "📄";

          const brandText = document.createElement("div");

          const title = document.createElement("div");
          title.className = "tk-title";
          title.textContent = "Tukang Dokumen";

          const subtitle = document.createElement("div");
          subtitle.className = "tk-subtitle";
          subtitle.textContent = "Document Automation Tool";

          brandText.append(title, subtitle);
          brand.append(logo, brandText);

          const actions = document.createElement("div");
          actions.className = "tk-actions";

          const logBtn = document.createElement("button");
          logBtn.className = "tk-icon-btn";
          logBtn.title = "Activity Log";
          logBtn.textContent = "◷";

          const settingsBtn = document.createElement("button");
          settingsBtn.className = "tk-icon-btn";
          settingsBtn.title = "Settings";
          settingsBtn.textContent = "⚙";

          const closeBtn = document.createElement("button");
          closeBtn.className = "tk-icon-btn danger";
          closeBtn.title = "Close";
          closeBtn.textContent = "✕";
          closeBtn.onclick = () => {
            modal.remove();
            overlay.remove();
            resolve(null);
          };

          actions.append(logBtn, settingsBtn, closeBtn);
          header.append(brand, actions);

          const body = document.createElement("div");
          body.className = "tk-body";

          if (showChangelog && changelogItems?.length) {
            const banner = document.createElement("div");
            banner.className = "tk-banner info";
            banner.innerHTML = `
                <strong>✨ ${changelogTitle || "Yang Baru"}</strong>
                <div style="font-size:11px;color:#93c5fd;margin-top:2px;">
                Versi ${changelogVersion || versionInfo?.version || ""} • ${changelogDate || ""}
                </div>
                <div style="margin-top:8px;">
                ${changelogItems.slice(0, 3).map((x) => `• ${x}`).join("<br>")}
                </div>
            `;
            body.appendChild(banner);
            }

          if (daysRemaining <= 7) {
            const warn = document.createElement("div");
            warn.className = "tk-banner warn";
            warn.innerHTML = `⚠️ Lisensi Anda berakhir dalam <strong>${daysRemaining} hari</strong>.`;
            body.appendChild(warn);
          }

          const label = document.createElement("div");
          label.className = "tk-label";
          label.textContent = "Jenis Dokumen";

          const versionCard = document.createElement("div");
            versionCard.className = "tk-version-card";

            const versionDisplay =
            versionInfo?.versionName ||
            versionInfo?.version ||
            changelogVersion ||
            "unknown";

            versionCard.innerHTML = `
            <div class="tk-version-top">
                <div>
                <div class="tk-version-title">${versionInfo?.name || "Tukangkunting"}</div>
                <div class="tk-version-meta">
                    ${changelogTitle || "Changelog"} • ${changelogDate || ""}
                </div>
                </div>
                <span class="tk-version-badge">v${versionDisplay}</span>
            </div>

            <button class="tk-changelog-toggle" id="tkChangelogToggle" type="button">
                Lihat Changelog
            </button>

            <ul class="tk-changelog-list" id="tkChangelogList">
                ${(changelogItems || []).map((item) => `<li>${item}</li>`).join("")}
            </ul>
            `;

            body.appendChild(versionCard);

          const select = document.createElement("select");
          select.className = "tk-select";

          moduleOptions.forEach((item) => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
          });

          if (lastModule && moduleOptions.includes(lastModule)) {
            select.value = lastModule;
          }

          const divider = document.createElement("div");
          divider.className = "tk-divider";

          const submit = document.createElement("button");
          submit.className = "tk-submit";
          submit.textContent = "Jalankan Proses";
          submit.onclick = () => {
            const value = select.value;
            chrome.storage.local.set({ tukang_last_module: value });
            modal.remove();
            overlay.remove();
            resolve(value);
          };

          body.append(label, select, divider, submit);

          const footer = document.createElement("div");
          footer.className = "tk-footer";

          let color = "green";
          if (daysRemaining <= 3) color = "red";
          else if (daysRemaining <= 7) color = "orange";

          const license = document.createElement("div");
          license.className = "tk-license";
          license.innerHTML = `
            <div class="tk-license-left">
              <span class="tk-dot ${color}"></span>
              <span class="tk-license-text">s/d ${expiryStr}</span>
            </div>
            <span class="tk-badge ${color}">${daysRemaining} hari</span>
          `;

          footer.appendChild(license);
          modal.append(header, body, footer);
          document.body.append(overlay, modal);

            const toggle = document.getElementById("tkChangelogToggle");
            const list = document.getElementById("tkChangelogList");

            if (toggle && list) {
            toggle.onclick = () => {
                const visible = list.classList.toggle("visible");
                toggle.textContent = visible ? "Sembunyikan Changelog" : "Lihat Changelog";
            };
            }

          logBtn.onclick = () => {
            if (document.getElementById("tk-log-overlay")) return;

            chrome.runtime.sendMessage({ action: "getActivityLog" }, (res) => {
              const log = res?.log || [];

              const logOverlay = document.createElement("div");
              logOverlay.id = "tk-log-overlay";

              const logModal = document.createElement("div");
              logModal.id = "tk-log-modal";

              const logHeader = document.createElement("div");
              logHeader.className = "tk-modal-header";

              const logTitle = document.createElement("div");
              logTitle.className = "tk-modal-title";
              logTitle.textContent = "📊 Activity Log";

              const logClose = document.createElement("button");
              logClose.className = "tk-icon-btn danger";
              logClose.textContent = "✕";
              logClose.onclick = () => {
                logOverlay.remove();
                logModal.remove();
              };

              logHeader.append(logTitle, logClose);

              const logBody = document.createElement("div");
              logBody.className = "tk-modal-body";

              if (!log.length) {
                const empty = document.createElement("div");
                empty.style.cssText = "text-align:center;color:#64748b;font-size:12px;padding:24px 0;";
                empty.textContent = "Belum ada aktivitas.";
                logBody.appendChild(empty);
              } else {
                log.slice(0, 30).forEach((entry) => {
                  const item = document.createElement("div");
                  item.className = "tk-log-item";

                  const left = document.createElement("div");
                  left.innerHTML = `
                    <div class="tk-log-module">${entry.module || "–"}</div>
                    <div class="tk-log-time">${new Date(entry.timestamp).toLocaleString("id-ID")}</div>
                  `;

                  const right = document.createElement("div");
                  right.style.cssText = "font-family:'DM Mono',monospace;font-size:11px;";
                  right.innerHTML = `
                    <span style="color:#22c55e">${entry.success || 0}✓</span>
                    ${entry.failed > 0 ? `<span style="color:#f87171;margin-left:6px;">${entry.failed}✗</span>` : ""}
                  `;

                  item.append(left, right);
                  logBody.appendChild(item);
                });
              }

              logModal.append(logHeader, logBody);
              document.body.append(logOverlay, logModal);
            });
          };

          settingsBtn.onclick = () => {
            if (document.getElementById("tk-settings-overlay")) return;

            const settingsOverlay = document.createElement("div");
            settingsOverlay.id = "tk-settings-overlay";

            const settingsModal = document.createElement("div");
            settingsModal.id = "tk-settings-modal";

            const settingsHeader = document.createElement("div");
            settingsHeader.className = "tk-modal-header";

            const settingsTitle = document.createElement("div");
            settingsTitle.className = "tk-modal-title";
            settingsTitle.textContent = "⚙️ Pengaturan";

            const settingsClose = document.createElement("button");
            settingsClose.className = "tk-icon-btn danger";
            settingsClose.textContent = "✕";
            settingsClose.onclick = () => {
              settingsOverlay.remove();
              settingsModal.remove();
            };

            settingsHeader.append(settingsTitle, settingsClose);

            const settingsBody = document.createElement("div");
            settingsBody.className = "tk-modal-body";

            const inputs = {};

            delaySettings.forEach((setting) => {
              const field = document.createElement("div");
              field.className = "tk-field";

              const fieldLabel = document.createElement("div");
              fieldLabel.className = "tk-field-label";
              fieldLabel.textContent = setting.label;

              const input = document.createElement("input");
              input.className = "tk-input";
              input.type = "number";
              input.placeholder = String(setting.defaultValue || 0);

              inputs[setting.key] = input;

              field.append(fieldLabel, input);
              settingsBody.appendChild(field);
            });

            chrome.storage.local.get(delaySettings.map(x => x.key), (res) => {
              delaySettings.forEach((setting) => {
                inputs[setting.key].value =
                  res[setting.key] ?? setting.defaultValue ?? 0;
              });
            });

            const settingsFooter = document.createElement("div");
            settingsFooter.className = "tk-modal-footer";

            const cancel = document.createElement("button");
            cancel.className = "tk-btn";
            cancel.textContent = "Batal";
            cancel.onclick = () => {
              settingsOverlay.remove();
              settingsModal.remove();
            };

            const save = document.createElement("button");
            save.className = "tk-btn primary";
            save.textContent = "Simpan";
            save.onclick = () => {
              const payload = {};

              delaySettings.forEach((setting) => {
                payload[setting.key] = parseInt(inputs[setting.key].value, 10) || 0;
              });

              chrome.storage.local.set(payload, () => {
                settingsOverlay.remove();
                settingsModal.remove();
              });
            };

            settingsFooter.append(cancel, save);
            settingsModal.append(settingsHeader, settingsBody, settingsFooter);
            document.body.append(settingsOverlay, settingsModal);
          };

          if (showOnboarding) {
            chrome.storage.local.set({ tukang_onboarded: true });
          }
        });
      },
    });

    return results?.[0]?.result || null;
  }

  async function showPengkreditanCSVModal(tab) {
    const results = await executeScript(tab.id, {
      func: () => {
        return new Promise((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".csv,.txt";

          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) {
              resolve(null);
              return;
            }

            const reader = new FileReader();

            reader.onload = () => {
              const text = reader.result || "";
              const rows = parseCsv(text);

              const output = rows.map((row) => ({
                nomorFaktur: row.nomor_faktur || row["nomor faktur"] || row.NomorFaktur || "",
                masaPajakFaktur: normalizeMonth(row.masa_pajak_faktur || row["masa pajak faktur"]),
                tahunPajakFaktur: row.tahun_pajak_faktur || row["tahun pajak faktur"] || "",
                masaPajakPengkreditan: normalizeMonth(row.masa_pajak_pengkreditan || row["masa pajak pengkreditan"]),
                tahunPajakPengkreditan: row.tahun_pajak_pengkreditan || row["tahun pajak pengkreditan"] || "",
              })).filter((item) => item.nomorFaktur);

              resolve(output);
            };

            reader.onerror = () => resolve(null);
            reader.readAsText(file);
          };

          input.click();

          function parseCsv(text) {
            const lines = text.split(/\r?\n/).filter((line) => line.trim());
            if (lines.length < 2) return [];

            const sep = lines[0].includes(";") ? ";" : ",";
            const headers = lines[0]
              .split(sep)
              .map((h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/['"]/g, ""));

            return lines.slice(1).map((line) => {
              const values = line.split(sep).map((v) => v.trim().replace(/^["']|["']$/g, ""));
              const row = {};

              headers.forEach((h, index) => {
                row[h] = values[index] || "";
              });

              return row;
            });
          }

          function normalizeMonth(value) {
            const months = [
              "",
              "januari",
              "februari",
              "maret",
              "april",
              "mei",
              "juni",
              "juli",
              "agustus",
              "september",
              "oktober",
              "november",
              "desember",
            ];

            const v = String(value || "").trim().toLowerCase();

            if (/^\d+$/.test(v)) {
              const n = Number(v);
              return n >= 1 && n <= 12 ? n : null;
            }

            const idx = months.findIndex((m) => m === v || (v.length >= 3 && m.startsWith(v)));
            return idx > 0 ? idx : null;
          }
        });
      },
    });

    return results?.[0]?.result || null;
  }

  async function showPembatalanCSVModal(tab) {
    const results = await executeScript(tab.id, {
      func: () => {
        return new Promise((resolve) => {
          const passphrase = prompt("Masukkan passphrase sertifikat:");
          if (!passphrase) {
            resolve(null);
            return;
          }

          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".csv,.txt";

          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) {
              resolve(null);
              return;
            }

            const reader = new FileReader();

            reader.onload = () => {
              const text = reader.result || "";
              const rows = parseCsv(text);

              const output = rows.map((row) => {
                const raw =
                  row.nomor_faktur ||
                  row["nomor faktur"] ||
                  row.NomorFaktur ||
                  Object.values(row)[0] ||
                  "";

                return {
                  nomorFaktur: String(raw).replace(/[.\-\s']/g, "").trim(),
                };
              }).filter((item) => item.nomorFaktur);

              resolve({
                rows: output,
                passphrase,
              });
            };

            reader.onerror = () => resolve(null);
            reader.readAsText(file);
          };

          input.click();

          function parseCsv(text) {
            const lines = text.split(/\r?\n/).filter((line) => line.trim());
            if (lines.length < 2) return [];

            const sep = lines[0].includes(";") ? ";" : ",";
            const headers = lines[0]
              .split(sep)
              .map((h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/['"]/g, ""));

            return lines.slice(1).map((line) => {
              const values = line.split(sep).map((v) => v.trim().replace(/^["']|["']$/g, ""));
              const row = {};

              headers.forEach((h, index) => {
                row[h] = values[index] || "";
              });

              return row;
            });
          }
        });
      },
    });

    return results?.[0]?.result || null;
  }

  chrome.action.onClicked.addListener(async (tab) => {
    try {
      const activation = await ensureActivation(tab);
      if (!activation.activated) return;

      chrome.action.setBadgeText({ text: "" });

      const prefs = await getPrefs();
      const versionInfo = getExtensionVersionInfo();

      const showChangelog = !!(
        prefs.tukang_last_version &&
        prefs.tukang_last_version !== CHANGELOG_VERSION
      );

      if (prefs.tukang_last_version !== CHANGELOG_VERSION) {
        chrome.storage.local.set({ tukang_last_version: CHANGELOG_VERSION });
      }

    const selected = await showMainMenu(tab, {
        expiryStr: formatExpiry(activation.expiry),
        daysRemaining: daysLeft(activation.expiry),
        lastModule: prefs.tukang_last_module || "",
        showOnboarding: !prefs.tukang_onboarded,
        showChangelog,
        versionInfo,
    });
        

      if (!selected) return;

      const moduleConfig = getModuleByLabel(selected);
      if (!moduleConfig) return;

      chrome.storage.local.set({ tukang_last_module: selected });

      if (moduleConfig.label === MODULES.PENGKREDITAN.label) {
        const csvData = await showPengkreditanCSVModal(tab);
        if (!csvData || !csvData.length) return;

        await setPageVars(tab.id, {
          __pengkreditanFakturList: csvData,
        });

        await injectModule(tab.id, moduleConfig);
        return;
      }

      if (moduleConfig.label === MODULES.PEMBATALAN.label) {
        const csvResult = await showPembatalanCSVModal(tab);
        if (!csvResult || !csvResult.rows || !csvResult.rows.length) return;

        await setPageVars(tab.id, {
          __pembatalanFakturList: csvResult.rows,
          __pembatalanPassphrase: csvResult.passphrase,
        });

        await injectModule(tab.id, moduleConfig);
        return;
      }

      await injectModule(tab.id, moduleConfig);
    } catch (err) {
      console.error("[Tukangkunting] Router error:", err);
    }
  });

  self.TK_ROUTER = {
    showMainMenu,
  };
})();