#!/usr/bin/env node
/**
 * capacitor-check.cjs
 * Script de diagnóstico para verificar el estado de Capacitor en el proyecto.
 * Solo lectura — no realiza ningún cambio.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// ─── Helpers ────────────────────────────────────────────────────────────────

const OK   = '\x1b[32m✔\x1b[0m';
const FAIL = '\x1b[31m✘\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';
const INFO = '\x1b[36mℹ\x1b[0m';

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readJSON(relPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
  } catch {
    return null;
  }
}

function section(title) {
  console.log(`\n\x1b[1m\x1b[34m━━━ ${title} ━━━\x1b[0m`);
}

function row(icon, label, detail = '') {
  const d = detail ? `\x1b[90m(${detail})\x1b[0m` : '';
  console.log(`  ${icon}  ${label} ${d}`);
}

// ─── 1. capacitor.config ────────────────────────────────────────────────────

section('1. Configuración de Capacitor');

const hasConfigTs  = exists('capacitor.config.ts');
const hasConfigJson = exists('capacitor.config.json');

if (hasConfigTs) {
  row(OK, 'capacitor.config.ts encontrado');
  // Leer como texto para extraer valores sin compilar TS
  const raw = fs.readFileSync(path.join(ROOT, 'capacitor.config.ts'), 'utf8');
  const appId   = (raw.match(/appId\s*:\s*['"]([^'"]+)['"]/)  || [])[1];
  const appName = (raw.match(/appName\s*:\s*['"]([^'"]+)['"]/) || [])[1];
  const webDir  = (raw.match(/webDir\s*:\s*['"]([^'"]+)['"]/)  || [])[1];
  row(INFO, `appId   : ${appId   || 'no detectado'}`);
  row(INFO, `appName : ${appName || 'no detectado'}`);
  row(INFO, `webDir  : ${webDir  || 'no detectado'}`);

  if (webDir) {
    const webDirExists = exists(webDir.replace(/^\.\//, ''));
    row(
      webDirExists ? OK : WARN,
      `webDir "${webDir}" ${webDirExists ? 'existe' : 'NO existe (ejecuta npm run build primero)'}`,
    );
  }
} else if (hasConfigJson) {
  row(OK, 'capacitor.config.json encontrado');
  const cfg = readJSON('capacitor.config.json');
  if (cfg) {
    row(INFO, `appId   : ${cfg.appId   || 'no definido'}`);
    row(INFO, `appName : ${cfg.appName || 'no definido'}`);
    row(INFO, `webDir  : ${cfg.webDir  || 'no definido'}`);
  }
} else {
  row(FAIL, 'No se encontró capacitor.config.ts ni capacitor.config.json');
}

// ─── 2. package.json — dependencias Capacitor ───────────────────────────────

section('2. Dependencias Capacitor en package.json');

const pkg = readJSON('package.json');

if (!pkg) {
  row(FAIL, 'No se pudo leer package.json');
} else {
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  const corePkgs = [
    '@capacitor/core',
    '@capacitor/cli',
    '@capacitor/android',
    '@capacitor/ios',
  ];

  for (const name of corePkgs) {
    if (allDeps[name]) {
      row(OK, `${name}`, `v${allDeps[name]}`);
    } else {
      row(name === '@capacitor/ios' ? WARN : FAIL, `${name} NO encontrado`);
    }
  }

  // Push notifications
  section('3. Plugin @capacitor/push-notifications');
  const pushPkg = '@capacitor/push-notifications';
  if (allDeps[pushPkg]) {
    row(OK, `${pushPkg} declarado en package.json`, `v${allDeps[pushPkg]}`);
  } else {
    row(FAIL, `${pushPkg} NO está en package.json`);
  }
}

// ─── 3. node_modules — instalación real ─────────────────────────────────────

section('4. Instalación real en node_modules');

const modulesToCheck = [
  '@capacitor/core',
  '@capacitor/cli',
  '@capacitor/android',
  '@capacitor/push-notifications',
];

for (const mod of modulesToCheck) {
  const modPath = path.join('node_modules', mod, 'package.json');
  if (exists(modPath)) {
    const modPkg = readJSON(modPath);
    row(OK, `${mod} instalado`, modPkg ? `v${modPkg.version}` : '');
  } else {
    row(FAIL, `${mod} NO está instalado en node_modules`);
  }
}

// ─── 4. Plataforma Android ───────────────────────────────────────────────────

section('5. Plataforma Android');

const androidFiles = [
  { file: 'android/build.gradle',            label: 'build.gradle raíz' },
  { file: 'android/settings.gradle',         label: 'settings.gradle' },
  { file: 'android/variables.gradle',        label: 'variables.gradle' },
  { file: 'android/capacitor.settings.gradle', label: 'capacitor.settings.gradle' },
  { file: 'android/app/build.gradle',        label: 'app/build.gradle' },
  { file: 'android/app/capacitor.build.gradle', label: 'app/capacitor.build.gradle' },
  { file: 'android/app/src/main/AndroidManifest.xml', label: 'AndroidManifest.xml' },
  { file: 'android/gradlew',                 label: 'gradlew (wrapper)' },
];

for (const { file, label } of androidFiles) {
  row(exists(file) ? OK : FAIL, label, file);
}

// Verificar capacitor-cordova-android-plugins
const cordovaPluginsDir = 'android/capacitor-cordova-android-plugins';
row(
  exists(cordovaPluginsDir) ? OK : WARN,
  'capacitor-cordova-android-plugins',
  exists(cordovaPluginsDir) ? 'presente' : 'ausente (normal si no hay plugins Cordova)',
);

// ─── 5. Resumen final ────────────────────────────────────────────────────────

section('6. Resumen');

const checks = [
  { label: 'Config Capacitor',          pass: hasConfigTs || hasConfigJson },
  { label: '@capacitor/core instalado', pass: exists('node_modules/@capacitor/core/package.json') },
  { label: '@capacitor/cli instalado',  pass: exists('node_modules/@capacitor/cli/package.json') },
  { label: '@capacitor/android instalado', pass: exists('node_modules/@capacitor/android/package.json') },
  { label: 'Carpeta android/ presente', pass: exists('android') },
  { label: 'AndroidManifest.xml',       pass: exists('android/app/src/main/AndroidManifest.xml') },
  { label: '@capacitor/push-notifications instalado', pass: exists('node_modules/@capacitor/push-notifications/package.json') },
];

let passed = 0;
for (const { label, pass } of checks) {
  row(pass ? OK : FAIL, label);
  if (pass) passed++;
}

const total = checks.length;
const color = passed === total ? '\x1b[32m' : passed >= total * 0.7 ? '\x1b[33m' : '\x1b[31m';
console.log(`\n  ${color}Resultado: ${passed}/${total} verificaciones pasadas\x1b[0m\n`);
