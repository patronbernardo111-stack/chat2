import React, { useState } from 'react';

interface Ride {
  id: string;
  origin: string;
  destination: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  driver?: string;
  eta?: number;
  price?: number;
}

interface MiTaxiViewProps {
  onBack: () => void;
  userBalance: number;
  onDebit: (amount: number) => void;
  userName?: string;
  userPhone?: string;
}

export const MiTaxiView: React.FC<MiTaxiViewProps> = ({
  onBack,
  userBalance = 0,
  onDebit,
}) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState<'economy' | 'comfort' | 'xl'>('economy');
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [tab, setTab] = useState<'request' | 'history'>('request');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const rideTypes = [
    { id: 'economy', label: 'Economico', price: 1500, icon: 'car', desc: 'Viaje basico' },
    { id: 'comfort', label: 'Confort', price: 2500, icon: 'car', desc: 'Vehiculo comodo' },
    { id: 'xl', label: 'XL', price: 3500, icon: 'car', desc: 'Para grupos' },
  ] as const;

  const selectedType = rideTypes.find(r => r.id === rideType)!;

  const handleRequestRide = async () => {
    if (!origin.trim() || !destination.trim()) { showToast('Ingresa origen y destino', 'error'); return; }
    if (userBalance < selectedType.price) { showToast('Saldo insuficiente', 'error'); return; }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setActiveRide({ id: `ride_${Date.now()}`, origin: origin.trim(), destination: destination.trim(), status: 'active', driver: 'Carlos M.', eta: Math.floor(Math.random() * 10) + 3, price: selectedType.price });
      onDebit(selectedType.price);
      showToast('Taxi solicitado! Conductor en camino', 'success');
      setOrigin(''); setDestination('');
    } catch { showToast('Error al solicitar taxi', 'error'); }
    finally { setLoading(false); }
  };

  const handleCancelRide = () => { if (!activeRide) return; setRideHistory(p => [{ ...activeRide, status: 'cancelled' }, ...p]); setActiveRide(null); showToast('Viaje cancelado', 'info'); };
  const handleCompleteRide = () => { if (!activeRide) return; setRideHistory(p => [{ ...activeRide, status: 'completed' }, ...p]); setActiveRide(null); showToast('Viaje completado!', 'success'); };

  const Y = '#F59E0B';
  const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 0 };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#FFFBF0', fontFamily: 'system-ui,sans-serif', zIndex: 600 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#6B7280', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: Y, color: '#fff', boxShadow: '0 2px 8px rgba(245,158,11,0.3)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18 }}>&#8592;</button>
        <div style={{ fontSize: 22 }}>&#128661;</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>MiTaxi</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Transporte en Guinea Ecuatorial</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Saldo</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{userBalance.toLocaleString()} XAF</div>
        </div>
      </div>
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        {(['request', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: tab === t ? Y : '#6B7280', borderBottom: tab === t ? `2px solid ${Y}` : '2px solid transparent' }}>
            {t === 'request' ? 'Solicitar' : 'Historial'}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tab === 'request' && (
          <>
            {activeRide ? (
              <div style={{ ...card, background: '#FFFBF0', border: '1.5px solid #FDE68A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 28 }}>&#128661;</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>Viaje en curso</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>Conductor: {activeRide.driver}</div>
                  </div>
                  <span style={{ background: Y, color: '#fff', fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{activeRide.eta} min</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Origen: {activeRide.origin}</div>
                  <div>Destino: {activeRide.destination}</div>
                  <div>Precio: {activeRide.price?.toLocaleString()} XAF</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCompleteRide} style={{ flex: 1, background: '#10B981', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Completar</button>
                  <button onClick={handleCancelRide} style={{ flex: 1, background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: 12, padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ height: 160, background: 'linear-gradient(135deg,#d1fae5,#6ee7b7)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
                  {[30,60,90,120,150].map(y => <div key={y} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 1, background: 'rgba(255,255,255,0.4)' }} />)}
                  {[50,100,150,200,250,300].map(x => <div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: 1, background: 'rgba(255,255,255,0.4)' }} />)}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 32 }}>&#128205;</div>
                    <div style={{ background: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: '#374151', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>Tu ubicacion - Malabo</div>
                  </div>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>A donde vas?</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: '1.5px solid #E5E7EB' }}>
                    <span>&#128205;</span>
                    <input type="text" placeholder="Origen (ej: Centro de Malabo)" value={origin} onChange={e => setOrigin(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: '#111827' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', border: `1.5px solid ${destination ? Y : '#E5E7EB'}` }}>
                    <span>&#127937;</span>
                    <input type="text" placeholder="Destino (ej: Aeropuerto)" value={destination} onChange={e => setDestination(e.target.value)} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, outline: 'none', color: '#111827' }} />
                  </div>
                </div>
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Tipo de vehiculo</div>
                  {rideTypes.map(type => (
                    <button key={type.id} onClick={() => setRideType(type.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${rideType === type.id ? Y : '#E5E7EB'}`, background: rideType === type.id ? '#FFFBF0' : '#F9FAFB', cursor: 'pointer', marginBottom: 8 }}>
                      <div style={{ fontSize: 26 }}>&#128661;</div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{type.label}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{type.desc}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: rideType === type.id ? Y : '#374151' }}>{type.price.toLocaleString()} XAF</div>
                      {rideType === type.id && <span style={{ color: Y, fontSize: 18 }}>&#10003;</span>}
                    </button>
                  ))}
                </div>
                <button onClick={handleRequestRide} disabled={loading || !origin.trim() || !destination.trim()} style={{ width: '100%', padding: '15px 0', background: (loading || !origin.trim() || !destination.trim()) ? '#D1D5DB' : Y, color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: (loading || !origin.trim() || !destination.trim()) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
                  {loading ? 'Buscando conductor...' : `Solicitar taxi - ${selectedType.price.toLocaleString()} XAF`}
                </button>
              </>
            )}
          </>
        )}
        {tab === 'history' && (
          <>
            {rideHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>&#128661;</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Sin viajes aun</div>
                <div style={{ fontSize: 13 }}>Tus viajes apareceran aqui</div>
              </div>
            ) : rideHistory.map(ride => (
              <div key={ride.id} style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{ride.origin} a {ride.destination}</div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: ride.status === 'completed' ? '#D1FAE5' : '#FEE2E2', color: ride.status === 'completed' ? '#065F46' : '#991B1B' }}>
                    {ride.status === 'completed' ? 'Completado' : 'Cancelado'}
                  </span>
                </div>
                {ride.price && <div style={{ fontSize: 12, color: '#6B7280' }}>{ride.price.toLocaleString()} XAF</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default MiTaxiView;
