import React, { useState, useRef, useEffect } from 'react';
import { X, Phone, QrCode, Search, Users, Check, UserPlus } from 'lucide-react';
import { chatAPI, contactsAPI } from './api';

interface AddContactModalProps {
  onClose: () => void;
  onAddContact: (phone: string, name?: string) => void;
  existingContacts?: any[];
  currentUserId?: string;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  onClose,
  onAddContact,
  existingContacts = [],
  currentUserId = ''
}) => {
  const [selectedTab, setSelectedTab] = useState<'number' | 'qr' | 'repertorio'>('number');

  // Tab: Por Teléfono
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Tab: QR
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Tab: Repertorio
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [repertorioSearch, setRepertorioSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);

  // Cargar usuarios de la app cuando se abre la pestaña repertorio
  useEffect(() => {
    if (selectedTab === 'repertorio' && appUsers.length === 0) {
      loadAppUsers();
    }
  }, [selectedTab]);

  const loadAppUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await chatAPI.searchUsers('');
      const existingIds = new Set(existingContacts.map((c: any) =>
        (c.contact_user_id || c.id)?.toString()
      ));
      const filtered = (users || [])
        .filter((u: any) => u.id?.toString() !== currentUserId && !existingIds.has(u.id?.toString()))
        .map((u: any) => ({
          id: u.id?.toString() || '',
          full_name: u.full_name || 'Usuario',
          phone: u.phone || '',
          avatar_url: u.avatar_url || '',
        }));
      setAppUsers(filtered);
    } catch {
      setAppUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUser = (id: string) => {
    const next = new Set(selectedUsers);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedUsers(next);
  };

  const handleAddFromRepertorio = async () => {
    if (selectedUsers.size === 0) return;
    try {
      setAddingUsers(true);
      await Promise.all(
        Array.from(selectedUsers).map(userId => contactsAPI.add(userId))
      );
      onClose();
    } catch {
      alert('Error al agregar algunos contactos. Intenta de nuevo.');
    } finally {
      setAddingUsers(false);
    }
  };

  // Buscar usuarios por teléfono (tab número)
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = [
        { phone: '+240123456789', name: 'Juan Pérez' },
        { phone: '+240987654321', name: 'María García' },
        { phone: '+240555555555', name: 'Carlos López' }
      ].filter(
        (u) => u.phone.includes(query.replace(/\s/g, '')) ||
               u.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddByPhone = () => {
    if (phoneNumber.trim().length >= 9) {
      const formattedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : '+240' + phoneNumber.replace(/\D/g, '').slice(-9);
      onAddContact(formattedPhone, contactName.trim() || undefined);
      onClose();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
    } catch { alert('No se pudo acceder a la cámara. Verifica los permisos.'); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const filteredAppUsers = appUsers.filter(u =>
    u.full_name.toLowerCase().includes(repertorioSearch.toLowerCase()) ||
    u.phone.includes(repertorioSearch)
  );

  // ── Estilos ──────────────────────────────────────────────────────
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 8px',
    background: active ? '#22c55e' : 'transparent',
    color: active ? '#fff' : '#6B7280',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 5000 }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#fff', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '16px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#111827' }}>Añadir Contacto</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <button onClick={() => { setSelectedTab('number'); stopCamera(); }} style={tabBtn(selectedTab === 'number')}>
            <Phone size={14} /> Por Teléfono
          </button>
          <button onClick={() => setSelectedTab('qr')} style={tabBtn(selectedTab === 'qr')}>
            <QrCode size={14} /> Escanear QR
          </button>
          <button onClick={() => setSelectedTab('repertorio')} style={tabBtn(selectedTab === 'repertorio')}>
            <Users size={14} /> Repertorio
          </button>
        </div>

        {/* ── Tab: Por Teléfono ── */}
        {selectedTab === 'number' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                Buscar por nombre o teléfono
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Ej: +240123456789 o Juan"
                  style={{ width: '100%', padding: '10px 12px 10px 32px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>

            {searchResults.length > 0 && (
              <div style={{ background: '#F9FAFB', borderRadius: '10px', marginBottom: '12px', maxHeight: '160px', overflowY: 'auto' }}>
                {searchResults.map((user, idx) => (
                  <button key={idx} onClick={() => { onAddContact(user.phone, user.name); onClose(); }}
                    style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: idx < searchResults.length - 1 ? '1px solid #E5E7EB' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{user.phone}</div>
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Nombre del contacto</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nombre del contacto"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Número de teléfono</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ padding: '10px 12px', background: '#F3F4F6', borderRadius: '10px', fontSize: '14px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>+240</div>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="numero de telefono"
                  style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>

            <button onClick={handleAddByPhone} disabled={phoneNumber.trim().length < 9}
              style={{ width: '100%', padding: '13px', background: phoneNumber.trim().length >= 9 ? '#22c55e' : '#D1D5DB', color: '#fff', border: 'none', borderRadius: '12px', cursor: phoneNumber.trim().length >= 9 ? 'pointer' : 'not-allowed', fontSize: '15px', fontWeight: '700' }}>
              Añadir contacto
            </button>
          </div>
        )}

        {/* ── Tab: QR ── */}
        {selectedTab === 'qr' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!cameraActive ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '90px', height: '90px', margin: '0 auto 16px', background: '#F3F4F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={44} color="#22c55e" />
                </div>
                <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 16px', lineHeight: '1.5' }}>
                  Escanea el código QR de un contacto para agregarlo instantáneamente
                </p>
                <button onClick={startCamera} style={{ width: '100%', padding: '13px', background: '#00B4E6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700' }}>
                  Iniciar Cámara
                </button>
              </div>
            ) : (
              <div>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', background: '#000' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => alert('Escaneo QR — próximamente')} style={{ flex: 1, padding: '12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                    Capturar QR
                  </button>
                  <button onClick={stopCamera} style={{ flex: 1, padding: '12px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Repertorio ── */}
        {selectedTab === 'repertorio' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Buscador */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                value={repertorioSearch}
                onChange={(e) => setRepertorioSearch(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                style={{ width: '100%', padding: '10px 12px 10px 32px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
              {loadingUsers ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>Cargando usuarios...</div>
              ) : filteredAppUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  {repertorioSearch ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
                </div>
              ) : (
                filteredAppUsers.map(user => {
                  const isSelected = selectedUsers.has(user.id);
                  const initials = user.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button key={user.id} onClick={() => toggleUser(user.id)}
                      style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', background: isSelected ? '#f0fdf4' : 'transparent', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                        background: user.avatar_url ? 'transparent' : 'linear-gradient(135deg, #00c8a0, #00b894)',
                        backgroundImage: user.avatar_url ? `url(${user.avatar_url})` : undefined,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '15px', fontWeight: '700'
                      }}>
                        {!user.avatar_url && initials}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{user.phone}</div>
                      </div>
                      {/* Check */}
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: isSelected ? 'none' : '2px solid #D1D5DB', background: isSelected ? '#22c55e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSelected && <Check size={14} color="#fff" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div>
              {selectedUsers.size > 0 && (
                <div style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginBottom: '8px' }}>
                  {selectedUsers.size} {selectedUsers.size === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
                </div>
              )}
              <button onClick={handleAddFromRepertorio} disabled={selectedUsers.size === 0 || addingUsers}
                style={{ width: '100%', padding: '13px', background: selectedUsers.size > 0 ? '#22c55e' : '#D1D5DB', color: '#fff', border: 'none', borderRadius: '12px', cursor: selectedUsers.size > 0 ? 'pointer' : 'not-allowed', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: addingUsers ? 0.7 : 1 }}>
                <UserPlus size={18} />
                {addingUsers ? 'Agregando...' : `Añadir${selectedUsers.size > 0 ? ` (${selectedUsers.size})` : ''} contacto${selectedUsers.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
