/**
 * EGCHAT Health Check
 * Ejecutar: node check_health.cjs
 * Verifica que no haya caracteres corruptos ni emojis rotos
 */
const fs = require('fs');

const files = ['App.tsx', 'ServiciosModules.tsx', 'Lia25View.tsx', 'WalletSystem.tsx', 
               'WalletModals.tsx', 'BancosModule.tsx', 'AuthScreen.tsx'];

let allOk = true;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const f = fs.readFileSync(file, 'utf8');
  const issues = [];

  // 1. Caracteres de reemplazo Unicode
  const corrupt = (f.match(/\uFFFD/g) || []).length;
  if (corrupt > 0) issues.push(`${corrupt} caracteres corruptos \\uFFFD`);

  // 2. Demasiados emojis ojo (señal de corrupción del panel)
  if (file === 'App.tsx') {
    const eyes = (f.match(/'👁'/g) || []).length;
    if (eyes > 10) issues.push(`${eyes} emojis 👁 (demasiados, posible corrupción del panel)`);
  }

  // 3. Strings ?? en JSX (emojis corruptos visibles) - solo en strings de texto, no operadores JS
  const qqInStrings = (f.match(/'[^']*\?\?[^']*'/g) || []).filter(m => !m.includes('??=')).length;
  if (qqInStrings > 0) issues.push(`${qqInStrings} posibles emojis ?? en strings`);

  if (issues.length === 0) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}:`);
    issues.forEach(i => console.log(`   - ${i}`));
    allOk = false;
  }
});

console.log('');
if (allOk) {
  console.log('✅ Todo OK — app lista para producción');
} else {
  console.log('⚠️  Hay problemas — ejecuta los scripts de fix antes de hacer deploy');
  process.exit(1);
}
