#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const JavaScriptObfuscator = require('javascript-obfuscator');

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

function rmrf(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function listFilesRecursive(dirPath) {
  const out = [];
  const queue = [dirPath];

  while (queue.length) {
    const current = queue.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile()) {
        out.push(fullPath);
      }
    }
  }

  return out.sort((a, b) => a.localeCompare(b));
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

  const base = path.parse(originalName).name;
  const hash = crypto
    .createHash('sha1')
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
  let out = code;
  for (const [originalName, obfuscatedName] of Object.entries(mapping)) {
    const pattern = new RegExp(`(["'])${escapeRegExp(originalName)}\\1`, 'g');
    out = out.replace(pattern, `'${obfuscatedName}'`);
  }
  return out;
}

function obfuscateJavaScript(code) {
  if (!code.trim()) return code;

  const antiDebugSnippet = "const __tk_guard=setInterval(function(){const __t=new Date();debugger;if(new Date()-__t>100){clearInterval(__tk_guard);}},3000);\n";
  const source = antiDebugSnippet + code;

  const result = JavaScriptObfuscator.obfuscate(source, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: false,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.85,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
  });

  return result.getObfuscatedCode();
}

function main() {
  rmrf(outputDir);
  ensureDir(outputDir);

  const allFiles = listFilesRecursive(sourceDir);
  const moduleMapping = {};
  const usedNames = new Set(Object.values(fixedModuleNames));

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

    if (!shouldObfuscate(absoluteFile, relPath)) {
      fs.copyFileSync(absoluteFile, destinationAbsPath);
      continue;
    }

    let sourceCode = fs.readFileSync(absoluteFile, 'utf8');
    if (base === 'background.js') {
      sourceCode = rewriteBackgroundReferences(sourceCode, moduleMapping);
    }

    const obfuscatedCode = obfuscateJavaScript(sourceCode);
    fs.writeFileSync(destinationAbsPath, obfuscatedCode, 'utf8');
  }

  const mappingLines = Object.entries(moduleMapping)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([from, to]) => `${from.padEnd(45)} ${to}`);

  const guideContent = mappingLines.join('\n') + '\n';
  fs.writeFileSync(path.join(outputDir, 'file_obfuscated_guide.MD'), guideContent, 'utf8');

  console.log(`Obfuscation complete.`);
  console.log(`Source : ${sourceDir}`);
  console.log(`Output : ${outputDir}`);
  console.log(`Modules: ${Object.keys(moduleMapping).length}`);
}

main();
