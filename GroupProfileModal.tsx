import React, { useState } from 'react';
import { Avatar } from './Avatar';

interface GroupMember {
  id: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  initials?: string;
  role: 'admin' | 'member';
  status?: 'online' | 'offline' | 'away';
}

interface Props {
  group: any;
  onClose: () => void;
  allContacts: any[];
  mutedChats: string[];
  pinnedChats: string[];
  onMuteToggle: (id: string) => void;
  onPinToggle: (id: string) => void;
  onClearChat: (id: string) => void;
  onOpenWallpaper: () => void;
  onUpdateGroup: (id: string, data: { name?: string; description?: string; avatarUrl?: string }) => void;
  onAddContactFromGroup: (member: any) => void;
  onLeaveGroup: (id: string) => void;
  showToast: (msg: string, type: string) => void;
}

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <div onClick={onToggle} style={{ width: '44px', height: '24px', borderRadius: '12px', background: on ? '#00c8a0' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: '2px', left: on ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
  </div>
);

export const GroupProfileModal: React.FC<Props> = ({
  group, onClose, allContacts, mutedChats, pinnedChats,
  onMuteToggle, onPinToggle, onClearChat, onOpenWallpaper,
  onUpdateGroup, onAddContactFromGroup, onLeaveGroup, showToast
}) => {
  const [tab, setTab] = useState<'info' | 'miembros' | 'ajustes'>('info');
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [newName, setNewName] = useState(group.title || group.name || '');
  const [newDesc, setNewDesc] = useState(group.description || '');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const groupId = group.id?.toString() || '';
  const isMuted = mutedChats.includes(groupId);
  const isPinned = pinnedChats.includes(groupId);

  // Construir lista de miembros desde participants o groupMembers
  const rawMembers: GroupMember[] = (group.participants || group.groupMembers || []).map((p: any, i: number) => ({
    id: p.user_id?.toString() || p.id?.toString() || `m${i}`,
    name: p.full_name || p.users?.full_name || p.name || `Miembro ${i + 1}`,
    phone: p.phone || p.users?.phone || '',
    avatarUrl: p.avatar_url || p.users?.avatar_url || p.avatarUrl || '',
    initials: (p.full_name || p.name || 'M').slice(0, 2).toUpperCase(),
    role: i === 0 ? 'admin' : 'member',
    status: p.status || 'offline',
  }));

  // Si no hay participants, crear miembros ficticios basados en el count
  const memberCount = group.members || rawMembers.length || 1;
  const members: GroupMember[] = rawMembers.length > 0 ? rawMembers : [
    { id: 'me', name: 'Tu', phone: '', avatarUrl: '', initials: 'TU', role: 'admin', status: 'online' },
    ...Array.from({ length: Math.max(0, memberCount - 1) }, (_, i) => ({
      id: `m${i}`, name: `Miembro ${i + 1}`, phone: '', avatarUrl: '', initials: `M${i + 1}`, role: 'member' as const, status: 'offline' as const,
    })),
  ];

  const [localMembers, setLocalMembers] = useState<GroupMember[]>(members);
  const [admins, setAdmins] = useState<string[]>(members.filter(m => m.role === 'admin').map(m => m.id));

  const contactsNotInGroup = allContacts.filter(c =>
    !localMembers.some(m => m.id === c.id?.toString() || m.phone === c.phone) &&
    (!memberSearch || c.name?.toLowerCase().includes(memberSearch.toLowerCase()) || c.phone?.includes(memberSearch))
  );

  const saveName = () => {
    if (newName.trim().length < 2) return;
    onUpdateGroup(groupId, { name: newName.trim() });
    showToast('Nombre actualizado', 'success');
    setEditingName(false);
  };

  const saveDesc = () => {
    onUpdateGroup(groupId, { description: newDesc });
    showToast('Descripcion actualizada', 'success');
    setEditingDesc(false);
  };

  const changePhoto = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (f) {
        const r = new FileReader();
        r.onload = e => {
          const url = e.target?.result as string;
          onUpdateGroup(groupId, { avatarUrl: url });
          showToast('Foto actualizada', 'success');
        };
        r.readAsDataURL(f);
      }
    };
    inp.click();
  };

  const toggleAdmin = (memberId: string) => {
    const isAdmin = admins.includes(memberId);
    if (isAdmin) {
      setAdmins(prev => prev.filter(id => id !== memberId));
      showToast('Administrador removido', 'info');
    } else {
      setAdmins(prev => [...prev, memberId]);
      showToast('Administrador asignado', 'success');
    }
  };

  const removeMember = (memberId: string) => {
    setLocalMembers(prev => prev.filter(m => m.id !== memberId));
    showToast('Miembro eliminado del grupo', 'info');
  };

  const addMember = (contact: any) => {
    const newMember: GroupMember = {
      id: contact.id?.toString() || Date.now().toString(),
      name: contact.name,
      phone: contact.phone || '',
      avatarUrl: contact.avatarUrl || '',
      initials: contact.name?.slice(0, 2).toUpperCase() || '??',
      role: 'member',
      status: contact.status || 'offline',
    };
    setLocalMembers(prev => [...prev, newMember]);
    showToast(`${contact.name} anadido al grupo`, 'success');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F0F2F5', zIndex: 4000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F0F2F5', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '4px', display: 'flex' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Informacion del grupo</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Avatar + nombre del grupo */}
        <div style={{ background: '#fff', padding: '28px 16px 20px', textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#fff', overflow: 'hidden', border: '3px solid rgba(168,85,247,0.3)' }}>
              {group.avatarUrl
                ? <img src={group.avatarUrl} alt={group.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              }
            </div>
            <button onClick={changePhoto} style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: '#a855f7', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
          </div>

          {/* Nombre editable */}
          {editingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} maxLength={50} autoFocus style={{ fontSize: '18px', fontWeight: '700', color: '#111827', border: 'none', borderBottom: '2px solid #a855f7', outline: 'none', textAlign: 'center', background: 'transparent', fontFamily: 'inherit', width: '200px' }} onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }} />
              <button onClick={saveName} style={{ background: '#a855f7', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button onClick={() => setEditingName(false)} style={{ background: '#E5E7EB', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{newName || group.title || group.name}</div>
              <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          )}

          <div style={{ fontSize: '13px', color: '#a855f7', fontWeight: '600', marginBottom: '4px' }}>Grupo · {localMembers.length} miembros</div>

          {/* Descripcion editable */}
          {editingDesc ? (
            <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} maxLength={200} autoFocus placeholder="Descripcion del grupo..." style={{ width: '100%', maxWidth: '320px', padding: '8px 12px', border: '1.5px solid #a855f7', borderRadius: '10px', outline: 'none', fontSize: '13px', color: '#374151', resize: 'none', fontFamily: 'inherit', background: '#F9FAFB', minHeight: '60px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveDesc} style={{ padding: '6px 16px', background: '#a855f7', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Guardar</button>
                <button onClick={() => setEditingDesc(false)} style={{ padding: '6px 16px', background: '#E5E7EB', border: 'none', borderRadius: '8px', color: '#6B7280', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
              <div style={{ fontSize: '13px', color: '#6B7280', maxWidth: '280px' }}>{newDesc || group.description || 'Sin descripcion'}</div>
              <button onClick={() => setEditingDesc(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px', display: 'flex', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          )}

          {/* Acciones rapidas */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px' }}>
            {[
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, label: 'Llamar', color: '#00c8a0', action: () => showToast('Llamada grupal iniciada', 'info') },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>, label: 'Video', color: '#00b4e6', action: () => showToast('Videollamada grupal iniciada', 'info') },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: 'Mensaje', color: '#6B5BD6', action: () => onClose() },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>, label: 'Anadir', color: '#F59E0B', action: () => setShowAddMembers(true) },
            ].map(a => (
              <button key={a.label} onClick={a.action} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: a.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>{a.icon}</div>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', display: 'flex', borderBottom: '1px solid #F0F2F5', marginBottom: '8px' }}>
          {(['info', 'miembros', 'ajustes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: tab === t ? '#a855f7' : '#9CA3AF', borderBottom: tab === t ? '2px solid #a855f7' : '2px solid transparent', transition: 'all 0.15s', textTransform: 'capitalize' }}>
              {t === 'info' ? 'Info' : t === 'miembros' ? `Miembros (${localMembers.length})` : 'Ajustes'}
            </button>
          ))}
        </div>

        {/* TAB INFO */}
        {tab === 'info' && (
          <div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalles del grupo</div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '2px' }}>Descripcion</div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>{newDesc || group.description || 'Sin descripcion'}</div>
                </div>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '2px' }}>Miembros</div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>{localMembers.length} participantes</div>
                </div>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div>
                  <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '2px' }}>Creado</div>
                  <div style={{ fontSize: '14px', color: '#111827' }}>{group.createdDate || new Date().toLocaleDateString('es-ES')}</div>
                </div>
              </div>
            </div>

            {/* Admins */}
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Administradores</div>
              {localMembers.filter(m => admins.includes(m.id)).map(m => (
                <div key={m.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F9FAFB' }}>
                  <Avatar name={m.name} size={42} photo={m.avatarUrl} status={m.status} showStatus />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{m.name}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.phone || 'Admin del grupo'}</div>
                  </div>
                  <span style={{ background: '#F3E8FF', color: '#7C3AED', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px' }}>Admin</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB MIEMBROS */}
        {tab === 'miembros' && (
          <div>
            {/* Boton anadir miembro */}
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <button onClick={() => setShowAddMembers(true)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#a855f7' }}>Anadir participante</div>
              </button>
            </div>

            {/* Lista de miembros */}
            <div style={{ background: '#fff' }}>
              {localMembers.map((m, i) => (
                <div key={m.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: i < localMembers.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                  <Avatar name={m.name} size={46} photo={m.avatarUrl} status={m.status} showStatus />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      {admins.includes(m.id) && <span style={{ background: '#F3E8FF', color: '#7C3AED', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '6px', flexShrink: 0 }}>Admin</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: m.status === 'online' ? '#00c8a0' : '#9CA3AF' }}>
                      {m.status === 'online' ? 'En linea' : m.phone || 'Miembro'}
                    </div>
                  </div>
                  {/* Acciones del miembro */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {/* Anadir a contactos */}
                    {m.id !== 'me' && (
                      <button onClick={() => { onAddContactFromGroup(m); showToast(`${m.name} anadido a contactos`, 'success'); }} title="Anadir a contactos" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c8a0' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                      </button>
                    )}
                    {/* Hacer/quitar admin */}
                    {m.id !== 'me' && (
                      <button onClick={() => toggleAdmin(m.id)} title={admins.includes(m.id) ? 'Quitar admin' : 'Hacer admin'} style={{ width: '32px', height: '32px', borderRadius: '50%', background: admins.includes(m.id) ? '#F3E8FF' : '#F9FAFB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: admins.includes(m.id) ? '#a855f7' : '#9CA3AF' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </button>
                    )}
                    {/* Eliminar del grupo */}
                    {m.id !== 'me' && (
                      <button onClick={() => removeMember(m.id)} title="Eliminar del grupo" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB AJUSTES */}
        {tab === 'ajustes' && (
          <div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notificaciones</div>
              <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#111827' }}>Silenciar notificaciones</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{isMuted ? 'Silenciado' : 'Activo'}</div>
                </div>
                <Toggle on={isMuted} onToggle={() => onMuteToggle(groupId)} />
              </div>
              <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#111827' }}>Fijar chat</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{isPinned ? 'Fijado' : 'No fijado'}</div>
                </div>
                <Toggle on={isPinned} onToggle={() => onPinToggle(groupId)} />
              </div>
            </div>

            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personalizacion</div>
              <button onClick={onOpenWallpaper} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F3F4F6', textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <div style={{ flex: 1 }}><div style={{ fontSize: '14px', color: '#111827' }}>Fondo de pantalla</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>Personalizar fondo del chat</div></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button onClick={() => { onClearChat(groupId); showToast('Chat vaciado', 'info'); }} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                <div style={{ flex: 1 }}><div style={{ fontSize: '14px', color: '#111827' }}>Vaciar chat</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>Eliminar todos los mensajes</div></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <button onClick={() => setShowLeaveConfirm(true)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <div style={{ flex: 1 }}><div style={{ fontSize: '14px', color: '#EF4444', fontWeight: '600' }}>Salir del grupo</div><div style={{ fontSize: '12px', color: '#FCA5A5' }}>Dejaras de recibir mensajes</div></div>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal anadir miembros */}
      {showAddMembers && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddMembers(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '0 0 32px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: '36px', height: '4px', background: '#E5E7EB', borderRadius: '2px' }} />
            </div>
            <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', flex: 1 }}>Anadir participantes</div>
              <button onClick={() => setShowAddMembers(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '0 16px 10px' }}>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0 12px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar contacto..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#111827', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
              {contactsNotInGroup.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: '13px' }}>
                  {allContacts.length === 0 ? 'No tienes contactos aun' : 'Todos tus contactos ya estan en el grupo'}
                </div>
              ) : contactsNotInGroup.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <Avatar name={c.name} size={44} photo={c.avatarUrl} status={c.status} showStatus />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{c.phone}</div>
                  </div>
                  <button onClick={() => { addMember(c); }} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#a855f7,#6366f1)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Anadir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmar salir del grupo */}
      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowLeaveConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Salir del grupo</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Dejaras de recibir mensajes de "{newName || group.title}". Esta accion no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeaveConfirm(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { onLeaveGroup(groupId); onClose(); showToast('Saliste del grupo', 'info'); }} style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>Salir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

        {/* TAB INFO */}
        {tab === 'info' && (
          <div style={{ background: '#fff', marginBottom: '8px' }}>
            <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalles</div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ marginTop: '2px', flexShrink: 0 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <div><div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '2px' }}>Descripcion</div><div style={{ fontSize: '14px', color: '#111827' }}>{newDesc || group.description || 'Sin descripcion'}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div><div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '2px' }}>Creado</div><div style={{ fontSize: '14px', color: '#111827' }}>{group.createdDate || new Date().toLocaleDateString('es-ES')}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div><div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '2px' }}>Miembros</div><div style={{ fontSize: '14px', color: '#111827' }}>{localMembers.length} participantes</div></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB MIEMBROS */}
        {tab === 'miembros' && (
          <div>
            <button onClick={() => setShowAddMembers(true)} style={{ width: 'calc(100% - 32px)', margin: '0 16px 8px', background: 'linear-gradient(135deg,#a855f7,#6366f1)', border: 'none', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Anadir participante
            </button>
            {localMembers.map(m => (
              <div key={m.id} style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar name={m.name} size={46} photo={m.avatarUrl} status={m.status as any} showStatus={true} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    {admins.includes(m.id) && <span style={{ fontSize: '10px', background: '#F3E8FF', color: '#a855f7', padding: '1px 7px', borderRadius: '8px', fontWeight: '700', flexShrink: 0 }}>Admin</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.phone || (m.status === 'online' ? 'En linea' : 'Desconectado')}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* Anadir a contactos */}
                  {m.id !== 'me' && !allContacts.some(c => c.id === m.id || c.phone === m.phone) && (
                    <button onClick={() => { onAddContactFromGroup(m); showToast(`${m.name} anadido a contactos`, 'success'); }} style={{ background: '#F0FDF9', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#059669', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                      Agregar
                    </button>
                  )}
                  {/* Hacer/quitar admin */}
                  {m.id !== 'me' && (
                    <button onClick={() => toggleAdmin(m.id)} style={{ background: admins.includes(m.id) ? '#FEF3C7' : '#F3E8FF', border: `1px solid ${admins.includes(m.id) ? '#FDE68A' : '#D8B4FE'}`, borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: admins.includes(m.id) ? '#92400E' : '#7C3AED', fontSize: '11px', fontWeight: '700' }}>
                      {admins.includes(m.id) ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                  )}
                  {/* Eliminar del grupo */}
                  {m.id !== 'me' && (
                    <button onClick={() => removeMember(m.id)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB AJUSTES */}
        {tab === 'ajustes' && (
          <div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notificaciones</div>
              <button onClick={() => onMuteToggle(groupId)} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>{isMuted && <line x1="1" y1="1" x2="23" y2="23"/>}</svg>
                <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontSize: '14px', color: '#111827' }}>Silenciar notificaciones</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>{isMuted ? 'Silenciado' : 'Activo'}</div></div>
                <Toggle on={isMuted} onToggle={() => onMuteToggle(groupId)} />
              </button>
              <button onClick={() => onPinToggle(groupId)} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontSize: '14px', color: '#111827' }}>Fijar chat</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>{isPinned ? 'Fijado' : 'No fijado'}</div></div>
                <Toggle on={isPinned} onToggle={() => onPinToggle(groupId)} />
              </button>
            </div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personalizacion</div>
              <button onClick={onOpenWallpaper} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontSize: '14px', color: '#111827' }}>Fondo de pantalla</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>Personalizar fondo del chat</div></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button onClick={() => { onClearChat(groupId); showToast('Chat vaciado', 'info'); }} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontSize: '14px', color: '#F59E0B' }}>Vaciar chat</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>Eliminar todos los mensajes</div></div>
              </button>
            </div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <button onClick={() => setShowLeaveConfirm(true)} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontSize: '14px', color: '#EF4444', fontWeight: '600' }}>Salir del grupo</div><div style={{ fontSize: '12px', color: '#FCA5A5' }}>Dejaras de recibir mensajes</div></div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal anadir miembros */}
      {showAddMembers && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddMembers(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '0 0 32px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}><div style={{ width: '36px', height: '4px', background: '#E5E7EB', borderRadius: '2px' }}/></div>
            <div style={{ padding: '12px 16px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>Anadir participantes</div>
            <div style={{ padding: '0 16px 10px' }}>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0 12px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar contacto..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#111827', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
              {contactsNotInGroup.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: '13px' }}>Todos tus contactos ya estan en el grupo</div>
              ) : contactsNotInGroup.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <Avatar name={c.name} size={44} photo={c.avatarUrl} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{c.name}</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>{c.phone}</div></div>
                  <button onClick={() => { addMember(c); }} style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)', border: 'none', borderRadius: '10px', padding: '8px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Anadir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmar salir */}
      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Salir del grupo</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Dejaras de recibir mensajes de "{newName || group.title}". Esta accion no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeaveConfirm(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', color: '#374151', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { onLeaveGroup(groupId); onClose(); showToast('Saliste del grupo', 'info'); }} style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>Salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

        {/* TAB INFO */}
        {tab === 'info' && (
          <div style={{ background: '#fff', marginBottom: '8px' }}>
            <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalles</div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px', borderBottom: '1px solid #F3F4F6' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <div>
                <div style={{ fontSize: '14px', color: '#111827' }}>{newDesc || group.description || 'Sin descripcion'}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>Descripcion del grupo</div>
              </div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F3F4F6' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <div>
                <div style={{ fontSize: '14px', color: '#111827' }}>{localMembers.length} miembros</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>Creado el {group.createdDate || new Date().toLocaleDateString('es-ES')}</div>
              </div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <div>
                <div style={{ fontSize: '14px', color: '#111827' }}>Cifrado de extremo a extremo</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>Los mensajes estan protegidos</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB MIEMBROS */}
        {tab === 'miembros' && (
          <div>
            <button onClick={() => setShowAddMembers(true)} style={{ width: '100%', background: '#fff', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', marginBottom: '8px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#a855f7' }}>Anadir participante</div>
            </button>
            {localMembers.map(m => (
              <div key={m.id} style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F9FAFB' }}>
                <Avatar name={m.name} size={46} status={m.status as any} showStatus={true} photo={m.avatarUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {m.name}
                    {admins.includes(m.id) && <span style={{ fontSize: '10px', background: '#F3E8FF', color: '#a855f7', padding: '1px 7px', borderRadius: '8px', fontWeight: '700' }}>Admin</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{m.phone || (m.status === 'online' ? 'En linea' : 'Desconectado')}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* Añadir a contactos */}
                  <button onClick={() => { onAddContactFromGroup(m); showToast(`${m.name} anadido a contactos`, 'success'); }} title="Anadir a contactos" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F0FDF9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c8a0' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  </button>
                  {/* Hacer/quitar admin */}
                  <button onClick={() => toggleAdmin(m.id)} title={admins.includes(m.id) ? 'Quitar admin' : 'Hacer admin'} style={{ width: '32px', height: '32px', borderRadius: '50%', background: admins.includes(m.id) ? '#F3E8FF' : '#F9FAFB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: admins.includes(m.id) ? '#a855f7' : '#9CA3AF' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </button>
                  {/* Eliminar del grupo */}
                  {m.id !== 'me' && (
                    <button onClick={() => removeMember(m.id)} title="Eliminar del grupo" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB AJUSTES */}
        {tab === 'ajustes' && (
          <div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notificaciones</div>
              <button onClick={() => onMuteToggle(groupId)} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>{isMuted && <line x1="1" y1="1" x2="23" y2="23"/>}</svg>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', color: '#111827' }}>Silenciar notificaciones</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{isMuted ? 'Silenciado' : 'Activo'}</div>
                </div>
                <Toggle on={isMuted} onToggle={() => onMuteToggle(groupId)} />
              </button>
              <button onClick={() => onPinToggle(groupId)} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/></svg>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', color: '#111827' }}>Fijar chat</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{isPinned ? 'Fijado' : 'No fijado'}</div>
                </div>
                <Toggle on={isPinned} onToggle={() => onPinToggle(groupId)} />
              </button>
            </div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personalizacion</div>
              <button onClick={onOpenWallpaper} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <div style={{ flex: 1, textAlign: 'left', fontSize: '14px', color: '#111827' }}>Fondo de pantalla</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button onClick={() => { onClearChat(groupId); showToast('Chat vaciado', 'info'); }} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                <div style={{ flex: 1, textAlign: 'left', fontSize: '14px', color: '#111827' }}>Vaciar chat</div>
              </button>
            </div>
            <div style={{ background: '#fff' }}>
              <button onClick={() => setShowLeaveConfirm(true)} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <div style={{ flex: 1, textAlign: 'left', fontSize: '14px', color: '#EF4444', fontWeight: '600' }}>Salir del grupo</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal anadir miembros */}
      {showAddMembers && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddMembers(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '0 0 32px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}><div style={{ width: '36px', height: '4px', background: '#E5E7EB', borderRadius: '2px' }}/></div>
            <div style={{ padding: '12px 16px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>Anadir participantes</div>
            <div style={{ padding: '0 16px 10px' }}>
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0 12px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar contacto..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#111827', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
              {contactsNotInGroup.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF', fontSize: '13px' }}>Todos tus contactos ya estan en el grupo</div>
              ) : contactsNotInGroup.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <Avatar name={c.name} size={44} photo={c.avatarUrl} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{c.phone}</div>
                  </div>
                  <button onClick={() => { addMember(c); }} style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#a855f7,#6366f1)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Anadir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmar salir */}
      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👋</div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Salir del grupo</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Ya no recibiras mensajes de este grupo. Esta accion no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeaveConfirm(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { onLeaveGroup(groupId); onClose(); }} style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>Salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

        {/* TAB INFO */}
        {tab === 'info' && (
          <div style={{ background: '#fff', marginBottom: '8px' }}>
            <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalles</div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F3F4F6' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <div><div style={{ fontSize: '14px', color: '#111827' }}>{localMembers.length} miembros</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>Incluyendote a ti</div></div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #F3F4F6' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <div><div style={{ fontSize: '14px', color: '#111827' }}>Creado el {group.createdDate || new Date().toLocaleDateString('es-ES')}</div></div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div><div style={{ fontSize: '14px', color: '#111827' }}>Cifrado de extremo a extremo</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>Los mensajes son privados</div></div>
            </div>
          </div>
        )}

        {/* TAB MIEMBROS */}
        {tab === 'miembros' && (
          <div>
            <button onClick={() => setShowAddMembers(true)} style={{ width: '100%', background: '#fff', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', marginBottom: '8px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#a855f7' }}>Anadir participante</div>
            </button>
            {localMembers.map(m => (
              <div key={m.id} style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F9FAFB' }}>
                <Avatar name={m.name} size={44} photo={m.avatarUrl} status={m.status as any} showStatus />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {m.name}
                    {admins.includes(m.id) && <span style={{ fontSize: '10px', background: '#F3E8FF', color: '#a855f7', padding: '1px 6px', borderRadius: '6px', fontWeight: '700' }}>Admin</span>}
                    {m.id === 'me' && <span style={{ fontSize: '10px', background: '#F0FDF9', color: '#00c8a0', padding: '1px 6px', borderRadius: '6px', fontWeight: '700' }}>Tu</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: m.status === 'online' ? '#00c8a0' : '#9CA3AF' }}>{m.status === 'online' ? 'En linea' : m.phone || 'Desconectado'}</div>
                </div>
                {m.id !== 'me' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {!allContacts.some((c: any) => c.id === m.id || c.phone === m.phone) && (
                      <button onClick={() => { onAddContactFromGroup(m); showToast(`${m.name} anadido a contactos`, 'success'); }} style={{ padding: '5px 10px', background: '#F0FDF9', border: '1px solid #A7F3D0', borderRadius: '8px', fontSize: '11px', fontWeight: '700', color: '#00c8a0', cursor: 'pointer' }}>+ Contacto</button>
                    )}
                    <button onClick={() => toggleAdmin(m.id)} style={{ padding: '5px 10px', background: admins.includes(m.id) ? '#FEF3C7' : '#F3E8FF', border: `1px solid ${admins.includes(m.id) ? '#FDE68A' : '#D8B4FE'}`, borderRadius: '8px', fontSize: '11px', fontWeight: '700', color: admins.includes(m.id) ? '#92400E' : '#7C3AED', cursor: 'pointer' }}>
                      {admins.includes(m.id) ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                    <button onClick={() => removeMember(m.id)} style={{ padding: '5px 8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB AJUSTES */}
        {tab === 'ajustes' && (
          <div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notificaciones</div>
              <button onClick={() => onMuteToggle(groupId)} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>{isMuted && <line x1="1" y1="1" x2="23" y2="23"/>}</svg>
                <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontSize: '14px', color: '#111827' }}>Silenciar notificaciones</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>{isMuted ? 'Silenciado' : 'Activo'}</div></div>
                <Toggle on={isMuted} onToggle={() => onMuteToggle(groupId)} />
              </button>
              <button onClick={() => onPinToggle(groupId)} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"/></svg>
                <div style={{ flex: 1, textAlign: 'left' }}><div style={{ fontSize: '14px', color: '#111827' }}>Fijar chat</div><div style={{ fontSize: '12px', color: '#9CA3AF' }}>{isPinned ? 'Fijado' : 'No fijado'}</div></div>
                <Toggle on={isPinned} onToggle={() => onPinToggle(groupId)} />
              </button>
            </div>
            <div style={{ background: '#fff', marginBottom: '8px' }}>
              <div style={{ padding: '16px 16px 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Personalizacion</div>
              <button onClick={onOpenWallpaper} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <div style={{ flex: 1, textAlign: 'left', fontSize: '14px', color: '#111827' }}>Fondo de pantalla</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button onClick={() => { onClearChat(groupId); showToast('Chat vaciado', 'info'); }} style={{ width: '100%', background: 'none', border: 'none', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#54656f" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                <div style={{ flex: 1, textAlign: 'left', fontSize: '14px', color: '#111827' }}>Vaciar chat</div>
              </button>
            </div>
            <div style={{ background: '#fff' }}>
              <button onClick={() => setShowLeaveConfirm(true)} style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <div style={{ fontSize: '14px', color: '#EF4444', fontWeight: '600' }}>Salir del grupo</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal anadir miembros */}
      {showAddMembers && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAddMembers(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: '#E5E7EB', borderRadius: '2px', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>Anadir participantes</div>
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '0 12px', height: '44px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar contacto..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '14px', color: '#111827', fontFamily: 'inherit' }} />
            </div>
            {contactsNotInGroup.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '13px' }}>Todos tus contactos ya estan en el grupo</div>
            ) : contactsNotInGroup.map((c: any) => (
              <button key={c.id} onClick={() => { addMember(c); }} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 0', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid #F9FAFB' }}>
                <Avatar name={c.name} size={44} photo={c.avatarUrl} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{c.phone}</div>
                </div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmar salir */}
      {showLeaveConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👋</div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Salir del grupo</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>Ya no podras enviar ni recibir mensajes en este grupo.</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeaveConfirm(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', color: '#374151', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { onLeaveGroup(groupId); onClose(); }} style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>Salir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
