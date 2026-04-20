const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

const startMarker = '                {/* Llamada de audio */}';
const endMarker = '                </div>\r\n              </div>\r\n\r\n              {/* Dropdown';
const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker, startIdx);

if (startIdx > 0 && endIdx > 0) {
  const newButtons = `                {/* Llamada de audio */}
                  <button onClick={() => startCall('audio', sc)}
                    style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', outline: 'none', padding: '6px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </button>
                  {/* Videollamada */}
                  <button onClick={() => startCall('video', sc)}
                    style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', outline: 'none', padding: '6px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                  </button>
                  {/* Camara */}
                  <button onClick={() => { setLiveCameraChatId(sc.id?.toString()||''); setShowLiveCamera(true); }}
                    style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', outline: 'none', padding: '6px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </button>
                  {/* Galeria */}
                  <button onClick={() => setShowWallpaperCatalog(true)}
                    style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', outline: 'none', padding: '6px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </button>
                  {/* Tres puntos */}
                  <button onClick={e => { e.stopPropagation(); setShowChatMenu(p => !p); }}
                    style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', outline: 'none', padding: '6px', display: 'flex', borderRadius: '50%' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>`;
  c = c.substring(0, startIdx) + newButtons + c.substring(endIdx);
  fs.writeFileSync('App.tsx', c, 'utf8');
  console.log('Done - buttons replaced');
} else {
  console.log('Markers not found. start:', startIdx, 'end:', endIdx);
}
