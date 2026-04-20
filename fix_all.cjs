const fs = require('fs');
let f = fs.readFileSync('App.tsx', 'utf8');

// ── 1. RESTORE EMOJI PANEL ────────────────────────────────────────────────────
// Find and replace the entire emojiCats block
const startMarker = 'const emojiCats: Record<string, {icon:string; emojis:string[]}> = {';
const endMarker = "custom:    { icon:'⭐', emojis:[] },";

const si = f.indexOf(startMarker);
const ei = f.indexOf(endMarker);

if (si !== -1 && ei !== -1) {
  const endLine = f.indexOf('\n', ei) + 1;
  const newBlock = `const emojiCats: Record<string, {icon:string; emojis:string[]}> = {
                  recientes: { icon:'🕐', emojis:['😀','😂','😍','🥰','😎','🤔','😭','😡','👍','❤️','🔥','✅','🎉','💯','🙏','😊','🤣','😅','😆','😋','😜','🤩','🥳','😴','🤯','🥺','😤','😏','🤗','😇'] },
                  caras:     { icon:'😀', emojis:['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
                  gestos:    { icon:'👋', emojis:['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','👀','👁️','👅','👄','💋'] },
                  personas:  { icon:'👤', emojis:['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷','👮','🕵️','💂','🥷','👷','🤴','👸','👳','👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸','🦹','🧙','🧝','🧛','🧟','🧞','🧜','🧚','👫','👬','👭','💏','💑','👨‍👩‍👦'] },
                  animales:  { icon:'🐶', emojis:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿️','🦔'] },
                  comida:    { icon:'🍎', emojis:['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥤','🧋','☕','🍵','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🥄','🍴','🍽️','🥢','🧂'] },
                  viajes:    { icon:'✈️', emojis:['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🚏','⛽','🚨','🚥','🚦','🛑','🚧','⚓','⛵','🚤','🛥️','🛳️','⛴️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚀','🛸','🌍','🌎','🌏','🗺️','🧭','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🛖','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋','⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','🎠','🎡','🎢','💈','🎪'] },
                  objetos:   { icon:'💡', emojis:['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','💽','💾','💿','📀','🧮','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🧯','💰','💴','💵','💶','💷','💸','💳','🪙','💹','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','🛡️','🔧','🪛','🔩','⚙️','🗜️','⚖️','🔗','⛓️','🪝','🧲','🪜','🧰','🧪','🧫','🧬','🔭','🔬','🩺','🩹','💊','💉','🩸','🌡️','🧹','🪣','🧺','🧻','🚽','🚰','🚿','🛁','🪥','🧼','🪒','🧴','🧷','🧹','🧺','🧻'] },
                  simbolos:  { icon:'❤️', emojis:['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣','⏏️','▶️','⏸️','⏹️','⏺️','⏭️','⏮️','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','🎵','🎶','➕','➖','➗','✖️','♾️','💲','💱','™️','©️','®️','〰️','➰','➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔷','🔶','🔹','🔸','🔲','🔳','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯️','♠️','♣️','♥️','♦️','🃏','🎴','🀄'] },
                  custom:    { icon:'⭐', emojis:[] },
                };`;

  f = f.substring(0, si) + newBlock + f.substring(endLine);
  console.log('✅ Emoji panel restored');
} else {
  console.log('⚠️ Could not find emoji block, si='+si+' ei='+ei);
}

// ── 2. FIX REMAINING \uFFFD ───────────────────────────────────────────────────
const fixes = [
  [/Mensajer\uFFFDa/g, 'Mensajería'],
  [/mensajer\uFFFDa/g, 'mensajería'],
  [/Grabaci\uFFFDn/g, 'Grabación'],
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
  [/a\uFFFDo/g, 'año'],
  [/A\uFFFDo/g, 'Año'],
  [/espa\uFFFDol/g, 'español'],
  [/Espa\uFFFDol/g, 'Español'],
  [/peque\uFFFDo/g, 'pequeño'],
  [/se\uFFFDal/g, 'señal'],
  [/Se\uFFFDal/g, 'Señal'],
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
  // Degree symbol
  [/(\d+)\uFFFD([\s<'"°,\n])/g, '$1°$2'],
  [/(\d+)\uFFFD$/gm, '$1°'],
  // Bullet points
  [/\uFFFD{3,}/g, '· · · · · ·'],
  // Remove remaining isolated replacement chars
  [/\uFFFD/g, ''],
];

fixes.forEach(([p, r]) => { f = f.replace(p, r); });
console.log('✅ Encoding fixes applied');

// ── 3. FIX TRANSACTION ICONS ──────────────────────────────────────────────────
// ? Recibido / ? Enviado in transaction history
f = f.replace(/'[?]\s*Recibido'/g, "'↙️ Recibido'");
f = f.replace(/'[?]\s*Enviado'/g, "'↗️ Enviado'");
f = f.replace(/'[?]\s*Completada'/g, "'✅ Completada'");
f = f.replace(/'[?]\s*Pendiente'/g, "'⏳ Pendiente'");
f = f.replace(/'[?]\s*Fallida'/g, "'❌ Fallida'");
console.log('✅ Transaction icons fixed');

// ── 4. FIX BALANCE DOTS ───────────────────────────────────────────────────────
// Replace bullet chars with CSS-safe dots
f = f.replace(/· · · · · ·/g, '● ● ● ●');
console.log('✅ Balance dots fixed');

// ── 5. VERIFY ─────────────────────────────────────────────────────────────────
const remaining = (f.match(/\uFFFD/g) || []).length;
const eyeCount = (f.match(/'👁'/g) || []).length;
console.log(`Remaining \\uFFFD: ${remaining}`);
console.log(`Eye emoji count: ${eyeCount} (should be ≤5)`);

fs.writeFileSync('App.tsx', f, 'utf8');
console.log('✅ App.tsx saved');
