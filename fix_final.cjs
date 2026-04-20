const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');
let fixes = 0;

// FIX 1: Emojis corruptos en preview de chats (lista de mensajes)
// Los ?? en el preview vienen del lastMsg del backend
// Ya tenemos el bloque que los filtra, pero necesitamos asegurarnos
// que cualquier ?? restante se limpie
const old1 = "// Limpiar cualquier ?? restante del texto\n                            return lastMsg.replace(/\\?\\?/g, '').trim() || 'Sin mensajes';";
const new1 = "// Limpiar cualquier ?? restante del texto\n                            const cleaned = lastMsg.replace(/\\?\\?/g, '').trim();\n                            return cleaned || 'Sin mensajes';";
if (c.includes(old1)) { c = c.replace(old1, new1); fixes++; console.log('Fix1: preview cleanup'); }

// FIX 2: Header del chat - hacerlo position fixed para que no se esconda
// El header ya tiene position fixed en el código actual, verificar
const hasFixed = c.includes("position: 'fixed', top: 'calc(56px + env(safe-area-inset-top, 44px))', left: 0, right: 0, zIndex: 10");
console.log('Header fixed:', hasFixed);

// FIX 3: Botón enviar - rediseñar sin fondo de color
// Buscar el botón de enviar actual
const sendBtnOld = `                            style={{ background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#fff', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
const sendBtnNew = `                            style={{ background: 'none', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#00c8a0', flexShrink: 0, transition: 'opacity 0.15s' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
if (c.includes(sendBtnOld)) { c = c.replace(sendBtnOld, sendBtnNew); fixes++; console.log('Fix3: send button redesign'); }
else console.log('Fix3: send button not found - checking...');

// FIX 4: Barra de typing - mejorar diseño
// Buscar el contenedor del input
const inputContainerOld = `style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(249,250,251,0.95)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '22px', minHeight: '44px', padding: '0 10px 0 16px', gap: '6px' }}>`;
const inputContainerNew = `style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', border: 'none', borderRadius: '24px', minHeight: '44px', padding: '0 12px 0 16px', gap: '6px' }}>`;
if (c.includes(inputContainerOld)) { c = c.replace(inputContainerOld, inputContainerNew); fixes++; console.log('Fix4: input container redesign'); }
else console.log('Fix4: input container not found');

// FIX 5: Barra de typing wrapper - fondo blanco limpio
const inputWrapperOld = `className="chat-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>`;
const inputWrapperNew = `className="chat-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px', paddingRight: '4px' }}>`;
if (c.includes(inputWrapperOld)) { c = c.replace(inputWrapperOld, inputWrapperNew); fixes++; console.log('Fix5: input wrapper redesign'); }
else console.log('Fix5: input wrapper not found');

// FIX 6: Botón + (adjuntar) - más limpio
const attachBtnOld = `style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#6b7280', flexShrink: 0, transition: 'all 0.15s' }}>`;
const attachBtnNew = `style={{ background: 'none', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#9ca3af', flexShrink: 0 }}>`;
if (c.includes(attachBtnOld)) { c = c.replace(attachBtnOld, attachBtnNew); fixes++; console.log('Fix6: attach button redesign'); }
else console.log('Fix6: attach button not found');

// FIX 7: Botón micrófono - más limpio cuando no graba
const micBtnOld = `style={{ background: isRecordingAudio ? '#ef4444' : 'transparent', border: 'none', borderRadius: '50%', color: isRecordingAudio ? '#fff' : '#6b7280', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0, transition: 'all 0.15s', position: 'relative' }}>`;
const micBtnNew = `style={{ background: isRecordingAudio ? '#ef4444' : 'none', border: 'none', borderRadius: '50%', color: isRecordingAudio ? '#fff' : '#9ca3af', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0, position: 'relative' }}>`;
if (c.includes(micBtnOld)) { c = c.replace(micBtnOld, micBtnNew); fixes++; console.log('Fix7: mic button redesign'); }
else console.log('Fix7: mic button not found');

fs.writeFileSync('App.tsx', c, 'utf8');
console.log('\nTotal fixes:', fixes);
