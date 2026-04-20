const fs = require('fs');
let f = fs.readFileSync('App.tsx', 'utf8');

// Fix corrupted emojis in AI responses and buttons
const fixes = [
  ["'?? Archivo", "'📎 Archivo"],
  ['`?? CLIMA', '`🌤️ CLIMA'],
  ['`?? C', '`🤖 C'],
  ['?? DINERO', '💰 DINERO'],
  ["'?? Chat cifrado", "'🔒 Chat cifrado"],
  ['?? Ver mapa', '🗺️ Ver mapa'],
  ['?? Cmo llegar', '📍 Cómo llegar'],
  ['?? Cómo llegar', '📍 Cómo llegar'],
  ['?? Ver perfil', '👤 Ver perfil'],
  ['?? Eliminar', '🗑️ Eliminar'],
  ["'?? Cdigo: '", "'🔑 Código: '"],
  ["'?? Código: '", "'🔑 Código: '"],
  ["'?? C?digo: '", "'🔑 Código: '"],
];

fixes.forEach(([from, to]) => {
  f = f.split(from).join(to);
});

// Any remaining ?? in string literals that look like emoji prefixes (before uppercase)
f = f.replace(/'(\?\?)\s+([A-ZÁÉÍÓÚÑ])/g, "'📌 $2");
f = f.replace(/`(\?\?)\s+([A-ZÁÉÍÓÚÑ])/g, '`📌 $2');

fs.writeFileSync('App.tsx', f, 'utf8');

const remaining = (f.match(/'[^']*\?\?[^']*'/g) || []).filter(m => !m.includes('??=')).length;
console.log('Remaining ?? in strings:', remaining);
console.log('Done');
