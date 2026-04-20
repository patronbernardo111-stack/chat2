const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');
let fixes = 0;

// ============================================================
// FIX 1: Chat list preview - clean corrupted emoji text
// The lastMsg from backend may contain emoji chars that render as ??
// Replace emoji-prefixed call messages with clean text
// ============================================================
const old1 = `                        <div style={{ fontSize:'13px', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px' }}>{lastMsg || 'Sin mensajes'}</div>`;
const new1 = `                        <div style={{ fontSize:'13px', color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px' }}>
                          {(() => {
                            if (!lastMsg) return 'Sin mensajes';
                            // Clean call message previews
                            if (lastMsg.includes('Llamada perdida')) return '📵 Llamada perdida';
                            if (lastMsg.includes('Llamada saliente')) return '📞 Llamada saliente';
                            if (lastMsg.includes('Llamada')) return '📞 Llamada';
                            if (lastMsg.includes('Mensaje de voz')) return '🎤 Mensaje de voz';
                            if (lastMsg.includes('Foto')) return '📷 Foto';
                            if (lastMsg.includes('Video')) return '🎥 Video';
                            // Remove any corrupted ?? sequences
                            return lastMsg.replace(/\?\?/g, '').trim() || 'Sin mensajes';
                          })()}
                        </div>`;
if (c.includes(old1)) { c = c.replace(old1, new1); fixes++; console.log('Fix1: chat preview clean emojis'); }
else console.log('WARN Fix1: chat preview not found');

// ============================================================
// FIX 2: Chat header - make it position fixed so it doesn't hide behind top bar
// ============================================================
const old2 = `              {/* Header conversacin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px 6px 4px', background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>`;
const new2 = `              {/* Header conversacin */}
              <div style={{ position: 'fixed', top: 'calc(56px + env(safe-area-inset-top, 0px))', left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px 6px 4px', background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>`;
if (c.includes(old2)) { c = c.replace(old2, new2); fixes++; console.log('Fix2: chat header fixed position'); }
else console.log('WARN Fix2: chat header not found');

// Also add padding-top to messages area to compensate for fixed header
const old2b = `              {/* Barra b?squeda en el chat */}`;
const new2b = `              {/* Spacer for fixed header */}
              <div style={{ height: '60px', flexShrink: 0 }} />
              {/* Barra b?squeda en el chat */}`;
if (c.includes(old2b) && !c.includes('Spacer for fixed header')) { c = c.replace(old2b, new2b); fixes++; console.log('Fix2b: header spacer added'); }
else console.log('WARN Fix2b: spacer already exists or not found');

// ============================================================
// FIX 3: Send button - remove colored background, make it clean
// ============================================================
const old3 = `                    style={{ background: 'linear-gradient(135deg,#00c8a0,#00b4e6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#fff', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
const new3 = `                    style={{ background: 'none', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: '#00c8a0', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
if (c.includes(old3)) { c = c.replace(old3, new3); fixes++; console.log('Fix3: send button redesign'); }
else console.log('WARN Fix3: send button not found');

// ============================================================
// FIX 4: Input bar container - cleaner WhatsApp-style design
// ============================================================
const old4 = `                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(249,250,251,0.95)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '22px', minHeight: '44px', padding: '0 10px 0 16px', gap: '6px' }}>`;
const new4 = `                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', border: 'none', borderRadius: '24px', minHeight: '44px', padding: '0 8px 0 16px', gap: '4px' }}>`;
if (c.includes(old4)) { c = c.replace(old4, new4); fixes++; console.log('Fix4: input container redesign'); }
else console.log('WARN Fix4: input container not found');

// ============================================================
// FIX 5: Input bar outer wrapper - cleaner background
// ============================================================
const old5 = `              {/* Barra de input */}
              <div style={{
                flexShrink: 0,
                background: '#FFFFFF',
                borderTop: '1px solid rgba(0,0,0,0.07)',
                padding: '10px 10px',
                paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>`;
const new5 = `              {/* Barra de input */}
              <div style={{
                flexShrink: 0,
                background: '#f0f2f5',
                borderTop: 'none',
                padding: '8px 8px',
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>`;
if (c.includes(old5)) { c = c.replace(old5, new5); fixes++; console.log('Fix5: input bar wrapper redesign'); }
else console.log('WARN Fix5: input bar wrapper not found');

// ============================================================
// FIX 6: Attach (+) button - cleaner style
// ============================================================
const old6 = `                <button onClick={() => { setShowChatAttach(p => !p); setShowChatEmojis(false); }}
                  style={{ background: showChatAttach ? 'rgba(0,180,230,0.15)' : '#f5f6f7', border: \`1px solid \${showChatAttach ? 'rgba(0,180,230,0.3)' : '#f3f4f6'}\`, borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: showChatAttach ? '#00b4e6' : '#9ca3af', flexShrink: 0, transition: 'all 0.15s' }}>`;
const new6 = `                <button onClick={() => { setShowChatAttach(p => !p); setShowChatEmojis(false); }}
                  style={{ background: 'none', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', color: showChatAttach ? '#00b4e6' : '#9ca3af', flexShrink: 0 }}>`;
if (c.includes(old6)) { c = c.replace(old6, new6); fixes++; console.log('Fix6: attach button redesign'); }
else console.log('WARN Fix6: attach button not found');

// ============================================================
// FIX 7: Emoji button - cleaner style
// ============================================================
const old7 = `                <button onClick={() => { setShowChatEmojis(p => !p); setShowChatAttach(false); }}
                  style={{ background: showChatEmojis ? '#FEF3C7' : 'transparent', border: 'none', borderRadius: '50%', color: showChatEmojis ? '#f59e0b' : '#6b7280', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0, transition: 'all 0.15s' }}>`;
const new7 = `                <button onClick={() => { setShowChatEmojis(p => !p); setShowChatAttach(false); }}
                  style={{ background: 'none', border: 'none', borderRadius: '50%', color: showChatEmojis ? '#f59e0b' : '#9ca3af', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0 }}>`;
if (c.includes(old7)) { c = c.replace(old7, new7); fixes++; console.log('Fix7: emoji button redesign'); }
else console.log('WARN Fix7: emoji button not found');

// ============================================================
// FIX 8: Mic button - cleaner style
// ============================================================
const old8 = `                  style={{ background: isRecordingAudio ? '#ef4444' : 'transparent', border: 'none', borderRadius: '50%', color: isRecordingAudio ? '#fff' : '#6b7280', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0, transition: 'all 0.15s', position: 'relative' }}>`;
const new8 = `                  style={{ background: isRecordingAudio ? '#ef4444' : 'none', border: 'none', borderRadius: '50%', color: isRecordingAudio ? '#fff' : '#9ca3af', cursor: 'pointer', outline: 'none', padding: '8px', display: 'flex', flexShrink: 0, position: 'relative' }}>`;
if (c.includes(old8)) { c = c.replace(old8, new8); fixes++; console.log('Fix8: mic button redesign'); }
else console.log('WARN Fix8: mic button not found');

fs.writeFileSync('App.tsx', c, 'utf8');
console.log('\n=== Total fixes applied:', fixes, '===');
