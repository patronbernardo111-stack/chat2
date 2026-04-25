import React, { useState, useEffect, useRef, useCallback } from 'react';

// â”€â”€â”€ TIPOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Props {
  onBack: () => void;
  userBalance: number;
  onDebit: (amount: number) => void;
  userName?: string;
  userPhone?: string;
}
type Screen = 'home' | 'searching' | 'matched' | 'riding' | 'rating' | 'driver';
interface LatLng { lat: number; lng: number; }

const MAPTILER_KEY = (import.meta as any).env?.VITE_MAPTILER_KEY || 'bg3FUa7es7Qn1TITIWjO';

// â”€â”€â”€ CATEGORÃAS DE VEHÃCULO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const RIDES = [
  {
    id:'moto', name:'Moto', sub:'1 pasajero Â· Rapido', price:500, eta:'2 min',
    color:'#F97316', bg:'#FFF7ED',
    desc:'Motocicleta economica',
    svg: `<svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="24" r="6" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="38" cy="24" r="6" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <path d="M10 24 L16 14 L26 12 L32 8 L38 14 L38 24" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
      <path d="M26 12 L30 18 L22 18 Z" fill="currentColor"/>
      <path d="M32 8 L36 6 L38 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id:'taxi', name:'Taxi', sub:'4 pasajeros Â· Sedan', price:1000, eta:'4 min',
    color:'#EAB308', bg:'#FEFCE8',
    desc:'Taxi estandar sedan',
    svg: `<svg viewBox="0 0 56 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="48" height="14" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <path d="M10 10 L14 2 L42 2 L46 10" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
      <rect x="15" y="3" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <rect x="31" y="3" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="14" cy="24" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="42" cy="24" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <rect x="22" y="1" width="12" height="3" rx="1" fill="currentColor" opacity="0.6"/>
    </svg>`,
  },
  {
    id:'suv', name:'Confort SUV', sub:'4 pasajeros Â· SUV', price:2000, eta:'5 min',
    color:'#6366F1', bg:'#EEF2FF',
    desc:'SUV comodo y espacioso',
    svg: `<svg viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="10" width="56" height="16" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <path d="M8 10 L13 2 L47 2 L52 10" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
      <rect x="14" y="3" width="12" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <rect x="34" y="3" width="12" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="14" cy="26" r="4.5" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="46" cy="26" r="4.5" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <line x1="2" y1="16" x2="58" y2="16" stroke="currentColor" stroke-width="1" opacity="0.4"/>
    </svg>`,
  },
  {
    id:'vip', name:'VIP', sub:'4 pasajeros Â· Premium', price:3500, eta:'7 min',
    color:'#7C3AED', bg:'#F5F3FF',
    desc:'Vehiculo premium ejecutivo',
    svg: `<svg viewBox="0 0 64 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="10" width="60" height="14" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <path d="M10 10 L16 2 L48 2 L54 10" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
      <rect x="17" y="3" width="11" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <rect x="36" y="3" width="11" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="15" cy="24" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="49" cy="24" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <path d="M2 14 L62 14" stroke="currentColor" stroke-width="1" opacity="0.3"/>
      <path d="M28 2 L36 2" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
    </svg>`,
  },
  {
    id:'cargo', name:'Cargo', sub:'Pickup Â· Carga', price:2500, eta:'8 min',
    color:'#0EA5E9', bg:'#F0F9FF',
    desc:'Pickup Dina 100 y camionetas',
    svg: `<svg viewBox="0 0 64 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="12" width="60" height="14" rx="2" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <path d="M2 12 L2 6 L28 6 L28 12" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
      <rect x="4" y="7" width="22" height="5" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <line x1="28" y1="6" x2="28" y2="26" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="14" cy="26" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="50" cy="26" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <rect x="30" y="14" width="28" height="8" rx="1" stroke="currentColor" stroke-width="1" opacity="0.4" fill="none"/>
    </svg>`,
  },
  {
    id:'van', name:'Van', sub:'8 pasajeros Â· Van', price:3000, eta:'9 min',
    color:'#10B981', bg:'#F0FDF4',
    desc:'Van grande para grupos',
    svg: `<svg viewBox="0 0 68 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="64" height="20" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <line x1="22" y1="6" x2="22" y2="26" stroke="currentColor" stroke-width="2" opacity="0.5"/>
      <rect x="4" y="8" width="16" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <rect x="24" y="8" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <rect x="38" y="8" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="14" cy="26" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="54" cy="26" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
    </svg>`,
  },
  {
    id:'minivan', name:'MiniVan', sub:'6 pasajeros Â· MiniVan', price:2200, eta:'6 min',
    color:'#EC4899', bg:'#FDF2F8',
    desc:'Minivan familiar',
    svg: `<svg viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="56" height="18" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <path d="M2 8 L8 2 L40 2 L46 8" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
      <rect x="9" y="3" width="10" height="5" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <rect x="22" y="3" width="10" height="5" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <line x1="34" y1="8" x2="34" y2="26" stroke="currentColor" stroke-width="2" opacity="0.4"/>
      <circle cx="13" cy="26" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="47" cy="26" r="4" stroke="currentColor" stroke-width="2.5" fill="none"/>
    </svg>`,
  },
];

const DRIVERS = [
  { name:'Carlos Nguema',  ini:'CN', rating:4.9, trips:1240, plate:'GE-1234', car:'Toyota Corolla Amarillo', bg:'#1e293b' },
  { name:'Pedro Mba Ondo', ini:'PM', rating:4.8, trips:876,  plate:'GE-5678', car:'Hyundai Tucson Gris',    bg:'#312e81' },
  { name:'Maria Obiang',   ini:'MO', rating:5.0, trips:2100, plate:'GE-3456', car:'Toyota Camry Negro',     bg:'#7c3aed' },
  { name:'Juan Esono',     ini:'JE', rating:4.7, trips:543,  plate:'GE-9012', car:'Kia Sportage Blanco',    bg:'#0f3460' },
];

const PLACES = [
  'Aeropuerto de Malabo','Hotel Bahia','Mercado Central','Palacio de Justicia',
  'Universidad Nacional','Hospital La Paz','Playa de Malabo','Estadio de Malabo',
  'Puerto de Malabo','Barrio Ela Nguema','Sipopo Beach','Centro Comercial Paraiso',
  'Catedral de Malabo','Colegio La Salle','Punta Europa','Ministerio de Hacienda',
  'Barrio Caracolas','Barrio Los Angeles','Embajada de Espana','Hotel Impala',
];

const DOCS = [
  { key:'dni',      label:'DNI / Cedula de identidad',   desc:'Documento de identidad vigente',   req:true  },
  { key:'license',  label:'Permiso de conducir',         desc:'Licencia categoria B o superior',  req:true  },
  { key:'itv',      label:'Inspeccion tecnica (ITV)',    desc:'Certificado tecnico del vehiculo', req:true  },
  { key:'owner',    label:'Titulo de propiedad',         desc:'Documento de titularidad',         req:true  },
  { key:'criminal', label:'Certificado de antecedentes', desc:'Antecedentes penales',             req:true  },
  { key:'insurance',label:'Seguro del vehiculo',         desc:'Poliza de seguro (opcional)',      req:false },
];

// â”€â”€â”€ MAPA CON GPS + RUTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface MapProps {
  h?: number | string;
  userPos?: LatLng | null;
  destPos?: LatLng | null;
  showRoute?: boolean;
  onMapReady?: (map: any, sdk: any) => void;
}

const LiveMap: React.FC<MapProps> = ({ h = 260, userPos, destPos, showRoute, onMapReady }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<any>(null);
  const sdkRef = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!ref.current || inst.current) return;
    import('@maptiler/sdk').then(sdk => {
      sdkRef.current = sdk;
      sdk.config.apiKey = MAPTILER_KEY;
      const center: [number,number] = userPos ? [userPos.lng, userPos.lat] : [8.7741, 3.7523];
      const m = new sdk.Map({
        container: ref.current!,
        style: sdk.MapStyle.STREETS,
        center,
        zoom: 14,
        attributionControl: false,
        navigationControl: false,
      });
      inst.current = m;
      m.on('load', () => {
        // Marcador usuario (punto azul pulsante)
        const el = document.createElement('div');
        el.style.cssText = 'width:20px;height:20px;border-radius:50%;background:#6366F1;border:3px solid #fff;box-shadow:0 0 0 4px rgba(99,102,241,0.3);animation:gps-pulse 2s ease-in-out infinite;';
        const style = document.createElement('style');
        style.textContent = '@keyframes gps-pulse{0%,100%{box-shadow:0 0 0 4px rgba(99,102,241,0.3)}50%{box-shadow:0 0 0 10px rgba(99,102,241,0.1)}}';
        document.head.appendChild(style);
        userMarker.current = new sdk.Marker({ element: el })
          .setLngLat(center)
          .addTo(m);
        if (onMapReady) onMapReady(m, sdk);
      });
    }).catch(() => setErr(true));
    return () => { inst.current?.remove(); inst.current = null; };
  }, []);

  // Actualizar posicion usuario
  useEffect(() => {
    if (!userMarker.current || !userPos) return;
    userMarker.current.setLngLat([userPos.lng, userPos.lat]);
    if (inst.current && !destPos) {
      inst.current.flyTo({ center: [userPos.lng, userPos.lat], zoom: 14, duration: 1000 });
    }
  }, [userPos]);

  // Dibujar ruta cuando hay destino
  useEffect(() => {
    if (!inst.current || !sdkRef.current || !userPos || !destPos || !showRoute) return;
    const map = inst.current;
    const sdk = sdkRef.current;

    // Marcador destino
    if (destMarker.current) destMarker.current.remove();
    const destEl = document.createElement('div');
    destEl.style.cssText = 'width:24px;height:24px;border-radius:50%;background:#EF4444;border:3px solid #fff;box-shadow:0 2px 8px rgba(239,68,68,0.4);';
    destMarker.current = new sdk.Marker({ element: destEl })
      .setLngLat([destPos.lng, destPos.lat])
      .addTo(map);

    // Dibujar ruta via MapTiler Directions
    const drawRoute = async () => {
      try {
        const url = `https://api.maptiler.com/directions/v2/driving/${userPos.lng},${userPos.lat};${destPos.lng},${destPos.lat}?key=${MAPTILER_KEY}&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (!coords) return;

        if (map.getSource('route')) {
          (map.getSource('route') as any).setData({ type:'Feature', properties:{}, geometry:{ type:'LineString', coordinates: coords } });
        } else {
          map.addSource('route', { type:'geojson', data:{ type:'Feature', properties:{}, geometry:{ type:'LineString', coordinates: coords } } });
          map.addLayer({ id:'route-bg', type:'line', source:'route', layout:{ 'line-join':'round','line-cap':'round' }, paint:{ 'line-color':'#fff','line-width':8,'line-opacity':0.8 } });
          map.addLayer({ id:'route', type:'line', source:'route', layout:{ 'line-join':'round','line-cap':'round' }, paint:{ 'line-color':'#6366F1','line-width':5,'line-opacity':1 } });
        }

        // Fit bounds
        const lngs = coords.map((c:number[]) => c[0]);
        const lats = coords.map((c:number[]) => c[1]);
        map.fitBounds([[Math.min(...lngs)-0.005, Math.min(...lats)-0.005],[Math.max(...lngs)+0.005, Math.max(...lats)+0.005]], { padding:80, duration:1000 });
      } catch(e) {
        // Fallback: linea recta
        const lineData = { type:'Feature', properties:{}, geometry:{ type:'LineString', coordinates:[[userPos.lng,userPos.lat],[destPos.lng,destPos.lat]] } };
        if (map.getSource('route')) {
          (map.getSource('route') as any).setData(lineData);
        } else {
          map.addSource('route', { type:'geojson', data: lineData });
          map.addLayer({ id:'route-bg', type:'line', source:'route', layout:{ 'line-join':'round','line-cap':'round' }, paint:{ 'line-color':'#fff','line-width':8 } });
          map.addLayer({ id:'route', type:'line', source:'route', layout:{ 'line-join':'round','line-cap':'round' }, paint:{ 'line-color':'#6366F1','line-width':5 } });
        }
      }
    };
    if (map.isStyleLoaded()) drawRoute(); else map.on('load', drawRoute);
  }, [destPos, showRoute]);

  if (err) return (
    <div style={{ height:h, background:'linear-gradient(135deg,#e0e7ff,#f0fdf4)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
      <span style={{ fontSize:32 }}>ðŸ—ºï¸</span>
      <span style={{ fontSize:13, color:'#6B7280' }}>Malabo, Guinea Ecuatorial</span>
    </div>
  );
  return <div ref={ref} style={{ height:h, width:'100%' }} />;
};

// â”€â”€â”€ COMPONENTE PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const [userPos, setUserPos] = useState<LatLng|null>(null);
  const [destPos, setDestPos] = useState<LatLng|null>(null);
  const [gpsError, setGpsError] = useState(false);
  const [dtab, setDtab]       = useState<'info'|'vehicle'|'docs'>('info');
  const [form, setForm]       = useState({ name:'', phone:'', license:'', brand:'', model:'', year:'', color:'', plate:'', type:'sedan' });
  const [docs, setDocs]       = useState<Record<string,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const timer = useRef<any>(null);
  const watchId = useRef<number|null>(null);

  // GPS en tiempo real
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError(true); return; }
    watchId.current = navigator.geolocation.watchPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { setGpsError(true); setUserPos({ lat: 3.7523, lng: 8.7741 }); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, []);

  // Geocodificar destino cuando se escribe
  const geocodeDest = useCallback(async (name: string) => {
    try {
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(name + ' Malabo Guinea Ecuatorial')}.json?key=${MAPTILER_KEY}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      const feat = data?.features?.[0];
      if (feat) setDestPos({ lng: feat.center[0], lat: feat.center[1] });
    } catch {}
  }, []);

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
        return p + 0.3;
      }), 150);
    }
    return () => clearInterval(timer.current);
  }, [screen]);

  const onSugg = (val: string, field: 'o'|'d') => {
    if (field === 'o') setOrigin(val); else setDest(val);
    setSugg(val.length > 0 ? PLACES.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0,5) : []);
  };

  const selectPlace = (s: string) => {
    if (focus === 'd') { setDest(s); geocodeDest(s); }
    else setOrigin(s);
    setSugg([]);
  };

  // â”€â”€ ESTILOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const TEXT = '#0F172A'; const SUB = '#64748B'; const ACCENT = '#6366F1';
  const ACCENT_L = '#EEF2FF'; const GREEN = '#10B981'; const RED = '#EF4444';
  const BORDER = '#EEF0F8';
  const wrapStyle: React.CSSProperties = { position:'fixed', inset:0, background:'#F8FAFF', display:'flex', flexDirection:'column', fontFamily:"'Inter',system-ui,sans-serif", zIndex:600, color:TEXT };
  const cardStyle: React.CSSProperties = { background:'#fff', borderRadius:20, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(99,102,241,0.06)' };
  const btnStyle = (dis=false): React.CSSProperties => ({ width:'100%', padding:'16px', background: dis ? '#E2E8F0' : ACCENT, color: dis ? '#94A3B8' : '#fff', border:'none', borderRadius:16, fontSize:16, fontWeight:700, cursor: dis ? 'not-allowed' : 'pointer', transition:'all 0.2s' });
  const fieldStyle = (active=false): React.CSSProperties => ({ background: active ? '#fff' : '#F1F5F9', borderRadius:14, padding:'14px 16px', border: active ? '1.5px solid ' + ACCENT : '1.5px solid transparent', transition:'all 0.2s' });
  const hdrStyle: React.CSSProperties = { display:'flex', alignItems:'center', gap:14, paddingTop:'max(14px, env(safe-area-inset-top))', paddingBottom:'14px', paddingLeft:'16px', paddingRight:'16px', background:'#fff', borderBottom:'1px solid ' + BORDER };
  const backBtn: React.CSSProperties = { background:'none', border:'none', cursor:'pointer', padding:6, borderRadius:10, display:'flex', alignItems:'center' };

  // â”€â”€ PANTALLA CONDUCTOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (screen === 'driver') return (
    <div style={wrapStyle}>
      <div style={hdrStyle}>
        <button style={backBtn} onClick={() => setScreen('home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div><div style={{ fontSize:17, fontWeight:700 }}>Ser conductor</div><div style={{ fontSize:12, color:SUB }}>Registrate en la flota MiTaxi</div></div>
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
                    {['Sedan','SUV','Van','Moto','Pickup'].map(t => (
                      <button key={t} onClick={() => setForm(x => ({...x,type:t.toLowerCase()}))} style={{ padding:'8px 18px', borderRadius:50, border:'1.5px solid ' + (form.type===t.toLowerCase() ? ACCENT : BORDER), background: form.type===t.toLowerCase() ? ACCENT_L : '#fff', color: form.type===t.toLowerCase() ? ACCENT : SUB, fontSize:13, fontWeight:600, cursor:'pointer' }}>{t}</button>
                    ))}
                  </div>
                </div>
                {/* Fotos del vehiculo */}
                <div style={fld()}>
                  <div style={{ fontSize:11, fontWeight:700, color:SUB, marginBottom:10, textTransform:'uppercase', letterSpacing:0.6 }}>Fotos del vehiculo</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                    {[{k:'photoExt',l:'Exterior'},  {k:'photoInt',l:'Interior'}, {k:'photoFront',l:'Frontal'}, {k:'photoBack',l:'Trasera'}].map(p => (
                      <label key={p.k} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'12px 8px', background: (form as any)[p.k] ? '#F0FDF4' : (theme.id==='midnight'?'#0F172A':'#F8FAFF'), borderRadius:12, border:'1.5px dashed '+((form as any)[p.k]?GREEN:BORDER), cursor:'pointer', textAlign:'center' }}>
                        {(form as any)[p.k]
                          ? <img src={(form as any)[p.k]} alt={p.l} style={{ width:'100%', height:60, objectFit:'cover', borderRadius:8 }} />
                          : <><svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke={SUB} strokeWidth='1.5' strokeLinecap='round'><rect x='3' y='3' width='18' height='18' rx='3'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg><span style={{ fontSize:11, color:SUB, fontWeight:500 }}>{p.l}</span></>
                        }
                        <input type='file' accept='image/*' style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f){const url=URL.createObjectURL(f); setForm(x=>({...x,[p.k]:url}));} }} />
                      </label>
                    ))}
                  </div>
                  <div style={fld()}>
                    <div style={{ fontSize:11, fontWeight:700, color:SUB, marginBottom:5, textTransform:'uppercase', letterSpacing:0.6 }}>Estado del vehiculo</div>
                    <textarea value={form.vehicleState} onChange={e => setForm(x=>({...x,vehicleState:e.target.value}))} placeholder='Ej: Vehiculo en excelente estado, AC funcionando, sin rayones...' rows={2} style={{ width:'100%', border:'none', background:'transparent', fontSize:13, outline:'none', color:TEXT, resize:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
                  </div>
                </div>
                <button onClick={() => setDtab('docs')} style={btnStyle(!form.plate)}>Continuar a Documentos</button>
              </div>
            )}
            {dtab === 'docs' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ background:ACCENT_L, borderRadius:12, padding:'12px 16px', border:'1px solid #C7D2FE' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:ACCENT }}>Documentos requeridos</div>
                  <div style={{ fontSize:12, color:'#818CF8', marginTop:3 }}>Los marcados con * son obligatorios.</div>
                </div>
                {DOCS.map(doc => (
                  <div key={doc.key} style={{ background: docs[doc.key] ? '#F0FDF4' : '#fff', borderRadius:16, padding:'16px 18px', border:'1.5px solid ' + (docs[doc.key] ? '#86EFAC' : BORDER) }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:TEXT, display:'flex', alignItems:'center', gap:6 }}>
                          {doc.label}
                          {doc.req ? <span style={{ color:RED, fontSize:12 }}>*</span> : <span style={{ fontSize:10, background:'#F1F5F9', color:SUB, padding:'2px 7px', borderRadius:20 }}>Opcional</span>}
                        </div>
                        <div style={{ fontSize:12, color:SUB, marginTop:3 }}>{doc.desc}</div>
                        {docs[doc.key] && <div style={{ fontSize:12, color:GREEN, marginTop:5 }}>Subido: {docs[doc.key]}</div>}
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

  // â”€â”€ BUSCANDO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(99,102,241,0.06)', animation:'p1 1.2s ease-in-out infinite' }} />
          <div style={{ position:'absolute', inset:18, borderRadius:'50%', background:'rgba(99,102,241,0.1)', animation:'p1 1.6s ease-in-out infinite' }} />
          <div style={{ position:'absolute', inset:36, borderRadius:'50%', background:'rgba(99,102,241,0.15)', animation:'p1 2.0s ease-in-out infinite' }} />
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:58, height:58, borderRadius:'50%', background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(99,102,241,0.4)' }}>
              <div style={{ width:32, height:20, color:'#fff' }} dangerouslySetInnerHTML={{ __html: ride.svg }} />
            </div>
          </div>
        </div>
        <style>{"@keyframes p1{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.12);opacity:1}}"}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:8 }}>Conectando contigo</div>
          <div style={{ fontSize:14, color:SUB, lineHeight:1.7 }}>{origin}<br/>hacia {dest}</div>
        </div>
        <div style={{ width:'100%', maxWidth:300 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, color:SUB }}>Buscando conductores...</span>
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

  // â”€â”€ CONDUCTOR ENCONTRADO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (screen === 'matched') return (
    <div style={wrapStyle}>
      <div style={hdrStyle}>
        <div style={{ fontSize:17, fontWeight:700 }}>Conductor asignado</div>
        <div style={{ marginLeft:'auto', background:'#F0FDF4', color:GREEN, fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:50 }}>En camino</div>
      </div>
      <div style={{ flex:1, overflowY:'auto' }}>
        <LiveMap h={200} userPos={userPos} destPos={destPos} showRoute={true} />
        <div style={{ padding:'20px 20px 120px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:18 }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:driver.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#fff', flexShrink:0 }}>{driver.ini}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:17, fontWeight:800 }}>{driver.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                  {[1,2,3,4,5].map(s => <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s<=Math.floor(driver.rating)?'#F59E0B':'#E2E8F0'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                  <span style={{ fontSize:13, color:SUB }}>{driver.rating} Â· {driver.trips.toLocaleString()} viajes</span>
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
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:14, color:SUB }}>Servicio</span>
              <span style={{ fontSize:14, fontWeight:600 }}>{ride.name}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:14, color:SUB }}>Ruta</span>
              <span style={{ fontSize:13, fontWeight:500, textAlign:'right', maxWidth:200 }}>{origin} a {dest}</span>
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
          Confirmar Â· {ride.price.toLocaleString()} XAF
        </button>
      </div>
    </div>
  );

  // â”€â”€ VIAJE EN CURSO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (screen === 'riding') return (
    <div style={wrapStyle}>
      <div style={{ ...hdrStyle, justifyContent:'space-between' }}>
        <div style={{ fontSize:17, fontWeight:700 }}>Viaje en curso</div>
        <div style={{ fontSize:13, fontWeight:700, color: progress>=100 ? GREEN : ACCENT }}>{progress>=100 ? 'Llegaste!' : Math.round(progress)+'%'}</div>
      </div>
      <div style={{ flex:1, position:'relative' }}>
        <LiveMap h="100%" userPos={userPos} destPos={destPos} showRoute={true} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'#fff', borderRadius:'24px 24px 0 0', padding:'22px 22px 36px', boxShadow:'0 -8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:driver.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#fff' }}>{driver.ini}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700 }}>{driver.name}</div>
              <div style={{ fontSize:12, color:SUB }}>{driver.plate} Â· {driver.car}</div>
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

  // â”€â”€ CALIFICACION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // AJUSTES
  if (screen === 'settings') return (
    <div style={wrap}>
      {showThemes && <ThemePanel />}
      <div style={hdr}>
        <button style={bk} onClick={() => setScreen('home')}><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke={TEXT} strokeWidth='2.5' strokeLinecap='round'><path d='M19 12H5M12 5l-7 7 7 7'/></svg></button>
        <div style={{ flex:1 }}><div style={{ fontSize:17, fontWeight:700, color:TEXT }}>Ajustes MiTaxi</div><div style={{ fontSize:12, color:SUB }}>Personaliza tu experiencia</div></div>
        <button onClick={() => setShowThemes(true)} style={{ background:AL, border:'none', borderRadius:50, padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2' strokeLinecap='round'><circle cx='12' cy='12' r='3'/><path d='M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83'/></svg>
          <span style={{ fontSize:11, fontWeight:700, color:ACCENT }}>Fondo</span>
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 40px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* VOZ DE NAVEGACION */}
        <div style={{ background:CARD, borderRadius:18, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2' strokeLinecap='round'><path d='M11 5L6 9H2v6h4l5 4V5z'/><path d='M19.07 4.93a10 10 0 0 1 0 14.14'/><path d='M15.54 8.46a5 5 0 0 1 0 7.07'/></svg>
            Voz de navegacion
          </div>
          {[{id:'es-GQ',l:'Espanol (Guinea Ecuatorial)',sub:'Voz local recomendada'},{id:'es-ES',l:'Espanol (Espana)',sub:'Voz estandar'},{id:'fr-FR',l:'Frances',sub:'Pour les francophones'},{id:'en-US',l:'Ingles',sub:'English navigation'}].map(v => (
            <button key={v.id} onClick={() => setSettings(s=>({...s,voice:v.id}))} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:'1.5px solid '+(settings.voice===v.id?ACCENT:BORDER), background:settings.voice===v.id?AL:CARD, cursor:'pointer', marginBottom:8, textAlign:'left' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:settings.voice===v.id?ACCENT:BORDER, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke={settings.voice===v.id?'#fff':SUB} strokeWidth='2' strokeLinecap='round'><path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z'/><path d='M19 10v2a7 7 0 0 1-14 0v-2'/><line x1='12' y1='19' x2='12' y2='23'/><line x1='8' y1='23' x2='16' y2='23'/></svg>
              </div>
              <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:600, color:TEXT }}>{v.l}</div><div style={{ fontSize:12, color:SUB }}>{v.sub}</div></div>
              {settings.voice===v.id && <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2.5' strokeLinecap='round'><path d='M20 6L9 17l-5-5'/></svg>}
            </button>
          ))}
        </div>

        {/* FONDOS DE PANTALLA */}
        <div style={{ background:CARD, borderRadius:18, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2' strokeLinecap='round'><rect x='3' y='3' width='18' height='18' rx='3'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg>
            Fondos de pantalla
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:12 }}>
            {APP_THEMES.map(t => (
              <button key={t.id} onClick={() => { setTheme(t); setCustomBg(null); }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'10px 6px', borderRadius:14, border:'2px solid '+(theme.id===t.id&&!customBg?t.accent:'transparent'), background:t.bg, cursor:'pointer' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:t.accent }} />
                <span style={{ fontSize:10, fontWeight:600, color:t.id==='midnight'?'#94A3B8':'#374151', textAlign:'center' }}>{t.name}</span>
              </button>
            ))}
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:AL, borderRadius:12, cursor:'pointer', border:'1.5px dashed '+ACCENT }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2' strokeLinecap='round'><rect x='3' y='3' width='18' height='18' rx='3'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg>
            <span style={{ fontSize:13, fontWeight:600, color:ACCENT }}>{customBg ? 'Cambiar imagen personalizada' : 'Subir imagen del dispositivo'}</span>
            <input type='file' accept='image/*' style={{ display:'none' }} onChange={e => { const f=e.target.files?.[0]; if(f) setCustomBg(URL.createObjectURL(f)); }} />
          </label>
          {customBg && <button onClick={() => setCustomBg(null)} style={{ width:'100%', marginTop:8, padding:'10px', background:'#FEE2E2', color:'#EF4444', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>Quitar imagen personalizada</button>}
        </div>

        {/* LUGARES FRECUENTES */}
        <div style={{ background:CARD, borderRadius:18, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2' strokeLinecap='round'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/><circle cx='12' cy='9' r='2.5'/></svg>
            Lugares frecuentes
          </div>
          <div style={{ fontSize:12, color:SUB, marginBottom:12 }}>Guarda destinos que usas frecuentemente para acceder rapido.</div>
          {settings.savedPlaces.map((p,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:theme.id==='midnight'?'#0F172A':'#F8FAFF', borderRadius:10, marginBottom:8 }}>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2' strokeLinecap='round'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/><circle cx='12' cy='9' r='2.5'/></svg>
              <span style={{ flex:1, fontSize:13, color:TEXT, fontWeight:500 }}>{p}</span>
              <button onClick={() => setSettings(s=>({...s,savedPlaces:s.savedPlaces.filter((_,j)=>j!==i)}))} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:16, padding:'0 4px' }}>×</button>
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <input id='newPlace' placeholder='Agregar lugar...' style={{ flex:1, padding:'10px 12px', borderRadius:10, border:'1.5px solid '+BORDER, background:theme.id==='midnight'?'#1E293B':'#F8FAFF', color:TEXT, fontSize:13, outline:'none' }} />
            <button onClick={() => { const el=document.getElementById('newPlace') as HTMLInputElement; if(el?.value.trim()){setSettings(s=>({...s,savedPlaces:[...s.savedPlaces,el.value.trim()]}));el.value='';} }} style={{ padding:'10px 16px', background:ACCENT, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>+</button>
          </div>
        </div>

        {/* MODELO DE NAVEGACION */}
        <div style={{ background:CARD, borderRadius:18, padding:'18px 20px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2' strokeLinecap='round'><polygon points='3 11 22 2 13 21 11 13 3 11'/></svg>
            Modelo de navegacion
          </div>
          {[{id:'standard',l:'Estandar',sub:'Ruta mas rapida'},{id:'eco',l:'Economico',sub:'Menos combustible'},{id:'avoid_tolls',l:'Sin peajes',sub:'Evitar peajes'},{id:'scenic',l:'Pintoresco',sub:'Ruta mas bonita'}].map(m => (
            <button key={m.id} onClick={() => setSettings(s=>({...s,navMode:m.id}))} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:'1.5px solid '+(settings.navMode===m.id?ACCENT:BORDER), background:settings.navMode===m.id?AL:CARD, cursor:'pointer', marginBottom:8, textAlign:'left' }}>
              <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:600, color:TEXT }}>{m.l}</div><div style={{ fontSize:12, color:SUB }}>{m.sub}</div></div>
              {settings.navMode===m.id && <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2.5' strokeLinecap='round'><path d='M20 6L9 17l-5-5'/></svg>}
            </button>
          ))}
        </div>

      </div>
    </div>
  );

  // â”€â”€ HOME - UBER STYLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div style={wrapStyle}>
      {/* Header flotante */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', alignItems:'center', gap:12, paddingTop:'max(14px, env(safe-area-inset-top))', paddingBottom:'12px', paddingLeft:'14px', paddingRight:'14px', background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(238,240,248,0.8)' }}>
        <button style={backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:800 }}>MiTaxi</div>
          <div style={{ fontSize:11, color:SUB }}>
            {gpsError ? 'Malabo Â· Guinea Ecuatorial' : userPos ? 'GPS activo' : 'Obteniendo ubicacion...'}
          </div>
        </div>
        {!gpsError && !userPos && (
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#F59E0B', animation:'p1 1s ease-in-out infinite' }} />
        )}
        {userPos && !gpsError && (
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'#F0FDF4', padding:'5px 10px', borderRadius:50 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:GREEN }} />
            <span style={{ fontSize:11, fontWeight:700, color:GREEN }}>GPS</span>
          </div>
        )}
        <button onClick={() => setScreen('settings')} style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 11px', background:AL, border:'none', borderRadius:50, cursor:'pointer' }}>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke={ACCENT} strokeWidth='2' strokeLinecap='round'><circle cx='12' cy='12' r='3'/><path d='M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83'/></svg>
          <span style={{ fontSize:11, fontWeight:700, color:ACCENT }}>Ajustes</span>
        </button>
        <button onClick={() => setScreen('driver')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:ACCENT_L, border:'none', borderRadius:50, cursor:'pointer', fontSize:12, fontWeight:700, color:ACCENT }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Conductor
        </button>
      </div>

      {/* Mapa full screen */}
      <div style={{ position:'absolute', inset:0 }}>
        <LiveMap h="100%" userPos={userPos} destPos={destPos} showRoute={!!destPos} />
      </div>

      {/* Bottom sheet */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'#fff', borderRadius:'24px 24px 0 0', boxShadow:'0 -4px 32px rgba(0,0,0,0.12)', zIndex:10, maxHeight:'70vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'#E2E8F0' }} />
        </div>

        <div style={{ padding:'0 20px 8px' }}>
          <div style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:14 }}>A donde vas?</div>

          {/* Campos ruta */}
          <div style={{ display:'flex', gap:12, alignItems:'stretch', marginBottom:16, position:'relative' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:14, paddingBottom:14 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', border:'2.5px solid ' + ACCENT, background:'#fff', flexShrink:0 }} />
              <div style={{ width:2, flex:1, background:'linear-gradient(#6366F1,#0F172A)', margin:'4px 0', borderRadius:1 }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:TEXT, flexShrink:0 }} />
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={fieldStyle(focus==='o')}>
                <div style={{ fontSize:10, fontWeight:700, color:ACCENT, marginBottom:3, textTransform:'uppercase', letterSpacing:0.8 }}>Origen</div>
                <input value={origin} onChange={e => onSugg(e.target.value,'o')} onFocus={() => setFocus('o')} onBlur={() => setTimeout(()=>setFocus(null),150)} placeholder={userPos ? 'Mi ubicacion (GPS activo)' : 'Tu ubicacion actual'} style={{ width:'100%', border:'none', background:'transparent', fontSize:14, outline:'none', color:TEXT, fontWeight:500, boxSizing:'border-box' }} />
              </div>
              <div style={fieldStyle(focus==='d')}>
                <div style={{ fontSize:10, fontWeight:700, color:TEXT, marginBottom:3, textTransform:'uppercase', letterSpacing:0.8 }}>Destino</div>
                <input value={dest} onChange={e => onSugg(e.target.value,'d')} onFocus={() => setFocus('d')} onBlur={() => setTimeout(()=>setFocus(null),150)} placeholder="A donde vas?" style={{ width:'100%', border:'none', background:'transparent', fontSize:14, outline:'none', color:TEXT, fontWeight:500, boxSizing:'border-box' }} />
              </div>
            </div>
          </div>

          {/* Sugerencias */}
          {sugg.length>0 && focus && (
            <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', marginBottom:12, overflow:'hidden', border:'1px solid ' + BORDER }}>
              {sugg.map((s,i) => (
                <button key={i} onClick={() => selectPlace(s)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left', borderBottom: i<sugg.length-1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ width:30, height:30, borderRadius:9, background:ACCENT_L, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  </div>
                  <span style={{ fontSize:14, color:TEXT, fontWeight:500 }}>{s}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tipos de vehiculo - scroll horizontal */}
          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8, marginBottom:14, scrollbarWidth:'none' }}>
            {RIDES.map(r => (
              <button key={r.id} onClick={() => setRide(r)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'12px 14px', borderRadius:16, border:'2px solid ' + (ride.id===r.id ? r.color : BORDER), background: ride.id===r.id ? r.bg : '#fff', cursor:'pointer', flexShrink:0, minWidth:82, transition:'all 0.2s' }}>
                <div style={{ width:44, height:28, color: ride.id===r.id ? r.color : '#94A3B8', display:'flex', alignItems:'center', justifyContent:'center' }} dangerouslySetInnerHTML={{ __html: r.svg }} />
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:12, fontWeight:800, color: ride.id===r.id ? r.color : TEXT, whiteSpace:'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize:10, color:SUB }}>{r.eta}</div>
                  <div style={{ fontSize:12, fontWeight:700, color: ride.id===r.id ? r.color : TEXT, marginTop:1 }}>{r.price.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Info servicio seleccionado */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'10px 14px', background:ride.bg, borderRadius:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:ride.color }}>{ride.name} Â· {ride.sub}</div>
              <div style={{ fontSize:12, color:SUB }}>{ride.desc}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:18, fontWeight:900, color:ride.color }}>{ride.price.toLocaleString()} XAF</div>
              <div style={{ fontSize:11, color:SUB }}>Saldo: <span style={{ fontWeight:700, color: userBalance>=ride.price ? GREEN : RED }}>{userBalance.toLocaleString()}</span></div>
            </div>
          </div>

          {/* BOTON PEDIR VIAJE */}
          <button
            onClick={() => { if(canGo) setScreen('searching'); }}
            disabled={!canGo}
            style={{ width:'100%', padding:'17px', background: canGo ? ride.color : '#E2E8F0', color: canGo ? '#fff' : '#94A3B8', border:'none', borderRadius:16, fontSize:16, fontWeight:800, cursor: canGo ? 'pointer' : 'not-allowed', transition:'all 0.2s', marginBottom:8, letterSpacing:0.3, boxShadow: canGo ? '0 4px 20px rgba(99,102,241,0.3)' : 'none' }}
          >
            {canGo ? 'Pedir ' + ride.name + ' Â· ' + ride.price.toLocaleString() + ' XAF' : 'Ingresa origen y destino'}
          </button>
          <div style={{ height:'max(8px, env(safe-area-inset-bottom))' }} />
        </div>
      </div>
    </div>
  );
};

export default MiTaxiView;
