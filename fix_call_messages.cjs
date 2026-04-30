const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

const startMarker = '/* -- LLAMADA -- */}';
const endMarker = "                        </div>\r\n                      ) : (msg as any).type === 'audio'";

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker, startIdx);

console.log('start:', startIdx, 'end:', endIdx);

if (startIdx > 0 && endIdx > 0) {
  const newCall = `/* -- LLAMADA estilo EGCHAT -- */}
                      {(msg as any).type === 'call' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 4px', minWidth: '200px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: \`1.5px solid \${(msg as any).callStatus === 'missed' ? '#ef4444' : '#00c8a0'}\` }}>
                            {(msg as any).callStatus === 'missed' ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8"/>
                                <line x1="23" y1="1" x2="1" y2="23"/>
                              </svg>
                            ) : (msg as any).callType === 'video' ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="1.8" strokeLinecap="round">
                                <polygon points="23 7 16 12 23 17 23 7"/>
                                <rect x="1" y="5" width="15" height="14" rx="2"/>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="1.8" strokeLinecap="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: (msg as any).callStatus === 'missed' ? '#ef4444' : '#111827', marginBottom: '2px' }}>
                              {(msg as any).callStatus === 'missed' ? 'Llamada perdida' : (msg as any).callStatus === 'outgoing' ? 'Llamada saliente' : 'Llamada recibida'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {(msg as any).callType === 'video' ? 'Videollamada' : 'Llamada de voz'}
                              {(msg as any).callDuration > 0 && \` · \${String(Math.floor((msg as any).callDuration/60)).padStart(2,'0')}:\${String((msg as any).callDuration%60).padStart(2,'0')}\`}
                            </div>
                          </div>
                          <button onClick={() => { if (selectedChat) startCall((msg as any).callType || 'audio', selectedChat); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', color: '#00c8a0', flexShrink: 0 }}>
                            {(msg as any).callType === 'video' ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            )}
                          </button>`;
  
  c = c.substring(0, startIdx) + newCall + c.substring(endIdx);
  fs.writeFileSync('App.tsx', c, 'utf8');
  console.log('Done');
} else {
  console.log('Not found');
}
