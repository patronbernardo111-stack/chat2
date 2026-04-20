const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');
let fixes = 0;

// ── FIX 1: created_at en mensajes de FOTO local ──────────────────────────────
const photoOld = "{ id: msgId, from: 'me' as const, text: '📷 Foto', time: tm, status: 'pending' as const, type: 'image', imageUrl: localUrl } as any";
const photoNew = "{ id: msgId, from: 'me' as const, text: '📷 Foto', time: tm, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), status: 'pending' as const, type: 'image', imageUrl: localUrl } as any";
if (c.includes(photoOld)) { c = c.replace(photoOld, photoNew); fixes++; console.log('Fix1: foto created_at'); }
else console.log('Fix1: foto already ok or not found');

// ── FIX 2: created_at en mensajes de AUDIO grabado ───────────────────────────
// Buscar el mensaje de audio con timestamp pero sin created_at
const audioSearch = "timestamp: new Date().toISOString(), status: 'pending' as const, type: 'audio' as const";
const audioOld = "timestamp: new Date().toISOString(), status: 'pending' as const, type: 'audio' as const";
const audioNew = "timestamp: new Date().toISOString(), created_at: new Date().toISOString(), status: 'pending' as const, type: 'audio' as const";
if (c.includes(audioOld) && !c.includes(audioNew)) { c = c.replace(audioOld, audioNew); fixes++; console.log('Fix2: audio created_at'); }
else console.log('Fix2: audio already ok');

// ── FIX 3: created_at en mensajes de VIDEO local ─────────────────────────────
// Buscar el mensaje de video (tiene text con nombre de archivo)
const videoOld = "from: 'me' as const, text: `🎥 ${file.name} (${size} MB)`, time: tm, status: 'pending' as const }";
const videoNew = "from: 'me' as const, text: `🎥 ${file.name} (${size} MB)`, time: tm, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), status: 'pending' as const }";
if (c.includes(videoOld)) { c = c.replace(videoOld, videoNew); fixes++; console.log('Fix3: video created_at'); }
else console.log('Fix3: video already ok or not found');

// ── FIX 4: created_at en mensajes de ARCHIVO local ───────────────────────────
const fileOld = "from: 'me' as const, text: `📎 ${file.name} (${size} KB)`, time: tm, status: 'pending' as const, fileName: file.name, fileSize: size + ' KB', fileExt: ext }";
const fileNew = "from: 'me' as const, text: `📎 ${file.name} (${size} KB)`, time: tm, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), status: 'pending' as const, fileName: file.name, fileSize: size + ' KB', fileExt: ext }";
if (c.includes(fileOld)) { c = c.replace(fileOld, fileNew); fixes++; console.log('Fix4: archivo created_at'); }
else console.log('Fix4: archivo already ok or not found');

// ── FIX 5: startCall mejorado con permisos + timeout ─────────────────────────
const startCallOld = `  const startCall = async (type: 'audio' | 'video', contact: any) => {`;
if (c.includes(startCallOld) && !c.includes('Necesitas permitir acceso al microfono')) {
  // Encontrar el final de startCall
  const idx = c.indexOf(startCallOld);
  const endMarker = '  };\n\n  // Añadir registro de llamada';
  const endIdx = c.indexOf(endMarker, idx);
  if (endIdx > 0) {
    const newStartCall = `  const startCall = async (type: 'audio' | 'video', contact: any) => {
    const targetUserId = contact?.user_id?.toString()
      || contact?.participant_id?.toString()
      || contact?.id?.toString()
      || '';
    const isRealUser = targetUserId && targetUserId.includes('-') && targetUserId.length > 20;

    // Pedir permisos de micrófono/cámara primero
    try {
      const constraints = type === 'video'
        ? { audio: true, video: { facingMode: 'user' as const } }
        : { audio: true, video: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
    } catch {
      showToast('Necesitas permitir acceso al microfono', 'error');
      return;
    }

    setActiveCall({ type, contact, status: 'calling' });
    setCallDuration(0); setIsMuted(false); setIsCameraOff(false);
    startDialingTone();

    if (isRealUser) {
      try { await webrtc.startCall(type, targetUserId); }
      catch { setTimeout(() => setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null), 2000); }
    } else {
      setTimeout(() => setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null), 2000);
    }

    // Timeout 30s sin respuesta
    setTimeout(() => {
      setActiveCall(prev => {
        if (prev && prev.status === 'calling') {
          stopDialingTone(); stopRingtone();
          showToast('Sin respuesta', 'info');
          return null;
        }
        return prev;
      });
    }, 30000);
  }`;
    c = c.substring(0, idx) + newStartCall + c.substring(endIdx);
    fixes++;
    console.log('Fix5: startCall mejorado');
  }
} else console.log('Fix5: startCall already ok');

// ── FIX 6: Iconos de apps con imágenes PNG ───────────────────────────────────
const appsOld = `            { id: 'estados',  label: 'Estados',   color: '#7c3aed', icon: renderIcon('estados',  42) },
            { id: 'apuestas', label: 'Juegos',     color: '#b45309', icon: renderIcon('apuestas', 42) },
            { id: 'cemac',    label: 'CEMAC',      color: '#065f46', icon: renderIcon('cemac',    42) },
            { id: 'mitaxi',   label: 'MiTaxi',     color: '#92400e', icon: renderIcon('mitaxi',   42) },`;
const appsNew = `            { id: 'estados',  label: 'ESTADOS',  color: '#7c3aed', icon: renderIcon('estados',  42), img: '/assets/apps/estados.png' },
            { id: 'apuestas', label: 'JUEGOS',   color: '#b45309', icon: renderIcon('apuestas', 42), img: '/assets/apps/apuestas.png' },
            { id: 'cemac',    label: 'CEMAC',    color: '#065f46', icon: renderIcon('cemac',    42), img: '/assets/apps/cemac.png' },
            { id: 'mitaxi',   label: 'MITAXI',   color: '#92400e', icon: renderIcon('mitaxi',   42), img: '/assets/apps/mitaxi.png' },`;
if (c.includes(appsOld)) { c = c.replace(appsOld, appsNew); fixes++; console.log('Fix6: app icons with images'); }
else console.log('Fix6: app icons already ok or not found');

// ── FIX 7: Render de botones de apps con imagen ──────────────────────────────
const btnOld = `          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setPreviousView(currentView); setCurrentView(item.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '4px 0', transition: 'transform 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{
                width: '80px', height: '80px', borderRadius: '22px',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.color,
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600', textAlign: 'center', lineHeight: '1.2', maxWidth: '80px' }}>{item.label}</span>
            </button>
          ))}`;
const btnNew = `          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setPreviousView(currentView); setCurrentView(item.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '4px 0', transition: 'transform 0.15s ease', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <img
                  src={(item as any).img}
                  alt={item.label}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: '2px', boxSizing: 'border-box' }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const next = target.nextElementSibling as HTMLElement;
                    if (next) next.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: item.color }}>
                  {item.icon}
                </div>
              </div>
              <span style={{ fontSize: '11px', color: '#111827', fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
            </button>
          ))}`;
if (c.includes(btnOld)) { c = c.replace(btnOld, btnNew); fixes++; console.log('Fix7: app button render with image'); }
else console.log('Fix7: app button already ok or not found');

fs.writeFileSync('App.tsx', c, 'utf8');
console.log(`\nTotal fixes: ${fixes}`);
console.log('Verification:');
console.log('  foto created_at:', c.includes("text: '📷 Foto', time: tm, timestamp:"));
console.log('  audio created_at:', c.includes("created_at: new Date().toISOString(), status: 'pending' as const, type: 'audio'"));
console.log('  startCall timeout:', c.includes('Necesitas permitir acceso al microfono'));
console.log('  app images:', c.includes("img: '/assets/apps/estados.png'"));
console.log('  app render:', c.includes("objectFit: 'contain'"));
