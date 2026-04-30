import React from 'react';
import { Avatar } from './Avatar';

type Msg = { id:string; from:'me'|'them'; text:string; time:string; status?:string };

interface Props {
  contact: any;
  onClose: () => void;
  mutedChats: string[];
  blockedChats: string[];
  pinnedChats: string[];
  chatMessages: Record<string, Msg[]>;
  allGroups: any[];
  userBalance: number;
  isFavorite?: boolean;
  onMuteToggle: (id:string) => void;
  onBlockToggle: (id:string) => void;
  onPinToggle: (id:string) => void;
  onClearChat: (id:string) => void;
  onDeleteContact: (id:string) => void;
  onOpenWallpaper: () => void;
  onSendMoney: (contact:any) => void;
  onStartCall: (type:'audio'|'video', contact:any) => void;
  onFavoriteToggle?: (id:string, isFav:boolean) => void;
  isInContacts?: boolean;
  onAddContact?: () => void;
  onAddGroupMembers?: () => void;
  // Grupo: miembros actuales
  groupMembers?: Array<{id:string; user_id:string; phone?:string; full_name?:string; avatar_url?:string; online_status?:boolean; role?:string}>;
  currentUserId?: string;
  onAddMemberToContacts?: (member:any) => void;
  onRemoveGroupMember?: (userId:string) => void;
  onPromoteToAdmin?: (userId:string) => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
  onGroupAvatarChange?: (url: string) => void;
  onGroupNameChange?: (name: string) => void;
}

// Toggle switch component
const Toggle = ({on, onToggle}:{on:boolean; onToggle:()=>void}) => (
  <div onClick={onToggle} style={{width:'44px',height:'24px',borderRadius:'12px',background:on?'#00c8a0':'#D1D5DB',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
    <div style={{position:'absolute',top:'2px',left:on?'22px':'2px',width:'20px',height:'20px',borderRadius:'50%',background:'#fff',boxShadow:'0 1px 3px rgba(0,0,0,0.2)',transition:'left 0.2s'}}/>
  </div>
);

// Row item for info/settings
const Row = ({icon, label, value, sub, onPress, danger=false, toggle, toggleOn}:{icon:React.ReactNode; label:string; value?:string; sub?:string; onPress?:()=>void; danger?:boolean; toggle?:boolean; toggleOn?:boolean}) => (
  <button onClick={onPress} style={{width:'100%',background:'none',border:'none',padding:'13px 16px',display:'flex',alignItems:'center',gap:'14px',cursor:onPress?'pointer':'default',outline:'none',textAlign:'left'}}>
    <div style={{color:danger?'#EF4444':'#54656f',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',width:'22px'}}>{icon}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:'14px',color:danger?'#EF4444':'#111827',fontWeight:'400',lineHeight:'1.3'}}>{label}</div>
      {sub&&<div style={{fontSize:'12px',color:'#9CA3AF',marginTop:'1px'}}>{sub}</div>}
    </div>
    {value&&!toggle&&<div style={{fontSize:'13px',color:'#9CA3AF',flexShrink:0,marginLeft:'8px'}}>{value}</div>}
    {toggle&&<Toggle on={!!toggleOn} onToggle={onPress||(() => {})}/>}
  </button>
);

const Divider = () => <div style={{height:'1px',background:'#F3F4F6',marginLeft:'52px'}}/>;
const Section = ({children}:{children:React.ReactNode}) => (
  <div style={{background:'#fff',marginBottom:'8px'}}>{children}</div>
);
const SectionLabel = ({label}:{label:string}) => (
  <div style={{padding:'16px 16px 6px',fontSize:'12px',color:'#9CA3AF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
);

// Icono SVG de grupo según tipo — sin fondo, sin color
const GroupIcon = ({avatar, size=24}:{avatar:string; size?:number}) => {
  const s = {width:size,height:size} as React.CSSProperties;
  const props = {width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'#54656f',strokeWidth:1.7,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
  switch(avatar) {
    case 'family': return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'work':   return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;
    case 'friends':return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
    case 'project':return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    default:       return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>;
  }
};

export const ContactProfileModal: React.FC<Props> = ({
  contact: cp, onClose, mutedChats, blockedChats, pinnedChats,
  chatMessages, allGroups, userBalance, isFavorite,
  onMuteToggle, onBlockToggle, onPinToggle, onClearChat,
  onDeleteContact, onOpenWallpaper, onSendMoney, onStartCall, onFavoriteToggle,
  isInContacts = true, onAddContact, onAddGroupMembers,
  groupMembers = [], currentUserId, onAddMemberToContacts,
  onRemoveGroupMember, onPromoteToAdmin, onLeaveGroup, onDeleteGroup, onGroupAvatarChange, onGroupNameChange
}) => {
  const isGroup = !!cp.isGroup;
  const [tab, setTab] = React.useState<'info'|'media'|'grupos'>('info');
  const [note, setNote] = React.useState('');
  const [editNote, setEditNote] = React.useState('');
  const [showNoteEdit, setShowNoteEdit] = React.useState(false);
  const [starred, setStarred] = React.useState(!!isFavorite);
  const [editingGroupName, setEditingGroupName] = React.useState(false);
  const [groupNameInput, setGroupNameInput] = React.useState(cp.title || cp.name || '');

  // Determinar si el usuario actual es admin del grupo
  const myMember = groupMembers.find(m => m.user_id?.toString() === currentUserId?.toString());
  // Es admin si: tiene rol admin, o es el primer miembro, o no hay miembros cargados aún (dar beneficio de la duda al creador)
  const isAdmin = !isGroup || myMember?.role === 'admin' || 
    (groupMembers.length > 0 && groupMembers[0]?.user_id?.toString() === currentUserId?.toString()) ||
    groupMembers.length === 0; // Si no hay miembros cargados, mostrar controles de admin

  const cpId = cp.id?.toString() || cp.title;
  const isMuted = mutedChats.includes(cpId);
  const isBlocked = blockedChats.includes(cpId);
  const isPinned = pinnedChats.includes(cpId);
  const cpColor = cp.color || '#00b4e6';
  const cpInitials = cp.initials || cp.avatar || cp.title?.slice(0,2).toUpperCase() || 'CN';
  const msgs = chatMessages[cpId] || [];

  // Multimedia: fotos, videos, audios, archivos
  const mediaImgs  = msgs.filter((m:any) => m.imageUrl || m.text?.startsWith('📷'));
  const mediaFiles = msgs.filter((m:any) => m.fileUrl || m.text?.startsWith('📎') || m.text?.startsWith('📄'));
  const mediaVids  = msgs.filter((m:any) => m.text?.startsWith('🎥'));
  const mediaAudio = msgs.filter((m:any) => m.audioUrl || m.type === 'audio');
  const allMedia   = [...mediaImgs, ...mediaVids, ...mediaFiles, ...mediaAudio];

  // Grupos en común: grupos donde el contacto es miembro
  const sharedGroups = allGroups.filter((g:any) => {
    const members = g.members_list || g.participants || [];
    return members.some((m:any) =>
      m.user_id?.toString() === cpId ||
      m.id?.toString() === cpId ||
      m.phone === cp.phone
    );
  });

  const handleStarToggle = () => {
    const newVal = !starred;
    setStarred(newVal);
    if (onFavoriteToggle) onFavoriteToggle(cpId, newVal);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'#F0F2F5',zIndex:4000,display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Header fijo */}
      <div style={{background:'#fff',borderBottom:'1px solid #F0F2F5',padding:'10px 16px',paddingTop:'calc(10px + env(safe-area-inset-top, 44px))',display:'flex',alignItems:'center',gap:'12px',flexShrink:0}}>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#374151',padding:'4px',display:'flex'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{flex:1,fontSize:'16px',fontWeight:'600',color:'#111827'}}>{isGroup ? 'Información del grupo' : 'Información del contacto'}</div>
        <button onClick={handleStarToggle} style={{background:'none',border:'none',cursor:'pointer',color:starred?'#F59E0B':'#9CA3AF',padding:'4px',display:'flex'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={starred?'#F59E0B':'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
      </div>

      <div style={{flex:1,overflowY:'auto'}}>

        {/* Avatar + nombre — estilo EGCHAT */}
        <div style={{background:'#fff',padding:'28px 16px 20px',textAlign:'center',marginBottom:'8px'}}>
          <div style={{display:'inline-block',marginBottom:'14px',position:'relative'}}>
            <Avatar name={cp.title||cp.name||'?'} size={90} status={cp.status} showStatus={!isGroup} photo={cp.avatarUrl || cp.avatar_url || cp.photo} />
            {/* Botón editar foto — solo para grupos admin */}
            {isGroup && isAdmin && (
              <button
                onClick={() => {
                  const inp = document.createElement('input');
                  inp.type = 'file'; inp.accept = 'image/*';
                  inp.onchange = () => {
                    const f = inp.files?.[0];
                    if (f && f.size < 5 * 1024 * 1024) {
                      const r = new FileReader();
                      r.onload = (ev) => {
                        const url = ev.target?.result as string;
                        // Actualizar avatar en el objeto cp
                        cp.avatarUrl = url;
                        if (onGroupAvatarChange) onGroupAvatarChange(url);
                      };
                      r.readAsDataURL(f);
                    }
                  };
                  inp.click();
                }}
                style={{position:'absolute',bottom:0,right:0,width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#a855f7,#6366f1)',border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',outline:'none',padding:0}}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
            )}
          </div>
          <div style={{fontSize:'22px',fontWeight:'700',color:'#111827',marginBottom:'3px'}}>
            {isGroup && isAdmin && editingGroupName ? (
              <div style={{display:'flex',alignItems:'center',gap:'8px',justifyContent:'center'}}>
                <input
                  value={groupNameInput}
                  onChange={e => setGroupNameInput(e.target.value)}
                  autoFocus
                  maxLength={50}
                  style={{fontSize:'18px',fontWeight:'700',color:'#111827',border:'none',borderBottom:'2px solid #a855f7',outline:'none',textAlign:'center',background:'transparent',width:'200px'}}
                />
                <button onClick={() => { if(groupNameInput.trim()) { onGroupNameChange?.(groupNameInput.trim()); } setEditingGroupName(false); }}
                  style={{background:'#a855f7',border:'none',borderRadius:'8px',padding:'4px 10px',color:'#fff',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>✓</button>
                <button onClick={() => { setGroupNameInput(cp.title||cp.name||''); setEditingGroupName(false); }}
                  style={{background:'#e5e7eb',border:'none',borderRadius:'8px',padding:'4px 10px',color:'#6b7280',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>✕</button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:'6px',justifyContent:'center'}}>
                <span>{cp.title||cp.name}</span>
                {isGroup && isAdmin && (
                  <button onClick={() => setEditingGroupName(true)}
                    style={{background:'none',border:'none',cursor:'pointer',padding:'2px',display:'flex',alignItems:'center',color:'#9ca3af'}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{fontSize:'13px',color:cp.status==='online'?'#22c55e':cp.status==='away'?'#f59e0b':'#9CA3AF',marginBottom:'4px'}}>
            {cp.status==='online'?'En línea':cp.status==='away'?'Ausente':'Desconectado'}
          </div>
          <div style={{fontSize:'13px',color:'#9CA3AF',display:'flex',alignItems:'center',gap:'5px',justifyContent:'center'}}>
            {(cp.phone||cp.subtitle||'+240 222 *** ***').includes('Mensaje de voz') || (cp.phone||cp.subtitle||'').includes('🎤') ? (
              <>
                <svg width="14" height="10" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="8" width="3" height="4" rx="1.5" fill="#9ca3af"/>
                  <rect x="5" y="5" width="3" height="10" rx="1.5" fill="#9ca3af"/>
                  <rect x="10" y="2" width="3" height="16" rx="1.5" fill="#9ca3af"/>
                  <rect x="15" y="5" width="3" height="10" rx="1.5" fill="#9ca3af"/>
                  <rect x="20" y="7" width="3" height="6" rx="1.5" fill="#9ca3af"/>
                  <rect x="25" y="4" width="3" height="12" rx="1.5" fill="#9ca3af"/>
                  <rect x="30" y="6" width="3" height="8" rx="1.5" fill="#9ca3af"/>
                  <rect x="35" y="8" width="3" height="4" rx="1.5" fill="#9ca3af"/>
                </svg>
                <span>Audio</span>
              </>
            ) : (cp.phone||cp.subtitle||'+240 222 *** ***')}</div>

          {/* Acciones rápidas — estilo EGCHAT */}
          <div style={{display:'flex',justifyContent:'center',gap:'24px',marginTop:'20px'}}>
            {[
              {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,label:'Llamar',color:'#00c8a0',action:()=>onStartCall('audio',cp)},
              {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,label:'Video',color:'#00b4e6',action:()=>onStartCall('video',cp)},
              {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,label:'Mensaje',color:'#6B5BD6',action:()=>onClose()},
              {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,label:'Enviar',color:'#F59E0B',action:()=>{onClose();onSendMoney(cp);}},
            ].map(a=>(
              <button key={a.label} onClick={a.action} style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',padding:'0'}}>
                <div style={{color:a.color}}>{a.icon}</div>
                <span style={{fontSize:'11px',color:'#6B7280',fontWeight:'500'}}>{a.label}</span>
              </button>
            ))}
          </div>

          {/* Botón añadir a contactos — solo si no está en la lista y NO es grupo */}
          {!isGroup && !isInContacts && onAddContact && (
            <button onClick={onAddContact} style={{
              marginTop:'14px', width:'100%',
              background:'linear-gradient(135deg,#00c8a0,#00b4e6)',
              border:'none', borderRadius:'10px', padding:'10px',
              color:'#fff', fontSize:'13px', fontWeight:'700',
              cursor:'pointer', outline:'none',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Añadir a mis contactos
            </button>
          )}

          {/* Botón añadir miembros — solo para grupos (admin) */}
          {isGroup && isAdmin && onAddGroupMembers && (
            <button onClick={onAddGroupMembers} style={{
              marginTop:'14px', width:'100%',
              background:'linear-gradient(135deg,#a855f7,#6366f1)',
              border:'none', borderRadius:'10px', padding:'10px',
              color:'#fff', fontSize:'13px', fontWeight:'700',
              cursor:'pointer', outline:'none',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Añadir miembros
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',background:'#fff',borderBottom:'1px solid #F0F2F5',marginBottom:'8px'}}>
          {(isGroup
            ? [['info','Información'],['media','Multimedia'],['grupos','Integrantes']] as ['info'|'media'|'grupos',string][]
            : [['info','Información'],['media','Multimedia'],['grupos','Grupos']] as ['info'|'media'|'grupos',string][]
          ).map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:'none',border:'none',borderBottom:`2px solid ${tab===id?'#00b4e6':'transparent'}`,padding:'12px 4px',fontSize:'13px',fontWeight:tab===id?'700':'500',color:tab===id?'#00b4e6':'#9CA3AF',cursor:'pointer',transition:'all 0.15s'}}>{label}</button>
          ))}
        </div>

        {/* TAB INFO */}
        {tab==='info'&&(
          <div>
            {/* Datos del grupo o del contacto */}
            <Section>
              {isGroup ? (
                <>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} label={`${cp.members || groupMembers.length || 0} miembros`} sub="Integrantes del grupo"/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label={cp.description || cp.subtitle || 'Sin descripción'} sub="Descripción del grupo"/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} label={cp.createdDate || cp.addedDate || new Date().toLocaleDateString('es-ES')} sub="Grupo creado"/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} label={`#${cpId?.slice(0,8) || 'grupo'}`} sub="ID del grupo"/>
                </>
              ) : (
                <>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>} label={cp.phone||'+240 222 *** ***'} sub="Teléfono móvil"/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} label={cp.email||'No disponible'} sub="Email"/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Malabo, Guinea Ecuatorial" sub="Ubicación"/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} label={cp.addedDate||'15/03/2026'} sub="Contacto desde"/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} label={`@${(cp.title||'usuario').toLowerCase().replace(/\s/g,'')}`} sub="ID EGCHAT"/>
                </>
              )}
            </Section>

            {/* Nota personal */}
            <Section>
              <SectionLabel label="Nota personal"/>
              <div style={{padding:'0 16px 14px'}}>
                {showNoteEdit?(
                  <div>
                    <textarea value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="Añade una nota sobre este contacto..." rows={3}
                      style={{width:'100%',background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'10px',padding:'10px 12px',fontSize:'13px',color:'#111827',fontFamily:'inherit',outline:'none',resize:'none',boxSizing:'border-box'}}/>
                    <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                      <button onClick={()=>setShowNoteEdit(false)} style={{flex:1,background:'#F3F4F6',border:'none',borderRadius:'10px',padding:'9px',fontSize:'13px',color:'#6B7280',cursor:'pointer',fontWeight:'600'}}>Cancelar</button>
                      <button onClick={()=>{setNote(editNote);setShowNoteEdit(false);}} style={{flex:1,background:'#00b4e6',border:'none',borderRadius:'10px',padding:'9px',fontSize:'13px',color:'#fff',cursor:'pointer',fontWeight:'700'}}>Guardar</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round" style={{flexShrink:0,marginTop:'2px'}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'13px',color:note?'#374151':'#9CA3AF',fontStyle:note?'normal':'italic',marginBottom:'4px'}}>{note||'Toca para añadir una nota...'}</div>
                      <button onClick={()=>{setEditNote(note);setShowNoteEdit(true);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:'12px',color:'#00b4e6',fontWeight:'600',padding:0}}>Editar nota</button>
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Configuración del chat */}
            <Section>
              <SectionLabel label="Configuración del chat"/>
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>{isMuted&&<line x1="1" y1="1" x2="23" y2="23"/>}</svg>} label="Silenciar notificaciones" sub={isMuted?'Silenciado':'Activo'} toggle toggleOn={isMuted} onPress={()=>onMuteToggle(cpId)}/>
              <Divider/>
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/><circle cx="12" cy="12" r="10"/></svg>} label="Fijar chat" sub={isPinned?'Fijado en la lista':'No fijado'} toggle toggleOn={isPinned} onPress={()=>onPinToggle(cpId)}/>
              <Divider/>
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>} label="Fondo de pantalla" sub="Personalizar fondo del chat" onPress={()=>{onClose();onOpenWallpaper();}}/>
              <Divider/>
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.7" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} label="Cifrado extremo a extremo" sub="Los mensajes están cifrados" onPress={()=>alert('✅ Este chat usa cifrado de extremo a extremo.')}/>
            </Section>

            {/* Acciones */}
            <Section>
              <SectionLabel label="Acciones"/>
              <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>} label="Vaciar chat" sub="Eliminar todos los mensajes" onPress={()=>{if(window.confirm('¿Vaciar todos los mensajes?'))onClearChat(cpId);}}/>
              <Divider/>
              {isGroup ? (
                /* Compartir enlace del grupo */
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>} label="Compartir enlace del grupo" sub="Invitar a cualquiera a unirse" onPress={()=>{
                  const link = `https://egchat.app/join/${cpId}`;
                  if(navigator.clipboard){ navigator.clipboard.writeText(link); }
                  alert(`Enlace copiado:\n${link}`);
                }}/>
              ) : (
                /* Compartir contacto */
                <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>} label="Compartir contacto" sub="Enviar a otro chat" onPress={()=>{
                  const text = `👤 ${cp.title||cp.name}\n📞 ${cp.phone||'+240 222 *** ***'}\n🆔 @${(cp.title||'usuario').toLowerCase().replace(/\s/g,'')}`;
                  if(navigator.clipboard){ navigator.clipboard.writeText(text); }
                  alert(`Datos de ${cp.title||cp.name} copiados al portapapeles`);
                }}/>
              )}
            </Section>

            {/* Zona peligrosa */}
            <Section>
              {!isGroup && (
                <>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>} label={isBlocked?'Desbloquear contacto':'Bloquear contacto'} sub={isBlocked?'Permitir mensajes de nuevo':'No recibirás más mensajes'} danger onPress={()=>onBlockToggle(cpId)}/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} label="Reportar contacto" sub="Reportar comportamiento inapropiado" danger onPress={()=>alert(`"${cp.title||cp.name}" reportado.`)}/>
                  <Divider/>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>} label="Eliminar contacto" sub="Eliminar de tu lista de contactos" danger onPress={()=>{if(window.confirm(`¿Eliminar a ${cp.title||cp.name}?`)){onDeleteContact(cpId);onClose();}}}/>
                </>
              )}
              {isGroup && (
                <>
                  <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} label="Reportar grupo" sub="Reportar comportamiento inapropiado" danger onPress={()=>alert(`Grupo "${cp.title||cp.name}" reportado.`)}/>
                  <Divider/>
                  {!isAdmin && (
                    <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} label="Salir del grupo" sub="Dejarás de recibir mensajes" danger onPress={()=>{if(window.confirm(`¿Salir del grupo "${cp.title||cp.name}"?`)){onLeaveGroup?.();onClose();}}}/>
                  )}
                  {isAdmin && (
                    <Row icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.7" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>} label="Eliminar grupo" sub="Se eliminará para todos los miembros" danger onPress={()=>{if(window.confirm(`¿Eliminar el grupo "${cp.title||cp.name}"? Esta acción no se puede deshacer.`)){onDeleteGroup?.();onClose();}}}/>
                  )}
                </>
              )}
            </Section>
            <div style={{height:'24px'}}/>
          </div>
        )}

        {/* TAB MULTIMEDIA */}
        {tab==='media'&&(
          <div style={{padding:'0 0 24px'}}>
            {allMedia.length===0?(
              <div style={{textAlign:'center',padding:'60px 0',color:'#9CA3AF',background:'#fff'}}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.4" strokeLinecap="round" style={{margin:'0 auto 14px',display:'block'}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>Sin multimedia compartida</div>
                <div style={{fontSize:'12px'}}>Las fotos, videos y archivos aparecerán aquí</div>
              </div>
            ):(
              <div>
                {/* Fotos y videos */}
                {(mediaImgs.length > 0 || mediaVids.length > 0) && (
                  <div>
                    <div style={{padding:'12px 16px 8px',fontSize:'12px',color:'#9CA3AF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',background:'#fff'}}>
                      Fotos y videos  -  {mediaImgs.length + mediaVids.length}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'2px',marginBottom:'8px'}}>
                      {[...mediaImgs, ...mediaVids].map((m:any,i) => (
                        <div key={m.id||i}
                          style={{aspectRatio:'1',background:'#e5e7eb',overflow:'hidden',position:'relative',cursor:m.imageUrl?'zoom-in':'default'}}
                          onClick={() => {
                            if (m.imageUrl) {
                              // Abrir visor inline — crear overlay temporal
                              const overlay = document.createElement('div');
                              overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
                              const img = document.createElement('img');
                              img.src = m.imageUrl;
                              img.style.cssText = 'max-width:95vw;max-height:90vh;object-fit:contain;border-radius:8px';
                              overlay.appendChild(img);
                              overlay.onclick = () => document.body.removeChild(overlay);
                              document.body.appendChild(overlay);
                            }
                          }}>
                          {m.imageUrl ? (
                            <img src={m.imageUrl} alt="foto"
                              style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                              onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                            />
                          ) : m.text?.startsWith('🎥') ? (
                            <div style={{width:'100%',height:'100%',background:'#1f2937',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                              <span style={{fontSize:'9px',color:'#6b7280',fontWeight:'600'}}>VIDEO</span>
                            </div>
                          ) : (
                            <div style={{width:'100%',height:'100%',background:'#f3f4f6',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              <span style={{fontSize:'9px',color:'#9ca3af',fontWeight:'600'}}>FOTO</span>
                            </div>
                          )}
                          {/* Hora en esquina */}
                          <div style={{position:'absolute',bottom:'3px',right:'4px',fontSize:'9px',color:'rgba(255,255,255,0.85)',fontWeight:'600',textShadow:'0 1px 2px rgba(0,0,0,0.5)'}}>
                            {m.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Archivos */}
                {mediaFiles.length > 0 && (
                  <div>
                    <div style={{padding:'12px 16px 8px',fontSize:'12px',color:'#9CA3AF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',background:'#fff'}}>
                      Archivos  -  {mediaFiles.length}
                    </div>
                    {mediaFiles.map((m:any,i) => {
                      const raw = (m.text||'').replace(/^📎 |^📄 /,'');
                      const match = raw.match(/^(.+?) \((.+?)\)$/);
                      const fileName = match?.[1] || raw;
                      const fileSize = match?.[2] || '';
                      const ext = ((m as any).fileExt || fileName.split('.').pop()?.toLowerCase() || '');
                      const extColors: Record<string,string> = {pdf:'#ef4444',doc:'#2563eb',docx:'#2563eb',xls:'#16a34a',xlsx:'#16a34a',txt:'#6b7280',csv:'#16a34a',zip:'#7c3aed'};
                      const extColor = extColors[ext] || '#6b7280';
                      return (
                        <div key={m.id||i} style={{background:'#fff',borderBottom:'1px solid #F3F4F6',padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px',cursor:(m as any).fileUrl?'pointer':'default'}}
                          onClick={() => { if((m as any).fileUrl){ const a=document.createElement('a');a.href=(m as any).fileUrl;a.download=fileName;a.click(); } }}>
                          <div style={{width:'40px',height:'48px',borderRadius:'6px',background:extColor+'18',border:`1px solid ${extColor}30`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={extColor} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span style={{fontSize:'6px',fontWeight:'800',color:extColor,textTransform:'uppercase'}}>{ext}</span>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:'13px',fontWeight:'600',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fileName}</div>
                            <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'2px'}}>{fileSize}{fileSize?'  -  ':''}{ext.toUpperCase()}  -  {m.time}</div>
                          </div>
                          {(m as any).fileUrl && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Audios */}
                {mediaAudio.length > 0 && (
                  <div>
                    <div style={{padding:'12px 16px 8px',fontSize:'12px',color:'#9CA3AF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',background:'#fff'}}>
                      Mensajes de voz  -  {mediaAudio.length}
                    </div>
                    {mediaAudio.map((m:any,i) => (
                      <div key={m.id||i} style={{background:'#fff',borderBottom:'1px solid #F3F4F6',padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
                        <button onClick={() => { if(m.audioUrl){ const a=new Audio(m.audioUrl);a.play(); } }}
                          style={{width:'38px',height:'38px',borderRadius:'50%',background:'#00c8a0',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                        </button>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:'2px',height:'20px'}}>
                            {[3,5,8,6,10,7,4,9,6,8,5,7,4,6,8].map((h,j)=>(
                              <div key={j} style={{width:'3px',height:`${h*2}px`,background:'rgba(0,200,160,0.5)',borderRadius:'2px'}}/>
                            ))}
                          </div>
                          <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'2px'}}>Mensaje de voz  -  {m.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB GRUPOS / INTEGRANTES */}
        {tab==='grupos'&&(
          <div style={{padding:'0 0 24px'}}>
            {isGroup ? (
              /* ── INTEGRANTES DEL GRUPO ── */
              <div>
                {/* Header con botón + para añadir (solo admin) */}
                <div style={{padding:'12px 16px 8px',fontSize:'12px',color:'#9CA3AF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',background:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span>{groupMembers.length} integrante{groupMembers.length!==1?'s':''}</span>
                  {isAdmin && onAddGroupMembers && (
                    <button onClick={onAddGroupMembers} style={{background:'linear-gradient(135deg,#a855f7,#6366f1)',border:'none',borderRadius:'20px',padding:'4px 12px',color:'#fff',fontSize:'12px',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Añadir
                    </button>
                  )}
                </div>
                {groupMembers.length === 0 ? (
                  <div style={{textAlign:'center',padding:'40px 0',color:'#9CA3AF',background:'#fff'}}>
                    <div style={{fontSize:'13px'}}>Sin integrantes cargados</div>
                  </div>
                ) : [...groupMembers]
                  .sort((a, b) => {
                    const aAdmin = a.role === 'admin' ? 0 : 1;
                    const bAdmin = b.role === 'admin' ? 0 : 1;
                    if (aAdmin !== bAdmin) return aAdmin - bAdmin;
                    const aName = (a.full_name || '').trim();
                    const bName = (b.full_name || '').trim();
                    // Sin nombre real → al final
                    const aHasName = /^[a-zA-ZÀ-ÿ]/.test(aName) ? 0 : 1;
                    const bHasName = /^[a-zA-ZÀ-ÿ]/.test(bName) ? 0 : 1;
                    if (aHasName !== bHasName) return aHasName - bHasName;
                    return aName.localeCompare(bName, 'es', { sensitivity: 'base' });
                  })
                  .map((member, idx) => {
                  const name = member.full_name || member.phone || 'Miembro';
                  const initials = name.slice(0,2).toUpperCase();
                  const isMe = member.user_id?.toString() === currentUserId?.toString();
                  const memberIsAdmin = member.role === 'admin';
                  return (
                    <div key={member.id||idx} style={{background:'#fff',borderBottom:'1px solid #F3F4F6',padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
                      {/* Avatar */}
                      <div style={{position:'relative',flexShrink:0}}>
                        <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'linear-gradient(135deg,#a855f7,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                          {member.avatar_url
                            ? <img src={member.avatar_url} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            : <span style={{fontSize:'15px',fontWeight:'700',color:'#fff'}}>{initials}</span>
                          }
                        </div>
                        {member.online_status && <div style={{position:'absolute',bottom:'1px',right:'1px',width:'10px',height:'10px',borderRadius:'50%',background:'#22c55e',border:'2px solid #fff'}}/>}
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <span style={{fontSize:'14px',fontWeight:'600',color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {isMe ? 'Tú' : name}
                          </span>
                          {memberIsAdmin && <span style={{fontSize:'9px',fontWeight:'700',color:'#a855f7',background:'#F3E8FF',borderRadius:'4px',padding:'1px 5px',flexShrink:0}}>ADMIN</span>}
                        </div>
                        <div style={{fontSize:'12px',color:member.online_status?'#22c55e':'#9ca3af',marginTop:'1px'}}>
                          {member.online_status ? '● En línea' : member.phone || '○ Desconectado'}
                        </div>
                      </div>
                      {/* Acciones */}
                      {!isMe && (
                        <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                          {/* Añadir a contactos */}
                          {onAddMemberToContacts && (
                            <button title="Añadir a contactos" onClick={()=>onAddMemberToContacts(member)}
                              style={{width:'32px',height:'32px',borderRadius:'50%',background:'#F0FDF4',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                            </button>
                          )}
                          {/* Hacer admin (solo admin actual) */}
                          {isAdmin && !memberIsAdmin && onPromoteToAdmin && (
                            <button title="Hacer administrador" onClick={()=>{if(window.confirm(`¿Hacer administrador a ${name}?`))onPromoteToAdmin(member.user_id);}}
                              style={{width:'32px',height:'32px',borderRadius:'50%',background:'#FFF7ED',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </button>
                          )}
                          {/* Eliminar del grupo (solo admin) */}
                          {isAdmin && onRemoveGroupMember && (
                            <button title="Eliminar del grupo" onClick={()=>{if(window.confirm(`¿Eliminar a ${name} del grupo?`))onRemoveGroupMember(member.user_id);}}
                              style={{width:'32px',height:'32px',borderRadius:'50%',background:'#FEF2F2',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="18" x2="16" y2="18"/></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── GRUPOS EN COMÚN (contacto individual) ── */
              sharedGroups.length>0?(
                <div>
                  <div style={{padding:'12px 16px 8px',fontSize:'12px',color:'#9CA3AF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px',background:'#fff'}}>
                    {sharedGroups.length} grupo{sharedGroups.length!==1?'s':''} en común
                  </div>
                  {sharedGroups.map((g:any)=>(
                    <div key={g.id} style={{background:'#fff',borderBottom:'1px solid #F3F4F6'}}>
                      <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
                        <div style={{width:'46px',height:'46px',borderRadius:'50%',background:'linear-gradient(135deg,#a855f7,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
                          {g.avatarUrl
                            ? <img src={g.avatarUrl} alt={g.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            : <GroupIcon avatar={g.avatar||'friends'} size={22}/>
                          }
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'2px'}}>{g.name}</div>
                          <div style={{fontSize:'12px',color:'#9CA3AF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {typeof g.members === 'number' ? `${g.members} miembros` : g.description || 'Grupo'}
                            {g.lastMessage ? `  ·  ${g.lastMessage}` : ''}
                          </div>
                        </div>
                        {g.unread>0&&<span style={{background:'#00c8a0',color:'#fff',borderRadius:'50%',minWidth:'20px',height:'20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',padding:'0 4px'}}>{g.unread}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ):(
                <div style={{textAlign:'center',padding:'60px 0',color:'#9CA3AF',background:'#fff'}}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.4" strokeLinecap="round" style={{margin:'0 auto 14px',display:'block'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <div style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>Sin grupos en común</div>
                  <div style={{fontSize:'12px'}}>Los grupos compartidos con {cp.title||cp.name} aparecerán aquí</div>
                </div>
              )
            )}
          </div>
        )}

      </div>
    </div>
  );
};
