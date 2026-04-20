const fs = require('fs');

// Files to fix
const files = ['App.tsx', 'ServiciosModules.tsx', 'Lia25View.tsx', 'WalletSystem.tsx', 'WalletModals.tsx', 'BancosModule.tsx', 'SupermercadosModule.tsx', 'AuthScreen.tsx', 'EstadosView.tsx', 'CemacView.tsx', 'MiTaxiView.tsx', 'ApuestasView.tsx', 'ChatConversation.tsx', 'ContactProfileModal.tsx', 'CameraModal.tsx', 'PhotoEditorModal.tsx', 'Avatar.tsx', 'AddContactModal.tsx'];

// Map of corrupted sequences to correct characters
// The file was saved as Latin-1 but read as UTF-8, causing mojibake
const fixes = [
  // The replacement char \uFFFD appears where multi-byte UTF-8 chars were mangled
  // Common Spanish patterns with corrupted chars
  [/Mensajer\uFFFDa/g, 'Mensajería'],
  [/mensajer\uFFFDa/g, 'mensajería'],
  [/Grabaci\uFFFDn/g, 'Grabación'],
  [/grabaci\uFFFDn/g, 'grabación'],
  [/im\uFFFDgenes/g, 'imágenes'],
  [/Im\uFFFDgenes/g, 'Imágenes'],
  [/vibraci\uFFFDn/g, 'vibración'],
  [/est\uFFFDn/g, 'están'],
  [/men\uFFFD\b/g, 'menú'],
  [/Men\uFFFD\b/g, 'Menú'],
  [/A\uFFFDadir/g, 'Añadir'],
  [/a\uFFFDadir/g, 'añadir'],
  [/Dep\uFFFDsito/g, 'Depósito'],
  [/dep\uFFFDsito/g, 'depósito'],
  [/Mar\uFFFDa/g, 'María'],
  [/autenticaci\uFFFDn/g, 'autenticación'],
  [/Autenticaci\uFFFDn/g, 'Autenticación'],
  [/ser\uFFFD\b/g, 'será'],
  [/L\uFFFDmites/g, 'Límites'],
  [/l\uFFFDmites/g, 'límites'],
  [/Tel\uFFFDfono/g, 'Teléfono'],
  [/tel\uFFFDfono/g, 'teléfono'],
  [/Pr\uFFFDstamos/g, 'Préstamos'],
  [/pr\uFFFDstamos/g, 'préstamos'],
  [/M\uFFFDviles/g, 'Móviles'],
  [/m\uFFFDviles/g, 'móviles'],
  [/M\uFFFDvil/g, 'Móvil'],
  [/m\uFFFDvil/g, 'móvil'],
  [/Cr\uFFFDditos/g, 'Créditos'],
  [/cr\uFFFDditos/g, 'créditos'],
  [/Consultor\uFFFDa/g, 'Consultoría'],
  [/Inversi\uFFFDn/g, 'Inversión'],
  [/inversi\uFFFDn/g, 'inversión'],
  [/Depu\uFFFDsito/g, 'Depósito'],
  [/l\uFFFDnea/g, 'línea'],
  [/L\uFFFDnea/g, 'Línea'],
  [/transcripci\uFFFDn/g, 'transcripción'],
  [/usar\uFFFDs/g, 'usarás'],
  [/\uFFFDCu\uFFFDl/g, '¿Cuál'],
  [/Cu\uFFFDl/g, 'Cuál'],
  [/\uFFFDHola/g, '¡Hola'],
  [/Adem\uFFFDs/g, 'Además'],
  [/adem\uFFFDs/g, 'además'],
  [/autom\uFFFDtica/g, 'automática'],
  [/Autom\uFFFDtica/g, 'Automática'],
  [/autom\uFFFDtico/g, 'automático'],
  [/bot\uFFFDn/g, 'botón'],
  [/Bot\uFFFDn/g, 'Botón'],
  [/ubicaci\uFFFDn/g, 'ubicación'],
  [/Ubicaci\uFFFDn/g, 'Ubicación'],
  [/condici\uFFFDn/g, 'condición'],
  [/Condici\uFFFDn/g, 'Condición'],
  [/a\uFFFDn\b/g, 'aún'],
  [/versi\uFFFDn/g, 'versión'],
  [/Versi\uFFFDn/g, 'Versión'],
  [/sesi\uFFFDn/g, 'sesión'],
  [/Sesi\uFFFDn/g, 'Sesión'],
  [/direcci\uFFFDn/g, 'dirección'],
  [/Direcci\uFFFDn/g, 'Dirección'],
  [/notificaci\uFFFDn/g, 'notificación'],
  [/Notificaci\uFFFDn/g, 'Notificación'],
  [/configuraci\uFFFDn/g, 'configuración'],
  [/Configuraci\uFFFDn/g, 'Configuración'],
  [/informaci\uFFFDn/g, 'información'],
  [/Informaci\uFFFDn/g, 'Información'],
  [/transacci\uFFFDn/g, 'transacción'],
  [/Transacci\uFFFDn/g, 'Transacción'],
  [/comunicaci\uFFFDn/g, 'comunicación'],
  [/Comunicaci\uFFFDn/g, 'Comunicación'],
  [/conexi\uFFFDn/g, 'conexión'],
  [/Conexi\uFFFDn/g, 'Conexión'],
  [/descripci\uFFFDn/g, 'descripción'],
  [/Descripci\uFFFDn/g, 'Descripción'],
  [/soluci\uFFFDn/g, 'solución'],
  [/Soluci\uFFFDn/g, 'Solución'],
  [/opci\uFFFDn/g, 'opción'],
  [/Opci\uFFFDn/g, 'Opción'],
  [/actualizaci\uFFFDn/g, 'actualización'],
  [/Actualizaci\uFFFDn/g, 'Actualización'],
  [/aplicaci\uFFFDn/g, 'aplicación'],
  [/Aplicaci\uFFFDn/g, 'Aplicación'],
  [/operaci\uFFFDn/g, 'operación'],
  [/Operaci\uFFFDn/g, 'Operación'],
  [/protecci\uFFFDn/g, 'protección'],
  [/Protecci\uFFFDn/g, 'Protección'],
  [/validaci\uFFFDn/g, 'validación'],
  [/Validaci\uFFFDn/g, 'Validación'],
  [/gesti\uFFFDn/g, 'gestión'],
  [/Gesti\uFFFDn/g, 'Gestión'],
  [/suscripci\uFFFDn/g, 'suscripción'],
  [/Suscripci\uFFFDn/g, 'Suscripción'],
  [/selecci\uFFFDn/g, 'selección'],
  [/Selecci\uFFFDn/g, 'Selección'],
  [/acci\uFFFDn/g, 'acción'],
  [/Acci\uFFFDn/g, 'Acción'],
  [/reacci\uFFFDn/g, 'reacción'],
  [/Reacci\uFFFDn/g, 'Reacción'],
  [/interacci\uFFFDn/g, 'interacción'],
  [/Interacci\uFFFDn/g, 'Interacción'],
  [/producci\uFFFDn/g, 'producción'],
  [/Producci\uFFFDn/g, 'Producción'],
  [/introducci\uFFFDn/g, 'introducción'],
  [/Introducci\uFFFDn/g, 'Introducción'],
  [/traducci\uFFFDn/g, 'traducción'],
  [/Traducci\uFFFDn/g, 'Traducción'],
  [/construcci\uFFFDn/g, 'construcción'],
  [/Construcci\uFFFDn/g, 'Construcción'],
  [/reducci\uFFFDn/g, 'reducción'],
  [/Reducci\uFFFDn/g, 'Reducción'],
  [/reproducci\uFFFDn/g, 'reproducción'],
  [/Reproducci\uFFFDn/g, 'Reproducción'],
  [/instrucci\uFFFDn/g, 'instrucción'],
  [/Instrucci\uFFFDn/g, 'Instrucción'],
  // Degree symbol
  [/(\d+)\uFFFD([\s<'"°,])/g, '$1°$2'],
  [/(\d+)\uFFFD$/gm, '$1°'],
  // Bullet points for hidden balance
  [/\uFFFD{3,}/g, '••••••'],
  // ñ patterns
  [/a\uFFFDo/g, 'año'],
  [/A\uFFFDo/g, 'Año'],
  [/espa\uFFFDol/g, 'español'],
  [/Espa\uFFFDol/g, 'Español'],
  [/peque\uFFFDo/g, 'pequeño'],
  [/Peque\uFFFDo/g, 'Pequeño'],
  [/se\uFFFDal/g, 'señal'],
  [/Se\uFFFDal/g, 'Señal'],
  [/ni\uFFFDo/g, 'niño'],
  [/Ni\uFFFDo/g, 'Niño'],
  [/due\uFFFDo/g, 'dueño'],
  [/Due\uFFFDo/g, 'Dueño'],
  [/sue\uFFFDo/g, 'sueño'],
  [/Sue\uFFFDo/g, 'Sueño'],
  [/oto\uFFFDo/g, 'otoño'],
  [/Oto\uFFFDo/g, 'Otoño'],
  [/cumplea\uFFFDos/g, 'cumpleaños'],
  [/Cumplea\uFFFDos/g, 'Cumpleaños'],
  [/ma\uFFFDana/g, 'mañana'],
  [/Ma\uFFFDana/g, 'Mañana'],
  [/compa\uFFFDero/g, 'compañero'],
  [/Compa\uFFFDero/g, 'Compañero'],
  [/espa\uFFFDa/g, 'españa'],
  [/Espa\uFFFDa/g, 'España'],
  [/campa\uFFFDa/g, 'campaña'],
  [/Campa\uFFFDa/g, 'Campaña'],
  [/ense\uFFFDanza/g, 'enseñanza'],
  [/Ense\uFFFDanza/g, 'Enseñanza'],
  // Remaining isolated replacement chars in comments/strings - replace with space
  [/\uFFFD/g, ''],
];

let totalFixed = 0;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  fixes.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    const count = (original.match(/\uFFFD/g) || []).length;
    console.log(`Fixed ${file}: ~${count} corrupted chars`);
    totalFixed += count;
  } else {
    console.log(`No changes needed: ${file}`);
  }
});

console.log(`\nTotal corrupted chars fixed: ~${totalFixed}`);
