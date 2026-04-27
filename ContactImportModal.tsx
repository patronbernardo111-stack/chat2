import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Check, Search, Phone } from 'lucide-react';
import { contactsAPI, chatAPI } from './api';

interface ContactImportModalProps {
  onClose: () => void;
  onComplete: () => void;
  currentUserId: string;
}

interface AppUser {
  id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  isInContacts?: boolean;
}

interface PhoneContact {
  name: string;
  phone: string;
  matchedUser?: AppUser;
}

export const ContactImportModal: React.FC<ContactImportModalProps> = ({
  onClose,
  onComplete,
  currentUserId
}) => {
  const [step, setStep] = useState<'welcome' | 'phone-contacts' | 'app-users'>('welcome');
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Cargar usuarios de la app al montar
  useEffect(() => {
    loadAppUsers();
  }, []);

  const loadAppUsers = async () => {
    try {
      setLoading(true);
      // Obtener todos los usuarios registrados en la app
      const users = await chatAPI.searchUsers('');
      
      // Filtrar el usuario actual y obtener contactos existentes
      const existingContacts = await contactsAPI.getAll();
      const existingIds = new Set(existingContacts.map((c: any) => c.contact_user_id?.toString()));
      
      const filteredUsers = (users || [])
        .filter((u: any) => u.id?.toString() !== currentUserId)
        .map((u: any) => ({
          id: u.id?.toString() || '',
          full_name: u.full_name || 'Usuario',
          phone: u.phone || '',
          avatar_url: u.avatar_url || '',
          isInContacts: existingIds.has(u.id?.toString())
        }));
      
      setAppUsers(filteredUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneContacts = async () => {
    try {
      setLoading(true);
      
      // Verificar si la API de contactos está disponible
      if (!('contacts' in navigator) || !(navigator as any).contacts) {
        setPermissionDenied(true);
        // Si no hay acceso a contactos, ir directo a usuarios de la app
        setStep('app-users');
        return;
      }

      const props = ['name', 'tel'];
      const opts = { multiple: true };
      
      const contacts = await (navigator as any).contacts.select(props, opts);
      
      const formatted: PhoneContact[] = contacts.map((c: any) => ({
        name: c.name?.[0] || 'Sin nombre',
        phone: c.tel?.[0] || ''
      }));

      setPhoneContacts(formatted);
      
      // Buscar coincidencias con usuarios de la app
      await matchContactsWithAppUsers(formatted);
      
      setStep('phone-contacts');
    } catch (error: any) {
      console.error('Error accediendo a contactos:', error);
      if (error.name === 'NotAllowedError') {
        setPermissionDenied(true);
      }
      // Si falla, ir a usuarios de la app
      setStep('app-users');
    } finally {
      setLoading(false);
    }
  };

  const matchContactsWithAppUsers = async (contacts: PhoneContact[]) => {
    // Buscar en appUsers los que coincidan con los teléfonos
    const matched = contacts.map(contact => {
      const cleanPhone = contact.phone.replace(/\D/g, '');
      const matchedUser = appUsers.find(u => 
        u.phone.replace(/\D/g, '').includes(cleanPhone) ||
        cleanPhone.includes(u.phone.replace(/\D/g, ''))
      );
      return { ...contact, matchedUser };
    });
    
    setPhoneContacts(matched);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAddSelected = async () => {
    try {
      setLoading(true);
      
      // Agregar todos los usuarios seleccionados
      const promises = Array.from(selectedUsers).map(userId => 
        contactsAPI.add(userId)
      );
      
      await Promise.all(promises);
      
      onComplete();
    } catch (error) {
      console.error('Error agregando contactos:', error);
      alert('Error al agregar algunos contactos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppUsers = appUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  const availableUsers = filteredAppUsers.filter(u => !u.isInContacts);

  // Estilos
  const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  };

  const modalContent: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  };

  const header: React.CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #00c8a0 0%, #00b894 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    width: '100%'
  };

  const btnSecondary: React.CSSProperties = {
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%'
  };

  // Pantalla de bienvenida
  if (step === 'welcome') {
    return (
      <div style={modalOverlay} onClick={onClose}>
        <div style={modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={header}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
              ¡Bienvenido a EGChat!
            </h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
            >
              <X size={24} />
            </button>
          </div>
          
          <div style={{ padding: '32px 20px', textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00c8a0 0%, #00b894 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Users size={40} color="#fff" />
            </div>
            
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 12px' }}>
              Agrega tus contactos
            </h3>
            
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 32px' }}>
              Encuentra a tus amigos y familiares que ya están en EGChat. Puedes importar desde tu lista de contactos o buscar usuarios manualmente.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={requestPhoneContacts}
                disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
              >
                <Phone size={18} />
                {loading ? 'Cargando...' : 'Importar desde mi teléfono'}
              </button>
              
              <button
                onClick={() => setStep('app-users')}
                style={btnSecondary}
              >
                Buscar usuarios manualmente
              </button>
              
              <button
                onClick={onClose}
                style={{ ...btnSecondary, background: 'transparent', color: '#9ca3af', marginTop: '8px' }}
              >
                Omitir por ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de usuarios de la app
  if (step === 'app-users') {
    return (
      <div style={modalOverlay} onClick={onClose}>
        <div style={modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={header}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Usuarios en EGChat
            </h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Buscador */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
          
          {/* Lista de usuarios */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                Cargando usuarios...
              </div>
            ) : availableUsers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
              </div>
            ) : (
              availableUsers.map(user => {
                const isSelected = selectedUsers.has(user.id);
                const initials = user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: 'none',
                      background: isSelected ? '#f0fdf4' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: user.avatar_url ? `url(${user.avatar_url})` : 'linear-gradient(135deg, #00c8a0 0%, #00b894 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {!user.avatar_url && initials}
                    </div>
                    
                    {/* Info */}
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                        {user.full_name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {user.phone}
                      </div>
                    </div>
                    
                    {/* Checkbox */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? 'none' : '2px solid #d1d5db',
                      background: isSelected ? 'linear-gradient(135deg, #00c8a0 0%, #00b894 100%)' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={16} color="#fff" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          
          {/* Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginBottom: '8px' }}>
              {selectedUsers.size} {selectedUsers.size === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
            </div>
            
            <button
              onClick={handleAddSelected}
              disabled={selectedUsers.size === 0 || loading}
              style={{
                ...btnPrimary,
                opacity: selectedUsers.size === 0 || loading ? 0.5 : 1,
                cursor: selectedUsers.size === 0 || loading ? 'not-allowed' : 'pointer'
              }}
            >
              <UserPlus size={18} />
              {loading ? 'Agregando...' : `Agregar ${selectedUsers.size > 0 ? selectedUsers.size : ''} contacto${selectedUsers.size !== 1 ? 's' : ''}`}
            </button>
            
            <button onClick={onClose} style={{ ...btnSecondary, background: 'transparent', color: '#9ca3af' }}>
              Omitir por ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
