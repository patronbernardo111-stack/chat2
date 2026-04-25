import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onBack: () => void;
  userBalance: number;
  onDebit: (amount: number) => void;
  userName?: string;
  userPhone?: string;
}
type Screen = 'home' | 'searching' | 'matched' | 'riding' | 'rating' | 'driver';

const MAPTILER_KEY = (import.meta as any).env?.VITE_MAPTILER_KEY || 'bg3FUa7es7Qn1TITIWjO';

const RIDES = [
  { id:'moto',    name:'Moto',    sub:'1 pasajero',    price:500,  eta:'2 min', color:'#F97316', bg:'#FFF7ED' },
  { id:'basic',   name:'Taxi',    sub:'4 pasajeros',   price:1000, eta:'4 min', color:'#6366F1', bg:'#EEF2FF' },
  { id:'comfort', name:'Confort', sub:'SUV 4 plazas',  price:2000, eta:'6 min', color:'#0EA5E9', bg:'#F0F9FF' },
  { id:'xl',      name:'XL',      sub:'Van 6 plazas',  price:3000, eta:'8 min', color:'#10B981', bg:'#F0FDF4' },
];
const DRIVERS = [
  { name:'Carlos Nguema',  ini:'CN', rating:4.9, trips:1240, plate:'GE-1234', car:'Toyota Corolla', bg:'#1e293b' },
  { name:'Pedro Mba Ondo', ini:'PM', rating:4.8, trips:876,  plate:'GE-5678', car:'Hyundai Accent', bg:'#312e81' },
  { name:'Maria Obiang',   ini:'MO', rating:5.0, trips:2100, plate:'GE-3456', car:'Toyota Camry',   bg:'#7c3aed' },
];
const PLACES = ['Aeropuerto de Malabo','Hotel Bahia','Mercado Central','Palacio de Justicia','Universidad Nacional','Hospital La Paz','Playa de Malabo','Estadio de Malabo','Puerto de Malabo','Barrio Ela Nguema','Sipopo Beach','Centro Comercial Paraiso','Catedral de Malabo','Colegio La Salle','Punta Europa','Ministerio de Hacienda'];
const DOCS = [
  { key:'dni',      label:'DNI / Cedula de identidad',   desc:'Documento de identidad vigente',   req:true  },
  { key:'license',  label:'Permiso de conducir',         desc:'Licencia categoria B o superior',  req:true  },
  { key:'itv',      label:'Inspeccion tecnica (ITV)',    desc:'Certificado tecnico del vehiculo', req:true  },
  { key:'owner',    label:'Titulo de propiedad',         desc:'Documento de titularidad',         req:true  },
  { key:'criminal', label:'Certificado de antecedentes', desc:'Antecedentes penales',             req:true  },
  { key:'insurance',label:'Seguro del vehiculo',         desc:'Poliza de seguro (opcional)',      req:false },
];

const LiveMap: React.FC<{ h?: number | string }> = ({ h = 260 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (!ref.current || inst.current) return;
    import('@maptiler/sdk').then(sdk => {
      sdk.config.apiKey = MAPTILER_KEY;
      const m = new sdk.Map({ container: ref.current!, style: sdk.MapStyle.STREETS, center: [8.7741, 3.7523], zoom: 13, attributionControl: false, navigationControl: false });
      inst.current = m;
      m.on('load', () => { new sdk.Marker({ color: '#6366F1' }).setLngLat([8.7741, 3.7523]).addTo(m); });
    }).catch(() => setErr(true));
    return () => { inst.current?.remove(); inst.current = null; };
  }, []);
  if (err) return (
    <div style={{ height: h, background: 'linear-gradient(135deg,#e0e7ff,#f0fdf4)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
      <span style={{ fontSize:32 }}>🗺️</span>
      <span style={{ fontSize:13, color:'#6B7280', fontWeight:500 }}>Malabo, Guinea Ecuatorial</span>
    </div>
  );
  return <div ref={ref} style={{ height: h, width:'100%' }} />;
};

export const MiTaxiView: React.FC<Props> = ({ onBack, userBalance = 0, onDebit }) => {
  const [screen, setScreen]   = useState<Screen>('home');
  const [origin, setOrigin]   = useState('');
  const [dest, setDest]       = useState('');
  const [sugg, setSugg]       = useState<string[]>([]);
  const [focus, setFocus]     = useState<'o'|'d'|null>(null);
  const [ride, setRide]       = useState(RIDES[1]);
  const [driver, setDriver]   = useState(DRIVERS[0]);
  const [pct, setPct]         = useState(0);
  const [progress, setProgress] = useState(0);
  const [stars, setStars]     = useState(0);
  const [hover, setHover]     = useState(0);
  const [rated, setRated]     = useState(false);
  const [dtab, setDtab]       = useState<'info'|'vehicle'|'docs'>('info');
  const [form, setForm]       = useState({ name:'', phone:'', license:'', brand:'', model:'', year:'', color:'', plate:'', type:'sedan' });
  const [docs, setDocs]       = useState<Record<string,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const timer = useRef<any>(null);

  const upDoc = (k: string, f: File|null) => { if (f) setDocs(d => ({...d, [k]: f.name})); };
  const reqDone = DOCS.filter(d => d.req).every(d => docs[d.key]);
  const canGo = origin.trim().length > 0 && dest.trim().length > 0;

  useEffect(() => {
    if (screen === 'searching') {
      setPct(0);
      timer.current = setInterval(() => setPct(p => {
        if (p >= 100) { clearInterval(timer.current); setDriver(DRIVERS[Math.floor(Math.random()*DRIVERS.length)]); setScreen('matched'); return 100; }
        return p + 3;
      }), 80);
    }
    if (screen === 'riding') {
      setProgress(0);
      timer.current = setInterval(() => setProgress(p => {
        if (p >= 100) { clearInterval(timer.current); return 100; }
        return p + 0.4;
      }), 120);
    }
    return () => clearInterval(timer.current);
  }, [screen]);

  const onSugg = (val: string, field: 'o'|'d') => {
    if (field === 'o') setOrigin(val); else setDest(val);
    setSugg(val.length > 0 ? PLACES.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0,5) : []);
  };

  const BG = '#F8FAFF';
  const CARD = '#FFFFFF';
  const BORDER = '#EEF0F8';
  const TEXT = '#0F172A';
  const SUB = '#64748B';
  const ACCENT = '#6366F1';
  const ACCENT_L = '#EEF2FF';
  const GREEN = '#10B981';
  const RED = '#EF4444';

  const wrapStyle: React.CSSProperties = { position:'fixed', inset:0, background:BG, display:'flex', flexDirection:'column', fontFamily:"'Inter',system-ui,sans-serif", zIndex:600, color:TEXT };
  const cardStyle: React.CSSProperties = { background:CARD, borderRadius:20, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(99,102,241,0.06)' };
  const btnStyle = (disabled=false): React.CSSProperties => ({ width:'100%', padding:'16px', background: disabled ? '#E2E8F0' : ACCENT, color: disabled ? '#94A3B8' : '#fff', border:'none', borderRadius:16, fontSize:16, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer', transition:'all 0.2s' });
  const fieldStyle = (active=false): React.CSSProperties => ({ background: active ? '#fff' : '#F1F5F9', borderRadius:14, padding:'14px 16px', border: active ? '1.5px solid ' + ACCENT : '1.5px solid transparent', transition:'all 0.2s' });
  const hdrStyle: React.CSSProperties = { display:'flex', alignItems:'center', gap:14, padding:'16px 20px', background:'#fff', borderBottom:'1px solid ' + BORDER };
  const backBtn: React.CSSProperties = { background:'none', border:'none', cursor:'pointer', padding:6, borderRadius:10, display:'flex', alignItems:'center' };

  // DRIVER SCREEN
  if (screen === 'driver') return (
    <div style={wrapStyle}>
      <div style={hdrStyle}>
        <button style={backBtn} onClick={() => setScreen('home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <div style={{ fontSize:17, fontWeight:700 }}>Ser conductor</div>
          <div style={{ fontSize:12, color:SUB }}>Registrate en la flota MiTaxi</div>
        </div>
      </div>
      {submitted ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, gap:20, textAlign:'center' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div style={{ fontSize:22, fontWeight:800 }}>Solicitud enviada</div>
          <div style={{ fontSize:15, color:SUB, lineHeight:1.7, maxWidth:280 }}>Tu solicitud esta siendo revisada. Te contactaremos en 24-48 horas.</div>
          <button onClick={() => { setSubmitted(false); setScreen('home'); }} style={{ ...btnStyle(), width:'auto', padding:'14px 40px' }}>Volver al inicio</button>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', background:'#fff', borderBottom:'1px solid ' + BORDER, padding:'4px 16px', gap:4 }}>
            {(['info','vehicle','docs'] as const).map(t => (
              <button key={t} onClick={() => setDtab(t)} style={{ padding:'10px 18px', borderRadius:50, border:'none', fontSize:14, fontWeight:600, cursor:'pointer', background: dtab===t ? ACCENT : 'transparent', color: dtab===t ? '#fff' : SUB, transition:'all 0.2s' }}>
                {t==='info' ? 'Datos' : t==='vehicle' ? 'Vehiculo' : 'Documentos'}
              </button>
            ))}
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 100px' }}>
            {dtab === 'info' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <p style={{ fontSize:13, color:SUB, margin:'0 0 4px' }}>Completa tus datos personales para continuar.</p>
                {[{k:'name',l:'Nombre completo',p:'Carlos Nguema Obiang'},{k:'phone',l:'Telefono',p:'+240 222 000 000'},{k:'license',l:'Numero de licencia',p:'GE-2024-001234'}].map(f => (
                  <div key={f.k} style={fieldStyle()}>
                    <div style={{ fontSize:11, fontWeight:700, color:SUB, marginBottom:5, textTransform:'uppercase', letterSpacing:0.6 }}>{f.l}</div>
                    <input value={(form as any)[f.k]} onChange={e => setForm(x => ({...x,[f.k]:e.target.value}))} placeholder={f.p} style={{ width:'100%', border:'none', background:'transparent', fontSize:15, outline:'none', color:TEXT, boxSizing:'border-box' }} />
                  </div>
                ))}
                <button onClick={() => setDtab('vehicle')} style={btnStyle(!form.name || !form.phone)}>Continuar</button>
              </div>
            )}
            {dtab === 'vehicle' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <p style={{ fontSize:13, color:SUB, margin:'0 0 4px' }}>Informacion del vehiculo que usaras.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[{k:'brand',l:'Marca',p:'Toyota'},{k:'model',l:'Modelo',p:'Corolla'},{k:'year',l:'Ano',p:'2020'},{k:'color',l:'Color',p:'Blanco'}].map(f => (
                    <div key={f.k} style={fieldStyle()}>
                      <div style={{ fontSize:11, fontWeight:700, color:SUB, marginBottom:5, textTransform:'uppercase', letterSpacing:0.6 }}>{f.l}</div>
                      <input value={(form as any)[f.k]} onChange={e => setForm(x => ({...x,[f.k]:e.target.value}))} placeholder={f.p} style={{ width:'100%', border:'none', background:'transparent', fontSize:14, outline:'none', color:TEXT, boxSizing:'border-box' }} />
                    </div>
                  ))}
                </div>
                <div style={fieldStyle()}>
                  <div style={{ fontSize:11, fontWeight:700, color:SUB, marginBottom:5, textTransform:'uppercase', letterSpacing:0.6 }}>Matricula</div>
                  <input value={form.plate} onChange={e => setForm(x => ({...x,plate:e.target.value}))} placeholder="GE-1234" style={{ width:'100%', border:'none', background:'transparent', fontSize:15, outline:'none', color:TEXT, boxSizing:'border-box' }} />
                </div>
                <div style={fieldStyle()}>
                  <div style={{ fontSize:11, fontWeight:700, color:SUB, marginBottom:10, textTransform:'uppercase', letterSpacing:0.6 }}>Tipo de vehiculo</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {['Sedan','SUV','Van','Moto'].map(t => (
                      <button key={t} onClick={() => setForm(x => ({...x,type:t.toLowerCase()}))} style={{ padding:'8px 18px', borderRadius:50, border:'1.5px solid ' + (form.type===t.toLowerCase() ? ACCENT : BORDER), background: form.type===t.toLowerCase() ? ACCENT_L : '#fff', color: form.type===t.toLowerCase() ? ACCENT : SUB, fontSize:13, fontWeight:600, cursor:'pointer' }}>{t}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setDtab('docs')} style={btnStyle(!form.plate)}>Continuar a Documentos</button>
              </div>
            )}
            {dtab === 'docs' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ background:ACCENT_L, borderRadius:12, padding:'12px 16px', border:'1px solid #C7D2FE' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:ACCENT }}>Documentos requeridos</div>
                  <div style={{ fontSize:12, color:'#818CF8', marginTop:3 }}>Los marcados con * son obligatorios para activar tu cuenta.</div>
                </div>
                {DOCS.map(doc => (
                  <div key={doc.key} style={{ background: docs[doc.key] ? '#F0FDF4' : CARD, borderRadius:16, padding:'16px 18px', border: '1.5px solid ' + (docs[doc.key] ? '#86EFAC' : BORDER), boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:TEXT, display:'flex', alignItems:'center', gap:6 }}>
                          {doc.label}
                          {doc.req ? <span style={{ color:RED, fontSize:12 }}>*</span> : <span style={{ fontSize:10, background:'#F1F5F9', color:SUB, padding:'2px 7px', borderRadius:20, fontWeight:500 }}>Opcional</span>}
                        </div>
                        <div style={{ fontSize:12, color:SUB, marginTop:3 }}>{doc.desc}</div>
                        {docs[doc.key] && <div style={{ fontSize:12, color:GREEN, marginTop:5, fontWeight:500 }}>Subido: {docs[doc.key]}</div>}
                      </div>
                      <label style={{ padding:'9px 18px', background: docs[doc.key] ? '#DCFCE7' : ACCENT, color: docs[doc.key] ? GREEN : '#fff', borderRadius:50, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                        {docs[doc.key] ? 'Cambiar' : 'Subir'}
                        <input type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={e => upDoc(doc.key, e.target.files?.[0]||null)} />
                      </label>
                    </div>
                  </div>
                ))}
                <button onClick={() => { if(form.name&&form.phone&&form.plate&&reqDone) setSubmitted(true); }} style={btnStyle(!(form.name&&form.phone&&form.plate&&reqDone))}>
                  {reqDone ? 'Enviar solicitud' : 'Sube los documentos obligatorios (*)'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // SEARCHING
  if (screen === 'searching') return (
    <div style={wrapStyle}>
      <div style={hdrStyle}>
        <button style={backBtn} onClick={() => setScreen('home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ fontSize:17, fontWeight:700 }}>Buscando conductor</div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, gap:28 }}>
        <div style={{ position:'relative', width:130, height:130 }}>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(99,102,241,0.06)', animation:'pulse1 1.2s ease-in-out infinite' }} />
          <div style={{ position:'absolute', inset:18, borderRadius:'50%', background:'rgba(99,102,241,0.1)', animation:'pulse1 1.6s ease-in-out infinite' }} />
          <div style={{ position:'absolute', inset:36, borderRadius:'50%', background:'rgba(99,102,241,0.15)', animation:'pulse1 2.0s ease-in-out infinite' }} />
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:58, height:58, borderRadius:'50%', background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(99,102,241,0.4)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="15" height="12" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>
            </div>
          </div>
        </div>
        <style>{"@keyframes pulse1{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.12);opacity:1}}"}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:8 }}>Conectando contigo</div>
          <div style={{ fontSize:14, color:SUB, lineHeight:1.7 }}>{origin}<br/>hacia {dest}</div>
        </div>
        <div style={{ width:'100%', maxWidth:300 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:SUB }}>Buscando conductores cercanos...</span>
            <span style={{ fontSize:13, fontWeight:700, color:ACCENT }}>{pct}%</span>
          </div>
          <div style={{ height:6, background:'#E2E8F0', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:pct+'%', background:'linear-gradient(90deg,#6366F1,#818CF8)', borderRadius:3, transition:'width 0.08s linear' }} />
          </div>
        </div>
        <button onClick={() => setScreen('home')} style={{ padding:'12px 32px', background:'none', border:'1.5px solid ' + BORDER, borderRadius:50, color:SUB, fontSize:14, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
      </div>
    </div>
  );

  // MATCHED
  if (screen === 'matched') return (
    <div style={wrapStyle}>
      <div style={hdrStyle}>
        <div style={{ fontSize:17, fontWeight:700 }}>Conductor asignado</div>
        <div style={{ marginLeft:'auto', background:'#F0FDF4', color:GREEN, fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:50 }}>En camino</div>
      </div>
      <div style={{ flex:1, overflowY:'auto' }}>
        <LiveMap h={200} />
        <div style={{ padding:'20px 20px 120px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18 }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:driver.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#fff', flexShrink:0 }}>{driver.ini}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:800 }}>{driver.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                  {[1,2,3,4,5].map(s => <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s<=Math.floor(driver.rating)?'#F59E0B':'#E2E8F0'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                  <span style={{ fontSize:13, color:SUB }}>{driver.rating} · {driver.trips.toLocaleString()} viajes</span>
                </div>
              </div>
              <div style={{ textAlign:'center', background:ACCENT_L, borderRadius:14, padding:'10px 16px' }}>
                <div style={{ fontSize:22, fontWeight:900, color:ACCENT }}>4 min</div>
                <div style={{ fontSize:11, color:SUB }}>llegada</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[{l:'Vehiculo',v:driver.car},{l:'Matricula',v:driver.plate}].map(x => (
                <div key={x.l} style={{ background:'#F8FAFF', borderRadius:12, padding:'10px 14px' }}>
                  <div style={{ fontSize:11, color:SUB, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:3 }}>{x.l}</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize:12, fontWeight:700, color:SUB, textTransform:'uppercase', letterSpacing:0.5, marginBottom:14 }}>Resumen del viaje</div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:14, color:SUB }}>Servicio</span>
              <span style={{ fontSize:14, fontWeight:600 }}>{ride.name}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:14, color:SUB }}>Ruta</span>
              <span style={{ fontSize:13, fontWeight:500, textAlign:'right', maxWidth:200 }}>{origin} → {dest}</span>
            </div>
            <div style={{ height:1, background:BORDER, margin:'12px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:16, fontWeight:700 }}>Total</span>
              <span style={{ fontSize:24, fontWeight:900, color:ACCENT }}>{ride.price.toLocaleString()} XAF</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 20px', background:'#fff', borderTop:'1px solid ' + BORDER, display:'flex', gap:10 }}>
        <button onClick={() => setScreen('home')} style={{ flex:1, padding:'14px', background:'#F1F5F9', color:SUB, border:'none', borderRadius:14, fontSize:15, fontWeight:600, cursor:'pointer' }}>Cancelar</button>
        <button onClick={() => { if(userBalance>=ride.price){onDebit(ride.price);setScreen('riding');}else alert('Saldo insuficiente'); }} style={{ flex:2, padding:'14px', background:ACCENT, color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer' }}>
          Confirmar · {ride.price.toLocaleString()} XAF
        </button>
      </div>
    </div>
  );

  // RIDING
  if (screen === 'riding') return (
    <div style={wrapStyle}>
      <div style={{ ...hdrStyle, justifyContent:'space-between' }}>
        <div style={{ fontSize:17, fontWeight:700 }}>Viaje en curso</div>
        <div style={{ fontSize:13, fontWeight:700, color: progress>=100 ? GREEN : ACCENT }}>{progress>=100 ? 'Llegaste!' : Math.round(progress)+'%'}</div>
      </div>
      <div style={{ flex:1, position:'relative' }}>
        <LiveMap h="100%" />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'#fff', borderRadius:'24px 24px 0 0', padding:'22px 22px 36px', boxShadow:'0 -8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:driver.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#fff' }}>{driver.ini}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700 }}>{driver.name}</div>
              <div style={{ fontSize:12, color:SUB }}>{driver.plate} · {driver.car}</div>
            </div>
            <div style={{ fontSize:15, fontWeight:800, color:ACCENT }}>{ride.price.toLocaleString()} XAF</div>
          </div>
          <div style={{ marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:SUB }}>{origin}</span>
              <span style={{ fontSize:12, color:SUB }}>{dest}</span>
            </div>
            <div style={{ height:6, background:'#E2E8F0', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:progress+'%', background:'linear-gradient(90deg,#6366F1,#818CF8)', borderRadius:3, transition:'width 0.12s' }} />
            </div>
          </div>
          {progress>=100
            ? <button onClick={() => setScreen('rating')} style={{ ...btnStyle(), background:GREEN }}>Calificar viaje</button>
            : <button onClick={() => setScreen('home')} style={{ ...btnStyle(), background:'#F1F5F9', color:SUB }}>Cancelar viaje</button>
          }
        </div>
      </div>
    </div>
  );

  // RATING
  if (screen === 'rating') return (
    <div style={wrapStyle}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, gap:24 }}>
        {rated ? (
          <>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div style={{ fontSize:24, fontWeight:900 }}>Gracias!</div>
            <div style={{ fontSize:15, color:SUB, textAlign:'center', lineHeight:1.7 }}>Tu calificacion ayuda a mejorar el servicio.</div>
            <button onClick={onBack} style={{ ...btnStyle(), width:'auto', padding:'14px 48px' }}>Volver al inicio</button>
          </>
        ) : (
          <>
            <div style={{ width:72, height:72, borderRadius:'50%', background:driver.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff' }}>{driver.ini}</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Como fue tu viaje?</div>
              <div style={{ fontSize:15, color:SUB }}>con {driver.name}</div>
            </div>
            <div style={{ display:'flex', gap:14 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setStars(s)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, transform: s<=(hover||stars)?'scale(1.2)':'scale(1)', transition:'transform 0.15s' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill={s<=(hover||stars)?'#F59E0B':'#E2E8F0'} style={{ transition:'fill 0.15s' }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              ))}
            </div>
            {stars>0 && <button onClick={() => setRated(true)} style={{ ...btnStyle(), width:'auto', padding:'14px 48px' }}>Enviar calificacion</button>}
            <button onClick={onBack} style={{ background:'none', border:'none', color:SUB, fontSize:14, cursor:'pointer' }}>Omitir</button>
          </>
        )}
      </div>
    </div>
  );

  // HOME - Uber/DiDi style
  return (
    <div style={wrapStyle}>
      {/* HEADER flotante sobre el mapa */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(238,240,248,0.8)' }}>
        <button style={backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:800, color:TEXT }}>MiTaxi</div>
          <div style={{ fontSize:11, color:SUB }}>Malabo · Guinea Ecuatorial</div>
        </div>
        <button onClick={() => setScreen('driver')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:ACCENT_L, border:'none', borderRadius:50, cursor:'pointer', fontSize:12, fontWeight:700, color:ACCENT }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Ser conductor
        </button>
      </div>

      {/* MAPA a pantalla completa */}
      <div style={{ position:'absolute', inset:0 }}>
        <LiveMap h="100%" />
      </div>

      {/* BOTTOM SHEET - panel deslizable estilo Uber */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'#fff', borderRadius:'24px 24px 0 0', boxShadow:'0 -4px 32px rgba(0,0,0,0.12)', zIndex:10 }}>
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'#E2E8F0' }} />
        </div>

        <div style={{ padding:'0 20px 8px' }}>
          <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:14 }}>A donde vas?</div>

          {/* CAMPOS RUTA */}
          <div style={{ display:'flex', gap:12, alignItems:'stretch', marginBottom:16 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:14, paddingBottom:14 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', border:'2.5px solid ' + ACCENT, background:'#fff', flexShrink:0 }} />
              <div style={{ width:2, flex:1, background:'linear-gradient(#6366F1,#0F172A)', margin:'4px 0', borderRadius:1 }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:TEXT, flexShrink:0 }} />
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={fieldStyle(focus==='o')}>
                <div style={{ fontSize:10, fontWeight:700, color:ACCENT, marginBottom:3, textTransform:'uppercase', letterSpacing:0.8 }}>Origen</div>
                <input value={origin} onChange={e => onSugg(e.target.value,'o')} onFocus={() => setFocus('o')} onBlur={() => setTimeout(()=>setFocus(null),150)} placeholder="Tu ubicacion actual" style={{ width:'100%', border:'none', background:'transparent', fontSize:14, outline:'none', color:TEXT, fontWeight:500, boxSizing:'border-box' }} />
              </div>
              <div style={fieldStyle(focus==='d')}>
                <div style={{ fontSize:10, fontWeight:700, color:TEXT, marginBottom:3, textTransform:'uppercase', letterSpacing:0.8 }}>Destino</div>
                <input value={dest} onChange={e => onSugg(e.target.value,'d')} onFocus={() => setFocus('d')} onBlur={() => setTimeout(()=>setFocus(null),150)} placeholder="A donde vas?" style={{ width:'100%', border:'none', background:'transparent', fontSize:14, outline:'none', color:TEXT, fontWeight:500, boxSizing:'border-box' }} />
              </div>
            </div>
          </div>

          {/* SUGERENCIAS */}
          {sugg.length>0 && focus && (
            <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', marginBottom:12, overflow:'hidden', border:'1px solid ' + BORDER }}>
              {sugg.map((s,i) => (
                <button key={i} onClick={() => { if(focus==='d') setDest(s); else setOrigin(s); setSugg([]); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left', borderBottom: i<sugg.length-1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ width:30, height:30, borderRadius:9, background:ACCENT_L, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  </div>
                  <span style={{ fontSize:14, color:TEXT, fontWeight:500 }}>{s}</span>
                </button>
              ))}
            </div>
          )}

          {/* TIPOS DE SERVICIO - scroll horizontal */}
          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4, marginBottom:16, scrollbarWidth:'none' }}>
            {RIDES.map(r => (
              <button key={r.id} onClick={() => setRide(r)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'12px 16px', borderRadius:16, border:'2px solid ' + (ride.id===r.id ? r.color : BORDER), background: ride.id===r.id ? r.bg : '#fff', cursor:'pointer', flexShrink:0, minWidth:90, transition:'all 0.2s' }}>
                <div style={{ width:44, height:44, borderRadius:14, background: ride.id===r.id ? r.color : '#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ride.id===r.id ? '#fff' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round">
                    {r.id==='moto'
                      ? <><circle cx="5.5" cy="17.5" r="3"/><circle cx="18.5" cy="17.5" r="3"/><path d="M14 6h3l3 5.5H8.5L11 6h3z"/><path d="M5.5 17.5L9 11.5"/></>
                      : r.id==='xl'
                      ? <><rect x="1" y="7" width="22" height="11" rx="2"/><path d="M1 11h22"/><circle cx="6" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/><path d="M5 7V5h14v2"/></>
                      : <><rect x="1" y="4" width="15" height="12" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></>
                    }
                  </svg>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:800, color: ride.id===r.id ? r.color : TEXT }}>{r.name}</div>
                  <div style={{ fontSize:11, color:SUB }}>{r.eta}</div>
                  <div style={{ fontSize:12, fontWeight:700, color: ride.id===r.id ? r.color : TEXT, marginTop:2 }}>{r.price.toLocaleString()} XAF</div>
                </div>
              </button>
            ))}
          </div>

          {/* SALDO + BOTON PEDIR */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:12, color:SUB }}>Saldo: <span style={{ fontWeight:700, color: userBalance>=ride.price ? GREEN : RED }}>{userBalance.toLocaleString()} XAF</span></div>
            <div style={{ fontSize:12, color:SUB }}>{ride.sub}</div>
          </div>

          <button
            onClick={() => { if(canGo) setScreen('searching'); }}
            disabled={!canGo}
            style={{ width:'100%', padding:'17px', background: canGo ? ACCENT : '#E2E8F0', color: canGo ? '#fff' : '#94A3B8', border:'none', borderRadius:16, fontSize:16, fontWeight:800, cursor: canGo ? 'pointer' : 'not-allowed', transition:'all 0.2s', marginBottom:8, letterSpacing:0.3, boxShadow: canGo ? '0 4px 20px rgba(99,102,241,0.35)' : 'none' }}
          >
            {canGo ? 'Pedir ' + ride.name + ' · ' + ride.price.toLocaleString() + ' XAF' : 'Ingresa origen y destino'}
          </button>
          <div style={{ height:8 }} />
        </div>
      </div>
    </div>
  );
};

export default MiTaxiView;
