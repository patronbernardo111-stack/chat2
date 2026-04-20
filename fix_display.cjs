const fs = require('fs');
let f = fs.readFileSync('App.tsx', 'utf8');
const orig = f;

// 1. Bullets ••••••  → puntos compatibles con todas las fuentes web
f = f.replace(/••••••/g, '· · · · · ·');

// 2. Temperatura - el símbolo ° que aparece como ◆ o carácter raro
// Buscar el patrón weather.temp seguido de carácter no-ASCII
f = f.replace(/\{weather\.temp\}([^\w<'"{\s])/g, '{weather.temp}°');

// 3. Mensajería en nav bar label
f = f.replace(/label:\s*'Mensajer[^í]a'/g, "label: 'Mensajería'");
f = f.replace(/>Mensajer[^í]a</g, '>Mensajería<');

// 4. Transacciones - ? Recibido / ? Enviado
f = f.replace(/'[?]\s*Recibido'/g, "'↙️ Recibido'");
f = f.replace(/'[?]\s*Enviado'/g, "'↗️ Enviado'");

// 5. Depósito salario description
f = f.replace(/Dep[^ó]sito salario/g, 'Depósito salario');
f = f.replace(/Dep[^ó]sito/g, 'Depósito');

// 6. Transferencia a Mar?a
f = f.replace(/Mar[^í]a/g, 'María');

// 7. Ver todo ? → Ver todo →
f = f.replace(/Ver todo\s*[?◆►»]/g, 'Ver todo →');

// 8. Eye icons ?? → use text
f = f.replace(/'\?\?'\s*:\s*'\?\?'/g, "'👁' : '🙈'");
f = f.replace(/'\?\?'/g, "'👁'");

// 9. Emoji panel - the ?? shown in chat emoji picker
// These are the customEmojis labels that show as ??
// They were already fixed by fix_encoding.cjs but let's verify
// the system emojis array in the chat emoji panel
f = f.replace(/emojis:\['[?][?]'/g, "emojis:['😀'");

// 10. Remove any remaining isolated ? in JSX text content (not in JS logic)
// Only in string literals that are displayed as text
f = f.replace(/(title|label|description|body|text):\s*'([^']*)[?]([^']*)'/g, (m, k, b, a) => {
  // Only fix if it looks like a corrupted accent (followed by a letter)
  return m; // skip for now, too risky
});

fs.writeFileSync('App.tsx', f, 'utf8');

const fixed = (orig.match(/••••••/g) || []).length + 
              (orig.match(/'[?]\s*Recibido'/g) || []).length +
              (orig.match(/'[?]\s*Enviado'/g) || []).length;
console.log(`Fixed: bullets, temperature, Mensajería, transactions`);
console.log(`App.tsx updated successfully`);
