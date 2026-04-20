const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Line 977 - micrófono
  ["micr?fono. Verifica los permisos.", "micrófono. Verifica los permisos."],
  // Line 1330 - ?? ANÁLISIS
  ["?? ANLISIS:", "📊 ANÁLISIS:"],
  // Line 3827 - PÁGINA
  ["P?GINA DE INICIO CON SOPORTE DE LAYOUTS", "PÁGINA DE INICIO CON SOPORTE DE LAYOUTS"],
  // Line 4352 - búsqueda
  ["Barra b?squeda en el chat", "Barra búsqueda en el chat"],
  // Line 4925 - contact card
  ["text: `👤 ${myName}\\n?? ${myPhone}`", "text: `👤 ${myName}\\n📞 ${myPhone}`"],
  // Line 4969 - transfer message
  ["text: `📌 Transferencia\\n?? ${amount.toLocaleString()} XAF\\n?? ${sc.title}\\n?? C?digo: ${code}\\n?? ? Enviado`",
   "text: `📌 Transferencia\\n💰 ${amount.toLocaleString()} XAF\\n👤 ${sc.title}\\n🔑 Código: ${code}\\n✅ Enviado`"],
  // Line 5153 - Micrófono comment
  ["Micr?fono ? toca para grabar, toca de nuevo para enviar", "Micrófono — toca para grabar, toca de nuevo para enviar"],
  // Line 5208 - micrófono error
  ["showToast('No se pudo acceder al micr?fono', 'error')", "showToast('No se pudo acceder al micrófono', 'error')"],
  // Line 5213 - recording timer (? before {String})
  ["? {String(Math.floor(chatRecordingTime/60)).padStart(2,'00')}:{String(chatRecordingTime%60).padStart(2,'00')}",
   "🔴 {String(Math.floor(chatRecordingTime/60)).padStart(2,'00')}:{String(chatRecordingTime%60).padStart(2,'00')}"],
  // Line 5241 - búsqueda + botón
  ["Barra de b?squeda + bot?n nuevo chat", "Barra de búsqueda + botón nuevo chat"],
];

let count = 0;
for (const [from, to] of replacements) {
  if (content.includes(from)) {
    content = content.split(from).join(to);
    console.log(`✅ Fixed: ${from.substring(0, 60)}`);
    count++;
  } else {
    console.log(`⚠️  Not found: ${from.substring(0, 60)}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`\nDone. ${count}/${replacements.length} replacements applied.`);
