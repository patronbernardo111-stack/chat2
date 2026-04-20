const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');
let fixes = 0;

// Fix 1: audio created_at
const audioOld = "text: `\uD83C\uDFA4 Mensaje de voz`, time, status: 'pending' as const, type: 'audio' as const, audioUrl: localUrl";
const audioNew = "text: `\uD83C\uDFA4 Mensaje de voz`, time, timestamp: new Date().toISOString(), created_at: new Date().toISOString(), status: 'pending' as const, type: 'audio' as const, audioUrl: localUrl";
if (c.includes(audioOld)) { c = c.replace(audioOld, audioNew); fixes++; console.log('Fix1: audio created_at'); }
else {
  // Try with emoji bytes
  const idx = c.indexOf('Mensaje de voz`, time, status:');
  if (idx > 0) {
    const before = c.substring(0, idx + 'Mensaje de voz`, time, '.length);
    const after = c.substring(idx + 'Mensaje de voz`, time, '.length);
    c = before + "timestamp: new Date().toISOString(), created_at: new Date().toISOString(), " + after;
    fixes++; console.log('Fix1b: audio created_at via index');
  } else console.log('Fix1: audio not found');
}

// Fix 2: startCall con permisos y timeout
if (!c.includes('Necesitas permitir acceso al microfono')) {
  const idx = c.indexOf('const startCall = async');
  const endMarker = '\n  };\n\n  // A';
  const endIdx = c.indexOf(endMarker, idx);
  if (idx > 0 && endIdx > 0) {
    const newStartCall = `  const startCall = async (type: 'audio' | 'video', contact: any) => {
    const targetUserId = contact?.user_id?.toString()
      || contact?.participant_id?.toString()
      || contact?.id?.toString()
      || '';
    const isRealUser = targetUserId && targetUserId.includes('-') && targetUserId.length > 20;
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
    fixes++; console.log('Fix2: startCall mejorado');
  } else console.log('Fix2: startCall markers not found');
} else console.log('Fix2: startCall already ok');

// Fix 3: App icons con imágenes
if (!c.includes("img: '/assets/apps/estados.png'")) {
  c = c.replace("{ id: 'estados',  label: 'Estados',   color: '#7c3aed', icon: renderIcon('estados',  42) },",
                "{ id: 'estados',  label: 'ESTADOS',  color: '#7c3aed', icon: renderIcon('estados',  42), img: '/assets/apps/estados.png' },");
  c = c.replace("{ id: 'apuestas', label: 'Juegos',     color: '#b45309', icon: renderIcon('apuestas', 42) },",
                "{ id: 'apuestas', label: 'JUEGOS',   color: '#b45309', icon: renderIcon('apuestas', 42), img: '/assets/apps/apuestas.png' },");
  c = c.replace("{ id: 'cemac',    label: 'CEMAC',      color: '#065f46', icon: renderIcon('cemac',    42) },",
                "{ id: 'cemac',    label: 'CEMAC',    color: '#065f46', icon: renderIcon('cemac',    42), img: '/assets/apps/cemac.png' },");
  c = c.replace("{ id: 'mitaxi',   label: 'MiTaxi',     color: '#92400e', icon: renderIcon('mitaxi',   42) },",
                "{ id: 'mitaxi',   label: 'MITAXI',   color: '#92400e', icon: renderIcon('mitaxi',   42), img: '/assets/apps/mitaxi.png' },");
  if (c.includes("img: '/assets/apps/estados.png'")) { fixes++; console.log('Fix3: app icons with images'); }
  else console.log('Fix3: app icons labels not found - trying alternate');
} else console.log('Fix3: app icons already ok');

// Fix 4: Render de botones con imagen
const btnOld = `style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '4px 0', transition: 'transform 0.15s ease' }}
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
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600', textAlign: 'center', lineHeight: '1.2', maxWidth: '80px' }}>{item.label}</span>`;
const btnNew = `style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '4px 0', transition: 'transform 0.15s ease', position: 'relative' }}
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
              <span style={{ fontSize: '11px', color: '#111827', fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>`;
if (c.includes(btnOld)) { c = c.replace(btnOld, btnNew); fixes++; console.log('Fix4: app button render'); }
else console.log('Fix4: app button already ok or not found');

fs.writeFileSync('App.tsx', c, 'utf8');
console.log('\nTotal fixes:', fixes);
console.log('audio created_at:', c.includes('created_at: new Date().toISOString(), status:'));
console.log('startCall timeout:', c.includes('Necesitas permitir acceso al microfono'));
console.log('app images:', c.includes("img: '/assets/apps/estados.png'"));
console.log('app render:', c.includes("objectFit: 'contain'"));
