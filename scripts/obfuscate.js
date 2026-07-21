#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const terser = require("terser");

const rootDir = process.cwd();

const sourceDir = path.resolve(
  rootDir,
  process.env.OBFUSCATE_SOURCE || "tukangkunting_before_obfuscate"
);

const outputDir = path.resolve(
  rootDir,
  process.env.OBFUSCATE_OUTPUT || "tukangkunting_commerce_edition"
);

if (!fs.existsSync(sourceDir)) {
  console.error(`Source folder not found: ${sourceDir}`);
  process.exit(1);
}

if (sourceDir === outputDir) {
  console.error("Source and output folder must be different.");
  process.exit(1);
}

const NON_COPIED_BASENAMES = new Set([
  "file_obfuscated_guide.MD",
  "obfuscated_rule.MD",
]);

const NON_COPIED_SUFFIXES = [
  "Zone.Identifier",
];

const SENSITIVE_LITERALS = [
  "checkLicense",
  "batchComplete",
  "saveActivityLog",
  "getActivityLog",

  "tukang_last_module",
  "tukang_onboarded",
  "tukang_last_version",
  "activity_log",

  "no_runtime",
  "no_response",
  "no_license",
  "lisensi sudah expired",
  "machine code tidak cocok",

  "delay_ppn_retur",
  "delay_ppn",
  "delay_dokumen_all",
  "delay_dokumen_bold",
  "delay_bppu",
  "delay_tax_withholding_slips",
  "delay_pengkreditan",
  "delay_pembatalan",

  "p-disabled",
  "aria-disabled",
  "true",
  "id-ID",
  "numeric",
  "long",

  "ERROR",
  "DONE",

  "libs/jquery-3.7.0.min.js",
];

/**
 * Normalize Windows path separator to POSIX-style path.
 */
function normalizeRelPath(relPath) {
  return String(relPath || "").replace(/\\/g, "/");
}

/**
 * Only module files are renamed.
 *
 * Examples:
 * modules/bppu-bpnr.js            -> modules/m0d_xxxxxxxx.js
 * modules/faktur-pajak-masukan.js -> modules/m0d_xxxxxxxx.js
 *
 * shared/*.js and background/*.js are obfuscated but not renamed.
 */
function isModuleFile(relPath) {
  const normalized = normalizeRelPath(relPath);
  return normalized.startsWith("modules/") && normalized.endsWith(".js");
}

function shouldRenameFile(relPath) {
  return isModuleFile(relPath);
}

/**
 * Deterministic obfuscated module name based on relative path.
 *
 * This means same path always produces same output name.
 */
function buildModuleNameFromPath(relPath, usedNames) {
  const normalized = normalizeRelPath(relPath);

  const hash = crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex")
    .slice(0, 8);

  const dir = path.posix.dirname(normalized);

  let candidate = path.posix.join(dir, `m0d_${hash}.js`);
  let counter = 0;

  while (usedNames.has(candidate)) {
    counter += 1;

    candidate = path.posix.join(
      dir,
      `m0d_${hash.slice(0, 6)}_${String(counter).padStart(2, "0")}.js`
    );
  }

  usedNames.add(candidate);

  return candidate;
}

function rmrf(targetPath) {
  if (!fs.existsSync(targetPath)) return;

  fs.rmSync(targetPath, {
    recursive: true,
    force: true,
  });
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, {
    recursive: true,
  });
}

function listFilesRecursive(dirPath) {
  const filesList = [];
  const queue = [dirPath];

  while (queue.length) {
    const current = queue.pop();
    const entries = fs.readdirSync(current, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile()) {
        filesList.push(fullPath);
      }
    }
  }

  return filesList.sort((a, b) => a.localeCompare(b));
}

function shouldSkipCopy(filePath) {
  const base = path.basename(filePath);

  if (NON_COPIED_BASENAMES.has(base)) {
    return true;
  }

  return NON_COPIED_SUFFIXES.some((suffix) => base.endsWith(suffix));
}

/**
 * JS obfuscation policy:
 * - libs/* copied as-is
 * - background/*.js obfuscated
 * - shared/*.js obfuscated
 * - modules/*.js obfuscated and renamed
 * - content.js obfuscated if present
 * - other .js files obfuscated by default, except libs
 */
function shouldObfuscate(filePath, relPath) {
  const normalized = normalizeRelPath(relPath);

  if (!filePath.endsWith(".js")) return false;
  if (normalized.startsWith("libs/")) return false;

  return true;
}

/**
 * Build dynamic mapping for modules only.
 *
 * Example output:
 * {
 *   "modules/bppu-bpnr.js": "modules/m0d_abcd1234.js"
 * }
 */
function buildRenameMapping(allFiles, sourceDirPath) {
  const mapping = {};
  const usedNames = new Set();

  for (const absoluteFile of allFiles) {
    const relPath = normalizeRelPath(path.relative(sourceDirPath, absoluteFile));

    if (!shouldRenameFile(relPath)) continue;

    const obfuscatedRelPath = buildModuleNameFromPath(relPath, usedNames);
    mapping[relPath] = obfuscatedRelPath;
  }

  return mapping;
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Rewrite references to renamed module paths.
 *
 * Example:
 * "modules/bppu-bpnr.js"
 * becomes
 * "modules/m0d_abcd1234.js"
 *
 * This runs against every JS file, not only background.
 */
function rewriteReferences(code, mapping) {
  let output = code;

  const entries = Object.entries(mapping).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [originalRelPath, obfuscatedRelPath] of entries) {
    const originalForward = normalizeRelPath(originalRelPath);
    const obfuscatedForward = normalizeRelPath(obfuscatedRelPath);

    const originalEscaped = escapeRegExp(originalForward);

    const quotedPattern = new RegExp(
      `(["'\`])${originalEscaped}\\1`,
      "g"
    );

    output = output.replace(quotedPattern, (_full, quote) => {
      return `${quote}${obfuscatedForward}${quote}`;
    });
  }

  return output;
}

function toHexEscapedContent(value) {
  return [...String(value)].map((ch) => {
    const codePoint = ch.codePointAt(0);

    if (codePoint <= 0xff) {
      return `\\x${codePoint.toString(16).padStart(2, "0")}`;
    }

    if (codePoint <= 0xffff) {
      return `\\u${codePoint.toString(16).padStart(4, "0")}`;
    }

    return `\\u{${codePoint.toString(16)}}`;
  }).join("");
}

/**
 * Escape selected string literals after terser minify.
 *
 * Important:
 * We intentionally only replace quoted string literals.
 */
function obfuscateSafeLiterals(code) {
  let output = code;

  for (const literal of SENSITIVE_LITERALS) {
    const quotedPattern = new RegExp(
      `(["'])${escapeRegExp(literal)}\\1`,
      "g"
    );

    output = output.replace(quotedPattern, (_full, quote) => {
      return `${quote}${toHexEscapedContent(literal)}${quote}`;
    });
  }

  return output;
}

async function transformJavaScript(code, relPath) {
  try {
    const result = await terser.minify(
      {
        code,
      },
      {
        compress: false,
        mangle: {
          toplevel: true,
          keep_fnames: false,
          keep_classnames: false,
        },
        format: {
          comments: false,
          beautify: false,
        },
      }
    );

    return result.code || code;
  } catch (err) {
    printParseErrorContext(code, relPath, err);
    throw err;
  }
}

function printParseErrorContext(code, relPath, err) {
  const line = Number(err.line || 0);
  const col = Number(err.col || 0);

  console.error("");
  console.error("════════════════════════════════════════════════════");
  console.error("❌ Terser gagal parse file:");
  console.error(`   ${relPath}`);
  console.error("────────────────────────────────────────────────────");
  console.error(`Error : ${err.message || err}`);
  console.error(`Line  : ${line}`);
  console.error(`Column: ${col}`);
  console.error("────────────────────────────────────────────────────");

  const lines = String(code).split(/\r?\n/);
  const start = Math.max(1, line - 4);
  const end = Math.min(lines.length, line + 4);

  for (let i = start; i <= end; i++) {
    const marker = i === line ? ">>" : "  ";
    const lineText = lines[i - 1] || "";

    console.error(`${marker} ${String(i).padStart(4, " ")} | ${lineText}`);

    if (i === line && col >= 0) {
      console.error(`      | ${" ".repeat(col)}^`);
    }
  }

  console.error("════════════════════════════════════════════════════");
  console.error("");
}

function buildAutoVersion(baseVersion) {
  const parts = String(baseVersion || "1.0.0")
    .split(".")
    .map((part) => {
      const asNumber = Number.parseInt(part, 10);

      if (Number.isNaN(asNumber)) {
        return 0;
      }

      return Math.max(0, Math.min(65535, asNumber));
    });

  while (parts.length < 3) {
    parts.push(0);
  }

  const major = parts[0] || 0;
  const minor = parts[1] || 0;

  const autoEpochUtc = Date.UTC(2024, 0, 1);
  const now = new Date();
  const midnightUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  const dayIndex = Math.floor((midnightUtc - autoEpochUtc) / 86_400_000);
  const patch = Math.max(0, Math.min(65535, dayIndex));
  const build = Math.max(
    0,
    Math.min(65535, now.getUTCHours() * 60 + now.getUTCMinutes())
  );

  return `${major}.${minor}.${patch}.${build}`;
}

function detectHtmlArtifacts(code, relPath) {
  const suspiciousPatterns = [
    /<br\s*\/?>/i,
    /<\/?(em|strong|span|div|a)\b/i,
    /&lt;|&gt;|&amp;|&quot;/i,
    /class="[^"]*"/i,
    /data-lexical-text/i,
  ];

  const hit = suspiciousPatterns.find((pattern) => pattern.test(code));

  if (!hit) return;

  console.warn("");
  console.warn("⚠️ Kemungkinan file mengandung HTML artifact:");
  console.warn(`   ${relPath}`);
  console.warn(`   Pattern: ${hit}`);
  console.warn("   Cek apakah file ini hasil copy dari chat/editor rich text.");
  console.warn("");
}

function autoVersionManifest(manifestContent) {
  const manifest = JSON.parse(manifestContent);
  const baseVersion = manifest.version || "1.0.0";

  manifest.name = "TukangKunting Commerce Edition";
  manifest.version_name = baseVersion;
  manifest.version = buildAutoVersion(baseVersion);

  return {
    manifestVersion: manifest.version,
    content: `${JSON.stringify(manifest, null, 2)}\n`,
  };
}

async function obfuscateJavaScript(code, relPath) {
  if (!code.trim()) return code;

  const transformed = await transformJavaScript(code, relPath);

  const normalized = transformed
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n");

  return obfuscateSafeLiterals(normalized);
}

function shouldWriteMap() {
  return process.env.WRITE_OBFUSCATION_MAP === "1";
}

async function main() {
  rmrf(outputDir);
  ensureDir(outputDir);

  const allFiles = listFilesRecursive(sourceDir);
  const moduleMapping = buildRenameMapping(allFiles, sourceDir);

  let generatedManifestVersion = null;

  for (const absoluteFile of allFiles) {
    const relPathRaw = path.relative(sourceDir, absoluteFile);
    const relPath = normalizeRelPath(relPathRaw);

    if (shouldSkipCopy(absoluteFile)) {
      continue;
    }

    const destinationRelPath = moduleMapping[relPath] || relPath;
    const destinationAbsPath = path.join(outputDir, destinationRelPath);

    ensureDir(path.dirname(destinationAbsPath));

    if (relPath === "manifest.json") {
      const manifestRaw = fs.readFileSync(absoluteFile, "utf8");
      const { manifestVersion, content } = autoVersionManifest(manifestRaw);

      generatedManifestVersion = manifestVersion;

      fs.writeFileSync(destinationAbsPath, content, "utf8");
      continue;
    }

    if (!shouldObfuscate(absoluteFile, relPath)) {
      fs.copyFileSync(absoluteFile, destinationAbsPath);
      continue;
    }

    let sourceCode = fs.readFileSync(absoluteFile, "utf8");

    detectHtmlArtifacts(sourceCode, relPath);

    sourceCode = rewriteReferences(sourceCode, moduleMapping);

    const obfuscatedCode = await obfuscateJavaScript(sourceCode, relPath);

    fs.writeFileSync(destinationAbsPath, obfuscatedCode, "utf8");
  }

  if (shouldWriteMap()) {
    fs.writeFileSync(
      path.join(outputDir, "_obfuscation-map.json"),
      `${JSON.stringify(moduleMapping, null, 2)}\n`,
      "utf8"
    );
  }

  console.log("Obfuscation complete.");
  console.log("Mode   : dynamic-path-module-obfuscation");
  console.log(`Source : ${sourceDir}`);
  console.log(`Output : ${outputDir}`);
  console.log(`Modules: ${Object.keys(moduleMapping).length}`);

  if (generatedManifestVersion) {
    console.log(`Version: ${generatedManifestVersion}`);
  }

  if (Object.keys(moduleMapping).length) {
    console.log("Module mapping:");

    for (const [from, to] of Object.entries(moduleMapping)) {
      console.log(`  ${from} -> ${to}`);
    }
  }

  if (shouldWriteMap()) {
    console.log("Map    : _obfuscation-map.json");
  }
}



main().catch((error) => {
  console.error(error);
  process.exit(1);
});