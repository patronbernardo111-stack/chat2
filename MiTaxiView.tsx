import React, { useState, useEffect, useRef } from 'react';

// ── TIPOS ────────────────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  userBalance: number;
  onDebit: (amount: number) => void;
  userName?: string;
  userPhone?: string;
}

type Screen = 'home' | 'searching' | 'matched' | 'riding' | 'rating' | 'driver-register';

interface VehicleType {
  id: string;
  label: string;
  sublabel: string;
  seats: number;
  price: number;
  eta: string;
  icon: string;
}

interface DriverMatch {
  name: string;
  initials: string;
  rating: number;
  trips: number;
  plate: string;
  car: string;
  eta: string;
  color: string;
}

// ── DATOS ────────────────────────────────────────────────────────────────────
const VEHICLE_TYPES: VehicleType[] = [
  { id: 'moto',    label: 'MiMoto',   sublabel: 'Moto · 1 pasajero',    seats: 1, price: 500,  eta: '2 min',  icon: 'M' },
  { id: 'basic',   label: 'MiTaxi',   sublabel: 'Sedán · 4 pasajeros',  seats: 4, price: 1000, eta: '4 min',  icon: 'T' },
  { id: 'comfort', label: 'Confort',  sublabel: 'SUV · 4 pasajeros',    seats: 4, price: 2000, eta: '6 min',  icon: 'C' },
  { id: 'xl',      label: 'XL',       sublabel: 'Van · 6 pasajeros',    seats: 6, price: 3000, eta: '8 min',  icon: 'X' },
];

const MOCK_DRIVERS: DriverMatch[] = [
  { name: 'Carlos Nguema',  initials: 'CN', rating: 4.9, trips: 1240, plate: 'GE-1234', car: 'Toyota Corolla Blanco',  eta: '3 min', color: '#1a1a2e' },
  { name: 'Pedro Mba Ondo', initials: 'PM', rating: 4.8, trips: 876,  plate: 'GE-5678', car: 'Hyundai Accent Gris',    eta: '5 min', color: '#16213e' },
  { name: 'Juan Esono',     initials: 'JE', rating: 4.7, trips: 543,  plate: 'GE-9012', car: 'Kia Rio Negro',          eta: '4 min', color: '#0f3460' },
  { name: 'María Obiang',   initials: 'MO', rating: 5.0, trips: 2100, plate: 'GE-3456', car: 'Toyota Camry Plateado',  eta: '2 min', color: '#533483' },
];

const MALABO_PLACES = [
  'Aeropuerto de Malabo', 'Hotel Bahía', 'Mercado Central', 'Palacio de Justicia',
  'Universidad Nacional de Guinea Ecuatorial', 'Hospital La Paz', 'Playa de Malabo',
  'Estadio de Malabo', 'Puerto de Malabo', 'Barrio Ela Nguema', 'Barrio Caracolas',
  'Sipopo Beach', 'Centro Comercial Paraíso', 'Embajada de España', 'Ministerio de Hacienda',
  'Catedral de Malabo', 'Colegio La Salle', 'Barrio Los Ángeles', 'Punta Europa',
];

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || 'bg3FUa7es7Qn1TITIWjO';

// ── ESTILOS BASE ─────────────────────────────────────────────────────────────
const BASE: React.CSSProperties = {
  position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
  background: '#F7F8FA', fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  zIndex: 600, color: '#111827',
};

// ── MAPA REAL ─────────────────────────────────────────────────────────────────
const MapView: React.FC<{ height?: number | string; origin?: string; destination?: string }> = ({ height = 280, origin, destination }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import('@maptiler/sdk').then(maptiler => {
      maptiler.config.apiKey = MAPTILER_KEY;
      const map = new maptiler.Map({
        container: mapRef.current!,
        style: maptiler.MapStyle.STREETS,
        center: [8.7741, 3.7523],
        zoom: 13,
        attributionControl: false,
      });
      mapInstance.current = map;
      map.on('load', () => {
        new maptiler.Marker({ color: '#111827' })
          .setLngLat([8.7741, 3.7523])
          .addTo(map);
      });
    }).catch(() => setMapError(true));
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  if (mapError) return (
    <div style={{ height, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
      <span style={{ fontSize: 13, color: '#9CA3AF' }}>Malabo, Guinea Ecuatorial</span>
    </div>
  );

  return <div ref={mapRef} style={{ height, width: '100%' }} />;
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export const MiTaxiView: React.FC<Props> = ({ onBack, userBalance = 0, onDebit, userName = 'Usuario' }) => {
  const [screen, setScreen] = useState<Screen>('home');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focusField, setFocusField] = useState<'origin' | 'dest' | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>(VEHICLE_TYPES[1]);
  const [driver, setDriver] = useState<DriverMatch>(MOCK_DRIVERS[0]);
  const [searchPct, setSearchPct] = useState(0);
  const [rideProgress, setRideProgress] = useState(0);
  const [stars, setStars] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [ratedDone, setRatedDone] = useState(false);
  const [driverTab, setDriverTab] = useState<'info' | 'vehicle' | 'docs'>('info');
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', license: '', carBrand: '', carModel: '', carYear: '', carColor: '', plate: '', carType: 'sedan' });
  const [driverDocs, setDriverDocs] = useState<Record<string, string>>({});
  const handleDocUpload = (key: string, file: File | null) => {
    if (file) setDriverDocs(d => ({ ...d, [key]: file.name }));
  };
  const REQUIRED_DOCS = [
    { key: 'dni',       label: 'DNI / Cedula de identidad',        desc: 'Documento nacional de identidad vigente',        required: true  },
    { key: 'license',   label: 'Permiso de conducir',              desc: 'Licencia de conducir categoria B o superior',    required: true  },
    { key: 'itv',       label: 'ITV / Inspeccion tecnica',         desc: 'Certificado de inspeccion tecnica del vehiculo', required: true  },
    { key: 'ownership', label: 'Titulo de propiedad del vehiculo', desc: 'Documento que acredita la titularidad',          required: true  },
    { key: 'criminal',  label: 'Certificado de antecedentes',      desc: 'Certificado de antecedentes penales',            required: true  },
    { key: 'insurance', label: 'Seguro del vehiculo',              desc: 'Poliza de seguro (opcional)',                    required: false },
  ];
  const requiredUploaded = REQUIRED_DOCS.filter(d => d.required).every(d => driverDocs[d.key]);
  const [driverSubmitted, setDriverSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  useEffect(() => {
    if (screen === 'searching') {
      setSearchPct(0);
      timerRef.current = setInterval(() => {
        setSearchPct(p => {
          if (p >= 100) { clearTimer(); setDriver(MOCK_DRIVERS[Math.floor(Math.random() * MOCK_DRIVERS.length)]); setScreen('matched'); return 100; }
          return p + 3;
        });
      }, 80);
    }
    if (screen === 'riding') {
      setRideProgress(0);
      timerRef.current = setInterval(() => {
        setRideProgress(p => { if (p >= 100) { clearTimer(); return 100; } return p + 0.5; });
      }, 150);
    }
    return clearTimer;
  }, [screen]);

  const handleDestInput = (val: string) => {
    setDestination(val);
    setSuggestions(val.length > 0 ? MALABO_PLACES.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 5) : []);
  };
  const handleOriginInput = (val: string) => {
    setOrigin(val);
    setSuggestions(val.length > 0 ? MALABO_PLACES.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 5) : []);
  };

  const canRequest = origin.trim().length > 0 && destination.trim().length > 0;

  // ── PANTALLA: REGISTRO CONDUCTOR ──────────────────────────────────────────
  if (screen === 'driver-register') return (
    <div style={BASE}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Registro de Conductor</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>Únete a la flota MiTaxi</div>
        </div>
      </div>

      {driverSubmitted ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', textAlign: 'center' }}>Solicitud enviada</div>
          <div style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.6 }}>Tu solicitud está siendo revisada. Te contactaremos en 24-48 horas al número registrado.</div>
          <button onClick={() => { setDriverSubmitted(false); setScreen('home'); }} style={{ marginTop: 8, padding: '12px 32px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Volver al inicio</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F3F4F6', padding: '0 20px' }}>
            {(['info', 'vehicle', 'docs'] as const).map(t => (
              <button key={t} onClick={() => setDriverTab(t)} style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: driverTab === t ? '#111827' : '#9CA3AF', borderBottom: driverTab === t ? '2px solid #111827' : '2px solid transparent' }}>
                {t === 'info' ? 'Datos personales' : t === 'vehicle' ? 'Vehiculo' : 'Documentos'}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px 20px 100px' }}>
            {driverTab === 'info' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#F8F9FF', borderRadius: 12, padding: '14px 16px', border: '1px solid #E8EAFF' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nombre completo</div>
                  <input value={driverForm.name} onChange={e => setDriverForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Carlos Nguema Obiang" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
                </div>
                <div style={{ background: '#F8F9FF', borderRadius: 12, padding: '14px 16px', border: '1px solid #E8EAFF' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Teléfono</div>
                  <input value={driverForm.phone} onChange={e => setDriverForm(f => ({ ...f, phone: e.target.value }))} placeholder="+240 222 000 000" type="tel" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
                </div>
                <div style={{ background: '#F8F9FF', borderRadius: 12, padding: '14px 16px', border: '1px solid #E8EAFF' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Número de licencia</div>
                  <input value={driverForm.license} onChange={e => setDriverForm(f => ({ ...f, license: e.target.value }))} placeholder="Ej: GE-2024-001234" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => setDriverTab('vehicle')} style={{ padding: '14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  Continuar → Datos del vehículo
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'carBrand', label: 'Marca', placeholder: 'Toyota' },
                    { key: 'carModel', label: 'Modelo', placeholder: 'Corolla' },
                    { key: 'carYear',  label: 'Año',    placeholder: '2020' },
                    { key: 'carColor', label: 'Color',  placeholder: 'Blanco' },
                  ].map(f => (
                    <div key={f.key} style={{ background: '#F8F9FF', borderRadius: 12, padding: '14px 16px', border: '1px solid #E8EAFF' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</div>
                      <input value={(driverForm as any)[f.key]} onChange={e => setDriverForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                <div style={{ background: '#F8F9FF', borderRadius: 12, padding: '14px 16px', border: '1px solid #E8EAFF' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Matrícula</div>
                  <input value={driverForm.plate} onChange={e => setDriverForm(f => ({ ...f, plate: e.target.value }))} placeholder="GE-1234" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15, outline: 'none', color: '#111827', boxSizing: 'border-box' }} />
                </div>
                <div style={{ background: '#F8F9FF', borderRadius: 12, padding: '14px 16px', border: '1px solid #E8EAFF' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tipo de vehículo</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    {['Sedán', 'SUV', 'Van', 'Moto'].map(t => (
                      <button key={t} onClick={() => setDriverForm(f => ({ ...f, carType: t.toLowerCase() }))} style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${driverForm.carType === t.toLowerCase() ? '#111827' : '#E5E7EB'}`, background: driverForm.carType === t.toLowerCase() ? '#111827' : '#fff', color: driverForm.carType === t.toLowerCase() ? '#fff' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setDriverTab('docs')}
                  style={{ padding: '14px', background: (driverForm.name && driverForm.phone && driverForm.plate) ? '#111827' : '#E5E7EB', color: (driverForm.name && driverForm.phone && driverForm.plate) ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: (driverForm.name && driverForm.phone && driverForm.plate) ? 'pointer' : 'not-allowed' }}
                >
                  Continuar a Documentos
                </button>
              </div>
            )}
            {driverTab === 'docs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#F0F9FF', borderRadius: 10, padding: '12px 14px', border: '1px solid #BAE6FD', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0369A1' }}>Documentos requeridos</div>
                  <div style={{ fontSize: 12, color: '#0284C7', marginTop: 2 }}>Los documentos marcados con * son obligatorios para activar tu cuenta.</div>
                </div>
                {REQUIRED_DOCS.map(doc => (
                  <div key={doc.key} style={{ background: driverDocs[doc.key] ? '#F0FDF4' : '#F8F9FF', borderRadius: 12, padding: '14px 16px', border: '1.5px solid ' + (driverDocs[doc.key] ? '#86EFAC' : (doc.required ? '#E8EAFF' : '#E5E7EB')) }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {doc.label}
                          {doc.required && <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>*</span>}
                          {!doc.required && <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>Opcional</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{doc.desc}</div>
                        {driverDocs[doc.key] && (
                          <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'><path d='M20 6L9 17l-5-5'/></svg>
                            {driverDocs[doc.key]}
                          </div>
                        )}
                      </div>
                      <label style={{ flexShrink: 0, padding: '8px 14px', background: driverDocs[doc.key] ? '#DCFCE7' : '#111827', color: driverDocs[doc.key] ? '#16A34A' : '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {driverDocs[doc.key] ? 'Cambiar' : 'Subir'}
                        <input type='file' accept='image/*,.pdf' style={{ display: 'none' }} onChange={e => handleDocUpload(doc.key, e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { if (driverForm.name && driverForm.phone && driverForm.plate && requiredUploaded) setDriverSubmitted(true); }}
                  style={{ padding: '14px', background: (driverForm.name && driverForm.phone && driverForm.plate && requiredUploaded) ? '#111827' : '#E5E7EB', color: (driverForm.name && driverForm.phone && driverForm.plate && requiredUploaded) ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: (driverForm.name && driverForm.phone && driverForm.plate && requiredUploaded) ? 'pointer' : 'not-allowed' }}
                >
                  {requiredUploaded ? 'Enviar solicitud completa' : 'Sube los documentos obligatorios (*)'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ── PANTALLA: BUSCANDO ────────────────────────────────────────────────────
  if (screen === 'searching') return (
    <div style={BASE}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Buscando conductor</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 24 }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: 'absolute', inset: i * 16, borderRadius: '50%', border: `1.5px solid rgba(17,24,39,${0.15 - i * 0.04})`, animation: `ripple ${1.4 + i * 0.3}s ease-out infinite` }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
        </div>
        <style>{`@keyframes ripple{0%{transform:scale(0.8);opacity:1}100%{transform:scale(1.4);opacity:0}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Conectando con conductores</div>
          <div style={{ fontSize: 14, color: '#6B7280' }}>{origin} → {destination}</div>
        </div>
        <div style={{ width: '100%', maxWidth: 300 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Buscando...</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{searchPct}%</span>
          </div>
          <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${searchPct}%`, background: '#111827', borderRadius: 2, transition: 'width 0.08s linear' }} />
          </div>
        </div>
        <button onClick={() => setScreen('home')} style={{ padding: '12px 28px', background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 10, color: '#6B7280', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Cancelar búsqueda
        </button>
      </div>
    </div>
  );

  // ── PANTALLA: CONDUCTOR ENCONTRADO ────────────────────────────────────────
  if (screen === 'matched') return (
    <div style={BASE}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Conductor asignado</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <MapView height={220} origin={origin} destination={destination} />
        <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card conductor */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: driver.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {driver.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{driver.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= Math.floor(driver.rating) ? '#F59E0B' : '#E5E7EB'}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{driver.rating} · {driver.trips.toLocaleString()} viajes</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{driver.eta}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>tiempo llegada</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: '#F7F8FA', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>VEHÍCULO</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{driver.car}</div>
              </div>
              <div style={{ flex: 1, background: '#F7F8FA', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>MATRÍCULA</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{driver.plate}</div>
              </div>
            </div>
          </div>
          {/* Resumen precio */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#6B7280' }}>Tipo de viaje</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selectedVehicle.label}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#6B7280' }}>Ruta</span>
              <span style={{ fontSize: 13, color: '#111827', maxWidth: 180, textAlign: 'right' }}>{origin} → {destination}</span>
            </div>
            <div style={{ height: 1, background: '#F3F4F6', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{selectedVehicle.price.toLocaleString()} XAF</span>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: '#fff', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
        <button onClick={() => setScreen('home')} style={{ flex: 1, padding: '14px', background: '#F7F8FA', color: '#374151', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={() => { if (userBalance >= selectedVehicle.price) { onDebit(selectedVehicle.price); setScreen('riding'); } else alert('Saldo insuficiente'); }} style={{ flex: 2, padding: '14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Confirmar · {selectedVehicle.price.toLocaleString()} XAF
        </button>
      </div>
    </div>
  );

  // PANTALLA: VIAJE EN CURSO
  if (screen === 'riding') return (
    <div style={BASE}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Viaje en curso</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: rideProgress >= 100 ? '#16A34A' : '#6B7280' }}>
          {rideProgress >= 100 ? 'Llegaste' : Math.round(rideProgress) + '%'}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapView height="100%" />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: driver.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {driver.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{driver.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{driver.plate} - {driver.car}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{selectedVehicle.price.toLocaleString()} XAF</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{origin}</span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{destination}</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: rideProgress + '%', background: '#111827', borderRadius: 2, transition: 'width 0.15s' }} />
            </div>
          </div>
          {rideProgress >= 100 ? (
            <button onClick={() => setScreen('rating')} style={{ width: '100%', padding: '14px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Calificar viaje
            </button>
          ) : (
            <button onClick={() => setScreen('home')} style={{ width: '100%', padding: '14px', background: '#F7F8FA', color: '#374151', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar viaje
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // PANTALLA: CALIFICACION
  if (screen === 'rating') return (
    <div style={BASE}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
        {ratedDone ? (
          <>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Gracias!</div>
            <div style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>Tu calificacion ayuda a mejorar el servicio</div>
            <button onClick={onBack} style={{ padding: '12px 32px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Volver al inicio</button>
          </>
        ) : (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: driver.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
              {driver.initials}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Como fue tu viaje?</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>con {driver.name}</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)} onClick={() => setStars(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill={s <= (hoverStar || stars) ? '#F59E0B' : '#E5E7EB'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              ))}
            </div>
            {stars > 0 && (
              <button onClick={() => setRatedDone(true)} style={{ padding: '14px 40px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Enviar calificacion
              </button>
            )}
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 14, cursor: 'pointer' }}>Omitir</button>
          </>
        )}
      </div>
    </div>
  );

  // PANTALLA: HOME
  return (
    <div style={BASE}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fff', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>MiTaxi</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Malabo - Guinea Ecuatorial</div>
        </div>
        <button onClick={() => setScreen('driver-register')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#F7F8FA', border: '1px solid #E5E7EB', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          Ser conductor
        </button>
      </div>

      <div style={{ flexShrink: 0 }}>
        <MapView height={240} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
        <div style={{ padding: '20px 20px 0', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14, paddingBottom: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #111827', background: '#fff', flexShrink: 0 }} />
              <div style={{ width: 1.5, flex: 1, background: '#D1D5DB', margin: '4px 0' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#111827', flexShrink: 0 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#F7F8FA', borderRadius: 10, padding: '12px 14px', border: '1.5px solid ' + (focusField === 'origin' ? '#111827' : 'transparent'), transition: 'border-color 0.15s' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2, fontWeight: 500 }}>ORIGEN</div>
                <input value={origin} onChange={e => handleOriginInput(e.target.value)} onFocus={() => setFocusField('origin')} onBlur={() => setTimeout(() => setFocusField(null), 150)} placeholder="Tu ubicacion actual" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: '#111827', fontWeight: 500, boxSizing: 'border-box' }} />
              </div>
              <div style={{ background: '#F7F8FA', borderRadius: 10, padding: '12px 14px', border: '1.5px solid ' + (focusField === 'dest' ? '#111827' : 'transparent'), transition: 'border-color 0.15s' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2, fontWeight: 500 }}>DESTINO</div>
                <input value={destination} onChange={e => handleDestInput(e.target.value)} onFocus={() => setFocusField('dest')} onBlur={() => setTimeout(() => setFocusField(null), 150)} placeholder="A donde vas?" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: '#111827', fontWeight: 500, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
          {suggestions.length > 0 && focusField && (
            <div style={{ position: 'absolute', left: 20, right: 20, top: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
              {suggestions.map((sg, i) => (
                <button key={i} onClick={() => { if (focusField === 'dest') setDestination(sg); else setOrigin(sg); setSuggestions([]); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: i < suggestions.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  <span style={{ fontSize: 14, color: '#111827' }}>{sg}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tipo de servicio</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {VEHICLE_TYPES.map(v => (
              <button key={v.id} onClick={() => setSelectedVehicle(v)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: 'none', background: selectedVehicle.id === v.id ? '#F7F8FA' : 'transparent', cursor: 'pointer', position: 'relative' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: selectedVehicle.id === v.id ? '#111827' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedVehicle.id === v.id ? '#fff' : '#6B7280'} strokeWidth="1.5">
                    {v.id === 'moto' ? (<><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l3 5H9l2-5h4z"/><path d="M5.5 17.5L9 11"/></>) : v.id === 'xl' ? (<><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M1 10h22M5 18v2M19 18v2"/><circle cx="6" cy="18" r="1"/><circle cx="18" cy="18" r="1"/></>) : (<><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>)}
                  </svg>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{v.label}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{v.sublabel} - {v.eta}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{v.price.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>XAF</div>
                </div>
                {selectedVehicle.id === v.id && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 32, background: '#111827', borderRadius: '0 2px 2px 0' }} />}
              </button>
            ))}
          </div>
        </div>

        <div style={{ margin: '16px 20px 0', padding: '12px 16px', background: '#F7F8FA', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Tu saldo disponible</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: userBalance >= selectedVehicle.price ? '#16A34A' : '#DC2626' }}>{userBalance.toLocaleString()} XAF</span>
        </div>
        <div style={{ height: 100 }} />
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: '#fff', borderTop: '1px solid #F3F4F6' }}>
        <button onClick={() => { if (canRequest) setScreen('searching'); }} disabled={!canRequest} style={{ width: '100%', padding: '16px', background: canRequest ? '#111827' : '#E5E7EB', color: canRequest ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: canRequest ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
          {canRequest ? 'Solicitar ' + selectedVehicle.label + ' - ' + selectedVehicle.price.toLocaleString() + ' XAF' : 'Ingresa origen y destino'}
        </button>
      </div>
    </div>
  );
};

export default MiTaxiView;
