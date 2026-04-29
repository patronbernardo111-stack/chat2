import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  onBack: () => void;
  userBalance: number;
  onDebit: (amount: number) => void;
  userName?: string;
  userPhone?: string;
}
type Screen = 'home' | 'searching' | 'matched' | 'riding' | 'rating' | 'driver' | 'settings';
interface LatLng { lat: number; lng: number; }

const MAPTILER_KEY = (import.meta as any).env?.VITE_MAPTILER_KEY || 'bg3FUa7es7Qn1TITIWjO';

const APP_THEMES = [
  { id:'default',  name:'Predeterminado', bg:'#F8FAFF', card:'#FFFFFF', accent:'#6366F1' },
  { id:'sunset',   name:'Atardecer',      bg:'#FFF7ED', card:'#FFFBF5', accent:'#F97316' },
  { id:'ocean',    name:'Oceano',         bg:'#F0F9FF', card:'#F8FCFF', accent:'#0EA5E9' },
  { id:'forest',   name:'Bosque',         bg:'#F0FDF4', card:'#F7FFF9', accent:'#10B981' },
  { id:'lavender', name:'Lavanda',        bg:'#F5F3FF', card:'#FDFCFF', accent:'#7C3AED' },
  { id:'rose',     name:'Rosa',           bg:'#FFF1F2', card:'#FFFBFB', accent:'#F43F5E' },
  { id:'midnight', name:'Medianoche',     bg:'#0F172A', card:'#1E293B', accent:'#818CF8' },
  { id:'gold',     name:'Dorado',         bg:'#FFFBEB', card:'#FFFEF5', accent:'#D97706' },
];

// SVG icons as strings (no backticks inside)
const MOTO_SVG = '<svg viewBox="0 0 60 36" fill="none"><circle cx="12" cy="28" r="7" stroke="currentColor" stroke-width="2.5"/><circle cx="48" cy="28" r="7" stroke="currentColor" stroke-width="2.5"/><path d="M12 28 L19 16 L30 14 L38 10 L44 16 L48 28" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 14 L34 20 L26 20 Z" fill="currentColor"/></svg>';
const TAXI_SVG = '<svg viewBox="0 0 64 36" fill="none"><rect x="4" y="14" width="56" height="16" rx="3" stroke="currentColor" stroke-width="2.5"/><path d="M12 14 L17 4 L47 4 L52 14" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><rect x="18" y="5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="35" y="5" width="11" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="30" r="5" stroke="currentColor" stroke-width="2.5"/><circle cx="48" cy="30" r="5" stroke="currentColor" stroke-width="2.5"/><rect x="26" y="2" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.5"/></svg>';
const SUV_SVG  = '<svg viewBox="0 0 68 36" fill="none"><rect x="2" y="12" width="64" height="18" rx="3" stroke="currentColor" stroke-width="2.5"/><path d="M8 12 L14 3 L54 3 L60 12" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><rect x="15" y="4" width="14" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="39" y="4" width="14" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="30" r="5.5" stroke="currentColor" stroke-width="2.5"/><circle cx="52" cy="30" r="5.5" stroke="currentColor" stroke-width="2.5"/></svg>';
const VIP_SVG  = '<svg viewBox="0 0 72 34" fill="none"><rect x="2" y="12" width="68" height="16" rx="3" stroke="currentColor" stroke-width="2.5"/><path d="M10 12 L17 3 L55 3 L62 12" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><rect x="18" y="4" width="13" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="41" y="4" width="13" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="17" cy="28" r="5" stroke="currentColor" stroke-width="2.5"/><circle cx="55" cy="28" r="5" stroke="currentColor" stroke-width="2.5"/><path d="M32 3 L40 3" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4"/></svg>';
const CARGO_SVG= '<svg viewBox="0 0 72 36" fill="none"><rect x="2" y="14" width="70" height="16" rx="2" stroke="currentColor" stroke-width="2.5"/><path d="M2 14 L2 7 L32 7 L32 14" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><rect x="4" y="8" width="26" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><line x1="32" y1="7" x2="32" y2="30" stroke="currentColor" stroke-width="2.5"/><circle cx="16" cy="30" r="5" stroke="currentColor" stroke-width="2.5"/><circle cx="58" cy="30" r="5" stroke="currentColor" stroke-width="2.5"/></svg>';
const VAN_SVG  = '<svg viewBox="0 0 76 36" fill="none"><rect x="2" y="8" width="72" height="22" rx="3" stroke="currentColor" stroke-width="2.5"/><line x1="24" y1="8" x2="24" y2="30" stroke="currentColor" stroke-width="2" opacity="0.4"/><rect x="4" y="10" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="26" y="10" width="13" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><rect x="41" y="10" width="13" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="30" r="5" stroke="currentColor" stroke-width="2.5"/><circle cx="60" cy="30" r="5" stroke="currentColor" stroke-width="2.5"/></svg>';
const MINI_SVG = '<svg viewBox="0 0 66 36" fill="none"><rect x="2" y="10" width="62" height="20" rx="3" stroke="currentColor" stroke-width="2.5"/><path d="M2 10 L8 3 L44 3 L50 10" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><rect x="9" y="4" width="12" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="24" y="4" width="12" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/><line x1="38" y1="10" x2="38" y2="30" stroke="currentColor" stroke-width="2" opacity="0.4"/><circle cx="14" cy="30" r="5" stroke="currentColor" stroke-width="2.5"/><circle cx="52" cy="30" r="5" stroke="currentColor" stroke-width="2.5"/></svg>';

const RIDES = [
  { id:'moto',    name:'Moto',     sub:'1 pasajero',    price:500,  eta:'2 min', color:'#F97316', bg:'#FFF7ED', desc:'Motocicleta rapida',      icon: MOTO_SVG  },
  { id:'taxi',    name:'Taxi',     sub:'4 pasajeros',   price:1000, eta:'4 min', color:'#EAB308', bg:'#FEFCE8', desc:'Taxi sedan estandar',     icon: TAXI_SVG  },
  { id:'suv',     name:'Confort',  sub:'SUV 4 plazas',  price:2000, eta:'5 min', color:'#6366F1', bg:'#EEF2FF', desc:'SUV comodo y espacioso',  icon: SUV_SVG   },
  { id:'vip',     name:'VIP',      sub:'Premium 4 plz', price:3500, eta:'7 min', color:'#7C3AED', bg:'#F5F3FF', desc:'Vehiculo ejecutivo',      icon: VIP_SVG   },
  { id:'cargo',   name:'Cargo',    sub:'Pickup/Dina',   price:2500, eta:'8 min', color:'#0EA5E9', bg:'#F0F9FF', desc:'Pickup y camionetas',     icon: CARGO_SVG },
  { id:'van',     name:'Van',      sub:'8 pasajeros',   price:3000, eta:'9 min', color:'#10B981', bg:'#F0FDF4', desc:'Van grande para grupos',  icon: VAN_SVG   },
  { id:'minivan', name:'MiniVan',  sub:'6 pasajeros',   price:2200, eta:'6 min', color:'#EC4899', bg:'#FDF2F8', desc:'Minivan familiar',        icon: MINI_SVG  },
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
  'Barrio Caracolas','Barrio Los Angeles','Hotel Impala','Embajada de Espana',
];

const DOCS = [
  { key:'dni',      label:'DNI / Cedula de identidad',   desc:'Documento de identidad vigente',   req:true  },
  { key:'license',  label:'Permiso de conducir',         desc:'Licencia categoria B o superior',  req:true  },
  { key:'itv',      label:'Inspeccion tecnica (ITV)',    desc:'Certificado tecnico del vehiculo', req:true  },
  { key:'criminal', label:'Certificado de antecedentes', desc:'Antecedentes penales',             req:true  },
  { key:'insurance',label:'Seguro del vehiculo',         desc:'Poliza de seguro (opcional)',      req:false },
];

const NEARBY = [
  { dx:0.003,  dy:0.002,  rideId:'taxi',  label:'Taxi' },
  { dx:-0.004, dy:0.001,  rideId:'suv',   label:'SUV'  },
  { dx:0.001,  dy:-0.003, rideId:'moto',  label:'Moto' },
  { dx:-0.002, dy:-0.002, rideId:'van',   label:'Van'  },
  { dx:0.005,  dy:-0.001, rideId:'vip',   label:'VIP'  },
];

// -- MAPA ----------------------------------------------------------------------
const LiveMap: React.FC<{
  h?: number | string;
  userPos?: LatLng | null;
  destPos?: LatLng | null;
  showRoute?: boolean;
  showNearby?: boolean;
}> = ({ h = 260, userPos, destPos, showRoute, showNearby }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<any>(null);
  const sdkRef = useRef<any>(null);
  const userMk = useRef<any>(null);
  const destMk = useRef<any>(null);
  const nearbyMks = useRef<any[]>([]);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref.current || inst.current) return;
    import('@maptiler/sdk').then(sdk => {
      sdkRef.current = sdk;
      sdk.config.apiKey = MAPTILER_KEY;
      const center: [number, number] = userPos ? [userPos.lng, userPos.lat] : [8.7741, 3.7523];
      const m = new sdk.Map({ container: ref.current!, style: sdk.MapStyle.STREETS, center, zoom: 14, navigationControl: false });
      inst.current = m;
      m.on('load', () => {
        setLoading(false);
        // Pin GPS usuario - punto azul pulsante
        const el = document.createElement('div');
        el.style.cssText = 'position:relative;width:22px;height:22px;';
        el.innerHTML = '<div style="width:22px;height:22px;border-radius:50%;background:#6366F1;border:3px solid #fff;box-shadow:0 2px 8px rgba(99,102,241,0.5);"></div><div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(99,102,241,0.2);animation:gpsp 2s ease-in-out infinite;"></div>';
        const st = document.createElement('style');
        st.textContent = '@keyframes gpsp{0%,100%{transform:scale(1);opacity:0.8}50%{transform:scale(1.6);opacity:0}}';
        document.head.appendChild(st);
        userMk.current = new sdk.Marker({ element: el, anchor: 'center' }).setLngLat(center).addTo(m);
      });
    }).catch(() => setErr(true));
    return () => { inst.current?.remove(); inst.current = null; };
  }, []);

  // Seguir GPS
  useEffect(() => {
    if (!userMk.current || !userPos || !inst.current) return;
    userMk.current.setLngLat([userPos.lng, userPos.lat]);
    if (!destPos) inst.current.flyTo({ center: [userPos.lng, userPos.lat], zoom: 14, duration: 800 });
  }, [userPos]);

  // Veh�culos cercanos
  useEffect(() => {
    if (!inst.current || !sdkRef.current || !userPos || !showNearby) return;
    const sdk = sdkRef.current; const map = inst.current;
    nearbyMks.current.forEach(m => m.remove()); nearbyMks.current = [];
    const add = () => {
      NEARBY.forEach(d => {
        const ride = RIDES.find(r => r.id === d.rideId) || RIDES[1];
        const el = document.createElement('div');
        el.innerHTML = '<div style="background:' + ride.color + ';color:#fff;border-radius:8px;padding:3px 7px;font-size:10px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.2);border:1.5px solid #fff;">' + d.label + '</div>';
        nearbyMks.current.push(new sdk.Marker({ element: el, anchor: 'bottom' }).setLngLat([userPos.lng + d.dx, userPos.lat + d.dy]).addTo(map));
      });
    };
    if (map.isStyleLoaded()) add(); else map.on('load', add);
  }, [userPos, showNearby]);

  // Ruta
  useEffect(() => {
    if (!inst.current || !sdkRef.current || !userPos || !destPos || !showRoute) return;
    const map = inst.current; const sdk = sdkRef.current;
    if (destMk.current) destMk.current.remove();
    const de = document.createElement('div');
    de.innerHTML = '<div style="width:18px;height:18px;border-radius:50%;background:#EF4444;border:3px solid #fff;box-shadow:0 2px 8px rgba(239,68,68,0.5);"></div>';
    destMk.current = new sdk.Marker({ element: de, anchor: 'center' }).setLngLat([destPos.lng, destPos.lat]).addTo(map);
    const draw = async () => {
      try {
        const url = 'https://api.maptiler.com/directions/v2/driving/' + userPos.lng + ',' + userPos.lat + ';' + destPos.lng + ',' + destPos.lat + '?key=' + MAPTILER_KEY + '&geometries=geojson';
        const data = await fetch(url).then(r => r.json());
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (!coords) throw new Error('no route');
        const geo = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } };
        if (map.getSource('route')) { (map.getSource('route') as any).setData(geo); }
        else {
          map.addSource('route', { type: 'geojson', data: geo });
          map.addLayer({ id: 'route-bg', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fff', 'line-width': 8 } });
          map.addLayer({ id: 'route-ln', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#6366F1', 'line-width': 5 } });
        }
        const lngs = coords.map((c: number[]) => c[0]); const lats = coords.map((c: number[]) => c[1]);
        map.fitBounds([[Math.min(...lngs) - 0.005, Math.min(...lats) - 0.005], [Math.max(...lngs) + 0.005, Math.max(...lats) + 0.005]], { padding: 80, duration: 1000 });
      } catch {
        const line = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[userPos.lng, userPos.lat], [destPos.lng, destPos.lat]] } };
        if (map.getSource('route')) { (map.getSource('route') as any).setData(line); }
        else {
          map.addSource('route', { type: 'geojson', data: line });
          map.addLayer({ id: 'route-bg', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#fff', 'line-width': 8 } });
          map.addLayer({ id: 'route-ln', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#6366F1', 'line-width': 5 } });
        }
        map.fitBounds([[Math.min(userPos.lng, destPos.lng) - 0.01, Math.min(userPos.lat, destPos.lat) - 0.01], [Math.max(userPos.lng, destPos.lng) + 0.01, Math.max(userPos.lat, destPos.lat) + 0.01]], { padding: 80 });
      }
    };
    if (map.isStyleLoaded()) draw(); else map.on('load', draw);
  }, [destPos, showRoute]);

  if (err) return (
    <div style={{ height: h, width: '100%', background: 'linear-gradient(135deg,#e0e7ff,#f0fdf4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span style={{ fontSize: 32 }}>???</span>
      <span style={{ fontSize: 13, color: '#6B7280' }}>Malabo, Guinea Ecuatorial</span>
    </div>
  );
  return (
    <div style={{ position: 'relative', height: h, width: '100%' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#e0e7ff,#f0fdf4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 1 }}>
          <span style={{ fontSize: 32 }}>???</span>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Cargando mapa...</span>
        </div>
      )}
      <div ref={ref} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

// -- COMPONENTE PRINCIPAL ------------------------------------------------------
export const MiTaxiView: React.FC<Props> = ({ onBack, userBalance = 0, onDebit }) => {
  const [screen, setScreen]     = useState<Screen>('home');
  const [origin, setOrigin]     = useState('');
  const [dest, setDest]         = useState('');
  const [sugg, setSugg]         = useState<string[]>([]);
  const [focus, setFocus]       = useState<'o' | 'd' | null>(null);
  const [ride, setRide]         = useState(RIDES[1]);
  const [driver, setDriver]     = useState(DRIVERS[0]);
  const [pct, setPct]           = useState(0);
  const [progress, setProgress] = useState(0);
  const [stars, setStars]       = useState(0);
  const [hover, setHover]       = useState(0);
  const [rated, setRated]       = useState(false);
  const [userPos, setUserPos]   = useState<LatLng | null>(null);
  const [destPos, setDestPos]   = useState<LatLng | null>(null);
  const [gpsOk, setGpsOk]       = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [theme, setTheme]       = useState(APP_THEMES[0]);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [dtab, setDtab]         = useState<'info' | 'vehicle' | 'docs'>('info');
  const [form, setForm]         = useState({ name: '', phone: '', license: '', brand: '', model: '', year: '', color: '', plate: '', type: 'sedan', vehicleState: '', photoExt: '', photoInt: '', photoFront: '', photoBack: '' });
  const [docs, setDocs]         = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [settings, setSettings]   = useState({ voice: 'es-GQ', navMode: 'standard', savedPlaces: ['Aeropuerto de Malabo', 'Hospital La Paz'] });
  const [showDriverChat, setShowDriverChat] = useState(false);
  const [driverChatMsgs, setDriverChatMsgs] = useState<Array<{id:string; from:'me'|'driver'; text:string; time:string}>>([
    { id:'1', from:'driver', text:'Hola, estoy en camino. Llegaré en unos minutos.', time:'13:00' },
  ]);
  const [driverChatInput, setDriverChatInput] = useState('');
  const driverChatEndRef = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);
  const watchId = useRef<number | null>(null);

  // Tema activo - definido aqu� para que est� disponible en todo el componente
  const BG = customBg ? 'transparent' : theme.bg;
  const CARD = theme.card;
  const ACCENT = theme.accent;
  const ACCENT_LIGHT = ACCENT + '18';
  const TEXT = theme.id === 'midnight' ? '#F1F5F9' : '#0F172A';
  const SUB = theme.id === 'midnight' ? '#94A3B8' : '#64748B';
  const BORDER = theme.id === 'midnight' ? '#334155' : '#EEF0F8';
  const GREEN = '#10B981'; const RED = '#EF4444';

  const wrap: React.CSSProperties = { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter',system-ui,sans-serif", zIndex: 600, color: TEXT, background: customBg ? 'url(' + customBg + ') center/cover no-repeat' : BG };
  const card: React.CSSProperties = { background: CARD, borderRadius: 20, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.06)' };
  const btn = (dis = false): React.CSSProperties => ({ width: '100%', padding: '16px', background: dis ? '#E2E8F0' : ACCENT, color: dis ? '#94A3B8' : '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: dis ? 'not-allowed' : 'pointer', transition: 'all 0.2s' });
  const fld = (active = false): React.CSSProperties => ({ background: active ? CARD : (theme.id === 'midnight' ? '#1E293B' : '#F1F5F9'), borderRadius: 14, padding: '14px 16px', border: '1.5px solid ' + (active ? ACCENT : 'transparent'), transition: 'all 0.2s' });
  const hdr: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, paddingTop: 'max(14px, env(safe-area-inset-top))', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', background: theme.id === 'midnight' ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid ' + BORDER };
  const bk: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 10, display: 'flex', alignItems: 'center' };

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) { setUserPos({ lat: 3.7523, lng: 8.7741 }); return; }
    navigator.geolocation.getCurrentPosition(
      p => { setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsOk(true); },
      () => setUserPos({ lat: 3.7523, lng: 8.7741 }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
    watchId.current = navigator.geolocation.watchPosition(
      p => { setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsOk(true); },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, []);

  const geocodeDest = useCallback(async (name: string) => {
    try {
      const url = 'https://api.maptiler.com/geocoding/' + encodeURIComponent(name + ' Malabo Guinea Ecuatorial') + '.json?key=' + MAPTILER_KEY + '&limit=1';
      const data = await fetch(url).then(r => r.json());
      const feat = data?.features?.[0];
      if (feat) setDestPos({ lng: feat.center[0], lat: feat.center[1] });
    } catch {}
  }, []);

  const upDoc = (k: string, f: File | null) => { if (f) setDocs(d => ({ ...d, [k]: f.name })); };
  const reqDone = DOCS.filter(d => d.req).every(d => docs[d.key]);
  const canGo = origin.trim().length > 0 && dest.trim().length > 0;

  useEffect(() => {
    if (screen === 'searching') {
      setPct(0);
      timer.current = setInterval(() => setPct(p => {
        if (p >= 100) { clearInterval(timer.current); setDriver(DRIVERS[Math.floor(Math.random() * DRIVERS.length)]); setScreen('matched'); return 100; }
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

  const onSugg = (val: string, field: 'o' | 'd') => {
    if (field === 'o') setOrigin(val); else setDest(val);
    const allPlaces = [...settings.savedPlaces, ...PLACES];
    setSugg(val.length > 0 ? allPlaces.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 6) : []);
  };
  const selectPlace = (s: string) => {
    if (focus === 'd') { setDest(s); geocodeDest(s); } else setOrigin(s);
    setSugg([]);
  };

  // Panel de temas
  const ThemePanel = () => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowThemes(false)}>
      <div style={{ width: '100%', background: CARD, borderRadius: '24px 24px 0 0', padding: '20px 20px 40px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><div style={{ width: 40, height: 4, borderRadius: 2, background: BORDER }} /></div>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 16 }}>Personalizar fondo</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {APP_THEMES.map(t => (
            <button key={t.id} onClick={() => { setTheme(t); setCustomBg(null); setShowThemes(false); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 6px', borderRadius: 14, border: '2px solid ' + (theme.id === t.id && !customBg ? t.accent : 'transparent'), background: t.bg, cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.accent }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: t.id === 'midnight' ? '#94A3B8' : '#374151', textAlign: 'center' }}>{t.name}</span>
            </button>
          ))}
        </div>
        <div style={{ height: 1, background: BORDER, margin: '12px 0' }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: SUB, marginBottom: 10 }}>O sube tu propia imagen</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: ACCENT_LIGHT, borderRadius: 14, cursor: 'pointer', border: '1.5px dashed ' + ACCENT }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: ACCENT }}>Seleccionar imagen del dispositivo</span>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setCustomBg(URL.createObjectURL(f)); setShowThemes(false); } }} />
        </label>
        {customBg && <button onClick={() => setCustomBg(null)} style={{ width: '100%', marginTop: 10, padding: '12px', background: '#FEE2E2', color: RED, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Quitar imagen personalizada</button>}
      </div>
    </div>
  );

  // PANTALLA CONDUCTOR
  if (screen === 'driver') return (
    <div style={wrap}>
      {showThemes && <ThemePanel />}
      <div style={hdr}>
        <button style={bk} onClick={() => setScreen('home')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg></button>
        <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Ser conductor</div><div style={{ fontSize: 12, color: SUB }}>Registrate en la flota MiTaxi</div></div>
        <button onClick={() => setShowThemes(true)} style={{ background: ACCENT_LIGHT, border: 'none', borderRadius: 50, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>Fondo</span>
        </button>
      </div>
      {submitted ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>Solicitud enviada</div>
          <div style={{ fontSize: 15, color: SUB, lineHeight: 1.7, maxWidth: 280 }}>Tu solicitud esta siendo revisada. Te contactaremos en 24-48 horas.</div>
          <button onClick={() => { setSubmitted(false); setScreen('home'); }} style={{ ...btn(), width: 'auto', padding: '14px 40px' }}>Volver ACCENT_LIGHT inicio</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', background: CARD, borderBottom: '1px solid ' + BORDER, padding: '4px 16px', gap: 4 }}>
            {(['info', 'vehicle', 'docs'] as const).map(t => (
              <button key={t} onClick={() => setDtab(t)} style={{ padding: '10px 18px', borderRadius: 50, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: dtab === t ? ACCENT : 'transparent', color: dtab === t ? '#fff' : SUB, transition: 'all 0.2s' }}>
                {t === 'info' ? 'Datos' : t === 'vehicle' ? 'Vehiculo' : 'Documentos'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>
            {dtab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[{ k: 'name', l: 'Nombre completo', p: 'Carlos Nguema Obiang' }, { k: 'phone', l: 'Telefono', p: '+240 222 000 000' }, { k: 'license', l: 'Numero de licencia', p: 'GE-2024-001234' }].map(f => (
                  <div key={f.k} style={fld()}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: SUB, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.6 }}>{f.l}</div>
                    <input value={(form as any)[f.k]} onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))} placeholder={f.p} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, outline: 'none', color: TEXT, boxSizing: 'border-box' }} />
                  </div>
                ))}
                <button onClick={() => setDtab('vehicle')} style={btn(!form.name || !form.phone)}>Continuar</button>
              </div>
            )}
            {dtab === 'vehicle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[{ k: 'brand', l: 'Marca', p: 'Toyota' }, { k: 'model', l: 'Modelo', p: 'Corolla' }, { k: 'year', l: 'Ano', p: '2020' }, { k: 'color', l: 'Color', p: 'Blanco' }].map(f => (
                    <div key={f.k} style={fld()}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: SUB, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.6 }}>{f.l}</div>
                      <input value={(form as any)[f.k]} onChange={e => setForm(x => ({ ...x, [f.k]: e.target.value }))} placeholder={f.p} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: TEXT, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                <div style={fld()}><div style={{ fontSize: 11, fontWeight: 700, color: SUB, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.6 }}>Matricula</div><input value={form.plate} onChange={e => setForm(x => ({ ...x, plate: e.target.value }))} placeholder="GE-1234" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, outline: 'none', color: TEXT, boxSizing: 'border-box' }} /></div>
                <div style={fld()}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: SUB, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>Tipo de vehiculo</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Sedan', 'SUV', 'Van', 'Moto', 'Pickup'].map(t => (
                      <button key={t} onClick={() => setForm(x => ({ ...x, type: t.toLowerCase() }))} style={{ padding: '8px 18px', borderRadius: 50, border: '1.5px solid ' + (form.type === t.toLowerCase() ? ACCENT : BORDER), background: form.type === t.toLowerCase() ? ACCENT_LIGHT : CARD, color: form.type === t.toLowerCase() ? ACCENT : SUB, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setDtab('docs')} style={btn(!form.plate)}>Continuar a Documentos</button>
              </div>
            )}
            {dtab === 'docs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: ACCENT_LIGHT, borderRadius: 12, padding: '12px 16px', border: '1px solid ' + ACCENT + '40' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>Documentos requeridos</div>
                  <div style={{ fontSize: 12, color: ACCENT + 'aa', marginTop: 3 }}>Los marcados con * son obligatorios.</div>
                </div>
                {DOCS.map(doc => (
                  <div key={doc.key} style={{ background: docs[doc.key] ? '#F0FDF4' : CARD, borderRadius: 16, padding: '16px 18px', border: '1.5px solid ' + (docs[doc.key] ? '#86EFAC' : BORDER) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {doc.label}
                          {doc.req ? <span style={{ color: RED, fontSize: 12 }}>*</span> : <span style={{ fontSize: 10, background: '#F1F5F9', color: SUB, padding: '2px 7px', borderRadius: 20 }}>Opcional</span>}
                        </div>
                        <div style={{ fontSize: 12, color: SUB, marginTop: 3 }}>{doc.desc}</div>
                        {docs[doc.key] && <div style={{ fontSize: 12, color: GREEN, marginTop: 5 }}>Subido: {docs[doc.key]}</div>}
                      </div>
                      <label style={{ padding: '9px 18px', background: docs[doc.key] ? '#DCFCE7' : ACCENT, color: docs[doc.key] ? GREEN : '#fff', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {docs[doc.key] ? 'Cambiar' : 'Subir'}
                        <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => upDoc(doc.key, e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>
                ))}
                <button onClick={() => { if (form.name && form.phone && form.plate && reqDone) setSubmitted(true); }} style={btn(!(form.name && form.phone && form.plate && reqDone))}>
                  {reqDone ? 'Enviar solicitud' : 'Sube los documentos obligatorios (*)'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // BUSCANDO
  if (screen === 'searching') return (
    <div style={wrap}>
      {showThemes && <ThemePanel />}
      <div style={hdr}>
        <button style={bk} onClick={() => setScreen('home')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg></button>
        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Buscando conductor</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 28 }}>
        <div style={{ position: 'relative', width: 130, height: 130 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ACCENT + '10', animation: 'p1 1.2s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 18, borderRadius: '50%', background: ACCENT + '18', animation: 'p1 1.6s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 36, borderRadius: '50%', background: ACCENT + '25', animation: 'p1 2.0s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 58, height: 58, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px ' + ACCENT + '60' }}>
              <div style={{ width: 36, height: 22, color: '#fff' }} dangerouslySetInnerHTML={{ __html: ride.icon }} />
            </div>
          </div>
        </div>
        <style>{'@keyframes p1{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.12);opacity:1}}'}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Conectando contigo</div>
          <div style={{ fontSize: 14, color: SUB, lineHeight: 1.7 }}>{origin}<br />hacia {dest}</div>
        </div>
        <div style={{ width: '100%', maxWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: SUB }}>Buscando conductores...</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: ACCENT, borderRadius: 3, transition: 'width 0.08s linear' }} />
          </div>
        </div>
        <button onClick={() => setScreen('home')} style={{ padding: '12px 32px', background: 'none', border: '1.5px solid ' + BORDER, borderRadius: 50, color: SUB, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
      </div>
    </div>
  );

  // CONDUCTOR ENCONTRADO
  if (screen === 'matched') return (
    <div style={wrap}>
      {showThemes && <ThemePanel />}
      <div style={hdr}>
        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Conductor asignado</div>
        <div style={{ marginLeft: 'auto', background: '#F0FDF4', color: GREEN, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 50 }}>En camino</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <LiveMap h={200} userPos={userPos} destPos={destPos} showRoute={true} />
        <div style={{ padding: '20px 20px 120px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: driver.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{driver.ini}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: TEXT }}>{driver.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map(s => <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= Math.floor(driver.rating) ? '#F59E0B' : '#E2E8F0'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>)}
                  <span style={{ fontSize: 13, color: SUB }}>{driver.rating} � {driver.trips.toLocaleString()} viajes</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', background: ACCENT_LIGHT, borderRadius: 14, padding: '10px 16px' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: ACCENT }}>4 min</div>
                <div style={{ fontSize: 11, color: SUB }}>llegada</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[{ l: 'Vehiculo', v: driver.car }, { l: 'Matricula', v: driver.plate }].map(x => (
                <div key={x.l} style={{ background: theme.id === 'midnight' ? '#0F172A' : '#F8FAFF', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: SUB, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{x.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{x.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 14, color: SUB }}>Servicio</span><span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{ride.name}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 14, color: SUB }}>Ruta</span><span style={{ fontSize: 13, fontWeight: 500, color: TEXT, textAlign: 'right', maxWidth: 200 }}>{origin} a {dest}</span></div>
            <div style={{ height: 1, background: BORDER, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Total</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: ACCENT }}>{ride.price.toLocaleString()} XAF</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: CARD, borderTop: '1px solid ' + BORDER, display: 'flex', gap: 10 }}>
        <button onClick={() => setScreen('home')} style={{ flex: 1, padding: '14px', background: BORDER, color: SUB, border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={() => { if (userBalance >= ride.price) { onDebit(ride.price); setScreen('riding'); } else alert('Saldo insuficiente'); }} style={{ flex: 2, padding: '14px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Confirmar � {ride.price.toLocaleString()} XAF
        </button>
      </div>
    </div>
  );

  // VIAJE EN CURSO
  if (screen === 'riding') return (
    <div style={wrap}>
      {showThemes && <ThemePanel />}
      <div style={{ ...hdr, justifyContent: 'space-between' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>Viaje en curso</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: progress >= 100 ? GREEN : ACCENT }}>{progress >= 100 ? 'Llegaste!' : Math.round(progress) + '%'}</div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <LiveMap h="100%" userPos={userPos} destPos={destPos} showRoute={true} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: CARD, borderRadius: '24px 24px 0 0', padding: '22px 22px 36px', boxShadow: '0 -8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: driver.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>{driver.ini}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{driver.name}</div><div style={{ fontSize: 12, color: SUB }}>{driver.plate} � {driver.car}</div></div>
            <div style={{ fontSize: 15, fontWeight: 800, color: ACCENT }}>{ride.price.toLocaleString()} XAF</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 12, color: SUB }}>{origin}</span><span style={{ fontSize: 12, color: SUB }}>{dest}</span></div>
            <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: progress + '%', background: ACCENT, borderRadius: 3, transition: 'width 0.12s' }} />
            </div>
          </div>
          {progress >= 100
            ? <button onClick={() => setScreen('rating')} style={{ ...btn(), background: GREEN }}>Calificar viaje</button>
            : <button onClick={() => setScreen('home')} style={{ ...btn(), background: BORDER, color: SUB }}>Cancelar viaje</button>
          }
        </div>
      </div>
    </div>
  );

  // CALIFICACION
  if (screen === 'rating') return (
    <div style={wrap}>
      {showThemes && <ThemePanel />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 24 }}>
        {rated ? (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: TEXT }}>Gracias!</div>
            <div style={{ fontSize: 15, color: SUB, textAlign: 'center', lineHeight: 1.7 }}>Tu calificacion ayuda a mejorar el servicio.</div>
            <button onClick={onBack} style={{ ...btn(), width: 'auto', padding: '14px 48px' }}>Volver ACCENT_LIGHT inicio</button>
          </>
        ) : (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: driver.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' }}>{driver.ini}</div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Como fue tu viaje?</div><div style={{ fontSize: 15, color: SUB }}>con {driver.name}</div></div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setStars(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transform: s <= (hover || stars) ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill={s <= (hover || stars) ? '#F59E0B' : '#E2E8F0'} style={{ transition: 'fill 0.15s' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </button>
              ))}
            </div>
            {stars > 0 && <button onClick={() => setRated(true)} style={{ ...btn(), width: 'auto', padding: '14px 48px' }}>Enviar calificacion</button>}
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: SUB, fontSize: 14, cursor: 'pointer' }}>Omitir</button>
          </>
        )}
      </div>
    </div>
  );

  // HOME - UBER STYLE
  return (
    <div style={wrap}>
      {showThemes && <ThemePanel />}

      {/* Header flotante */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px', paddingLeft: '14px', paddingRight: '14px', background: theme.id === 'midnight' ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid ' + BORDER }}>
        <button style={bk} onClick={onBack}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: TEXT }}>MiTaxi</div>
          <div style={{ fontSize: 11, color: SUB, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: gpsOk ? GREEN : '#F59E0B', flexShrink: 0 }} />
            <span>{gpsOk ? 'GPS activo � Malabo' : 'Obteniendo ubicacion...'}</span>
          </div>
        </div>
        <button onClick={() => setShowThemes(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 11px', background: ACCENT_LIGHT, border: 'none', borderRadius: 50, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>Fondo</span>
        </button>
        <button onClick={() => setScreen('driver')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 11px', background: ACCENT_LIGHT, border: 'none', borderRadius: 50, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>Conductor</span>
        </button>
      </div>

      {/* Mapa full screen */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <LiveMap h="100%" userPos={userPos} destPos={destPos} showRoute={!!destPos} showNearby={!destPos && !!userPos} />
      </div>

      {/* Bottom sheet */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: CARD, borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 32px rgba(0,0,0,0.15)', zIndex: 10, maxHeight: '72vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: BORDER }} />
        </div>
        <div style={{ padding: '4px 20px 8px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, marginBottom: 12 }}>A donde vas?</div>

          {/* Campos ruta */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, paddingBottom: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2.5px solid ' + ACCENT, background: CARD, flexShrink: 0 }} />
              <div style={{ width: 2, flex: 1, background: 'linear-gradient(' + ACCENT + ',#0F172A)', margin: '4px 0', borderRadius: 1 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0F172A', flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={fld(focus === 'o')}>
                <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>Origen</div>
                <input value={origin} onChange={e => onSugg(e.target.value, 'o')} onFocus={() => setFocus('o')} onBlur={() => setTimeout(() => setFocus(null), 150)} placeholder={gpsOk ? 'Mi ubicacion (GPS activo)' : 'Tu ubicacion actual'} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: TEXT, fontWeight: 500, boxSizing: 'border-box' }} />
              </div>
              <div style={fld(focus === 'd')}>
                <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>Destino</div>
                <input value={dest} onChange={e => onSugg(e.target.value, 'd')} onFocus={() => setFocus('d')} onBlur={() => setTimeout(() => setFocus(null), 150)} placeholder="A donde vas?" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: TEXT, fontWeight: 500, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Sugerencias */}
          {sugg.length > 0 && focus && (
            <div style={{ background: CARD, borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: 12, overflow: 'hidden', border: '1px solid ' + BORDER }}>
              {sugg.map((s, i) => (
                <button key={i} onClick={() => selectPlace(s)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: i < sugg.length - 1 ? '1px solid ' + BORDER : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                  </div>
                  <span style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{s}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tipos de vehiculo - scroll horizontal */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 12, scrollbarWidth: 'none' }}>
            {RIDES.map(r => (
              <button key={r.id} onClick={() => setRide(r)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 12px', borderRadius: 16, border: '2px solid ' + (ride.id === r.id ? r.color : BORDER), background: ride.id === r.id ? r.color + '15' : CARD, cursor: 'pointer', flexShrink: 0, minWidth: 78, transition: 'all 0.2s' }}>
                <div style={{ width: 48, height: 28, color: ride.id === r.id ? r.color : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: r.icon }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ride.id === r.id ? r.color : TEXT, whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: SUB }}>{r.eta}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ride.id === r.id ? r.color : TEXT }}>{r.price.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Info servicio seleccionado */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '10px 14px', background: ride.color + '12', borderRadius: 12, border: '1px solid ' + ride.color + '30' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ride.color }}>{ride.name} � {ride.sub}</div>
              <div style={{ fontSize: 11, color: SUB }}>{ride.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: ride.color }}>{ride.price.toLocaleString()} XAF</div>
              <div style={{ fontSize: 11, color: SUB }}>Saldo: <span style={{ fontWeight: 700, color: userBalance >= ride.price ? GREEN : RED }}>{userBalance.toLocaleString()}</span></div>
            </div>
          </div>

          {/* BOTON PEDIR VIAJE */}
          <button
            onClick={() => { if (canGo) setScreen('searching'); }}
            disabled={!canGo}
            style={{
              width: '100%', padding: '17px',
              background: canGo ? ride.color : '#E2E8F0',
              color: canGo ? '#fff' : '#94A3B8',
              border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 800,
              cursor: canGo ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s', marginBottom: 6, letterSpacing: 0.3,
              boxShadow: canGo ? '0 4px 20px ' + ride.color + '50' : 'none',
            }}
          >
            {canGo ? 'Pedir ' + ride.name + ' � ' + ride.price.toLocaleString() + ' XAF' : 'Ingresa origen y destino'}
          </button>
          <div style={{ height: 6 }} />
        </div>
      </div>
    </div>
  );
};

export default MiTaxiView;

