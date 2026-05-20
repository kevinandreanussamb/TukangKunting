#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const terser = require('terser');

const rootDir = process.cwd();
const sourceDir = path.resolve(rootDir, process.env.OBFUSCATE_SOURCE || 'tukangkunting_before_obfuscate');
const outputDir = path.resolve(rootDir, process.env.OBFUSCATE_OUTPUT || 'tukangkunting_commerce_edition');

if (!fs.existsSync(sourceDir)) {
  console.error(`Source folder not found: ${sourceDir}`);
  process.exit(1);
}

if (sourceDir === outputDir) {
  console.error('Source and output folder must be different.');
  process.exit(1);
}

const fixedModuleNames = {
  'dokumen_saya_bold.js': 'm0d_a3f8c1.js',
  'dokumen_saya_all.js': 'm0d_b7d2e4.js',
  'faktur_pajak_keluaran.js': 'm0d_c8ad8s.js',
  'faktur_pajak_masukan.js': 'm0d_c9a1f6.js',
  'faktur_pajak_retur_masukan_keluaran.js': 'm0d_d4b5e8.js',
  'bppu_bpnr.js': 'm0d_e2c7a0.js',
  'pengkreditan_faktur.js': 'm0d_f5e3b2.js',
  'pembatalan_faktur.js': 'm0d_g8d4c7.js'
};

const NON_COPIED_BASENAMES = new Set(['file_obfuscated_guide.MD', 'obfuscated_rule.MD']);
const NON_COPIED_SUFFIXES = ['Zone.Identifier'];

const SENSITIVE_LITERALS = [
  'checkLicense',
  'no_runtime',
  'no_response',
  'no_license',
  'lisensi sudah expired',
  'machine code tidak cocok',
  'delay_ppn_retur',
  'delay_ppn',
  'delay_dokumen_all',
  'delay_dokumen_bold',
  'delay_bppu',
  'delay_pengkreditan',
  'delay_pembatalan',
  'p-disabled',
  'aria-disabled',
  'true',
  'id-ID',
  'numeric',
  'long',
  'ERROR',
  'DONE',
  'libs/jquery-3.7.0.min.js'
];

function rmrf(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function listFilesRecursive(dirPath) {
  const filesList = [];
  const queue = [dirPath];

  while (queue.length) {
    const current = queue.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
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
  if (NON_COPIED_BASENAMES.has(base)) return true;
  return NON_COPIED_SUFFIXES.some((suffix) => base.endsWith(suffix));
}

function shouldObfuscate(filePath, relPath) {
  if (!filePath.endsWith('.js')) return false;
  if (relPath.split(path.sep).includes('libs')) return false;
  return true;
}

function buildModuleName(originalName, used) {
  if (fixedModuleNames[originalName]) {
    return fixedModuleNames[originalName];
  }

  const hash = crypto
    .createHash('sha256')
    .update(originalName)
    .digest('hex')
    .slice(0, 6);

  let candidate = `m0d_${hash}.js`;
  let counter = 0;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `m0d_${hash.slice(0, 4)}${String(counter).padStart(2, '0')}.js`;
  }

  return candidate;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteBackgroundReferences(code, mapping) {
  let rewrittenCode = code;
  for (const [originalName, obfuscatedName] of Object.entries(mapping)) {
    const pattern = new RegExp(`(["'])${escapeRegExp(originalName)}\\1`, 'g');
    rewrittenCode = rewrittenCode.replace(pattern, `'${obfuscatedName}'`);
  }
  return rewrittenCode;
}

function toHexEscapedContent(value) {
  return [...value].map((ch) => {
    const codePoint = ch.codePointAt(0);
    if (codePoint <= 0xff) {
      return `\\x${codePoint.toString(16).padStart(2, '0')}`;
    }
    if (codePoint <= 0xffff) {
      return `\\u${codePoint.toString(16).padStart(4, '0')}`;
    }
    return `\\u{${codePoint.toString(16)}}`;
  }).join('');
}

function obfuscateSafeLiterals(code) {
  let out = code;
  for (const literal of SENSITIVE_LITERALS) {
    const quotedPattern = new RegExp(`(["'])${escapeRegExp(literal)}\\1`, 'g');
    out = out.replace(quotedPattern, (_full, quote) => `${quote}${toHexEscapedContent(literal)}${quote}`);
  }
  return out;
}

async function stripJsComments(code) {
  const result = await terser.minify(code, {
    compress: false,
    mangle: false,
    format: {
      comments: false,
      beautify: true
    }
  });

  return result.code || code;
}

function buildAutoVersion(baseVersion) {
  const parts = String(baseVersion || '1.0.0')
    .split('.')
    .map((part) => {
      const asNumber = Number.parseInt(part, 10);
      if (Number.isNaN(asNumber)) return 0;
      return Math.max(0, Math.min(65535, asNumber));
    });

  while (parts.length < 3) {
    parts.push(0);
  }

  const major = parts[0] || 0;
  const minor = parts[1] || 0;
  const autoEpochUtc = Date.UTC(2024, 0, 1);
  const now = new Date();
  const midnightUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayIndex = Math.floor((midnightUtc - autoEpochUtc) / 86_400_000);
  const patch = Math.max(0, Math.min(65535, dayIndex));
  const build = Math.max(0, Math.min(65535, now.getUTCHours() * 60 + now.getUTCMinutes()));
  return `${major}.${minor}.${patch}.${build}`;
}

function autoVersionManifest(manifestContent) {
  const manifest = JSON.parse(manifestContent);
  const baseVersion = manifest.version || '1.0.0';
  manifest.version_name = baseVersion;
  manifest.version = buildAutoVersion(baseVersion);
  return {
    manifestVersion: manifest.version,
    content: `${JSON.stringify(manifest, null, 2)}\n`
  };
}

async function obfuscateJavaScript(code) {
  if (!code.trim()) return code;

  const withoutComments = await stripJsComments(code);
  const normalized = withoutComments
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');

  return obfuscateSafeLiterals(normalized);
}

async function main() {
  rmrf(outputDir);
  ensureDir(outputDir);

  const allFiles = listFilesRecursive(sourceDir);
  const moduleMapping = {};
  const usedNames = new Set(Object.values(fixedModuleNames));
  let generatedManifestVersion = null;

  for (const absoluteFile of allFiles) {
    const relPath = path.relative(sourceDir, absoluteFile);
    if (!absoluteFile.endsWith('.js')) continue;
    if (relPath.split(path.sep).includes('libs')) continue;

    const base = path.basename(absoluteFile);
    if (base === 'background.js' || base === 'content.js') continue;

    const obfuscatedName = buildModuleName(base, usedNames);
    usedNames.add(obfuscatedName);
    moduleMapping[base] = obfuscatedName;
  }

  for (const absoluteFile of allFiles) {
    const relPath = path.relative(sourceDir, absoluteFile);
    const base = path.basename(absoluteFile);

    if (shouldSkipCopy(absoluteFile)) {
      continue;
    }

    const destinationRelPath =
      moduleMapping[base] && !relPath.split(path.sep).includes('libs')
        ? moduleMapping[base]
        : relPath;

    const destinationAbsPath = path.join(outputDir, destinationRelPath);
    ensureDir(path.dirname(destinationAbsPath));

    if (relPath === 'manifest.json') {
      const manifestRaw = fs.readFileSync(absoluteFile, 'utf8');
      const { manifestVersion, content } = autoVersionManifest(manifestRaw);
      generatedManifestVersion = manifestVersion;
      fs.writeFileSync(destinationAbsPath, content, 'utf8');
      continue;
    }

    if (!shouldObfuscate(absoluteFile, relPath)) {
      fs.copyFileSync(absoluteFile, destinationAbsPath);
      continue;
    }

    let sourceCode = fs.readFileSync(absoluteFile, 'utf8');
    if (base === 'background.js') {
      sourceCode = rewriteBackgroundReferences(sourceCode, moduleMapping);
    }

    const obfuscatedCode = await obfuscateJavaScript(sourceCode);
    fs.writeFileSync(destinationAbsPath, obfuscatedCode, 'utf8');
  }

  console.log('Obfuscation complete.');
  console.log(`Mode   : custom-safe-obfuscation`);
  console.log(`Source : ${sourceDir}`);
  console.log(`Output : ${outputDir}`);
  console.log(`Modules: ${Object.keys(moduleMapping).length}`);
  if (generatedManifestVersion) {
    console.log(`Version: ${generatedManifestVersion}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
