import React, { useState } from 'react';
import { useGPS, distanceKm } from './useGPS';

// ─── DATOS INTERNET ───────────────────────────────────────────────────────────
const INTERNET_PROVIDERS = [
  { id:'ip1', name:'GETESA',    full:'Guinea Ecuatorial de Telecomunicaciones S.A.', logo:'/assets/internet/getesa.svg',    color:'#003082', cat:'Telecom / Internet',       cov:'Nacional', type:'Operador / Proveedor Internet' },
  { id:'ip2', name:'GECOMSA',   full:'GECOMSA Telecomunicaciones',                   logo:'/assets/internet/gecomsa.svg',   color:'#0066CC', cat:'Telecom / Internet Móvil',  cov:'Nacional', type:'Operador Móvil / Datos' },
  { id:'ip3', name:'Conexxia',  full:'Conexxia Internet Empresarial',                logo:'/assets/internet/conexxia.svg',  color:'#8B5CF6', cat:'Internet Empresarial',      cov:'Nacional', type:'Internet Empresa / Redes' },
  { id:'ip4', name:'Guineanet', full:'Guineanet Proveedor de Internet',              logo:'/assets/internet/guineanet.svg', color:'#10B981', cat:'Proveedor de Internet',     cov:'Nacional', type:'Conectividad / Internet' },
  { id:'ip5', name:'Fenix',     full:'Fenix Tecnología e Internet',                  logo:'/assets/internet/fenix.svg',     color:'#F97316', cat:'Tecnología / Internet',     cov:'Nacional', type:'Internet Residencial / Empresarial' },
  { id:'ip6', name:'IPX EG',    full:'IPX EG Conectividad e Infraestructura',        logo:'/assets/internet/ipxeg.svg',     color:'#6366F1', cat:'Conectividad / Infraestructura', cov:'Nacional', type:'Internet / Redes / Telecom' },
  { id:'ip7', name:'Officetech',full:'Officetech Tecnología y Conectividad',         logo:'/assets/internet/officetech.svg',color:'#0EA5E9', cat:'Tecnología / Conectividad', cov:'Nacional', type:'Internet / Soporte TI' },
  { id:'ip8', name:'GITGE',     full:'GITGE Infraestructura Telecom',                logo:'/assets/internet/gitge.svg',     color:'#1E293B', cat:'Infraestructura Telecom',   cov:'Nacional', type:'Backbone / Infraestructura' },
  { id:'ip9', name:'ORTEL GE',  full:'ORTEL GE Supervisión Sectorial',               logo:'/assets/internet/ortelge.svg',   color:'#DC2626', cat:'Telecom / Supervisión',     cov:'Nacional', type:'Telecom / Soporte Sectorial' },
];

const INTERNET_SERVICES: Record<string, Array<{id:string;name:string;type:string;desc:string;price:string;speed:string}>> = {
  ip1:[
    { id:'s1', name:'Internet Hogar Básico',    type:'Hogar',    desc:'Conexión ADSL residencial',         price:'15,000 XAF/mes', speed:'10 Mbps' },
    { id:'s2', name:'Fibra Óptica Hogar',       type:'Hogar',    desc:'Fibra óptica de alta velocidad',    price:'30,000 XAF/mes', speed:'100 Mbps' },
    { id:'s3', name:'Internet Empresa',         type:'Empresa',  desc:'Conectividad empresarial dedicada', price:'80,000 XAF/mes', speed:'500 Mbps' },
    { id:'s4', name:'Router + Instalación',     type:'Servicio', desc:'Instalación completa con router',   price:'25,000 XAF',     speed:'—' },
  ],
  ip2:[
    { id:'s5', name:'Datos Móvil Diario',       type:'Móvil',    desc:'1 GB datos móviles 24h',            price:'500 XAF/día',    speed:'4G' },
    { id:'s6', name:'Paquete Mensual 10GB',     type:'Móvil',    desc:'10 GB datos 30 días',               price:'8,000 XAF/mes',  speed:'4G' },
    { id:'s7', name:'Paquete Ilimitado',        type:'Móvil',    desc:'Datos ilimitados 30 días',          price:'20,000 XAF/mes', speed:'4G' },
  ],
  ip3:[
    { id:'s8', name:'Internet Empresarial',     type:'Empresa',  desc:'Conectividad dedicada empresas',    price:'120,000 XAF/mes',speed:'1 Gbps' },
    { id:'s9', name:'VPN Corporativa',          type:'Empresa',  desc:'Red privada virtual segura',        price:'50,000 XAF/mes', speed:'—' },
  ],
  ip4:[
    { id:'s10',name:'Internet Residencial',     type:'Hogar',    desc:'Conexión inalámbrica residencial',  price:'12,000 XAF/mes', speed:'20 Mbps' },
    { id:'s11',name:'Internet Inalámbrico',     type:'Hogar',    desc:'Conexión wireless sin cables',      price:'18,000 XAF/mes', speed:'50 Mbps' },
  ],
  ip5:[
    { id:'s12',name:'Fibra Residencial',        type:'Hogar',    desc:'Fibra óptica para el hogar',        price:'22,000 XAF/mes', speed:'100 Mbps' },
    { id:'s13',name:'Paquete Empresarial',      type:'Empresa',  desc:'Solución completa para empresas',   price:'95,000 XAF/mes', speed:'500 Mbps' },
  ],
  ip6:[
    { id:'s14',name:'Internet Dedicado',        type:'Empresa',  desc:'Línea dedicada garantizada',        price:'200,000 XAF/mes',speed:'1 Gbps' },
    { id:'s15',name:'Infraestructura de Red',   type:'Empresa',  desc:'Diseño e instalación de redes',     price:'Consultar',      speed:'—' },
  ],
  ip7:[
    { id:'s16',name:'Internet + Soporte TI',    type:'Empresa',  desc:'Conectividad con soporte técnico',  price:'60,000 XAF/mes', speed:'200 Mbps' },
    { id:'s17',name:'Revisión de Línea',        type:'Servicio', desc:'Diagnóstico y revisión técnica',    price:'5,000 XAF',      speed:'—' },
  ],
  ip8:[
    { id:'s18',name:'Backbone Nacional',        type:'Infraestructura', desc:'Infraestructura de backbone', price:'Consultar',     speed:'10 Gbps' },
  ],
  ip9:[
    { id:'s19',name:'Soporte Sectorial',        type:'Soporte',  desc:'Supervisión y soporte telecom',     price:'Consultar',      speed:'—' },
  ],
};

// ─── DATOS RECARGA ────────────────────────────────────────────────────────────
const MOBILE_OPERATORS = [
  { id:'mo1', name:'GETESA',   logo:'/assets/recharge/getesa.svg',   color:'#003082', cat:'Operador Móvil / Telefonía', cov:'Nacional', desc:'Operador estatal de telecomunicaciones' },
  { id:'mo2', name:'GECOMSA',  logo:'/assets/recharge/gecomsa.svg',  color:'#0066CC', cat:'Operador Móvil / Datos',     cov:'Nacional', desc:'Operador móvil de datos y telefonía' },
  { id:'mo3', name:'MUNI',     logo:'/assets/recharge/muni.svg',     color:'#FF6B00', cat:'Operador Móvil',             cov:'Nacional', desc:'MUNI Telecomunicaciones Guinea Ecuatorial' },
  { id:'mo4', name:'Orange GE',logo:'/assets/recharge/orange.svg',   color:'#FF6600', cat:'Operador Móvil',             cov:'Nacional', desc:'Orange Guinea Ecuatorial' },
  { id:'mo5', name:'Otro',     logo:'',                              color:'#8A9BB5', cat:'Otros Operadores',           cov:'Nacional', desc:'Otros operadores disponibles' },
];

const MOBILE_PACKAGES: Record<string, Array<{id:string;name:string;type:string;desc:string;price:number;validity:string}>> = {
  mo1:[
    { id:'r1', name:'Recarga 500 XAF',    type:'Saldo',   desc:'Recarga de saldo',          price:500,   validity:'Sin caducidad' },
    { id:'r2', name:'Recarga 1,000 XAF',  type:'Saldo',   desc:'Recarga de saldo',          price:1000,  validity:'Sin caducidad' },
    { id:'r3', name:'Recarga 2,000 XAF',  type:'Saldo',   desc:'Recarga de saldo',          price:2000,  validity:'Sin caducidad' },
    { id:'r4', name:'Recarga 5,000 XAF',  type:'Saldo',   desc:'Recarga de saldo',          price:5000,  validity:'Sin caducidad' },
    { id:'r5', name:'Datos 1 GB',         type:'Datos',   desc:'1 GB datos móviles',        price:1500,  validity:'7 días' },
    { id:'r6', name:'Datos 5 GB',         type:'Datos',   desc:'5 GB datos móviles',        price:5000,  validity:'30 días' },
    { id:'r7', name:'Pack Mixto',         type:'Mixto',   desc:'500 MB + 100 min llamadas', price:3000,  validity:'30 días' },
  ],
  mo2:[
    { id:'r8', name:'Recarga 500 XAF',    type:'Saldo',   desc:'Recarga de saldo',          price:500,   validity:'Sin caducidad' },
    { id:'r9', name:'Datos Diario 1GB',   type:'Datos',   desc:'1 GB datos 24h',            price:500,   validity:'1 día' },
    { id:'r10',name:'Datos Semanal 5GB',  type:'Datos',   desc:'5 GB datos 7 días',         price:2500,  validity:'7 días' },
    { id:'r11',name:'Datos Mensual 25GB', type:'Datos',   desc:'25 GB datos 30 días',       price:15000, validity:'30 días' },
    { id:'r12',name:'Ilimitado Mensual',  type:'Datos',   desc:'Datos ilimitados 30 días',  price:25000, validity:'30 días' },
  ],
  mo3:[
    { id:'r13',name:'Recarga 500 XAF',    type:'Saldo',   desc:'Recarga de saldo MUNI',     price:500,   validity:'Sin caducidad' },
    { id:'r14',name:'Recarga 1,000 XAF',  type:'Saldo',   desc:'Recarga de saldo MUNI',     price:1000,  validity:'Sin caducidad' },
    { id:'r15',name:'Datos Diario 500MB', type:'Datos',   desc:'500 MB datos 24h',          price:300,   validity:'1 día' },
    { id:'r16',name:'Datos Semanal 3GB',  type:'Datos',   desc:'3 GB datos 7 días',         price:2000,  validity:'7 días' },
    { id:'r17',name:'Datos Mensual 10GB', type:'Datos',   desc:'10 GB datos 30 días',       price:8000,  validity:'30 días' },
    { id:'r18',name:'Pack Mixto MUNI',    type:'Mixto',   desc:'1 GB + 60 min llamadas',    price:3500,  validity:'30 días' },
  ],
  mo4:[
    { id:'r19',name:'Recarga 1,000 XAF',  type:'Saldo',   desc:'Recarga de saldo',          price:1000,  validity:'Sin caducidad' },
    { id:'r20',name:'Fly 1G',             type:'Datos',   desc:'1 GB datos 3 días',         price:1000,  validity:'3 días' },
    { id:'r21',name:'Max 20G',            type:'Datos',   desc:'20 GB datos 30 días',       price:12000, validity:'30 días' },
  ],
  mo5:[
    { id:'r22',name:'Recarga Genérica',   type:'Saldo',   desc:'Recarga de saldo',          price:1000,  validity:'Sin caducidad' },
  ],
};

// ─── DATOS CANALES ────────────────────────────────────────────────────────────
const CHANNEL_COMPANIES = [
  { id:'cc1', name:'Canal Sol',     full:'Canal Sol Guinea Ecuatorial',    logo:'/assets/channels/canalsol.svg',    color:'#0A2463', cat:'TV Local / Generalista',    desc:'Canal de televisión local de Guinea Ecuatorial', cov:'Nacional' },
  { id:'cc2', name:'Cachu y Hnos', full:'Cachu y Hermanos Entretenimiento',logo:'/assets/channels/cachuyhnos.svg', color:'#1B4332', cat:'TV Local / Entretenimiento', desc:'Producción y entretenimiento local GQ',           cov:'Nacional' },
  { id:'cc3', name:'Guinea Vista', full:'Guinea Vista Televisión',         logo:'/assets/channels/guineavista.svg',color:'#B45309', cat:'TV Local / Informativa',     desc:'Televisión local informativa de Guinea Ecuatorial',cov:'Nacional' },
  { id:'cc4', name:'Canal Sat',    full:'Canal Sat Guinea Ecuatorial',     logo:'/assets/channels/canalsat.svg',   color:'#1E3A5F', cat:'TV Satélite',                desc:'Televisión por satélite para Guinea Ecuatorial',  cov:'Nacional' },
  { id:'cc5', name:'Canal+',       full:'Canal+ Guinea Ecuatorial',        logo:'/assets/channels/canalplus.svg',  color:'#0A0A0A', cat:'TV Premium',                desc:'Cine, series y deportes premium en HD',          cov:'Con internet / satélite' },
  { id:'cc6', name:'Sony Sat',     full:'Sony Sat Guinea Ecuatorial',      logo:'/assets/channels/sonysat.svg',    color:'#1A1A1A', cat:'TV Satélite / Internacional',desc:'Televisión por satélite Sony en Guinea Ecuatorial',cov:'Nacional' },
  { id:'cc7', name:'Kuryebe',      full:'Kuryebe Televisión GQ',           logo:'/assets/channels/kuryebe.svg',    color:'#7C3AED', cat:'TV Local / Digital',         desc:'Canal digital local de Guinea Ecuatorial',       cov:'Nacional' },
];

const CHANNEL_PACKAGES: Record<string, Array<{id:string;name:string;type:string;desc:string;price:string;duration:string;channels:string[]}>> = {
  cc1:[
    { id:'cp1',  name:'Sol Básico',       type:'Básico',    desc:'Programación general diaria',          price:'3,000 XAF/mes',  duration:'1 mes',    channels:['Noticias locales','Entretenimiento','Deportes GQ','Cultura'] },
    { id:'cp2',  name:'Sol Plus',         type:'Completo',  desc:'Acceso completo a Canal Sol',          price:'6,000 XAF/mes',  duration:'1 mes',    channels:['Todo Canal Sol','Repeticiones','Archivo','Eventos en directo'] },
    { id:'cp3',  name:'Sol Anual',        type:'Anual',     desc:'Suscripción anual con descuento',      price:'60,000 XAF/año', duration:'12 meses', channels:['Todo Canal Sol','Acceso prioritario','Sin interrupciones'] },
  ],
  cc2:[
    { id:'cp4',  name:'Cachu Básico',     type:'Básico',    desc:'Entretenimiento y shows locales',      price:'2,500 XAF/mes',  duration:'1 mes',    channels:['Shows locales','Humor GQ','Música africana','Eventos'] },
    { id:'cp5',  name:'Cachu Premium',    type:'Premium',   desc:'Contenido exclusivo Cachu y Hnos',     price:'5,000 XAF/mes',  duration:'1 mes',    channels:['Contenido exclusivo','Estrenos','Detrás de cámaras','Archivo'] },
  ],
  cc3:[
    { id:'cp6',  name:'Guinea Vista Info',type:'Informativo',desc:'Noticias y actualidad de GQ',         price:'2,000 XAF/mes',  duration:'1 mes',    channels:['Noticias 24h','Política GQ','Economía','Internacional'] },
    { id:'cp7',  name:'Guinea Vista Plus',type:'Completo',  desc:'Programación completa Guinea Vista',   price:'4,500 XAF/mes',  duration:'1 mes',    channels:['Noticias','Documentales','Reportajes','Entrevistas','Cultura'] },
  ],
  cc4:[
    { id:'cp8',  name:'Sat Básico',       type:'Satélite',  desc:'Paquete satélite básico',              price:'8,000 XAF/mes',  duration:'1 mes',    channels:['50+ canales','Noticias internacionales','Deportes','Cine'] },
    { id:'cp9',  name:'Sat Familiar',     type:'Familiar',  desc:'Paquete familiar por satélite',        price:'14,000 XAF/mes', duration:'1 mes',    channels:['80+ canales','Infantil','Deportes','Películas','Documentales'] },
    { id:'cp10', name:'Sat Premium',      type:'Premium',   desc:'Paquete satélite completo',            price:'25,000 XAF/mes', duration:'1 mes',    channels:['150+ canales','HD','Deportes premium','Cine premium','Series'] },
  ],
  cc5:[
    { id:'cp11', name:'Canal+ Séries',    type:'Series',    desc:'Las mejores series internacionales',   price:'18,000 XAF/mes', duration:'1 mes',    channels:['Canal+ Séries','Canal+ Cinéma','OCS','HBO'] },
    { id:'cp12', name:'Canal+ Sport',     type:'Deportes',  desc:'Fútbol y deportes premium',            price:'22,000 XAF/mes', duration:'1 mes',    channels:['Canal+ Sport','beIN Sports','Eurosport','LaLiga'] },
    { id:'cp13', name:'Canal+ Tout',      type:'Premium',   desc:'Paquete completo Canal+',              price:'38,000 XAF/mes', duration:'1 mes',    channels:['Todos los canales Canal+','4K','Sin anuncios'] },
  ],
  cc6:[
    { id:'cp14', name:'Sony Sat Básico',  type:'Satélite',  desc:'Canales Sony por satélite',            price:'10,000 XAF/mes', duration:'1 mes',    channels:['Sony Entertainment','Sony Movies','Sony Ten','AXN'] },
    { id:'cp15', name:'Sony Sat Plus',    type:'Premium',   desc:'Paquete completo Sony Sat',            price:'18,000 XAF/mes', duration:'1 mes',    channels:['Todos los canales Sony','HD','Deportes','Cine','Series'] },
  ],
  cc7:[
    { id:'cp16', name:'Kuryebe Básico',   type:'Básico',    desc:'Programación local Kuryebe',           price:'2,000 XAF/mes',  duration:'1 mes',    channels:['Entretenimiento local','Música GQ','Noticias','Cultura'] },
    { id:'cp17', name:'Kuryebe Plus',     type:'Completo',  desc:'Acceso completo a Kuryebe',            price:'4,000 XAF/mes',  duration:'1 mes',    channels:['Todo Kuryebe','Eventos en directo','Archivo','Exclusivos'] },
  ],
};

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
// LogoThumb — logo pequeño con fallback para uso inline
const LogoThumb: React.FC<{ logo:string; name:string; color:string; size?:number }> = ({ logo, name, color, size=40 }) => {
  const [err, setErr] = React.useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ width:`${size}px`, height:`${size}px`, borderRadius:`${size*0.28}px`, background:`${color}15`, border:`1.5px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
      {logo && !err
        ? <img src={logo} alt={name} onError={() => setErr(true)} style={{ width:`${size*0.75}px`, height:`${size*0.75}px`, objectFit:'contain' }}/>
        : <div style={{ width:`${size*0.75}px`, height:`${size*0.75}px`, borderRadius:`${size*0.2}px`, background:color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:`${size*0.3}px`, fontWeight:'900' }}>{initials}</div>
      }
    </div>
  );
};

// ProviderCard — componente reutilizable para Internet, Recarga y Canales
interface ProviderCardProps {
  logo: string;
  name: string;
  description: string;
  category: string;
  coverage: string;
  accentColor: string;
  actionLabel: string;
  onClick: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ logo, name, description, category, coverage, accentColor, actionLabel, onClick }) => {
  const [imgError, setImgError] = React.useState(false);

  // Genera iniciales para el fallback
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{ background:'#fff', borderRadius:'16px', padding:'16px', marginBottom:'10px', cursor:'pointer', boxShadow:'0 1px 6px rgba(0,0,0,0.08)', transition:'transform 0.15s, box-shadow 0.15s', display:'flex', alignItems:'center', gap:'14px' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateX(4px)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateX(0)'; e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.08)'; }}
    >
      {/* Logo con fallback */}
      <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:`${accentColor}12`, border:`1.5px solid ${accentColor}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
        {logo && !imgError ? (
          <img
            src={logo}
            alt={name}
            onError={() => setImgError(true)}
            style={{ width:'44px', height:'44px', objectFit:'contain' }}
          />
        ) : (
          <div style={{ width:'44px', height:'44px', borderRadius:'10px', background:accentColor, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'16px', fontWeight:'900', letterSpacing:'-0.5px' }}>
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'15px', fontWeight:'800', color:'#111', marginBottom:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
        <div style={{ fontSize:'11px', color:'#888', marginBottom:'4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{description}</div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          <span style={{ background:`${accentColor}15`, color:accentColor, borderRadius:'6px', padding:'2px 8px', fontSize:'10px', fontWeight:'700' }}>{category}</span>
          <span style={{ background:'#F3F4F6', color:'#6B7280', borderRadius:'6px', padding:'2px 8px', fontSize:'10px', fontWeight:'600' }}>📍 {coverage}</span>
        </div>
      </div>

      {/* Action */}
      <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px' }}>
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          style={{ background:accentColor, border:'none', borderRadius:'10px', padding:'7px 12px', color:'#fff', fontSize:'11px', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap' }}>
          {actionLabel}
        </button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>
  );
};
const ModHeader = ({ title, sub, color, onBack, onClose }: { title:string; sub?:string; color:string; onBack:()=>void; onClose:()=>void }) => (
  <div style={{ background:'#FFFFFF', borderBottom:'1px solid #F0F2F5', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
    <button onClick={onBack} style={{ background:'none', border:'none', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#6B7280', fontSize:'20px', flexShrink:0, padding:'0' }}>←</button>
    <div style={{ flex:1 }}>
      <div style={{ fontSize:'16px', fontWeight:'700', color:'#111827' }}>{title}</div>
      {sub && <div style={{ fontSize:'9px', color:'#9CA3AF', textAlign:'center' }}>{sub}</div>}
    </div>
    <button onClick={onClose} style={{ background:'#F3F4F6', border:'none', borderRadius:'50%', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#6B7280', fontSize:'14px' }}>✕</button>
  </div>
);

const StatusBadge = ({ status }: { status:string }) => {
  const cfg: Record<string,{bg:string;color:string}> = {
    pendiente:{bg:'#FEF3C7',color:'#92400E'}, activo:{bg:'#F0FDF4',color:'#16A34A'},
    cancelado:{bg:'#FFF1F2',color:'#DC2626'}, completado:{bg:'#EFF6FF',color:'#1D4ED8'},
    aprobado:{bg:'#F0FDF4',color:'#16A34A'}, rechazado:{bg:'#FFF1F2',color:'#DC2626'},
  };
  const s = cfg[status] || {bg:'#F3F4F6',color:'#6B7280'};
  return <span style={{ background:s.bg, color:s.color, borderRadius:'8px', padding:'3px 10px', fontSize:'11px', fontWeight:'700' }}>{status}</span>;
};

const SupportScreen = ({ onClose }: { onClose:()=>void }) => (
  <div style={{ padding:'12px 14px 24px' }}>
    <div style={{ background:'#fff', borderRadius:'14px', padding:'16px' }}>
      <div style={{ fontSize:'15px', fontWeight:'700', color:'#111', marginBottom:'12px' }}>🎧 Soporte</div>
      {[
        { icon:'🐛', label:'Reportar incidencia',  desc:'Problema con tu servicio' },
        { icon:'🎫', label:'Abrir ticket',          desc:'Nueva solicitud de soporte' },
        { icon:'💬', label:'Chat con soporte',      desc:'Respuesta en menos de 1h' },
        { icon:'📞', label:'Llamar soporte',        desc:'+240 333 00 00 00' },
        { icon:'📧', label:'Email soporte',         desc:'soporte@egchat.gq' },
      ].map((s,i) => (
        <button key={i} style={{ width:'100%', background:'#F9FAFB', border:'none', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px', textAlign:'left' }}>
          <div style={{ fontSize:'22px' }}>{s.icon}</div>
          <div><div style={{ fontSize:'13px', fontWeight:'700', color:'#111' }}>{s.label}</div><div style={{ fontSize:'11px', color:'#888' }}>{s.desc}</div></div>
        </button>
      ))}
    </div>
  </div>
);

// ─── MÓDULO INTERNET ─────────────────────────────────────────────────────────
export const InternetModal: React.FC<{ onClose:()=>void; userBalance:number; onDebit:(n:number)=>void }> = ({ onClose, userBalance, onDebit }) => {
  type IScreen = 'home'|'providers'|'services'|'detail'|'form'|'orders'|'myServices'|'support'|'payBill';
  const [screen, setScreen] = useState<IScreen>('home');
  const [provider, setProvider] = useState('');
  const [service, setService] = useState<any>(null);
  const [orders, setOrders] = useState<Array<{id:string;provider:string;service:string;status:string;date:string;price:string}>>([]);
  const [form, setForm] = useState({name:'',phone:'',address:'',city:'',notes:'',type:''});
  const [billRef, setBillRef] = useState('');
  const [billAmt, setBillAmt] = useState('');
  const [billOk, setBillOk] = useState(false);

  const selProv = INTERNET_PROVIDERS.find(p => p.id === provider);
  const provServices = provider ? (INTERNET_SERVICES[provider] || []) : [];
  const color = selProv?.color || '#1485EE';

  const screenTitle = {home:'Internet',providers:'Proveedores',services:`${selProv?.name||''} · Servicios`,detail:service?.name||'Detalle',form:'Solicitar Instalación',orders:'Mis Pedidos',myServices:'Mis Servicios',support:'Soporte',payBill:'Pagar Factura'}[screen];

  const goBack = () => {
    if(screen==='home') onClose();
    else if(screen==='services') setScreen('providers');
    else if(screen==='detail') setScreen('services');
    else if(screen==='form') setScreen('detail');
    else setScreen('home');
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:3000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#f5f5f5', borderRadius:'16px 16px 0 0', width:'100%', maxWidth:'420px', maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <ModHeader title={screenTitle} sub={screen==='home'?'Conectividad · Guinea Ecuatorial':undefined} color={color} onBack={goBack} onClose={onClose}/>
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px 24px' }}>

          {/* HOME */}
          {screen==='home' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'#F0F2F5', borderRadius:'14px', overflow:'hidden', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                {([
                  { id:'providers',  label:'Ver Proveedores',      desc:`${INTERNET_PROVIDERS.length} disponibles`, color:'#1485EE', bg:'#EFF5FD', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1485EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                  { id:'form',       label:'Solicitar Instalación', desc:'Contratar servicio',    color:'#10B981', bg:'#F0FAF5', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
                  { id:'payBill',    label:'Pagar Factura',         desc:'Pago de servicios',     color:'#C47D2A', bg:'#FDF6EE', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C47D2A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
                  { id:'orders',     label:'Mis Pedidos',           desc:`${orders.length} pedidos`, color:'#6B5BD6', bg:'#F3F1FD', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg> },
                  { id:'myServices', label:'Mis Servicios',         desc:'Servicios activos',     color:'#0E7FA8', bg:'#EDF7FB', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0E7FA8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="#0E7FA8" stroke="none"/></svg> },
                  { id:'support',    label:'Soporte',               desc:'Ayuda técnica',         color:'#C0392B', bg:'#FDF2F2', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> },
                ] as {id:IScreen;label:string;desc:string;color:string;bg:string;svg:React.ReactElement}[]).map(item => (
                  <button key={item.id} onClick={() => setScreen(item.id)}
                    style={{ background:'#fff', border:'none', borderRadius:'16px', padding:'16px 14px', cursor:'pointer', textAlign:'left', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', transition:'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)';}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.07)';}}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>{item.svg}</div>
                    <div style={{ fontSize:'11px', fontWeight:'600', color:'#111827', textAlign:'center', lineHeight:'1.2' }}>{item.label}</div>
                    <div style={{ fontSize:'9px', color:'#9CA3AF', textAlign:'center' }}>{item.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ background:'linear-gradient(135deg,#1485EE,#0066CC)', borderRadius:'14px', padding:'14px 16px', color:'#fff' }}>
                <div style={{ fontSize:'12px', opacity:0.85, marginBottom:'4px' }}>Proveedores en Guinea Ecuatorial</div>
                <div style={{ fontSize:'24px', fontWeight:'800' }}>{INTERNET_PROVIDERS.length} operadores</div>
                <div style={{ fontSize:'11px', opacity:0.75, marginTop:'4px' }}>Hogar · Empresa · Fibra · Móvil · Satélite</div>
              </div>
            </div>
          )}

          {/* PROVIDERS */}
          {screen==='providers' && (
            <div style={{background:'#fff',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',marginBottom:'12px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'#F0F2F5'}}>
                {INTERNET_PROVIDERS.map(p=>(
                  <div key={p.id} onClick={()=>{setProvider(p.id);setScreen('services');}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',padding:'14px 6px',background:'#fff',cursor:'pointer',transition:'background 0.12s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#F7F8FA';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${p.color}14`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                      <img src={p.logo} alt={p.name} onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} style={{width:'36px',height:'36px',objectFit:'contain'}} />
                    </div>
                    <div style={{fontSize:'10px',fontWeight:'600',color:'#111827',textAlign:'center',lineHeight:'1.2',maxWidth:'60px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{fontSize:'9px',color:'#9CA3AF',textAlign:'center'}}>{p.cov}</div>
                  </div>
                ))}
              </div>
            </div>
          )}




          {/* SERVICES */}
          {screen==='services' && (
            <div>
              {provServices.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 0',color:'#9CA3AF'}}>
                  <div style={{fontSize:'32px',marginBottom:'8px'}}>📡</div>
                  <div style={{fontSize:'14px',fontWeight:'600',color:'#374151'}}>Sin servicios disponibles</div>
                </div>
              ) : (
                <div style={{background:'#fff',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',marginBottom:'12px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'#F0F2F5'}}>
                    {provServices.map(svc=>(
                      <div key={svc.id} onClick={()=>{setService(svc);setScreen('detail');}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',padding:'14px 8px',background:'#fff',cursor:'pointer',transition:'background 0.12s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#F7F8FA';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';}}>
                        <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${selProv?.color||'#1485EE'}12`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selProv?.color||'#1485EE'} strokeWidth="1.8" strokeLinecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={selProv?.color||'#1485EE'} stroke="none"/></svg>
                        </div>
                        <div style={{fontSize:'11px',fontWeight:'600',color:'#111827',textAlign:'center',lineHeight:'1.2'}}>{svc.name}</div>
                        <div style={{fontSize:'10px',fontWeight:'700',color:selProv?.color||'#1485EE',textAlign:'center'}}>{svc.price}</div>
                        {svc.speed!=='—'&&<div style={{fontSize:'9px',color:'#9CA3AF',textAlign:'center'}}>⚡ {svc.speed}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DETAIL */}
          {screen==='detail' && service && (
            <div>
              <div style={{ background:'#fff', borderRadius:'16px', padding:'18px', marginBottom:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                  <LogoThumb logo={selProv?.logo||''} name={selProv?.name||''} color={selProv?.color||'#1485EE'} size={52}/>
                  <div><div style={{ fontSize:'18px', fontWeight:'800', color:'#111' }}>{service.name}</div><div style={{ fontSize:'12px', color:'#888' }}>{selProv?.name} · {service.type}</div></div>
                </div>
                <div style={{ fontSize:'26px', fontWeight:'900', color:selProv?.color||'#1485EE', marginBottom:'8px' }}>{service.price}</div>
                <div style={{ fontSize:'13px', color:'#555', marginBottom:'12px' }}>{service.desc}</div>
                {service.speed !== '—' && <div style={{ background:(selProv?.color||'#1485EE')+'12', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color:selProv?.color||'#1485EE', fontWeight:'700' }}>⚡ Velocidad: {service.speed}</div>}
              </div>
              <button onClick={() => setScreen('form')} style={{ width:'100%', background:`linear-gradient(135deg,${selProv?.color||'#1485EE'},${selProv?.color||'#1485EE'}bb)`, border:'none', borderRadius:'12px', padding:'14px', color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>
                🔧 Solicitar ahora
              </button>
            </div>
          )}

          {/* FORM */}
          {screen==='form' && (
            <div>
              {service && <div style={{ background:'#fff', borderRadius:'12px', padding:'12px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
                <LogoThumb logo={selProv?.logo||''} name={selProv?.name||''} color={selProv?.color||'#1485EE'} size={36}/>
                <div><div style={{ fontSize:'13px', fontWeight:'700', color:'#111' }}>{service.name}</div><div style={{ fontSize:'11px', color:'#888' }}>{selProv?.name} · {service.price}</div></div>
              </div>}
              {[{k:'name',l:'Nombre completo',t:'text'},{k:'phone',l:'Teléfono',t:'tel'},{k:'address',l:'Dirección',t:'text'},{k:'city',l:'Ciudad / Barrio / Zona',t:'text'},{k:'type',l:'Tipo de instalación',t:'text'},{k:'notes',l:'Observaciones (opcional)',t:'text'}].map(f => (
                <div key={f.k} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', height:'48px', display:'flex', alignItems:'center' }}>
                  <input type={f.t} placeholder={f.l} value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                </div>
              ))}
              <button onClick={() => {
                if(form.name && form.phone) {
                  setOrders(p => [...p, { id:`io${Date.now()}`, provider:selProv?.name||'', service:service?.name||'Instalación', status:'pendiente', date:new Date().toLocaleDateString('es'), price:service?.price||'—' }]);
                  setForm({name:'',phone:'',address:'',city:'',notes:'',type:''});
                  setScreen('orders');
                }
              }} style={{ width:'100%', background:form.name&&form.phone?'linear-gradient(135deg,#10B981,#059669)':'#e5e7eb', border:'none', borderRadius:'12px', padding:'14px', color:form.name&&form.phone?'#fff':'#9ca3af', fontSize:'14px', fontWeight:'700', cursor:form.name&&form.phone?'pointer':'default', marginTop:'8px' }}>
                Confirmar solicitud
              </button>
            </div>
          )}

          {/* PAY BILL */}
          {screen==='payBill' && (
            <div>
              {!billOk ? (
                <div>
                  <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', marginBottom:'12px' }}>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'#111', marginBottom:'12px' }}>💳 Pagar Factura de Internet</div>
                    {[{k:'billRef',l:'Referencia / Número de contrato',v:billRef,set:setBillRef},{k:'billAmt',l:'Importe a pagar (XAF)',v:billAmt,set:setBillAmt}].map(f => (
                      <div key={f.k} style={{ background:'#F9FAFB', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', height:'48px', display:'flex', alignItems:'center' }}>
                        <input placeholder={f.l} value={f.v} onChange={e => f.set(e.target.value)} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { if(billRef && billAmt && parseInt(billAmt) <= userBalance) { onDebit(parseInt(billAmt)); setBillOk(true); } }}
                    style={{ width:'100%', background:billRef&&billAmt?'linear-gradient(135deg,#F59E0B,#D97706)':'#e5e7eb', border:'none', borderRadius:'12px', padding:'14px', color:billRef&&billAmt?'#fff':'#9ca3af', fontSize:'14px', fontWeight:'700', cursor:billRef&&billAmt?'pointer':'default' }}>
                    Pagar {billAmt ? `${parseInt(billAmt).toLocaleString()} XAF` : ''}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <div style={{ fontSize:'52px', marginBottom:'12px' }}>✅</div>
                  <div style={{ fontSize:'16px', fontWeight:'700', color:'#111', marginBottom:'6px' }}>Pago realizado</div>
                  <div style={{ fontSize:'13px', color:'#888', marginBottom:'20px' }}>Ref: {billRef} · {parseInt(billAmt).toLocaleString()} XAF</div>
                  <button onClick={() => { setBillOk(false); setBillRef(''); setBillAmt(''); setScreen('home'); }} style={{ background:'#1485EE', border:'none', borderRadius:'12px', padding:'12px 28px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>Listo</button>
                </div>
              )}
            </div>
          )}

          {/* ORDERS */}
          {screen==='orders' && (
            <div>
              {orders.length===0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#888' }}>
                  <div style={{ fontSize:'40px', marginBottom:'12px' }}>📋</div>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:'#111', marginBottom:'6px' }}>Sin pedidos aún</div>
                  <div style={{ fontSize:'13px' }}>Solicita un servicio para ver tus pedidos aquí</div>
                </div>
              ) : orders.map(o => (
                <div key={o.id} style={{ background:'#fff', borderRadius:'14px', padding:'14px', marginBottom:'10px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                    <div><div style={{ fontSize:'14px', fontWeight:'700', color:'#111' }}>{o.service}</div><div style={{ fontSize:'11px', color:'#888' }}>{o.provider}</div></div>
                    <StatusBadge status={o.status}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#888' }}>
                    <span>📅 {o.date}</span><span style={{ fontWeight:'700', color:'#111' }}>{o.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MY SERVICES */}
          {screen==='myServices' && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#888' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>📡</div>
              <div style={{ fontSize:'15px', fontWeight:'700', color:'#111', marginBottom:'6px' }}>Sin servicios activos</div>
              <div style={{ fontSize:'13px', marginBottom:'20px' }}>Tus servicios activos aparecerán aquí</div>
              <button onClick={() => setScreen('providers')} style={{ background:'#1485EE', border:'none', borderRadius:'10px', padding:'10px 20px', color:'#fff', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>Ver proveedores</button>
            </div>
          )}

          {screen==='support' && <SupportScreen onClose={onClose}/>}
        </div>
      </div>
    </div>
  );
};

// ─── MÓDULO RECARGA TEL. ─────────────────────────────────────────────────────
export const RecargaModal: React.FC<{ onClose:()=>void; userBalance:number; onDebit:(n:number)=>void }> = ({ onClose, userBalance, onDebit }) => {
  type RScreen = 'home'|'operators'|'packages'|'confirm'|'success'|'history'|'myLines'|'support';
  const [screen, setScreen] = useState<RScreen>('home');
  const [operator, setOperator] = useState('');
  const [pkg, setPkg] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState<Array<{id:string;op:string;phone:string;type:string;amount:number;date:string;status:string}>>([]);
  const [lines, setLines] = useState<Array<{number:string;op:string}>>([]);
  const [newLine, setNewLine] = useState('');

  const selOp = MOBILE_OPERATORS.find(o => o.id === operator);
  const opPackages = operator ? (MOBILE_PACKAGES[operator] || []) : [];
  const color = selOp?.color || '#07C160';

  const screenTitle = {home:'Recarga Tel.',operators:'Operadores',packages:`${selOp?.name||''} · Paquetes`,confirm:'Confirmar',success:'Completado',history:'Historial',myLines:'Mis Líneas',support:'Soporte'}[screen];

  const goBack = () => {
    if(screen==='home') onClose();
    else if(screen==='packages') setScreen('operators');
    else if(screen==='confirm') setScreen('packages');
    else setScreen('home');
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:3000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#f5f5f5', borderRadius:'16px 16px 0 0', width:'100%', maxWidth:'420px', maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <ModHeader title={screenTitle} sub={screen==='home'?'Saldo · Datos · Minutos':undefined} color={color} onBack={goBack} onClose={onClose}/>
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px 24px' }}>

          {/* HOME */}
          {screen==='home' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'#F0F2F5', borderRadius:'14px', overflow:'hidden', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                {([
                  { id:'operators', label:'Recargar Saldo',    desc:'Elige operador',             color:'#2E9E6B', bg:'#F0FAF5', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="6" x2="1" y2="18"/><line x1="6" y1="11" x2="6" y2="18"/><line x1="11" y1="8" x2="11" y2="18"/><line x1="16" y1="5" x2="16" y2="18"/><line x1="21" y1="2" x2="21" y2="18"/></svg> },
                  { id:'operators', label:'Comprar Datos',     desc:'Paquetes de datos',          color:'#1485EE', bg:'#EFF5FD', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1485EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="#1485EE" stroke="none"/></svg> },
                  { id:'operators', label:'Comprar Minutos',   desc:'Paquetes de llamadas',       color:'#C47D2A', bg:'#FDF6EE', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C47D2A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
                  { id:'history',   label:'Historial',         desc:`${history.length} recargas`, color:'#6B5BD6', bg:'#F3F1FD', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                  { id:'myLines',   label:'Mis Líneas',        desc:`${lines.length} guardadas`,  color:'#0E7FA8', bg:'#EDF7FB', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0E7FA8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
                  { id:'support',   label:'Soporte',           desc:'Reportar fallo',             color:'#C0392B', bg:'#FDF2F2', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> },
                ] as {id:RScreen;label:string;desc:string;color:string;bg:string;svg:React.ReactElement}[]).map((item,i) => (
                  <button key={i} onClick={() => setScreen(item.id)}
                    style={{ background:'#fff', border:'none', borderRadius:'16px', padding:'16px 14px', cursor:'pointer', textAlign:'left', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', transition:'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)';}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.07)';}}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>{item.svg}</div>
                    <div style={{ fontSize:'11px', fontWeight:'600', color:'#111827', textAlign:'center', lineHeight:'1.2' }}>{item.label}</div>
                    <div style={{ fontSize:'9px', color:'#9CA3AF', textAlign:'center' }}>{item.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ background:'linear-gradient(135deg,#2E9E6B,#1B7A52)', borderRadius:'14px', padding:'14px 16px', color:'#fff' }}>
                <div style={{ fontSize:'12px', opacity:0.85, marginBottom:'4px' }}>Operadores disponibles</div>
                <div style={{ fontSize:'24px', fontWeight:'800' }}>{MOBILE_OPERATORS.length} operadores</div>
                <div style={{ fontSize:'11px', opacity:0.75, marginTop:'4px' }}>GETESA · GECOMSA · Orange GE · Otros</div>
              </div>
            </div>
          )}

          {/* OPERATORS */}
          {screen==='operators' && (
            <div style={{background:'#fff',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',marginBottom:'12px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'#F0F2F5'}}>
                {MOBILE_OPERATORS.map(op=>(
                  <div key={op.id} onClick={()=>{setOperator(op.id);setScreen('packages');}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',padding:'14px 6px',background:'#fff',cursor:'pointer',transition:'background 0.12s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#F7F8FA';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${op.color}14`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                      {op.logo ? <img src={op.logo} alt={op.name} onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} style={{width:'36px',height:'36px',objectFit:'contain'}}/> : <div style={{width:'36px',height:'36px',borderRadius:'8px',background:op.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'900'}}>{op.name.slice(0,2).toUpperCase()}</div>}
                    </div>
                    <div style={{fontSize:'10px',fontWeight:'600',color:'#111827',textAlign:'center',lineHeight:'1.2',maxWidth:'60px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{op.name}</div>
                    <div style={{fontSize:'9px',color:'#9CA3AF',textAlign:'center'}}>{op.cov}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PACKAGES */}
          {screen==='packages' && (
            <div>
              <div style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'12px', height:'48px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'16px' }}>📞</span>
                <input type="tel" placeholder="Número de teléfono" value={phone} onChange={e => setPhone(e.target.value)} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
              </div>
              <div style={{background:'#fff',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',marginBottom:'8px'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'#F0F2F5'}}>
                  {opPackages.map(p=>(
                    <div key={p.id} onClick={()=>{if(phone){setPkg(p);setScreen('confirm');}}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',padding:'12px 6px',background:'#fff',cursor:phone?'pointer':'not-allowed',opacity:phone?1:0.5,transition:'background 0.12s'}} onMouseEnter={e=>{if(phone)(e.currentTarget as HTMLElement).style.background='#F7F8FA';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';}}>
                      <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`${selOp?.color||'#07C160'}12`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selOp?.color||'#07C160'} strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                      </div>
                      <div style={{fontSize:'10px',fontWeight:'700',color:'#111827',textAlign:'center',lineHeight:'1.2'}}>{p.name}</div>
                      <div style={{fontSize:'10px',fontWeight:'700',color:selOp?.color||'#07C160',textAlign:'center'}}>{p.price.toLocaleString()} XAF</div>
                      <div style={{fontSize:'9px',color:'#9CA3AF',textAlign:'center'}}>{p.validity}</div>
                    </div>
                  ))}
                </div>
              </div>
              {!phone && <div style={{ textAlign:'center', fontSize:'12px', color:'#F59E0B', fontWeight:'600', marginTop:'8px' }}>⚠️ Introduce el número para continuar</div>}
            </div>
          )}

          {/* CONFIRM */}
          {screen==='confirm' && pkg && (
            <div>
              <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', marginBottom:'12px' }}>
                {[['Operador',selOp?.name||''],['Número',phone],['Paquete',pkg.name],['Descripción',pkg.desc],['Validez',pkg.validity],['Precio',`${pkg.price.toLocaleString()} XAF`],['Saldo actual',`${userBalance.toLocaleString()} XAF`]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                    <span style={{ fontSize:'13px', color:'#888' }}>{l}</span>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#111' }}>{v}</span>
                  </div>
                ))}
              </div>
              {pkg.price > userBalance && <div style={{ background:'#FEF2F2', borderRadius:'8px', padding:'9px 12px', marginBottom:'10px', fontSize:'12px', color:'#EF4444', fontWeight:'600' }}>Saldo insuficiente</div>}
              <button onClick={() => {
                if(pkg.price <= userBalance) {
                  onDebit(pkg.price);
                  setHistory(p => [...p, { id:`rh${Date.now()}`, op:selOp?.name||'', phone, type:pkg.type, amount:pkg.price, date:new Date().toLocaleDateString('es'), status:'completado' }]);
                  setScreen('success');
                }
              }} style={{ width:'100%', background:pkg.price<=userBalance?`linear-gradient(135deg,${selOp?.color||'#07C160'},${selOp?.color||'#07C160'}bb)`:'#e5e7eb', border:'none', borderRadius:'12px', padding:'14px', color:pkg.price<=userBalance?'#fff':'#9ca3af', fontSize:'14px', fontWeight:'700', cursor:pkg.price<=userBalance?'pointer':'default' }}>
                Confirmar recarga
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {screen==='success' && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#F0FAF5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'32px' }}>✅</div>
              <div style={{ fontSize:'18px', fontWeight:'800', color:'#111', marginBottom:'6px' }}>¡Recarga exitosa!</div>
              <div style={{ fontSize:'13px', color:'#888', marginBottom:'4px' }}>{pkg?.name} → {phone}</div>
              <div style={{ fontSize:'13px', color:'#888', marginBottom:'20px' }}>{selOp?.name} · {pkg?.price.toLocaleString()} XAF</div>
              <button onClick={() => { setScreen('home'); setPkg(null); setPhone(''); }} style={{ background:selOp?.color||'#07C160', border:'none', borderRadius:'12px', padding:'12px 28px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>Listo</button>
            </div>
          )}

          {/* HISTORY */}
          {screen==='history' && (
            <div>
              {history.length===0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#888' }}>
                  <div style={{ fontSize:'40px', marginBottom:'12px' }}>📋</div>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:'#111', marginBottom:'6px' }}>Sin historial</div>
                  <div style={{ fontSize:'13px' }}>Tus recargas aparecerán aquí</div>
                </div>
              ) : history.map(h => (
                <div key={h.id} style={{ background:'#fff', borderRadius:'14px', padding:'14px', marginBottom:'10px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px' }}>
                    <div><div style={{ fontSize:'14px', fontWeight:'700', color:'#111' }}>{h.op}</div><div style={{ fontSize:'11px', color:'#888' }}>{h.phone} · {h.type}</div></div>
                    <StatusBadge status={h.status}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#888' }}>
                    <span>📅 {h.date}</span><span style={{ fontWeight:'700', color:'#07C160' }}>-{h.amount.toLocaleString()} XAF</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MY LINES */}
          {screen==='myLines' && (
            <div>
              <div style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'10px', height:'48px', display:'flex', alignItems:'center', gap:'8px' }}>
                <input placeholder="Añadir número (+240...)" value={newLine} onChange={e => setNewLine(e.target.value)} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                <button onClick={() => { if(newLine) { setLines(p => [...p, {number:newLine, op:'GETESA'}]); setNewLine(''); } }} style={{ background:'#07C160', border:'none', borderRadius:'8px', padding:'6px 12px', color:'#fff', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>+</button>
              </div>
              {lines.length===0 ? (
                <div style={{ textAlign:'center', padding:'30px 0', color:'#888', fontSize:'13px' }}>Sin líneas guardadas</div>
              ) : lines.map((l,i) => (
                <div key={i} style={{ background:'#fff', borderRadius:'12px', padding:'12px 14px', marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div><div style={{ fontSize:'14px', fontWeight:'700', color:'#111' }}>{l.number}</div><div style={{ fontSize:'11px', color:'#888' }}>{l.op}</div></div>
                  <button onClick={() => setLines(p => p.filter((_,j) => j!==i))} style={{ background:'#FFF1F2', border:'none', borderRadius:'8px', padding:'4px 10px', color:'#DC2626', fontSize:'12px', cursor:'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {screen==='support' && <SupportScreen onClose={onClose}/>}
        </div>
      </div>
    </div>
  );
};

// ─── MÓDULO CANALES ──────────────────────────────────────────────────────────
export const CanalesModal: React.FC<{ onClose:()=>void; userBalance:number; onDebit:(n:number)=>void }> = ({ onClose, userBalance, onDebit }) => {
  type CScreen = 'home'|'companies'|'packages'|'detail'|'subscribe'|'paySubscription'|'orders'|'myChannels'|'support';
  const [screen, setScreen] = useState<CScreen>('home');
  const [company, setCompany] = useState('');
  const [pkg, setPkg] = useState<any>(null);
  const [orders, setOrders] = useState<Array<{id:string;company:string;pkg:string;status:string;date:string;price:string}>>([]);
  const [form, setForm] = useState({name:'',phone:'',address:'',city:'',notes:''});
  const [payRef, setPayRef] = useState('');
  const [payOk, setPayOk] = useState(false);

  const selCo = CHANNEL_COMPANIES.find(c => c.id === company);
  const coPkgs = company ? (CHANNEL_PACKAGES[company] || []) : [];
  const color = selCo?.color || '#8B5CF6';

  const screenTitle = {home:'Canales',companies:'Compañías',packages:`${selCo?.name||''} · Paquetes`,detail:pkg?.name||'Detalle',subscribe:'Suscribirme',paySubscription:'Pagar Suscripción',orders:'Mis Pedidos',myChannels:'Mis Canales',support:'Soporte'}[screen];

  const goBack = () => {
    if(screen==='home') onClose();
    else if(screen==='packages') setScreen('companies');
    else if(screen==='detail') setScreen('packages');
    else if(screen==='subscribe') setScreen('detail');
    else setScreen('home');
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:3000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#f5f5f5', borderRadius:'16px 16px 0 0', width:'100%', maxWidth:'420px', maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <ModHeader title={screenTitle} sub={screen==='home'?'TV · Streaming · Entretenimiento':undefined} color={color} onBack={goBack} onClose={onClose}/>
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px 24px' }}>

          {/* HOME */}
          {screen==='home' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'#F0F2F5', borderRadius:'14px', overflow:'hidden', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                {([
                  { id:'companies',       label:'Ver Compañías',     desc:`${CHANNEL_COMPANIES.length} disponibles`, color:'#6B5BD6', bg:'#F3F1FD', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg> },
                  { id:'packages',        label:'Ver Paquetes',       desc:'Todos los paquetes',    color:'#3B7DD8', bg:'#EFF5FD', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B7DD8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
                  { id:'subscribe',       label:'Suscribirme',        desc:'Contratar servicio',    color:'#2E9E6B', bg:'#F0FAF5', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                  { id:'paySubscription', label:'Pagar Suscripción',  desc:'Renovar o pagar',       color:'#C47D2A', bg:'#FDF6EE', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C47D2A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
                  { id:'orders',          label:'Mis Pedidos',        desc:`${orders.length} pedidos`, color:'#6B5BD6', bg:'#F3F1FD', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/></svg> },
                  { id:'myChannels',      label:'Mis Canales',        desc:'Servicios activos',     color:'#0E7FA8', bg:'#EDF7FB', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0E7FA8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="#0E7FA8" stroke="none"/></svg> },
                  { id:'support',         label:'Soporte',            desc:'Ayuda y tickets',       color:'#C0392B', bg:'#FDF2F2', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> },
                ] as {id:CScreen;label:string;desc:string;color:string;bg:string;svg:React.ReactElement}[]).map(item => (
                  <button key={item.id} onClick={() => setScreen(item.id)}
                    style={{ background:'#fff', border:'none', borderRadius:'16px', padding:'16px 14px', cursor:'pointer', textAlign:'left', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', transition:'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.12)';}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.07)';}}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>{item.svg}</div>
                    <div style={{ fontSize:'11px', fontWeight:'600', color:'#111827', textAlign:'center', lineHeight:'1.2' }}>{item.label}</div>
                    <div style={{ fontSize:'9px', color:'#9CA3AF', textAlign:'center' }}>{item.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ background:'linear-gradient(135deg,#8B5CF6,#6D28D9)', borderRadius:'14px', padding:'14px 16px', color:'#fff' }}>
                <div style={{ fontSize:'12px', opacity:0.85, marginBottom:'4px' }}>Compañías disponibles</div>
                <div style={{ fontSize:'24px', fontWeight:'800' }}>{CHANNEL_COMPANIES.length} operadores</div>
                <div style={{ fontSize:'11px', opacity:0.75, marginTop:'4px' }}>TV · Streaming · Deportes · Local · Satélite</div>
              </div>
            </div>
          )}

          {/* COMPANIES */}
          {screen==='companies' && (
            <div style={{background:'#fff',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',marginBottom:'12px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'#F0F2F5'}}>
                {CHANNEL_COMPANIES.map(c=>(
                  <div key={c.id} onClick={()=>{setCompany(c.id);setScreen('packages');}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',padding:'14px 6px',background:'#fff',cursor:'pointer',transition:'background 0.12s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#F7F8FA';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';}}>
                    <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${c.color}14`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                      {c.logo ? <img src={c.logo} alt={c.name} onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} style={{width:'36px',height:'36px',objectFit:'contain'}}/> : <div style={{width:'36px',height:'36px',borderRadius:'8px',background:c.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'11px',fontWeight:'900'}}>{c.name.slice(0,2).toUpperCase()}</div>}
                    </div>
                    <div style={{fontSize:'10px',fontWeight:'600',color:'#111827',textAlign:'center',lineHeight:'1.2',maxWidth:'60px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                    <div style={{fontSize:'9px',color:'#9CA3AF',textAlign:'center'}}>{c.cat}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PACKAGES */}
          {screen==='packages' && (
            <div>
              {!company ? (
                <div>
                  <div style={{ fontSize:'12px', color:'#888', marginBottom:'10px' }}>Selecciona una compañía para ver sus paquetes</div>
                  {CHANNEL_COMPANIES.map(c => (
                    <button key={c.id} onClick={() => setCompany(c.id)}
                      style={{ width:'100%', background:'#fff', border:'none', borderRadius:'12px', padding:'12px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', textAlign:'left' }}>
                      <LogoThumb logo={c.logo} name={c.name} color={c.color} size={36}/>
                      <div style={{ flex:1 }}><div style={{ fontSize:'13px', fontWeight:'700', color:'#111' }}>{c.name}</div><div style={{ fontSize:'11px', color:'#888' }}>{(CHANNEL_PACKAGES[c.id]||[]).length} paquetes</div></div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{background:'#fff',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'#F0F2F5'}}>
                    {coPkgs.map(p=>(
                      <div key={p.id} onClick={()=>{setPkg(p);setScreen('detail');}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',padding:'12px 6px',background:'#fff',cursor:'pointer',transition:'background 0.12s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#F7F8FA';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';}}>
                        <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`${selCo?.color||'#8B5CF6'}12`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selCo?.color||'#8B5CF6'} strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
                        </div>
                        <div style={{fontSize:'10px',fontWeight:'700',color:'#111827',textAlign:'center',lineHeight:'1.2'}}>{p.name}</div>
                        <div style={{fontSize:'10px',fontWeight:'700',color:selCo?.color||'#8B5CF6',textAlign:'center'}}>{p.price}</div>
                        <div style={{fontSize:'9px',color:'#9CA3AF',textAlign:'center'}}>{p.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DETAIL */}
          {screen==='detail' && pkg && (
            <div>
              <div style={{ background:'#fff', borderRadius:'16px', padding:'18px', marginBottom:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                  <LogoThumb logo={selCo?.logo||''} name={selCo?.name||''} color={selCo?.color||'#8B5CF6'} size={52}/>
                  <div><div style={{ fontSize:'18px', fontWeight:'800', color:'#111' }}>{pkg.name}</div><div style={{ fontSize:'12px', color:'#888' }}>{selCo?.name} · {pkg.type} · {pkg.duration}</div></div>
                </div>
                <div style={{ fontSize:'26px', fontWeight:'900', color:selCo?.color||'#8B5CF6', marginBottom:'8px' }}>{pkg.price}</div>
                <div style={{ fontSize:'13px', color:'#555', marginBottom:'12px' }}>{pkg.desc}</div>
                <div style={{ fontSize:'12px', fontWeight:'700', color:'#111', marginBottom:'8px' }}>Canales incluidos:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {pkg.channels.map((ch: string, i: number) => <span key={i} style={{ background:(selCo?.color||'#8B5CF6')+'18', color:selCo?.color||'#8B5CF6', borderRadius:'8px', padding:'4px 10px', fontSize:'11px', fontWeight:'600' }}>{ch}</span>)}
                </div>
              </div>
              <button onClick={() => setScreen('subscribe')} style={{ width:'100%', background:`linear-gradient(135deg,${selCo?.color||'#8B5CF6'},${selCo?.color||'#8B5CF6'}bb)`, border:'none', borderRadius:'12px', padding:'14px', color:'#fff', fontSize:'15px', fontWeight:'700', cursor:'pointer' }}>
                ✅ Suscribirme ahora
              </button>
            </div>
          )}

          {/* SUBSCRIBE */}
          {screen==='subscribe' && (
            <div>
              {pkg && <div style={{ background:'#fff', borderRadius:'12px', padding:'12px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
                <LogoThumb logo={selCo?.logo||''} name={selCo?.name||''} color={selCo?.color||'#8B5CF6'} size={36}/>
                <div><div style={{ fontSize:'13px', fontWeight:'700', color:'#111' }}>{pkg.name}</div><div style={{ fontSize:'11px', color:'#888' }}>{selCo?.name} · {pkg.price}</div></div>
              </div>}
              {[{k:'name',l:'Nombre completo',t:'text'},{k:'phone',l:'Teléfono',t:'tel'},{k:'address',l:'Dirección',t:'text'},{k:'city',l:'Ciudad / Barrio / Zona',t:'text'},{k:'notes',l:'Observaciones (opcional)',t:'text'}].map(f => (
                <div key={f.k} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', height:'48px', display:'flex', alignItems:'center' }}>
                  <input type={f.t} placeholder={f.l} value={(form as any)[f.k]} onChange={e => setForm(p => ({...p,[f.k]:e.target.value}))} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                </div>
              ))}
              <button onClick={() => {
                if(form.name && form.phone) {
                  setOrders(p => [...p, { id:`co${Date.now()}`, company:selCo?.name||'', pkg:pkg?.name||'', status:'pendiente', date:new Date().toLocaleDateString('es'), price:pkg?.price||'—' }]);
                  setForm({name:'',phone:'',address:'',city:'',notes:''});
                  setScreen('orders');
                }
              }} style={{ width:'100%', background:form.name&&form.phone?`linear-gradient(135deg,#10B981,#059669)`:'#e5e7eb', border:'none', borderRadius:'12px', padding:'14px', color:form.name&&form.phone?'#fff':'#9ca3af', fontSize:'14px', fontWeight:'700', cursor:form.name&&form.phone?'pointer':'default', marginTop:'8px' }}>
                Confirmar suscripción
              </button>
            </div>
          )}

          {/* PAY SUBSCRIPTION */}
          {screen==='paySubscription' && (
            <div>
              {!payOk ? (
                <div>
                  <div style={{ background:'#fff', borderRadius:'14px', padding:'16px', marginBottom:'12px' }}>
                    <div style={{ fontSize:'14px', fontWeight:'700', color:'#111', marginBottom:'12px' }}>💳 Pagar Suscripción</div>
                    <div style={{ background:'#F9FAFB', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', height:'48px', display:'flex', alignItems:'center' }}>
                      <input placeholder="Referencia / Número de contrato" value={payRef} onChange={e => setPayRef(e.target.value)} style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'14px', color:'#0d0d0d', fontFamily:'inherit' }} />
                    </div>
                    <div style={{ fontSize:'12px', color:'#888', marginBottom:'8px' }}>Selecciona el paquete a pagar:</div>
                    {CHANNEL_COMPANIES.slice(0,4).map(c => (
                      <button key={c.id} onClick={() => { setCompany(c.id); }} style={{ width:'100%', background:company===c.id?'#F3F0FF':'#F9FAFB', border:company===c.id?`1.5px solid ${c.color}`:'1.5px solid transparent', borderRadius:'10px', padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px', textAlign:'left' }}>
                        <LogoThumb logo={c.logo} name={c.name} color={c.color} size={32}/>
                        <div style={{ fontSize:'13px', fontWeight:'600', color:'#111' }}>{c.name}</div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { if(payRef && company) { setPayOk(true); } }} style={{ width:'100%', background:payRef&&company?`linear-gradient(135deg,#F59E0B,#D97706)`:'#e5e7eb', border:'none', borderRadius:'12px', padding:'14px', color:payRef&&company?'#fff':'#9ca3af', fontSize:'14px', fontWeight:'700', cursor:payRef&&company?'pointer':'default' }}>
                    Confirmar pago
                  </button>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'40px 0' }}>
                  <div style={{ fontSize:'52px', marginBottom:'12px' }}>✅</div>
                  <div style={{ fontSize:'16px', fontWeight:'700', color:'#111', marginBottom:'6px' }}>Pago confirmado</div>
                  <div style={{ fontSize:'13px', color:'#888', marginBottom:'20px' }}>Ref: {payRef}</div>
                  <button onClick={() => { setPayOk(false); setPayRef(''); setScreen('home'); }} style={{ background:'#8B5CF6', border:'none', borderRadius:'12px', padding:'12px 28px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>Listo</button>
                </div>
              )}
            </div>
          )}

          {/* ORDERS */}
          {screen==='orders' && (
            <div>
              {orders.length===0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#888' }}>
                  <div style={{ fontSize:'40px', marginBottom:'12px' }}>📋</div>
                  <div style={{ fontSize:'15px', fontWeight:'700', color:'#111', marginBottom:'6px' }}>Sin pedidos aún</div>
                  <div style={{ fontSize:'13px' }}>Suscríbete a un paquete para ver tus pedidos aquí</div>
                </div>
              ) : orders.map(o => (
                <div key={o.id} style={{ background:'#fff', borderRadius:'14px', padding:'14px', marginBottom:'10px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                    <div><div style={{ fontSize:'14px', fontWeight:'700', color:'#111' }}>{o.pkg}</div><div style={{ fontSize:'11px', color:'#888' }}>{o.company}</div></div>
                    <StatusBadge status={o.status}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#888' }}>
                    <span>📅 {o.date}</span><span style={{ fontWeight:'700', color:'#111' }}>{o.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MY CHANNELS */}
          {screen==='myChannels' && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#888' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>📡</div>
              <div style={{ fontSize:'15px', fontWeight:'700', color:'#111', marginBottom:'6px' }}>Sin canales activos</div>
              <div style={{ fontSize:'13px', marginBottom:'20px' }}>Tus suscripciones activas aparecerán aquí</div>
              <button onClick={() => setScreen('companies')} style={{ background:'#8B5CF6', border:'none', borderRadius:'10px', padding:'10px 20px', color:'#fff', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>Ver compañías</button>
            </div>
          )}

          {screen==='support' && <SupportScreen onClose={onClose}/>}
        </div>
      </div>
    </div>
  );
};

// ─── MÓDULO BANCOS ───────────────────────────────────────────────────────────
const GQ_BANKS = [
  { id:'bange',   name:'BANGE',       full:'Banco Nacional de Guinea Ecuatorial',                        founded:2006, color:'#003082', color2:'#0052CC', initials:'BN', logo:'/assets/banks/bange.svg',   desc:'Banco nacional con capital ecuatoguineano. Principal institución financiera del Estado.',          address:'Av. de la Independencia, Malabo', phone:'+240 333 09 10 00', web:'bange.gq',     swift:'BANGEGQXX', branches:8, atms:12, services:['Cuenta Corriente','Cuenta de Ahorros','Transferencias Nacionales','Transferencias CEMAC','Préstamos Personales','Préstamos Empresariales','Hipotecas','Tarjeta de Débito','Tarjeta de Crédito','Pago de Facturas','Cambio de Divisas','Banca Digital','Depósitos a Plazo','Seguros Bancarios'], accounts:[{type:'Cuenta Corriente',number:'****4521',balance:45200},{type:'Cuenta Ahorros',number:'****8834',balance:120000}] },
  { id:'ccei',    name:'CCEI Bank GE', full:"Crédit Communautaire d'Afrique — Guinea Ecuatorial",       founded:1994, color:'#C8102E', color2:'#E8192C', initials:'CC', logo:'/assets/banks/ccei.svg',    desc:'Filial del grupo Afriland First Bank. Pionero en Guinea Ecuatorial desde 1994.',               address:'Calle del Presidente Obiang, Malabo', phone:'+240 333 09 20 00', web:'cceibank.gq', swift:'CCEIGQXX', branches:6, atms:9,  services:['Cuenta Corriente','Cuenta de Ahorros','Transferencias Internacionales','Pagos Móviles','Consulta de Cuenta','Inversiones','Tarjetas Bancarias','Seguros','Créditos Personales','Créditos Empresariales','Comercio Exterior','Banca Digital','Depósitos a Plazo','Remesas Internacionales'], accounts:[{type:'Cuenta Corriente',number:'****7712',balance:80000}] },
  { id:'bgfi',    name:'BGFIBank GE',  full:'Banque Gabonaise et Française Internationale — GE',         founded:2001, color:'#00539B', color2:'#0070CC', initials:'BG', logo:'/assets/banks/bgfi.svg',    desc:'Grupo financiero panafricano en 10 países. Especializado en empresas y grandes cuentas.',    address:'Av. Hassan II, Malabo',              phone:'+240 333 09 30 00', web:'bgfi.gq',     swift:'BGFIGQXX',  branches:5, atms:7,  services:['Banca Corporativa','Banca Personal','Pagos QR','Consultas Online','Créditos','Ahorros','Comercio Exterior','Financiamiento de Proyectos','Gestión de Tesorería','Tarjetas Premium','Banca Digital','Inversiones','Seguros Corporativos','Leasing'], accounts:[] },
  { id:'ecobank', name:'Ecobank GE',   full:'Ecobank Equatorial Guinea — Ecobank Transnational Inc.',    founded:2010, color:'#00A3E0', color2:'#0077B6', initials:'EC', logo:'/assets/banks/ecobank.svg', desc:'Banco panafricano en 35 países. Líder en banca móvil y pagos digitales en África.',          address:'Calle de Argelia, Malabo',           phone:'+240 333 09 40 00', web:'ecobank.com', swift:'ECOBGQXX',  branches:4, atms:8,  services:['Banca Móvil Xpress','Transferencias Pan-Africanas','Cuenta Corriente','Cuenta de Ahorros','Tarjeta Ecobank','Pagos Móviles','Préstamos Personales','Préstamos PYME','Remesas Internacionales','Cambio de Divisas','Banca Digital','Depósitos','Seguros','Inversiones'], accounts:[] },
  { id:'cbge',    name:'CBGE',         full:'Commercial Bank Guinée Equatoriale',                        founded:2008, color:'#1B5E20', color2:'#2E7D32', initials:'CB', logo:'/assets/banks/cbge.svg',    desc:'Filial del Commercial Bank Group. Enfocado en financiamiento comercial y empresarial.',      address:'Av. de la Libertad, Malabo',         phone:'+240 333 09 50 00', web:'cbge.gq',     swift:'CBGEGQXX',  branches:3, atms:5,  services:['Cuenta Corriente Empresarial','Financiamiento Comercial','Cartas de Crédito','Garantías Bancarias','Préstamos Empresariales','Gestión de Tesorería','Pagos Internacionales','Cambio de Divisas','Banca Digital','Depósitos Empresariales','Consultoría Financiera','Leasing Empresarial'], accounts:[] },
];
type GQBank = typeof GQ_BANKS[0];
type BkScreen = 'home'|'detail'|'transfer'|'loan'|'bills'|'invest'|'cards'|'history'|'success';

// ─── CARDS SCREEN ─────────────────────────────────────────────────────────────
const CARD_COLORS = ['#003082','#C8102E','#00539B','#1B5E20','#7C3AED','#0A2463','#B45309'];

// Extrae datos de tarjeta del texto OCR
function parseCardFromOCR(text: string): {number?:string; expiry?:string; holder?:string} {
  const result: {number?:string; expiry?:string; holder?:string} = {};
  // Número de tarjeta: 16 dígitos (con o sin espacios/guiones)
  const numMatch = text.replace(/[\s\-]/g,'').match(/\b(\d{16})\b/);
  if (numMatch) result.number = numMatch[1];
  // Fecha de vencimiento: MM/YY o MM/YYYY
  const expMatch = text.match(/\b(0[1-9]|1[0-2])\s*[\/\-]\s*(\d{2,4})\b/);
  if (expMatch) result.expiry = `${expMatch[1]}/${expMatch[2].slice(-2)}`;
  // Nombre del titular: línea en mayúsculas que no sea número
  const lines = text.split('\n').map(l=>l.trim()).filter(l=>l.length>3);
  const nameMatch = lines.find(l => /^[A-Z\s]{4,26}$/.test(l) && !/^\d/.test(l) && !l.includes('VISA') && !l.includes('MASTER') && !l.includes('VALID') && !l.includes('THRU'));
  if (nameMatch) result.holder = nameMatch.trim();
  return result;
}

const CardsScreen: React.FC<{bank: GQBank; grad: string; onClose:()=>void}> = ({bank, grad}) => {
  const [cards, setCards] = React.useState([
    { id:'c1', bank:bank.name, type:'Débito', number:'4521', holder:'USUARIO EGCHAT', expiry:'12/28', color:bank.color },
  ]);
  const [addMode, setAddMode] = React.useState<'none'|'scanning'|'manual'>('none');
  const [scanning, setScanning] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState(0);
  const [form, setForm] = React.useState({number:'',holder:'',expiry:'',cvv:'',type:'Débito',bankName:bank.name});
  const [activeCard, setActiveCard] = React.useState<string|null>(null);
  const [scannedFields, setScannedFields] = React.useState<Set<string>>(new Set());
  const setF = (k:string,v:string) => setForm(p=>({...p,[k]:v}));

  const handlePhotoScan = async (file: File) => {
    setAddMode('scanning');
    setScanning(true);
    setScanProgress(10);
    try {
      const Tesseract = await import('tesseract.js');
      setScanProgress(30);
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setScanProgress(30 + Math.round(m.progress * 60));
          }
        }
      });
      setScanProgress(95);
      const text = result.data.text;
      const parsed = parseCardFromOCR(text);
      const detected = new Set<string>();
      const newForm = {...form};
      if (parsed.number) { newForm.number = parsed.number; detected.add('number'); }
      if (parsed.expiry) { newForm.expiry = parsed.expiry; detected.add('expiry'); }
      if (parsed.holder) { newForm.holder = parsed.holder; detected.add('holder'); }
      setForm(newForm);
      setScannedFields(detected);
      setScanProgress(100);
    } catch {
      // Si falla OCR, abre manual vacío
    }
    setScanning(false);
    setAddMode('manual');
  };

  // Captura foto desde cámara viva
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = React.useState<MediaStream|null>(null);
  const [showCamera, setShowCamera] = React.useState(false);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: {ideal:1280}, height: {ideal:720} }
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch {
      // Fallback: input file
      document.getElementById('card-file-input')?.click();
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !cameraStream) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async (blob) => {
      if (blob) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
        setShowCamera(false);
        await handlePhotoScan(new File([blob], 'card.jpg', {type:'image/jpeg'}));
      }
    }, 'image/jpeg', 0.95);
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  React.useEffect(() => {
    if (showCamera && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play();
    }
  }, [showCamera, cameraStream]);

  const addCard = () => {
    if(form.number.length>=4 && form.holder && form.expiry) {
      setCards(p=>[...p,{id:`c${Date.now()}`,bank:form.bankName,type:form.type,number:form.number.slice(-4),holder:form.holder.toUpperCase(),expiry:form.expiry,color:CARD_COLORS[p.length%CARD_COLORS.length]}]);
      setForm({number:'',holder:'',expiry:'',cvv:'',type:'Débito',bankName:bank.name});
      setScannedFields(new Set());
      setAddMode('none');
    }
  };

  return (
    <div>
      {/* Lista de tarjetas */}
      <div style={{marginBottom:'16px'}}>
        {cards.map(c=>(
          <div key={c.id} onClick={()=>setActiveCard(activeCard===c.id?null:c.id)} style={{marginBottom:'10px',cursor:'pointer'}}>
            {/* Tarjeta visual */}
            <div style={{background:`linear-gradient(135deg,${c.color},${c.color}bb)`,borderRadius:'16px',padding:'20px',color:'#fff',boxShadow:'0 4px 16px rgba(0,0,0,0.15)',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:'-20px',right:'-20px',width:'120px',height:'120px',borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>
              <div style={{position:'absolute',bottom:'-30px',left:'-10px',width:'100px',height:'100px',borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}}>
                <div style={{fontSize:'12px',fontWeight:'700',opacity:0.85}}>{c.bank}</div>
                <div style={{fontSize:'11px',background:'rgba(255,255,255,0.2)',borderRadius:'6px',padding:'2px 8px',fontWeight:'600'}}>{c.type}</div>
              </div>
              <div style={{fontSize:'18px',fontWeight:'800',letterSpacing:'3px',marginBottom:'16px',fontFamily:'monospace'}}>
                •••• •••• •••• {c.number}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
                <div><div style={{fontSize:'9px',opacity:0.7,marginBottom:'2px'}}>TITULAR</div><div style={{fontSize:'12px',fontWeight:'700'}}>{c.holder}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'9px',opacity:0.7,marginBottom:'2px'}}>VENCE</div><div style={{fontSize:'12px',fontWeight:'700'}}>{c.expiry}</div></div>
              </div>
            </div>
            {/* Acciones de la tarjeta */}
            {activeCard===c.id&&(
              <div style={{background:'#fff',borderRadius:'0 0 14px 14px',padding:'8px 12px',display:'flex',gap:'6px',boxShadow:'0 4px 8px rgba(0,0,0,0.06)'}}>
                {[
                  {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label:'Bloquear', color:'#EF4444'},
                  {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><circle cx="12" cy="16" r="1" fill="#6B5BD6"/></svg>, label:'Ver PIN', color:'#6B5BD6'},
                  {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1485EE" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>, label:'Límite', color:'#1485EE'},
                  {icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>, label:'Eliminar', color:'#C0392B'},
                ].map((a,i)=>(
                  <button key={i} style={{flex:1,background:`${a.color}10`,border:`1px solid ${a.color}20`,borderRadius:'8px',padding:'7px 4px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'3px'}}>
                    {a.icon}
                    <span style={{fontSize:'9px',fontWeight:'600',color:a.color}}>{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón añadir */}
      {addMode==='none'&&(
        <div style={{background:'#fff',borderRadius:'14px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'13px',fontWeight:'700',color:'#111827',marginBottom:'12px'}}>Añadir nueva tarjeta</div>
          <div style={{display:'flex',gap:'10px'}}>
            <button onClick={openCamera} style={{flex:1,background:'#EFF5FD',border:'1.5px solid #3B7DD8',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',cursor:'pointer'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B7DD8" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span style={{fontSize:'11px',fontWeight:'700',color:'#3B7DD8'}}>Escanear tarjeta</span>
              <span style={{fontSize:'9px',color:'#9CA3AF',textAlign:'center'}}>Cámara → datos automáticos</span>
            </button>
            {/* Fallback input file */}
            <input id="card-file-input" type="file" accept="image/*" style={{display:'none'}} onChange={(e)=>{
              const file = e.target.files?.[0];
              if(file) handlePhotoScan(file);
            }}/>
            <button onClick={()=>setAddMode('manual')} style={{flex:1,background:'#F0FAF5',border:'1.5px solid #2E9E6B',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',cursor:'pointer'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="1.8" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span style={{fontSize:'11px',fontWeight:'700',color:'#2E9E6B'}}>Manual</span>
              <span style={{fontSize:'9px',color:'#9CA3AF',textAlign:'center'}}>Introduce los datos</span>
            </button>
          </div>
        </div>
      )}

      {/* Visor de cámara en vivo */}
      {showCamera&&(
        <div style={{position:'fixed',inset:0,background:'#000',zIndex:9999,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(0,0,0,0.8)'}}>
            <button onClick={closeCamera} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:'36px',height:'36px',color:'#fff',cursor:'pointer',fontSize:'18px'}}>←</button>
            <div style={{color:'#fff',fontSize:'14px',fontWeight:'700'}}>Escanear tarjeta</div>
            <div style={{width:'36px'}}/>
          </div>
          <div style={{flex:1,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <video ref={videoRef} style={{width:'100%',height:'100%',objectFit:'cover'}} playsInline muted/>
            {/* Marco guía de tarjeta */}
            <div style={{position:'absolute',width:'85%',aspectRatio:'1.586',border:'2px solid rgba(255,255,255,0.8)',borderRadius:'12px',boxShadow:'0 0 0 9999px rgba(0,0,0,0.5)'}}>
              <div style={{position:'absolute',top:'-1px',left:'-1px',width:'20px',height:'20px',borderTop:'3px solid #3B7DD8',borderLeft:'3px solid #3B7DD8',borderRadius:'10px 0 0 0'}}/>
              <div style={{position:'absolute',top:'-1px',right:'-1px',width:'20px',height:'20px',borderTop:'3px solid #3B7DD8',borderRight:'3px solid #3B7DD8',borderRadius:'0 10px 0 0'}}/>
              <div style={{position:'absolute',bottom:'-1px',left:'-1px',width:'20px',height:'20px',borderBottom:'3px solid #3B7DD8',borderLeft:'3px solid #3B7DD8',borderRadius:'0 0 0 10px'}}/>
              <div style={{position:'absolute',bottom:'-1px',right:'-1px',width:'20px',height:'20px',borderBottom:'3px solid #3B7DD8',borderRight:'3px solid #3B7DD8',borderRadius:'0 0 10px 0'}}/>
              <div style={{position:'absolute',bottom:'-32px',left:'50%',transform:'translateX(-50%)',color:'rgba(255,255,255,0.8)',fontSize:'11px',whiteSpace:'nowrap'}}>Coloca la tarjeta dentro del marco</div>
            </div>
          </div>
          <div style={{padding:'24px',background:'rgba(0,0,0,0.8)',display:'flex',justifyContent:'center'}}>
            <button onClick={captureFromCamera} style={{width:'64px',height:'64px',borderRadius:'50%',background:'#fff',border:'4px solid rgba(255,255,255,0.4)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'#fff',border:'2px solid #3B7DD8'}}/>
            </button>
          </div>
        </div>
      )}

      {/* Pantalla de escaneo con progreso */}
      {addMode==='scanning'&&(
        <div style={{background:'#fff',borderRadius:'14px',padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',textAlign:'center'}}>
          <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'#EFF5FD',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B7DD8" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <div style={{fontSize:'14px',fontWeight:'700',color:'#111827',marginBottom:'6px'}}>Analizando tarjeta...</div>
          <div style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'16px'}}>Extrayendo número, fecha y titular</div>
          <div style={{background:'#F0F2F5',borderRadius:'8px',height:'8px',overflow:'hidden',marginBottom:'8px'}}>
            <div style={{background:'linear-gradient(90deg,#3B7DD8,#1485EE)',height:'8px',borderRadius:'8px',width:`${scanProgress}%`,transition:'width 0.3s'}}/>
          </div>
          <div style={{fontSize:'11px',color:'#3B7DD8',fontWeight:'600'}}>{scanProgress}%</div>
        </div>
      )}

      {/* Formulario manual */}
      {addMode==='manual'&&(
        <div style={{background:'#fff',borderRadius:'14px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
            <div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>Datos de la tarjeta</div>
            <button onClick={()=>setAddMode('none')} style={{background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:'16px'}}>✕</button>
          </div>
          {/* Preview en tiempo real */}
          <div style={{background:`linear-gradient(135deg,${bank.color},${bank.color}bb)`,borderRadius:'12px',padding:'16px',color:'#fff',marginBottom:'14px'}}>
            <div style={{fontSize:'11px',opacity:0.8,marginBottom:'8px'}}>{form.bankName||bank.name} · {form.type}</div>
            <div style={{fontSize:'16px',fontWeight:'800',letterSpacing:'2px',marginBottom:'10px',fontFamily:'monospace'}}>
              {form.number ? `•••• •••• •••• ${form.number.slice(-4).padStart(4,'•')}` : '•••• •••• •••• ••••'}
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><div style={{fontSize:'8px',opacity:0.7}}>TITULAR</div><div style={{fontSize:'11px',fontWeight:'700'}}>{form.holder||'NOMBRE APELLIDO'}</div></div>
              <div><div style={{fontSize:'8px',opacity:0.7}}>VENCE</div><div style={{fontSize:'11px',fontWeight:'700'}}>{form.expiry||'MM/AA'}</div></div>
            </div>
          </div>
          {/* Tipo */}
          <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
            {['Débito','Crédito','Prepago'].map(t=>(
              <button key={t} onClick={()=>setF('type',t)} style={{flex:1,background:form.type===t?`${bank.color}15`:'#F9FAFB',border:`1.5px solid ${form.type===t?bank.color:'#E5E7EB'}`,borderRadius:'8px',padding:'7px',fontSize:'11px',fontWeight:'700',color:form.type===t?bank.color:'#6B7280',cursor:'pointer'}}>{t}</button>
            ))}
          </div>
          {/* Campos */}
          {[
            {k:'number',l:'Número de tarjeta (16 dígitos)',t:'number',max:16},
            {k:'holder',l:'Nombre del titular',t:'text',max:26},
            {k:'expiry',l:'Fecha de vencimiento (MM/AA)',t:'text',max:5},
            {k:'cvv',l:'CVV (3 dígitos)',t:'number',max:3},
            {k:'bankName',l:'Banco emisor',t:'text',max:30},
          ].map(f=>(
            <div key={f.k} style={{background:'#F9FAFB',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center',border:`1px solid ${scannedFields.has(f.k)?'#2E9E6B':'#F0F2F5'}`}}>
              <input type={f.t} placeholder={f.l} maxLength={f.max} value={(form as any)[f.k]} onChange={e=>setF(f.k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
              {scannedFields.has(f.k)&&<span style={{background:'#F0FAF5',color:'#2E9E6B',borderRadius:'6px',padding:'2px 6px',fontSize:'9px',fontWeight:'700',flexShrink:0}}>✓ Escaneado</span>}
            </div>
          ))}
          <button onClick={addCard} style={{width:'100%',background:form.number&&form.holder&&form.expiry?`linear-gradient(135deg,${bank.color},${bank.color}bb)`:'#E5E7EB',border:'none',borderRadius:'12px',padding:'13px',color:form.number&&form.holder&&form.expiry?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.number&&form.holder&&form.expiry?'pointer':'default',marginTop:'4px'}}>
            Añadir tarjeta
          </button>
        </div>
      )}
    </div>
  );
};

// BankLogo — muestra logo SVG con fallback de iniciales
const BankLogo: React.FC<{bank: GQBank; size?: number}> = ({bank, size=50}) => {
  const [err, setErr] = React.useState(false);
  const r = Math.round(size * 0.28);
  return (
    <div style={{width:`${size}px`,height:`${size}px`,borderRadius:`${r}px`,background:`linear-gradient(135deg,${bank.color},${bank.color2})`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden'}}>
      {bank.logo && !err
        ? <img src={bank.logo} alt={bank.name} onError={()=>setErr(true)} style={{width:`${size}px`,height:`${size}px`,objectFit:'cover'}}/>
        : <span style={{color:'#fff',fontSize:`${size*0.32}px`,fontWeight:'900'}}>{bank.initials}</span>
      }
    </div>
  );
};
export const BancosModal: React.FC<{ onClose:()=>void; userBalance:number; onDebit:(n:number)=>void; initScreen?:'home'|'cards' }> = ({ onClose, userBalance, onDebit, initScreen='home' }) => {
  const [screen, setScreen] = React.useState<BkScreen>(initScreen);
  const [bank, setBank]     = React.useState<GQBank|null>(null);
  const [form, setForm]     = React.useState<Record<string,string>>({});
  const [msg,  setMsg]      = React.useState('');
  const [banks, setBanks]   = React.useState(GQ_BANKS.map(b => ({...b, accounts: b.accounts.map(a => ({...a}))})));
  const [txHistory, setTxHistory] = React.useState<Array<{type:string;desc:string;amount:number;date:string}>>([
    {type:'in',  desc:'Depósito salario',      amount:150000, date:'01/03/2026'},
    {type:'out', desc:'Transferencia a María',  amount:25000,  date:'05/03/2026'},
    {type:'out', desc:'Pago electricidad',      amount:8500,   date:'10/03/2026'},
    {type:'in',  desc:'Reembolso seguro',       amount:35000,  date:'15/03/2026'},
    {type:'out', desc:'Recarga móvil',          amount:5000,   date:'18/03/2026'},
    {type:'out', desc:'Pago agua SNGE',         amount:3200,   date:'20/03/2026'},
  ]);

  const totalBalance = banks.flatMap(b=>b.accounts).reduce((s,a)=>s+a.balance,0);
  const grad = bank ? `linear-gradient(135deg,${bank.color},${bank.color2})` : 'linear-gradient(135deg,#1485EE,#0052CC)';
  const setF = (k:string,v:string) => setForm(p=>({...p,[k]:v}));

  const ok = (m:string, txDesc?:string, txAmount?:number, txType?:string) => {
    if (txDesc && txAmount) {
      setTxHistory(p => [{type:txType||'out', desc:txDesc, amount:txAmount, date:new Date().toLocaleDateString('es')},...p]);
    }
    setMsg(m); setScreen('success'); setForm({});
  };

  const back = () => {
    if(screen==='home'){onClose();}
    else if(screen==='detail'){setScreen('home');}
    else if(screen==='cards'&&!bank){onClose();}
    else{setScreen('detail');}
  };

  const titles:Record<BkScreen,string> = {
    home:'Bancos', detail:bank?.name||'', transfer:'Transferencia',
    loan:'Préstamos', bills:'Pagar Factura', invest:'Inversiones',
    cards: bank ? `Tarjetas · ${bank.name}` : 'Mis Tarjetas', history:'Historial', success:'Completado',
  };
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'4px',flexShrink:0}}>
          <div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#D1D5DB'}}/>
        </div>

        {/* Header */}
        <div style={{padding:'4px 16px 12px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
          <button onClick={back} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#5A7090',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:'17px',fontWeight:'700',color:'#111827'}}>{titles[screen]}</div>
            {screen==='home'&&<div style={{fontSize:'12px',color:'#9CA3AF'}}>Guinea Ecuatorial · {GQ_BANKS.length} bancos</div>}
            {screen==='detail'&&bank&&<div style={{fontSize:'12px',color:'#9CA3AF'}}>{bank.full}</div>}
          </div>
          <button onClick={onClose} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#5A7090',fontSize:'16px'}}>✕</button>
        </div>

        {/* Saldo total — ESTÁTICO solo en home */}
        {screen==='home'&&(
          <div style={{padding:'0 16px 12px',flexShrink:0}}>
            <div style={{background:'linear-gradient(135deg,#4A90D9,#2563EB)',borderRadius:'16px',padding:'16px 18px',color:'#fff',boxShadow:'0 2px 12px rgba(37,99,235,0.2)'}}>
              <div style={{fontSize:'11px',opacity:0.75,marginBottom:'6px',letterSpacing:'0.5px'}}>Saldo total</div>
              <div style={{fontSize:'28px',fontWeight:'800',letterSpacing:'-0.5px',marginBottom:'10px'}}>{totalBalance.toLocaleString()} <span style={{fontSize:'14px',fontWeight:'400',opacity:0.75}}>XAF</span></div>
              <div style={{display:'flex',gap:'0',background:'rgba(255,255,255,0.12)',borderRadius:'10px',overflow:'hidden'}}>
                {[
                  {v:GQ_BANKS.filter(b=>b.accounts.length>0).length, l:'Cuentas'},
                  {v:GQ_BANKS.length, l:'Bancos'},
                  {v:GQ_BANKS.filter(b=>b.accounts.length>0).length, l:'Tarjetas'},
                ].map((s,i)=>(
                  <div key={i} style={{flex:1,padding:'8px 0',textAlign:'center',borderRight:i<2?'1px solid rgba(255,255,255,0.15)':'none'}}>
                    <div style={{fontSize:'16px',fontWeight:'700'}}>{s.v}</div>
                    <div style={{fontSize:'10px',opacity:0.7}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div style={{flex:1,overflowY:'auto',padding:'0 16px 24px'}}>
          {screen==='home'&&<div>
            {GQ_BANKS.map(b=>(
              <div key={b.id} style={{background:'#fff',borderRadius:'14px',marginBottom:'10px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #F0F2F5'}}>
                {/* Header banco — color suave */}
                <div style={{background:`${b.color}10`,borderBottom:'1px solid #F0F2F5',padding:'12px 14px',display:'flex',alignItems:'center',gap:'10px'}}>
                  <BankLogo bank={b} size={38}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px',fontWeight:'700',color:'#111827'}}>{b.name}</div>
                    <div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'1px'}}>{b.branches} sucursales · {b.atms} ATMs</div>
                  </div>
                  <button onClick={()=>{setBank(b);setScreen('detail');}} style={{background:`${b.color}15`,border:'none',borderRadius:'8px',padding:'5px 10px',color:b.color,fontSize:'11px',fontWeight:'700',cursor:'pointer'}}>Ver</button>
                </div>
                {/* Cuentas */}
                {b.accounts.length>0 ? (
                  <div style={{padding:'10px 14px'}}>
                    {b.accounts.map((acc,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 10px',background:'#F9FAFB',borderRadius:'10px',marginBottom:'6px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                          <div style={{width:'30px',height:'30px',borderRadius:'8px',background:`${b.color}12`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {acc.type==='Cuenta Corriente'
                              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={b.color} strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={b.color} strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            }
                          </div>
                          <div>
                            <div style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>{acc.type}</div>
                            <div style={{fontSize:'10px',color:'#9CA3AF'}}>{acc.number}</div>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:'14px',fontWeight:'700',color:'#111827'}}>{acc.balance.toLocaleString()}</div>
                          <div style={{fontSize:'10px',color:'#9CA3AF'}}>XAF</div>
                        </div>
                      </div>
                    ))}
                    {/* Tarjeta */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 10px',background:'#F9FAFB',borderRadius:'10px',border:`1px dashed ${b.color}25`}}>
                      <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                        <div style={{width:'30px',height:'30px',borderRadius:'8px',background:`${b.color}12`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={b.color} strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="9" y2="15"/></svg>
                        </div>
                        <div>
                          <div style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>Tarjeta de Débito</div>
                          <div style={{fontSize:'10px',color:'#9CA3AF'}}>**** 4521 · Vence 12/28</div>
                        </div>
                      </div>
                      <span style={{background:`${b.color}12`,color:b.color,borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:'600'}}>Activa</span>
                    </div>
                  </div>
                ) : (
                  <div style={{padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontSize:'12px',color:'#9CA3AF'}}>Sin cuentas activas</div>
                    <button onClick={()=>{setBank(b);setScreen('detail');}} style={{background:`${b.color}12`,border:'none',borderRadius:'8px',padding:'5px 10px',color:b.color,fontSize:'11px',fontWeight:'600',cursor:'pointer'}}>+ Abrir cuenta</button>
                  </div>
                )}
                {/* Acciones rápidas */}
                <div style={{borderTop:'1px solid #F0F2F5',padding:'8px 14px',display:'flex',gap:'6px'}}>
                  {([['Transferir','transfer'],['Pagar','bills'],['Préstamo','loan'],['Invertir','invest']] as [string,BkScreen][]).map(([label,sc])=>(
                    <button key={label} onClick={()=>{setBank(b);setScreen(sc);}} style={{flex:1,background:'#F9FAFB',border:'1px solid #E5E7EB',borderRadius:'8px',padding:'6px 2px',fontSize:'10px',fontWeight:'600',color:'#6B7280',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=`${b.color}10`;e.currentTarget.style.borderColor=`${b.color}30`;e.currentTarget.style.color=b.color;}} onMouseLeave={e=>{e.currentTarget.style.background='#F9FAFB';e.currentTarget.style.borderColor='#E5E7EB';e.currentTarget.style.color='#6B7280';}}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>}
          {screen==='detail'&&bank&&<div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'18px',marginBottom:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'14px'}}>
                <BankLogo bank={bank} size={60}/>
                <div><div style={{fontSize:'18px',fontWeight:'900',color:'#1A2B4A'}}>{bank.name}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>Fundado en {bank.founded} · SWIFT: {bank.swift}</div></div>
              </div>
              <div style={{fontSize:'12px',color:'#5A7090',lineHeight:'1.5',marginBottom:'12px'}}>{bank.desc}</div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                <span style={{background:`${bank.color}12`,color:bank.color,borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>📍 {bank.address}</span>
                <span style={{background:'#F0F4F8',color:'#5A7090',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>📞 {bank.phone}</span>
                <span style={{background:'#F0F4F8',color:'#5A7090',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>🌍 {bank.web}</span>
              </div>
            </div>
            {bank.accounts.length>0&&<div style={{marginBottom:'12px'}}><div style={{fontSize:'12px',fontWeight:'700',color:'#8A9BB5',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Mis cuentas</div>{bank.accounts.map((a,i)=>(<div key={i} style={{background:grad,borderRadius:'14px',padding:'16px',marginBottom:'8px',color:'#fff'}}><div style={{fontSize:'11px',opacity:0.8,marginBottom:'4px'}}>{a.type} · {a.number}</div><div style={{fontSize:'26px',fontWeight:'900'}}>{a.balance.toLocaleString()} <span style={{fontSize:'13px',opacity:0.8}}>XAF</span></div></div>))}</div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'14px'}}>
              {([
                ['transfer', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1485EE" strokeWidth="1.8" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>, 'Transferir',   '#1485EE'],
                ['bills',    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C47D2A" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, 'Pagar Factura','#C47D2A'],
                ['loan',     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>, 'Préstamos',    '#2E9E6B'],
                ['invest',   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>, 'Inversiones',  '#6B5BD6'],
                ['cards',    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="9" y2="15"/></svg>, 'Tarjetas',     '#C0392B'],
                ['history',  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A7090" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, 'Historial',    '#5A7090'],
              ] as [BkScreen, React.ReactElement, string, string][]).map(([id,svg,label,color])=>(
                <button key={id} onClick={()=>setScreen(id)} style={{background:'#fff',border:'1px solid #F0F2F5',borderRadius:'12px',padding:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=`${color}08`;e.currentTarget.style.borderColor=`${color}25`;}} onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.borderColor='#F0F2F5';}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{svg}</div>
                  <div style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>{label}</div>
                </button>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:'14px',padding:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}><div style={{fontSize:'12px',fontWeight:'700',color:'#8A9BB5',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Servicios disponibles</div><div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>{bank.services.map(s=><span key={s} style={{background:`${bank.color}10`,color:bank.color,borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>{s}</span>)}</div></div>
          </div>}
          {screen==='transfer'&&bank&&<div>
            {([['local','Transferencia Local','Entre cuentas del mismo banco','#1485EE'],['inter','Transferencia Interna','Entre bancos de Guinea Ec.','#07C160'],['cemac','Transferencia CEMAC','Camerún, Gabón, Congo...','#576B95'],['intl','Internacional','Fuera de la zona CEMAC','#FA9D3B']] as [string,string,string,string][]).map(([id,label,sub,color])=>(
              <div key={id} onClick={()=>setF('tt',id)} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${form.tt===id?color:'transparent'}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
                <div><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{sub}</div></div>
              </div>
            ))}
            {form.tt&&<div style={{background:'#fff',borderRadius:'14px',padding:'14px',marginTop:'4px'}}>
              {([['recipient','Destinatario / IBAN / Teléfono','text'],['amount','Monto (XAF)','number'],['concept','Concepto (opcional)','text']] as [string,string,string][]).map(([k,l,t])=>(<div key={k} style={{background:'#F8FAFC',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}><input type={t} placeholder={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/></div>))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:'1px solid #F0F4F8'}}><span style={{fontSize:'12px',color:'#8A9BB5'}}>Saldo disponible</span><span style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{userBalance.toLocaleString()} XAF</span></div>
              <button onClick={()=>{if(form.recipient&&form.amount){onDebit(parseInt(form.amount));ok(`Transferencia de ${parseInt(form.amount).toLocaleString()} XAF a ${form.recipient} completada.`,`Transferencia a ${form.recipient}`,parseInt(form.amount),'out');}}} style={{width:'100%',background:form.recipient&&form.amount?grad:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.recipient&&form.amount?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.recipient&&form.amount?'pointer':'default',marginTop:'8px'}}>Confirmar transferencia</button>
            </div>}
          </div>}
          {screen==='loan'&&bank&&<div>
            {([['personal','Préstamo Personal','Hasta 5,000,000 XAF','12% anual','#FA9D3B'],['negocio','Préstamo Negocio','Hasta 50,000,000 XAF','9% anual','#1485EE'],['hipoteca','Hipoteca','Hasta 200,000,000 XAF','7% anual','#576B95'],['micro','Microcrédito','Hasta 500,000 XAF','15% anual','#07C160']] as [string,string,string,string,string][]).map(([id,label,sub,rate,color])=>(<div key={id} onClick={()=>setF('lt',id)} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${form.lt===id?color:'transparent'}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}><div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg></div><div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{sub} · <span style={{color,fontWeight:'600'}}>{rate}</span></div></div></div>))}
            {form.lt&&<div style={{background:'#fff',borderRadius:'14px',padding:'14px',marginTop:'4px'}}>{([['amount','Monto solicitado (XAF)','number'],['months','Plazo en meses (6-60)','number'],['income','Ingreso mensual (XAF)','number']] as [string,string,string][]).map(([k,l,t])=>(<div key={k} style={{background:'#F8FAFC',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}><input type={t} placeholder={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/></div>))}{form.amount&&form.months&&<div style={{background:'#F0FAF5',borderRadius:'10px',padding:'12px 14px',marginBottom:'10px'}}><div style={{fontSize:'11px',color:'#8A9BB5',marginBottom:'4px'}}>Cuota mensual estimada</div><div style={{fontSize:'22px',fontWeight:'800',color:'#07C160'}}>{Math.round(parseInt(form.amount)*1.12/parseInt(form.months)).toLocaleString()} XAF</div></div>}<button onClick={()=>{if(form.amount&&form.months)ok(`Solicitud de préstamo por ${parseInt(form.amount).toLocaleString()} XAF enviada a ${bank.name}.`);}} style={{width:'100%',background:form.amount&&form.months?grad:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.amount&&form.months?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.amount&&form.months?'pointer':'default'}}>Solicitar préstamo</button></div>}
          </div>}
          {screen==='bills'&&bank&&<div>
            {([['elec','Electricidad','SEGESA / ENERGE','#FA9D3B'],['agua','Agua','SNGE','#1485EE'],['gas','Gas','GEPetrol','#FA5151'],['tax','Impuestos','DGI / Hacienda','#07C160'],['edu','Educación','Colegios / Univ.','#576B95'],['other','Otro','Referencia manual','#8A9BB5']] as [string,string,string,string][]).map(([id,label,sub,color])=>(<div key={id} onClick={()=>setF('bt',id)} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${form.bt===id?color:'transparent'}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}><div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg></div><div><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{sub}</div></div></div>))}
            {form.bt&&<div style={{background:'#fff',borderRadius:'14px',padding:'14px',marginTop:'4px'}}>{([['ref','Número de referencia / Contrato','text'],['amount','Monto a pagar (XAF)','number']] as [string,string,string][]).map(([k,l,t])=>(<div key={k} style={{background:'#F8FAFC',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}><input type={t} placeholder={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/></div>))}<button onClick={()=>{if(form.ref&&form.amount){onDebit(parseInt(form.amount));ok(`Pago de factura por ${parseInt(form.amount).toLocaleString()} XAF completado.`,`Pago factura ref.${form.ref}`,parseInt(form.amount),'out');}}} style={{width:'100%',background:form.ref&&form.amount?grad:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.ref&&form.amount?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.ref&&form.amount?'pointer':'default'}}>Pagar factura</button></div>}
          </div>}
          {screen==='invest'&&bank&&<div>
            {([['plazo','Depósito a Plazo','3-24 meses','+6% anual','#07C160'],['fondos','Fondos de Inversión','Cartera diversif.','+8-12% anual','#1485EE'],['bonos','Bonos del Estado','Renta fija CEMAC','+5% anual','#576B95'],['acciones','Acciones BVMAC','Bolsa de Libreville','Variable','#FA9D3B']] as [string,string,string,string,string][]).map(([id,label,sub,rate,color])=>(<div key={id} onClick={()=>setF('it',id)} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${form.it===id?color:'transparent'}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}><div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg></div><div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{sub}</div></div><div style={{fontSize:'12px',fontWeight:'800',color}}>{rate}</div></div>))}
            {form.it&&<div style={{background:'#fff',borderRadius:'14px',padding:'14px',marginTop:'4px'}}>{([['amount','Monto a invertir (XAF)','number'],['months','Plazo en meses','number']] as [string,string,string][]).map(([k,l,t])=>(<div key={k} style={{background:'#F8FAFC',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}><input type={t} placeholder={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/></div>))}{form.amount&&form.months&&<div style={{background:'#F0FAF5',borderRadius:'10px',padding:'12px 14px',marginBottom:'10px'}}><div style={{fontSize:'11px',color:'#8A9BB5',marginBottom:'4px'}}>Ganancia estimada</div><div style={{fontSize:'22px',fontWeight:'800',color:'#07C160'}}>+{Math.round(parseInt(form.amount)*0.08*parseInt(form.months)/12).toLocaleString()} XAF</div></div>}<button onClick={()=>{if(form.amount&&form.months)ok(`Inversión de ${parseInt(form.amount).toLocaleString()} XAF registrada en ${bank.name}.`);}} style={{width:'100%',background:form.amount&&form.months?grad:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.amount&&form.months?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.amount&&form.months?'pointer':'default'}}>Invertir ahora</button></div>}
          </div>}
          {screen==='cards'&&<div>
            <CardsScreen bank={bank||GQ_BANKS[0]} grad={bank?grad:'linear-gradient(135deg,#1485EE,#0052CC)'} onClose={()=>setScreen(bank?'detail':'home')}/>
          </div>}
          {screen==='history'&&bank&&<div>
            {txHistory.length===0 ? (
              <div style={{textAlign:'center',padding:'40px 0',color:'#8A9BB5'}}><div style={{fontSize:'40px',marginBottom:'12px'}}>📋</div><div style={{fontSize:'15px',fontWeight:'700',color:'#1A2B4A'}}>Sin movimientos</div></div>
            ) : txHistory.map((h,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                <div style={{width:'38px',height:'38px',borderRadius:'10px',background:h.type==='in'?'#F0FDF4':'#FFF1F2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>{h.type==='in'?'↓':'↑'}</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'600',color:'#1A2B4A'}}>{h.desc}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{h.date}</div></div>
                <div style={{fontWeight:'700',fontSize:'14px',color:h.type==='in'?'#16A34A':'#DC2626'}}>{h.type==='in'?'+':'-'}{h.amount.toLocaleString()} XAF</div>
              </div>
            ))}
          </div>}
          {screen==='success'&&<div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'#F0FAF5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'36px'}}>✅</div>
            <div style={{fontSize:'18px',fontWeight:'800',color:'#1A2B4A',marginBottom:'8px'}}>Operación completada</div>
            <div style={{fontSize:'13px',color:'#8A9BB5',marginBottom:'24px',lineHeight:'1.5',padding:'0 20px'}}>{msg}</div>
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button onClick={()=>setScreen('history')} style={{background:'#F0F4F8',border:'none',borderRadius:'12px',padding:'12px 20px',color:'#5A7090',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>Ver historial</button>
              <button onClick={()=>setScreen('detail')} style={{background:grad,border:'none',borderRadius:'12px',padding:'12px 24px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Volver al banco</button>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
};

// ─── DATOS SEGUROS ────────────────────────────────────────────────────────────
const INS_COS = [
  { id:'gepetrol', name:'GEPetrol Seguros', color:'#1B5E20', color2:'#2E7D32', initials:'GP', desc:'Aseguradora oficial del sector petrolero y energético de Guinea Ecuatorial.', phone:'+240 333 09 60 00', web:'gepetrol.gq', address:'Av. de la Independencia, Malabo', products:[
    { id:'gp1', name:'Seguro de Vida', type:'vida', price:'8,000 XAF/mes', coverage:'Hasta 50,000,000 XAF', desc:'Cobertura familiar completa en caso de fallecimiento o invalidez.', docs:['DNI / Pasaporte','Certificado médico','Formulario de beneficiarios','Declaración de salud'] },
    { id:'gp2', name:'Seguro de Salud', type:'salud', price:'12,000 XAF/mes', coverage:'Hospitalización + consultas', desc:'Cubre hospitalización, consultas médicas, medicamentos y urgencias.', docs:['DNI / Pasaporte','Historial médico','Formulario de solicitud','Foto reciente'] },
    { id:'gp3', name:'Seguro de Vehículo', type:'auto', price:'15,000 XAF/mes', coverage:'Todo riesgo', desc:'Cobertura total: robo, accidente, daños a terceros.', docs:['DNI / Pasaporte','Permiso de conducir','Tarjeta de circulación','Ficha técnica','Fotos del vehículo','Foto de la matrícula'] },
  ]},
  { id:'activa', name:'Activa Assurances GQ', color:'#E65100', color2:'#F57C00', initials:'AA', desc:'Filial del grupo Activa, presente en 12 países de África Central y Occidental.', phone:'+240 333 09 61 00', web:'activaassurances.com', address:'Calle de Argelia, Malabo', products:[
    { id:'aa1', name:'Seguro de Vida', type:'vida', price:'7,500 XAF/mes', coverage:'Hasta 40,000,000 XAF', desc:'Protección financiera para tu familia ante imprevistos.', docs:['DNI / Pasaporte','Certificado médico','Formulario de beneficiarios','Declaración de salud'] },
    { id:'aa2', name:'Seguro del Hogar', type:'hogar', price:'5,000 XAF/mes', coverage:'Robo, incendio, inundación', desc:'Protege tu vivienda y contenido contra daños y robos.', docs:['DNI / Pasaporte','Escritura o contrato de alquiler','Inventario del hogar','Fotos de la vivienda'] },
    { id:'aa3', name:'Seguro de Vehículo', type:'auto', price:'13,000 XAF/mes', coverage:'Todo riesgo o terceros', desc:'Elige entre cobertura total o responsabilidad civil.', docs:['DNI / Pasaporte','Permiso de conducir','Tarjeta de circulación','Ficha técnica','Fotos del vehículo','Foto de la matrícula'] },
    { id:'aa4', name:'Seguro de Viaje', type:'viaje', price:'3,000 XAF/viaje', coverage:'Cobertura internacional', desc:'Asistencia médica y repatriación en el extranjero.', docs:['DNI / Pasaporte','Billete de avión o itinerario','Formulario de solicitud'] },
  ]},
  { id:'sunu', name:'Sunu Assurances GQ', color:'#1565C0', color2:'#1976D2', initials:'SA', desc:'Grupo panafricano de seguros con presencia en 15 países africanos.', phone:'+240 333 09 62 00', web:'sunu-group.com', address:'Av. Hassan II, Malabo', products:[
    { id:'sa1', name:'Seguro de Salud', type:'salud', price:'10,000 XAF/mes', coverage:'Hospitalización + especialistas', desc:'Acceso a red médica privada y reembolso de gastos médicos.', docs:['DNI / Pasaporte','Historial médico','Formulario de solicitud','Foto reciente','Certificado de trabajo'] },
    { id:'sa2', name:'Seguro de Vida', type:'vida', price:'6,000 XAF/mes', coverage:'Hasta 30,000,000 XAF', desc:'Seguro de vida con ahorro y cobertura por invalidez.', docs:['DNI / Pasaporte','Certificado médico','Formulario de beneficiarios','Declaración de salud'] },
    { id:'sa3', name:'Seguro Empresarial', type:'empresa', price:'Consultar', coverage:'Personalizado', desc:'Responsabilidad civil, accidentes laborales para empresas.', docs:['Registro mercantil','NIF empresa','Nóminas de empleados','Formulario empresarial','Memoria de actividad'] },
  ]},
  { id:'allianz', name:'Allianz GQ', color:'#003781', color2:'#0057A8', initials:'AL', desc:'Filial del grupo Allianz, líder mundial en seguros con presencia en Guinea Ecuatorial.', phone:'+240 333 09 63 00', web:'allianz.gq', address:'Centro Comercial, Malabo', products:[
    { id:'al1', name:'Seguro de Vida Premium', type:'vida', price:'15,000 XAF/mes', coverage:'Hasta 100,000,000 XAF', desc:'Cobertura premium con ahorro e inversión incluidos.', docs:['DNI / Pasaporte','Certificado médico completo','Formulario de beneficiarios','Declaración de salud','Extracto bancario 3 meses'] },
    { id:'al2', name:'Seguro de Salud Premium', type:'salud', price:'20,000 XAF/mes', coverage:'Total + dental + óptica', desc:'La cobertura más completa: hospitalización, dental, óptica, medicamentos.', docs:['DNI / Pasaporte','Historial médico completo','Formulario de solicitud','Foto reciente','Certificado de trabajo','Declaración de salud'] },
    { id:'al3', name:'Seguro de Vehículo Premium', type:'auto', price:'18,000 XAF/mes', coverage:'Todo riesgo + asistencia 24h', desc:'Cobertura total con asistencia en carretera 24h y vehículo de sustitución.', docs:['DNI / Pasaporte','Permiso de conducir','Tarjeta de circulación','Ficha técnica','Fotos del vehículo (4 ángulos)','Foto de la matrícula','Historial de siniestros'] },
  ]},
  { id:'axa', name:'AXA GQ', color:'#00008F', color2:'#0000CC', initials:'AX', desc:'Grupo AXA en Guinea Ecuatorial. Seguros de vida, salud y patrimonio.', phone:'+240 333 09 64 00', web:'axa.gq', address:'Barrio Residencial, Malabo', products:[
    { id:'ax1', name:'Seguro de Vida', type:'vida', price:'9,000 XAF/mes', coverage:'Hasta 60,000,000 XAF', desc:'Protección de vida con cobertura de invalidez permanente.', docs:['DNI / Pasaporte','Certificado médico','Formulario de beneficiarios','Declaración de salud'] },
    { id:'ax2', name:'Seguro del Hogar', type:'hogar', price:'6,500 XAF/mes', coverage:'Robo, incendio, responsabilidad civil', desc:'Protección integral del hogar y responsabilidad civil del propietario.', docs:['DNI / Pasaporte','Escritura o contrato de alquiler','Inventario valorado del hogar','Fotos de la vivienda'] },
    { id:'ax3', name:'Seguro de Viaje', type:'viaje', price:'4,000 XAF/viaje', coverage:'Médico + equipaje + cancelación', desc:'Cobertura completa para viajes: médico, equipaje y cancelación de vuelo.', docs:['DNI / Pasaporte','Billete de avión','Itinerario del viaje','Formulario de solicitud'] },
  ]},
];
const INS_ICONS: Record<string, React.ReactElement> = {
  vida:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E05C7A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  salud:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  auto:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B7DD8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
  hogar:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C47D2A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  viaje:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  empresa: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0E7FA8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
};
const INS_COLORS: Record<string,string> = { vida:'#E05C7A', salud:'#2E9E6B', auto:'#3B7DD8', hogar:'#C47D2A', viaje:'#6B5BD6', empresa:'#0E7FA8' };
const INS_BG: Record<string,string>     = { vida:'#FDF2F5', salud:'#F0FAF5', auto:'#EFF5FD', hogar:'#FDF6EE', viaje:'#F3F1FD', empresa:'#EDF7FB' };
type InsCo = typeof INS_COS[0];
type InsProd = typeof INS_COS[0]['products'][0];
type SgScreen = 'home'|'company'|'product'|'apply'|'docs'|'success';

export const SegurosModal: React.FC<{ onClose:()=>void; userBalance:number; onDebit:(n:number)=>void }> = ({ onClose }) => {
  const [screen, setScreen] = React.useState<SgScreen>('home');
  const [co, setCo] = React.useState<InsCo|null>(null);
  const [prod, setProd] = React.useState<InsProd|null>(null);
  const [form, setForm] = React.useState({name:'',dni:'',phone:'',email:'',address:'',city:''});
  const [docs, setDocs] = React.useState<Record<string,string>>({});
  const [filter, setFilter] = React.useState('all');
  const grad = co ? `linear-gradient(135deg,${co.color},${co.color2})` : 'linear-gradient(135deg,#2E9E6B,#1B7A52)';
  const setF = (k:string,v:string) => setForm(p=>({...p,[k]:v}));
  const back = () => { if(screen==='home')onClose(); else if(screen==='company')setScreen('home'); else if(screen==='product')setScreen('company'); else if(screen==='docs')setScreen('product'); else if(screen==='apply')setScreen('docs'); else setScreen('home'); };
  const allProds = INS_COS.flatMap(c=>c.products.map(p=>({...p,co:c})));
  const filtered = filter==='all' ? allProds : allProds.filter(p=>p.type===filter);
  const formOk = form.name&&form.dni&&form.phone&&form.email;
  const reqDocs = prod?.docs||[];
  const doneCount = reqDocs.filter(d=>docs[d]).length;
  const allDone = doneCount===reqDocs.length&&reqDocs.length>0;
  const titles:Record<SgScreen,string> = {home:'Seguros',company:co?.name||'',product:prod?.name||'',apply:'Solicitar Seguro',docs:'Documentos',success:'Solicitud Enviada'};
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:grad,padding:'14px 16px 12px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
          <button onClick={back} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}><div style={{fontSize:'15px',fontWeight:'800',color:'#fff'}}>{titles[screen]}</div>{screen==='home'&&<div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{INS_COS.length} aseguradoras · Guinea Ecuatorial</div>}</div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:'16px'}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'12px 14px 24px'}}>
          {screen==='home'&&<div>
            <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'8px',marginBottom:'12px'}}>
              {[['all','Todos'],['vida','Vida'],['salud','Salud'],['auto','Vehículo'],['hogar','Hogar'],['viaje','Viaje'],['empresa','Empresa']].map(([t,l])=>(
                <button key={t} onClick={()=>setFilter(t)} style={{flexShrink:0,background:filter===t?'#EEF2F7':'#fff',border:`1.5px solid ${filter===t?'#07C160':'#E5E7EB'}`,borderRadius:'20px',padding:'5px 12px',fontSize:'11px',fontWeight:'700',color:filter===t?'#1A2B4A':'#8A9BB5',cursor:'pointer'}}>{l}</button>
              ))}
            </div>
            {filtered.map((p,i)=>(
              <div key={i} onClick={()=>{setCo(p.co);setProd(p);setScreen('product');}} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'10px',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',transition:'transform 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`${INS_COLORS[p.type]}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>{INS_ICONS[p.type]}</div>
                  <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'800',color:'#1A2B4A'}}>{p.name}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{p.co.name}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:'13px',fontWeight:'800',color:'#07C160'}}>{p.price}</div><div style={{fontSize:'10px',color:'#8A9BB5'}}>{p.coverage}</div></div>
                </div>
                <div style={{fontSize:'12px',color:'#5A7090'}}>{p.desc}</div>
              </div>
            ))}
            <div style={{fontSize:'12px',fontWeight:'700',color:'#8A9BB5',textTransform:'uppercase',letterSpacing:'1px',margin:'16px 0 10px'}}>Aseguradoras</div>
            {INS_COS.map(c=>(
              <div key={c.id} onClick={()=>{setCo(c);setScreen('company');}} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',transition:'transform 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateX(4px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';}}>
                <div style={{width:'46px',height:'46px',borderRadius:'12px',background:`linear-gradient(135deg,${c.color},${c.color2})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'900',flexShrink:0}}>{c.initials}</div>
                <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'800',color:'#1A2B4A'}}>{c.name}</div><div style={{fontSize:'11px',color:'#8A9BB5',marginTop:'2px'}}>{c.products.length} productos · {c.phone}</div></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>}
          {screen==='company'&&co&&<div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'18px',marginBottom:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'12px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'16px',background:grad,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'18px',fontWeight:'900',flexShrink:0}}>{co.initials}</div>
                <div><div style={{fontSize:'18px',fontWeight:'900',color:'#1A2B4A'}}>{co.name}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{co.products.length} productos</div></div>
              </div>
              <div style={{fontSize:'12px',color:'#5A7090',lineHeight:'1.5',marginBottom:'12px'}}>{co.desc}</div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                <span style={{background:`${co.color}12`,color:co.color,borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>📍 {co.address}</span>
                <span style={{background:'#F0F4F8',color:'#5A7090',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>📞 {co.phone}</span>
              </div>
            </div>
            {co.products.map(p=>(
              <div key={p.id} onClick={()=>{setProd(p);setScreen('product');}} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'8px',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',transition:'transform 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`${INS_COLORS[p.type]}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>{INS_ICONS[p.type]}</div>
                  <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'700',color:'#1A2B4A'}}>{p.name}</div></div>
                  <div style={{fontSize:'13px',fontWeight:'800',color:'#07C160'}}>{p.price}</div>
                </div>
                <div style={{fontSize:'12px',color:'#5A7090'}}>{p.desc}</div>
              </div>
            ))}
          </div>}
          {screen==='product'&&prod&&co&&<div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'18px',marginBottom:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
                <div style={{width:'52px',height:'52px',borderRadius:'14px',background:`${INS_COLORS[prod.type]}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',flexShrink:0}}>{INS_ICONS[prod.type]}</div>
                <div><div style={{fontSize:'17px',fontWeight:'900',color:'#1A2B4A'}}>{prod.name}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{co.name}</div></div>
              </div>
              <div style={{fontSize:'28px',fontWeight:'900',color:'#07C160',marginBottom:'6px'}}>{prod.price}</div>
              <div style={{fontSize:'12px',color:'#5A7090',lineHeight:'1.5',marginBottom:'12px'}}>{prod.desc}</div>
              <div style={{background:`${INS_COLORS[prod.type]}10`,borderRadius:'10px',padding:'10px 14px',marginBottom:'14px'}}>
                <div style={{fontSize:'11px',color:'#8A9BB5',marginBottom:'2px'}}>Cobertura</div>
                <div style={{fontSize:'13px',fontWeight:'700',color:INS_COLORS[prod.type]}}>{prod.coverage}</div>
              </div>
            </div>
            <button onClick={()=>setScreen('docs')} style={{width:'100%',background:'linear-gradient(135deg,#2E9E6B,#1B7A52)',border:'none',borderRadius:'14px',padding:'15px',color:'#fff',fontSize:'15px',fontWeight:'700',cursor:'pointer'}}>📋 Solicitar este seguro</button>
          </div>}
          {screen==='apply'&&prod&&<div>
            <div style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'38px',height:'38px',borderRadius:'10px',background:INS_BG[prod.type],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{INS_ICONS[prod.type]}</div>
              <div><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{prod.name}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{co?.name} · {prod.price}</div></div>
            </div>
            {([['name','Nombre completo','text'],['dni','DNI / Pasaporte','text'],['phone','Teléfono','tel'],['email','Correo electrónico','email'],['address','Dirección','text'],['city','Ciudad / Barrio','text']] as [string,string,string][]).map(([k,l,t])=>(
              <div key={k} style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}>
                <input type={t} placeholder={l} value={(form as any)[k]} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/>
              </div>
            ))}
            <button onClick={()=>{if(formOk)setScreen('success');}} style={{width:'100%',background:formOk?'linear-gradient(135deg,#2E9E6B,#1B7A52)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:formOk?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:formOk?'pointer':'default',marginTop:'8px'}}>✅ Enviar solicitud</button>
          </div>}
          {screen==='docs'&&prod&&<div>
            <div style={{background:'#EFF6FF',borderRadius:'12px',padding:'12px 14px',marginBottom:'14px'}}>
              <div style={{fontSize:'13px',fontWeight:'700',color:'#1D4ED8',marginBottom:'4px'}}>📎 Documentos requeridos</div>
              <div style={{fontSize:'11px',color:'#3B82F6'}}>{doneCount}/{reqDocs.length} documentos subidos</div>
              <div style={{background:'#DBEAFE',borderRadius:'4px',height:'4px',marginTop:'8px'}}><div style={{background:'#3B82F6',borderRadius:'4px',height:'4px',width:`${reqDocs.length>0?(doneCount/reqDocs.length)*100:0}%`,transition:'width 0.3s'}}/></div>
            </div>
            {reqDocs.map((doc:string,i:number)=>(
              <div key={i} style={{background:'#fff',borderRadius:'12px',padding:'14px',marginBottom:'8px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom: docs[doc] ? '0' : '10px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'10px',background:docs[doc]?'#F0FAF5':'#F8FAFC',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {docs[doc]
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A9BB5" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    }
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:'600',color:'#1A2B4A'}}>{doc}</div>
                    <div style={{fontSize:'11px',color:docs[doc]?'#2E9E6B':'#8A9BB5',marginTop:'2px'}}>{docs[doc]?`✓ ${docs[doc]}`:'Pendiente de subir'}</div>
                  </div>
                </div>
                {!docs[doc] && (
                  <div style={{display:'flex',gap:'8px'}}>
                    {/* Subir archivo */}
                    <label style={{flex:1,background:'#EFF5FD',border:'1.5px solid #3B7DD8',borderRadius:'10px',padding:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'700',color:'#3B7DD8'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Subir archivo
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        style={{display:'none'}}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDocs(p => ({...p, [doc]: file.name}));
                        }}
                      />
                    </label>
                    {/* Tomar foto */}
                    <label style={{flex:1,background:'#F0FAF5',border:'1.5px solid #2E9E6B',borderRadius:'10px',padding:'10px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'700',color:'#2E9E6B'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Tomar foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{display:'none'}}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDocs(p => ({...p, [doc]: file.name}));
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
            <button onClick={()=>{if(allDone)setScreen('apply');}} style={{width:'100%',background:allDone?'linear-gradient(135deg,#2E9E6B,#1B7A52)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:allDone?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:allDone?'pointer':'default',marginTop:'8px'}}>{allDone?'Continuar → Datos personales':'Sube todos los documentos para continuar'}</button>
          </div>}
          {screen==='success'&&<div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'#F0FAF5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'40px'}}>✅</div>
            <div style={{fontSize:'20px',fontWeight:'900',color:'#1A2B4A',marginBottom:'8px'}}>¡Solicitud enviada!</div>
            <div style={{fontSize:'13px',color:'#8A9BB5',marginBottom:'6px'}}>{prod?.name} · {co?.name}</div>
            <div style={{background:'#F0FAF5',borderRadius:'14px',padding:'16px',marginBottom:'20px',textAlign:'left'}}>
              <div style={{fontSize:'12px',fontWeight:'700',color:'#16A34A',marginBottom:'8px'}}>¿Qué pasa ahora?</div>
              {['La aseguradora revisará tu solicitud en 2-5 días hábiles','Recibirás una llamada de confirmación','Si es aprobada, recibirás tu póliza por email','El primer pago se realizará al activar la póliza'].map((s,i)=>(
                <div key={i} style={{display:'flex',gap:'8px',marginBottom:'6px'}}><span style={{color:'#16A34A',fontWeight:'700',flexShrink:0}}>{i+1}.</span><span style={{fontSize:'12px',color:'#5A7090'}}>{s}</span></div>
              ))}
            </div>
            <button onClick={onClose} style={{background:'linear-gradient(135deg,#2E9E6B,#1B7A52)',border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Cerrar</button>
          </div>}
        </div>
      </div>
    </div>
  );
};

// ─── MÓDULO FACTURAS ──────────────────────────────────────────────────────────
type Bill = { id:string; service:string; provider:string; amount:number; dueDate:string; status:'pendiente'|'vencida'|'pagada'; ref:string; icon:string; color:string; };
type FScreen = 'home'|'add'|'detail'|'pay'|'success';

const BILL_CATEGORIES = [
  { id:'elec',    label:'Electricidad', provider:'SEGESA',    icon:'⚡', color:'#C47D2A' },
  { id:'agua',    label:'Agua',         provider:'SNGE',      icon:'💧', color:'#1485EE' },
  { id:'gas',     label:'Gas',          provider:'GEPetrol',  icon:'🔥', color:'#EF4444' },
  { id:'internet',label:'Internet',     provider:'GETESA',    icon:'📶', color:'#6B5BD6' },
  { id:'telefono',label:'Teléfono',     provider:'GETESA',    icon:'📞', color:'#2E9E6B' },
  { id:'alquiler',label:'Alquiler',     provider:'Propietario',icon:'🏠', color:'#0E7FA8' },
  { id:'seguro',  label:'Seguro',       provider:'Aseguradora',icon:'🛡️', color:'#7C3AED' },
  { id:'otro',    label:'Otro',         provider:'',          icon:'📄', color:'#5A7090' },
];

export const FacturasModal: React.FC<{ onClose:()=>void; userBalance:number; onDebit:(n:number)=>void }> = ({ onClose, userBalance, onDebit }) => {
  const [screen, setScreen] = React.useState<FScreen>('home');
  const [bills, setBills] = React.useState<Bill[]>([
    { id:'b1', service:'Electricidad', provider:'SEGESA',  amount:18500, dueDate:'30/04/2026', status:'pendiente', ref:'0012345678', icon:'⚡', color:'#C47D2A' },
    { id:'b2', service:'Agua',         provider:'SNGE',    amount:8200,  dueDate:'15/04/2026', status:'vencida',   ref:'SNGE-00456', icon:'💧', color:'#1485EE' },
    { id:'b3', service:'Internet',     provider:'GETESA',  amount:25000, dueDate:'05/05/2026', status:'pendiente', ref:'GET-789012', icon:'📶', color:'#6B5BD6' },
    { id:'b4', service:'Electricidad', provider:'SEGESA',  amount:16800, dueDate:'28/03/2026', status:'pagada',    ref:'0012345678', icon:'⚡', color:'#C47D2A' },
  ]);
  const [selected, setSelected] = React.useState<Bill|null>(null);
  const [form, setForm] = React.useState({ service:'', provider:'', amount:'', dueDate:'', ref:'', catId:'' });
  const [payMethod, setPayMethod] = React.useState('');
  const [filter, setFilter] = React.useState<'todas'|'pendiente'|'vencida'|'pagada'>('todas');
  const setF = (k:string,v:string) => setForm(p=>({...p,[k]:v}));

  const pending = bills.filter(b=>b.status!=='pagada');
  const totalPending = pending.reduce((s,b)=>s+b.amount,0);
  const overdue = bills.filter(b=>b.status==='vencida');
  const filtered = filter==='todas' ? bills : bills.filter(b=>b.status===filter);

  const payBill = () => {
    if(!selected||!payMethod) return;
    onDebit(selected.amount);
    setBills(p=>p.map(b=>b.id===selected.id?{...b,status:'pagada' as const}:b));
    setScreen('success');
  };

  const addBill = () => {
    const cat = BILL_CATEGORIES.find(c=>c.id===form.catId);
    if(!form.service||!form.amount||!form.dueDate) return;
    setBills(p=>[...p,{
      id:`b${Date.now()}`, service:form.service, provider:form.provider||cat?.provider||'',
      amount:parseInt(form.amount), dueDate:form.dueDate, status:'pendiente',
      ref:form.ref||'—', icon:cat?.icon||'📄', color:cat?.color||'#5A7090'
    }]);
    setForm({service:'',provider:'',amount:'',dueDate:'',ref:'',catId:''});
    setScreen('home');
  };

  const statusStyle = (s:string) => ({
    pendiente: {bg:'#FEF3C7',color:'#92400E',label:'Pendiente'},
    vencida:   {bg:'#FEF2F2',color:'#DC2626',label:'Vencida'},
    pagada:    {bg:'#F0FAF5',color:'#16A34A',label:'Pagada'},
  }[s]||{bg:'#F3F4F6',color:'#6B7280',label:s});

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'4px',flexShrink:0}}>
          <div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#D1D5DB'}}/>
        </div>

        {/* Header */}
        <div style={{padding:'4px 16px 12px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0,background:'#F7F8FA'}}>
          <button onClick={()=>{if(screen==='home')onClose();else setScreen('home');}} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:'17px',fontWeight:'700',color:'#111827'}}>{screen==='home'?'Mis Facturas':screen==='add'?'Nueva Factura':screen==='detail'?selected?.service||'Factura':screen==='pay'?'Pagar Factura':'Pago completado'}</div>
            {screen==='home'&&<div style={{fontSize:'12px',color:'#9CA3AF'}}>{pending.length} pendientes · {overdue.length} vencidas</div>}
          </div>
          {screen==='home'&&<button onClick={()=>setScreen('add')} style={{background:'#C47D2A',border:'none',borderRadius:'10px',padding:'7px 14px',color:'#fff',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>+ Añadir</button>}
          <button onClick={onClose} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'30px',height:'30px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'14px'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'0 16px 24px'}}>

          {/* HOME */}
          {screen==='home'&&<div>
            {/* Resumen */}
            <div style={{background:'linear-gradient(135deg,#C47D2A,#D97706)',borderRadius:'16px',padding:'16px',marginBottom:'12px',color:'#fff'}}>
              <div style={{fontSize:'11px',opacity:0.8,marginBottom:'4px'}}>Total pendiente de pago</div>
              <div style={{fontSize:'28px',fontWeight:'900',letterSpacing:'-0.5px',marginBottom:'10px'}}>{totalPending.toLocaleString()} <span style={{fontSize:'14px',opacity:0.8}}>XAF</span></div>
              <div style={{display:'flex',gap:'0',background:'rgba(255,255,255,0.15)',borderRadius:'10px',overflow:'hidden'}}>
                {[{v:bills.filter(b=>b.status==='pendiente').length,l:'Pendientes',c:'#FEF3C7'},{v:overdue.length,l:'Vencidas',c:'#FEF2F2'},{v:bills.filter(b=>b.status==='pagada').length,l:'Pagadas',c:'#F0FAF5'}].map((s,i)=>(
                  <div key={i} style={{flex:1,padding:'8px 0',textAlign:'center',borderRight:i<2?'1px solid rgba(255,255,255,0.2)':'none'}}>
                    <div style={{fontSize:'16px',fontWeight:'800'}}>{s.v}</div>
                    <div style={{fontSize:'9px',opacity:0.8}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtros */}
            <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
              {(['todas','pendiente','vencida','pagada'] as const).map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{flex:1,background:filter===f?'#C47D2A':'#fff',border:`1px solid ${filter===f?'#C47D2A':'#E5E7EB'}`,borderRadius:'8px',padding:'6px 4px',fontSize:'10px',fontWeight:'700',color:filter===f?'#fff':'#6B7280',cursor:'pointer',textTransform:'capitalize'}}>{f}</button>
              ))}
            </div>

            {/* Lista de facturas */}
            {filtered.length===0?(
              <div style={{textAlign:'center',padding:'40px 0',color:'#9CA3AF'}}>
                <div style={{fontSize:'40px',marginBottom:'8px'}}>📋</div>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#374151'}}>Sin facturas</div>
                <button onClick={()=>setScreen('add')} style={{marginTop:'12px',background:'#C47D2A',border:'none',borderRadius:'10px',padding:'10px 20px',color:'#fff',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>+ Añadir factura</button>
              </div>
            ):filtered.map(b=>(
              <div key={b.id} onClick={()=>{setSelected(b);setScreen('detail');}} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'8px',cursor:'pointer',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #F0F2F5',display:'flex',alignItems:'center',gap:'12px',transition:'transform 0.12s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateX(3px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${b.color}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>{b.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'3px'}}>
                    <div style={{fontSize:'14px',fontWeight:'700',color:'#111827'}}>{b.service}</div>
                    <div style={{fontSize:'14px',fontWeight:'800',color:b.status==='pagada'?'#16A34A':b.status==='vencida'?'#DC2626':'#111827'}}>{b.amount.toLocaleString()} XAF</div>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:'11px',color:'#9CA3AF'}}>{b.provider} · Vence {b.dueDate}</div>
                    <span style={{background:statusStyle(b.status).bg,color:statusStyle(b.status).color,borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:'700'}}>{statusStyle(b.status).label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>}

          {/* ADD */}
          {screen==='add'&&<div>
            <div style={{fontSize:'12px',fontWeight:'600',color:'#9CA3AF',marginBottom:'8px'}}>Categoría</div>
            <div style={{background:'#fff',borderRadius:'14px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',marginBottom:'12px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'#F0F2F5'}}>
                {BILL_CATEGORIES.map(c=>(
                  <div key={c.id} onClick={()=>{setF('catId',c.id);setF('service',c.label);setF('provider',c.provider);}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',padding:'12px 6px',background:form.catId===c.id?`${c.color}10`:'#fff',cursor:'pointer',transition:'background 0.12s',borderBottom:form.catId===c.id?`2px solid ${c.color}`:'2px solid transparent'}}>
                    <span style={{fontSize:'20px'}}>{c.icon}</span>
                    <span style={{fontSize:'9px',fontWeight:'600',color:form.catId===c.id?c.color:'#374151',textAlign:'center'}}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {[
              {k:'service',l:'Nombre del servicio',t:'text'},
              {k:'provider',l:'Proveedor / Empresa',t:'text'},
              {k:'ref',l:'Número de referencia / contrato',t:'text'},
              {k:'amount',l:'Importe (XAF)',t:'number'},
              {k:'dueDate',l:'Fecha de vencimiento (DD/MM/AAAA)',t:'text'},
            ].map(f=>(
              <div key={f.k} style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center',border:'1px solid #F0F2F5'}}>
                <input type={f.t} placeholder={f.l} value={(form as any)[f.k]} onChange={e=>setF(f.k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
              </div>
            ))}
            <button onClick={addBill} style={{width:'100%',background:form.service&&form.amount&&form.dueDate?'linear-gradient(135deg,#C47D2A,#D97706)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.service&&form.amount&&form.dueDate?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.service&&form.amount&&form.dueDate?'pointer':'default',marginTop:'4px'}}>
              Guardar factura
            </button>
          </div>}

          {/* DETAIL */}
          {screen==='detail'&&selected&&<div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'18px',marginBottom:'12px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'16px'}}>
                <div style={{width:'56px',height:'56px',borderRadius:'14px',background:`${selected.color}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px'}}>{selected.icon}</div>
                <div>
                  <div style={{fontSize:'18px',fontWeight:'800',color:'#111827'}}>{selected.service}</div>
                  <div style={{fontSize:'12px',color:'#9CA3AF'}}>{selected.provider}</div>
                </div>
              </div>
              {[['Referencia',selected.ref],['Vencimiento',selected.dueDate],['Estado',statusStyle(selected.status).label],['Importe',`${selected.amount.toLocaleString()} XAF`]].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F3F4F6'}}>
                  <span style={{fontSize:'13px',color:'#9CA3AF'}}>{l}</span>
                  <span style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',paddingTop:'12px'}}>
                <span style={{fontSize:'15px',fontWeight:'700',color:'#374151'}}>Total</span>
                <span style={{fontSize:'22px',fontWeight:'900',color:selected.color}}>{selected.amount.toLocaleString()} XAF</span>
              </div>
            </div>
            {selected.status!=='pagada'&&(
              <button onClick={()=>setScreen('pay')} style={{width:'100%',background:`linear-gradient(135deg,${selected.color},${selected.color}bb)`,border:'none',borderRadius:'12px',padding:'14px',color:'#fff',fontSize:'15px',fontWeight:'700',cursor:'pointer'}}>
                💳 Pagar ahora
              </button>
            )}
            {selected.status==='pagada'&&(
              <div style={{background:'#F0FAF5',borderRadius:'12px',padding:'14px',textAlign:'center',color:'#16A34A',fontWeight:'700',fontSize:'14px'}}>✅ Esta factura ya está pagada</div>
            )}
          </div>}

          {/* PAY */}
          {screen==='pay'&&selected&&<div>
            <div style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{fontSize:'22px'}}>{selected.icon}</div>
              <div><div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{selected.service}</div><div style={{fontSize:'11px',color:'#9CA3AF'}}>{selected.provider} · {selected.amount.toLocaleString()} XAF</div></div>
            </div>
            <div style={{fontSize:'12px',fontWeight:'600',color:'#9CA3AF',marginBottom:'8px'}}>Método de pago</div>
            {[{id:'wallet',icon:'💳',label:'EGCHAT Wallet',sub:`Saldo: ${userBalance.toLocaleString()} XAF`},{id:'bank',icon:'🏦',label:'Transferencia bancaria',sub:'BANGE, CCEI, BGFIBank...'},{id:'cash',icon:'💵',label:'Efectivo en ventanilla',sub:'Oficinas del proveedor'}].map(m=>(
              <div key={m.id} onClick={()=>setPayMethod(m.id)} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${payMethod===m.id?selected.color:'#E5E7EB'}`,boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                <div style={{fontSize:'22px'}}>{m.icon}</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{m.label}</div><div style={{fontSize:'11px',color:'#9CA3AF'}}>{m.sub}</div></div>
                {payMethod===m.id&&<div style={{width:'18px',height:'18px',borderRadius:'50%',background:selected.color,display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>}
              </div>
            ))}
            <button onClick={payBill} style={{width:'100%',background:payMethod?`linear-gradient(135deg,${selected.color},${selected.color}bb)`:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:payMethod?'#fff':'#9CA3AF',fontSize:'15px',fontWeight:'700',cursor:payMethod?'pointer':'default',marginTop:'8px'}}>
              Confirmar pago · {selected.amount.toLocaleString()} XAF
            </button>
          </div>}

          {/* SUCCESS */}
          {screen==='success'&&selected&&<div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'#F0FAF5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'40px'}}>✅</div>
            <div style={{fontSize:'20px',fontWeight:'900',color:'#111827',marginBottom:'6px'}}>¡Pago realizado!</div>
            <div style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'6px'}}>{selected.service} · {selected.provider}</div>
            <div style={{fontSize:'22px',fontWeight:'900',color:'#16A34A',marginBottom:'24px'}}>{selected.amount.toLocaleString()} XAF</div>
            <div style={{background:'#F0FAF5',borderRadius:'14px',padding:'14px',marginBottom:'20px',textAlign:'left'}}>
              {[['Referencia',selected.ref],['Fecha',new Date().toLocaleDateString('es')],['Método',payMethod==='wallet'?'EGCHAT Wallet':payMethod==='bank'?'Transferencia bancaria':'Efectivo']].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #D1FAE5'}}>
                  <span style={{fontSize:'12px',color:'#6B7280'}}>{l}</span>
                  <span style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setScreen('home')} style={{background:'linear-gradient(135deg,#C47D2A,#D97706)',border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Ver mis facturas</button>
          </div>}

        </div>
      </div>
    </div>
  );
};

// ─── CENTRO DE ACTIVIDAD ──────────────────────────────────────────────────────
type ActivityItem = {
  id: string; type: string; category: string; title: string;
  subtitle: string; amount?: number; amountType?: 'in'|'out';
  date: string; time: string; status: string; icon: string; color: string;
};

const ACTIVITY_CATEGORIES = [
  { id:'all',      label:'Todo',        color:'#5A7090' },
  { id:'pagos',    label:'Pagos',       color:'#C47D2A' },
  { id:'transferencias', label:'Transferencias', color:'#1485EE' },
  { id:'recargas', label:'Recargas',    color:'#2E9E6B' },
  { id:'seguros',  label:'Seguros',     color:'#6B5BD6' },
  { id:'internet', label:'Internet',    color:'#0E7FA8' },
  { id:'canales',  label:'Canales',     color:'#8B5CF6' },
];

export const ActividadModal: React.FC<{
  onClose: ()=>void;
  userBalance: number;
  transactionHistory?: Array<{id:string;type:string;amount:number;description:string;date:string;status:string}>;
}> = ({ onClose, userBalance, transactionHistory=[] }) => {
  const [catFilter, setCatFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<ActivityItem|null>(null);

  // Construir actividades combinando historial real + actividades del sistema
  const systemActivities: ActivityItem[] = [
    { id:'a1', type:'pago', category:'pagos', title:'Pago Electricidad SEGESA', subtitle:'Ref: 0012345678', amount:18500, amountType:'out', date:'01/04/2026', time:'09:14', status:'completado', icon:'⚡', color:'#C47D2A' },
    { id:'a2', type:'recarga', category:'recargas', title:'Recarga GETESA', subtitle:'Número: +240 222 123456', amount:5000, amountType:'out', date:'31/03/2026', time:'18:32', status:'completado', icon:'📶', color:'#2E9E6B' },
    { id:'a3', type:'seguro', category:'seguros', title:'Solicitud Seguro de Vida', subtitle:'GEPetrol Seguros · Pendiente revisión', date:'30/03/2026', time:'11:05', status:'pendiente', icon:'🛡️', color:'#6B5BD6' },
    { id:'a4', type:'internet', category:'internet', title:'Plan Internet 10GB', subtitle:'GETESA · 30 días', amount:25000, amountType:'out', date:'29/03/2026', time:'14:20', status:'activo', icon:'📡', color:'#0E7FA8' },
    { id:'a5', type:'canal', category:'canales', title:'Suscripción Canal Sol', subtitle:'Sol Básico · 1 mes', amount:3000, amountType:'out', date:'28/03/2026', time:'10:00', status:'activo', icon:'📺', color:'#0A2463' },
    { id:'a6', type:'pago', category:'pagos', title:'Pago Agua SNGE', subtitle:'Ref: SNGE-00456', amount:8200, amountType:'out', date:'27/03/2026', time:'08:45', status:'completado', icon:'💧', color:'#1485EE' },
    { id:'a7', type:'transferencia', category:'transferencias', title:'Transferencia a María García', subtitle:'BANGE · Concepto: Alquiler', amount:150000, amountType:'out', date:'25/03/2026', time:'16:30', status:'completado', icon:'↗', color:'#1485EE' },
    { id:'a8', type:'transferencia', category:'transferencias', title:'Transferencia recibida', subtitle:'De: Juan Pérez · CCEI Bank', amount:50000, amountType:'in', date:'24/03/2026', time:'12:15', status:'completado', icon:'↙', color:'#2E9E6B' },
    ...transactionHistory.slice(0,5).map((t,i)=>({
      id:`th${i}`, type:t.type, category:t.type==='received'?'transferencias':'pagos',
      title:t.description, subtitle:`Ref: ${t.id}`,
      amount:t.amount, amountType:(t.type==='received'?'in':'out') as 'in'|'out',
      date:t.date, time:'—', status:t.status, icon:t.type==='received'?'↙':'↗', color:t.type==='received'?'#2E9E6B':'#1485EE'
    })),
  ];

  const filtered = systemActivities.filter(a => {
    const matchCat = catFilter==='all' || a.category===catFilter;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalOut = systemActivities.filter(a=>a.amountType==='out'&&a.amount).reduce((s,a)=>s+(a.amount||0),0);
  const totalIn  = systemActivities.filter(a=>a.amountType==='in'&&a.amount).reduce((s,a)=>s+(a.amount||0),0);

  const statusStyle = (s:string) => ({
    completado:{bg:'#F0FAF5',color:'#16A34A'},
    activo:    {bg:'#EFF5FD',color:'#1485EE'},
    pendiente: {bg:'#FEF3C7',color:'#92400E'},
    fallido:   {bg:'#FEF2F2',color:'#DC2626'},
  }[s]||{bg:'#F3F4F6',color:'#6B7280'});

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'4px',flexShrink:0}}>
          <div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#D1D5DB'}}/>
        </div>

        {/* Header */}
        <div style={{padding:'4px 16px 10px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
          <button onClick={onClose} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}><div style={{fontSize:'17px',fontWeight:'700',color:'#111827'}}>Centro de Actividad</div><div style={{fontSize:'12px',color:'#9CA3AF'}}>{systemActivities.length} actividades registradas</div></div>
          <button onClick={onClose} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'30px',height:'30px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'14px'}}>✕</button>
        </div>

        {/* Resumen */}
        <div style={{padding:'0 16px 10px',flexShrink:0}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
            <div style={{background:'#fff',borderRadius:'12px',padding:'12px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'4px'}}>Gastos</div>
              <div style={{fontSize:'14px',fontWeight:'800',color:'#DC2626'}}>-{totalOut.toLocaleString()}</div>
              <div style={{fontSize:'9px',color:'#9CA3AF'}}>XAF</div>
            </div>
            <div style={{background:'#fff',borderRadius:'12px',padding:'12px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'4px'}}>Ingresos</div>
              <div style={{fontSize:'14px',fontWeight:'800',color:'#16A34A'}}>+{totalIn.toLocaleString()}</div>
              <div style={{fontSize:'9px',color:'#9CA3AF'}}>XAF</div>
            </div>
            <div style={{background:'#fff',borderRadius:'12px',padding:'12px',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'4px'}}>Saldo</div>
              <div style={{fontSize:'14px',fontWeight:'800',color:'#1485EE'}}>{userBalance.toLocaleString()}</div>
              <div style={{fontSize:'9px',color:'#9CA3AF'}}>XAF</div>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div style={{padding:'0 16px 8px',flexShrink:0}}>
          <div style={{background:'#fff',borderRadius:'10px',padding:'0 12px',height:'40px',display:'flex',alignItems:'center',gap:'8px',border:'1px solid #F0F2F5'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar actividad..." style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
            {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:'14px'}}>✕</button>}
          </div>
        </div>

        {/* Filtros por categoría */}
        <div style={{padding:'0 16px 8px',flexShrink:0}}>
          <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
            {ACTIVITY_CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>setCatFilter(c.id)} style={{flexShrink:0,background:catFilter===c.id?c.color:'#fff',border:`1px solid ${catFilter===c.id?c.color:'#E5E7EB'}`,borderRadius:'20px',padding:'5px 12px',fontSize:'11px',fontWeight:'700',color:catFilter===c.id?'#fff':'#6B7280',cursor:'pointer'}}>{c.label}</button>
            ))}
          </div>
        </div>

        {/* Lista de actividades */}
        <div style={{flex:1,overflowY:'auto',padding:'0 16px 24px'}}>
          {filtered.length===0?(
            <div style={{textAlign:'center',padding:'40px 0',color:'#9CA3AF'}}>
              <div style={{fontSize:'40px',marginBottom:'8px'}}>🔍</div>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#374151'}}>Sin resultados</div>
            </div>
          ):filtered.map((a,i)=>(
            <div key={a.id}>
              {/* Separador de fecha */}
              {(i===0||filtered[i-1].date!==a.date)&&(
                <div style={{fontSize:'11px',fontWeight:'600',color:'#9CA3AF',padding:'10px 0 6px'}}>{a.date}</div>
              )}
              <div onClick={()=>setSelected(selected?.id===a.id?null:a)} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'6px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',border:'1px solid #F0F2F5',transition:'transform 0.1s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateX(3px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${a.color}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>{a.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2px'}}>
                    <div style={{fontSize:'13px',fontWeight:'700',color:'#111827',flex:1,marginRight:'8px'}}>{a.title}</div>
                    {a.amount&&<div style={{fontSize:'13px',fontWeight:'800',color:a.amountType==='in'?'#16A34A':'#DC2626',flexShrink:0}}>{a.amountType==='in'?'+':'-'}{a.amount.toLocaleString()} XAF</div>}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontSize:'11px',color:'#9CA3AF'}}>{a.subtitle} · {a.time}</div>
                    <span style={{background:statusStyle(a.status).bg,color:statusStyle(a.status).color,borderRadius:'6px',padding:'1px 7px',fontSize:'9px',fontWeight:'700'}}>{a.status}</span>
                  </div>
                </div>
              </div>
              {/* Detalle expandible */}
              {selected?.id===a.id&&(
                <div style={{background:'#EFF5FD',borderRadius:'0 0 12px 12px',padding:'12px 14px',marginBottom:'6px',marginTop:'-6px',border:'1px solid #BFDBFE',borderTop:'none'}}>
                  <div style={{fontSize:'11px',fontWeight:'700',color:'#1A3A6B',marginBottom:'8px'}}>Detalles de la actividad</div>
                  {[['Categoría',a.category],['Fecha',`${a.date} ${a.time}`],['Estado',a.status],['Referencia',a.subtitle]].map(([l,v])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #DBEAFE'}}>
                      <span style={{fontSize:'11px',color:'#6B7280'}}>{l}</span>
                      <span style={{fontSize:'11px',fontWeight:'600',color:'#111827',textTransform:'capitalize'}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MÓDULO SALUD ─────────────────────────────────────────────────────────────
const HOSPITALS = [
  { id:'h1',  name:'Hospital General de Malabo',      type:'hospital', city:'Malabo', address:'Av. de la Independencia, Malabo', phone:'+240 333 09 70 00', beds:400, doctors:350, emergency:true,  lat:3.7523, lng:8.7737, specialties:['Medicina Interna','Cirugía','Ortopedia','Urgencias'], services:['Consulta General','Urgencias 24h','Laboratorio','Radiología','Farmacia'], schedule:'24h', rating:4.2, color:'#C0392B' },
  { id:'h2',  name:'Hospital La Paz',                 type:'hospital', city:'Malabo', address:'Barrio Residencial, Malabo',      phone:'+240 333 09 71 00', beds:300, doctors:250, emergency:true,  lat:3.7550, lng:8.7760, specialties:['Cardiología','Neurología','Cirugía General'],          services:['Cardiología','Neurología','Cirugía','UCI','Laboratorio'],    schedule:'24h', rating:4.5, color:'#C0392B' },
  { id:'h3',  name:'Hospital de la Santa Cruz',       type:'hospital', city:'Malabo', address:'Centro Malabo',                   phone:'+240 333 09 72 00', beds:200, doctors:180, emergency:true,  lat:3.7510, lng:8.7720, specialties:['Cirugía General','Cardiología','Urología'],             services:['Cirugía','Cardiología','Urología','Laboratorio'],             schedule:'24h', rating:4.1, color:'#C0392B' },
  { id:'h4',  name:'Hospital de Nkuantoma',           type:'hospital', city:'Malabo', address:'Nkuantoma, Malabo',               phone:'+240 333 09 73 00', beds:250, doctors:220, emergency:false, lat:3.7480, lng:8.7700, specialties:['Neurología','Ortopedia','Gastroenterología'],          services:['Neurología','Ortopedia','Gastro','Rehabilitación'],           schedule:'L-V 8-20h', rating:4.0, color:'#C0392B' },
  { id:'h5',  name:'Clínica Médica Malabo',           type:'clinica',  city:'Malabo', address:'Av. Hassan II, Malabo',           phone:'+240 333 09 74 00', beds:150, doctors:120, emergency:false, lat:3.7530, lng:8.7750, specialties:['Medicina Interna','Cirugía','Cardiología'],            services:['Consultas','Cirugía Menor','Cardiología','Laboratorio'],      schedule:'L-S 7-22h', rating:4.3, color:'#E74C3C' },
  { id:'h6',  name:'Clínica Santa Teresa',            type:'clinica',  city:'Malabo', address:'Caracolas, Malabo',               phone:'+240 333 09 75 00', beds:250, doctors:220, emergency:false, lat:3.7598, lng:8.7779, specialties:['Medicina Interna','Cirugía','Ortopedia'],              services:['Consultas','Cirugía','Ortopedia','Fisioterapia'],             schedule:'L-S 8-20h', rating:4.4, color:'#E74C3C' },
  { id:'h7',  name:'Hospital General de Bata',        type:'hospital', city:'Bata',   address:'Centro Bata',                     phone:'+240 333 09 76 00', beds:350, doctors:300, emergency:true,  lat:1.8575, lng:9.7686, specialties:['Pediatría','Obstetricia','Medicina Interna'],          services:['Pediatría','Maternidad','Urgencias','Laboratorio'],           schedule:'24h', rating:4.2, color:'#C0392B' },
  { id:'h8',  name:'Hospital de la Mujer y el Niño',  type:'hospital', city:'Bata',   address:'Bata Centro',                     phone:'+240 333 09 77 00', beds:180, doctors:150, emergency:true,  lat:1.8600, lng:9.7700, specialties:['Obstetricia','Ginecología','Pediatría'],               services:['Maternidad','Ginecología','Pediatría','Neonatología'],        schedule:'24h', rating:4.6, color:'#C0392B' },
  { id:'h9',  name:'Hospital Obiang Nguema Mbasogo',  type:'hospital', city:'Malabo', address:'Sipopo, Malabo',                  phone:'+240 333 09 78 00', beds:250, doctors:220, emergency:true,  lat:3.7765, lng:8.7899, specialties:['Cardiología','Medicina Interna','Neurología'],         services:['Cardiología','UCI','Neurología','Laboratorio','Farmacia'],    schedule:'24h', rating:4.3, color:'#C0392B' },
  { id:'h10', name:'Hospital Provincial de Bioko Norte',type:'hospital',city:'Malabo', address:'Malabo Norte',                   phone:'+240 333 09 79 00', beds:350, doctors:300, emergency:true,  lat:3.7600, lng:8.7800, specialties:['Neurología','Cardiología','Pediatría'],               services:['Urgencias','Neurología','Cardiología','Pediatría'],           schedule:'24h', rating:4.1, color:'#C0392B' },
];

const PHARMACIES = [
  // ── MALABO · Centro ──
  { id:'f1',  name:'Farmacia Central',       barrio:'Centro',      city:'Malabo', address:'Av. de la Independencia', phone:'+240 222 10 00 01', lat:3.7520, lng:8.7735, schedule:'L-S 8:00-22:00 / D 9:00-14:00', emergency:true,  services:['Medicamentos','Inyectables','Análisis rápidos','Tensión arterial'] },
  { id:'f2',  name:'Farmacia San Carlos',    barrio:'Centro',      city:'Malabo', address:'Centro Comercial',        phone:'+240 222 10 00 02', lat:3.7505, lng:8.7715, schedule:'L-V 8:00-20:00 / S 9:00-18:00', emergency:false, services:['Medicamentos','Parafarmacia','Cosméticos','Vitaminas'] },
  { id:'f3',  name:'Farmacia La Salud',      barrio:'Centro',      city:'Malabo', address:'Calle del Rey Boncoro',   phone:'+240 222 10 00 07', lat:3.7512, lng:8.7742, schedule:'L-S 8:00-21:00',                 emergency:false, services:['Medicamentos','Parafarmacia','Ortopedia'] },
  // ── MALABO · Caracolas ──
  { id:'f4',  name:'Farmacia Bioko',         barrio:'Caracolas',   city:'Malabo', address:'Barrio Caracolas',        phone:'+240 222 10 00 03', lat:3.7598, lng:8.7779, schedule:'L-D 7:00-23:00',                 emergency:true,  services:['Medicamentos','Urgencias','Inyectables','Análisis'] },
  { id:'f5',  name:'Farmacia Caracolas',     barrio:'Caracolas',   city:'Malabo', address:'Av. Caracolas s/n',       phone:'+240 222 10 00 08', lat:3.7590, lng:8.7770, schedule:'L-S 8:00-20:00',                 emergency:false, services:['Medicamentos','Vitaminas','Cosméticos'] },
  // ── MALABO · Ela Nguema ──
  { id:'f6',  name:'Farmacia Ela Nguema',    barrio:'Ela Nguema',  city:'Malabo', address:'Barrio Ela Nguema',       phone:'+240 222 10 00 04', lat:3.7412, lng:8.7765, schedule:'L-S 8:00-21:00',                 emergency:false, services:['Medicamentos','Parafarmacia','Ortopedia'] },
  { id:'f7',  name:'Farmacia Nueva Vida',    barrio:'Ela Nguema',  city:'Malabo', address:'Calle Principal Ela Nguema', phone:'+240 222 10 00 09', lat:3.7400, lng:8.7758, schedule:'L-V 8:00-20:00',              emergency:false, services:['Medicamentos','Inyectables','Análisis'] },
  // ── MALABO · Puerto ──
  { id:'f8',  name:'Farmacia Puerto',        barrio:'Puerto',      city:'Malabo', address:'Puerto de Malabo',        phone:'+240 222 10 00 06', lat:3.7442, lng:8.7705, schedule:'L-V 8:00-20:00',                 emergency:false, services:['Medicamentos','Parafarmacia'] },
  { id:'f9',  name:'Farmacia Marina',        barrio:'Puerto',      city:'Malabo', address:'Av. del Puerto',          phone:'+240 222 10 00 10', lat:3.7450, lng:8.7698, schedule:'L-S 8:00-21:00',                 emergency:false, services:['Medicamentos','Vitaminas','Tensión arterial'] },
  // ── MALABO · Luba Road ──
  { id:'f10', name:'Farmacia Luba Road',     barrio:'Luba Road',   city:'Malabo', address:'Carretera Luba km 3',     phone:'+240 222 10 00 11', lat:3.7350, lng:8.7820, schedule:'L-S 8:00-20:00',                 emergency:false, services:['Medicamentos','Parafarmacia','Inyectables'] },
  // ── MALABO · Aeropuerto ──
  { id:'f11', name:'Farmacia Aeropuerto',    barrio:'Aeropuerto',  city:'Malabo', address:'Zona Aeropuerto',         phone:'+240 222 10 00 12', lat:3.7550, lng:8.7080, schedule:'L-D 6:00-22:00',                 emergency:true,  services:['Medicamentos','Urgencias','Análisis rápidos'] },
  // ── MALABO · Malabo II ──
  { id:'f12', name:'Farmacia Malabo II',     barrio:'Malabo II',   city:'Malabo', address:'Barrio Malabo II',        phone:'+240 222 10 00 13', lat:3.7480, lng:8.7900, schedule:'L-S 8:00-21:00',                 emergency:false, services:['Medicamentos','Cosméticos','Vitaminas'] },
  { id:'f13', name:'Farmacia Bienestar',     barrio:'Malabo II',   city:'Malabo', address:'Av. Malabo II',           phone:'+240 222 10 00 14', lat:3.7470, lng:8.7910, schedule:'L-V 8:00-20:00',                 emergency:false, services:['Medicamentos','Parafarmacia','Ortopedia'] },
  // ── BATA · Centro ──
  { id:'f14', name:'Farmacia Bata Centro',   barrio:'Centro',      city:'Bata',   address:'Centro de Bata',          phone:'+240 222 10 00 05', lat:1.8575, lng:9.7686, schedule:'L-D 7:00-22:00',                 emergency:true,  services:['Medicamentos','Urgencias','Inyectables'] },
  { id:'f15', name:'Farmacia Continental',   barrio:'Centro',      city:'Bata',   address:'Av. de la Libertad, Bata',phone:'+240 222 10 00 15', lat:1.8560, lng:9.7670, schedule:'L-S 8:00-21:00',                 emergency:false, services:['Medicamentos','Parafarmacia','Vitaminas'] },
  // ── BATA · Nkolombong ──
  { id:'f16', name:'Farmacia Nkolombong',    barrio:'Nkolombong',  city:'Bata',   address:'Barrio Nkolombong, Bata', phone:'+240 222 10 00 16', lat:1.8620, lng:9.7720, schedule:'L-S 8:00-20:00',                 emergency:false, services:['Medicamentos','Inyectables','Análisis'] },
  // ── BATA · Litoral ──
  { id:'f17', name:'Farmacia Litoral',       barrio:'Litoral',     city:'Bata',   address:'Paseo Marítimo, Bata',    phone:'+240 222 10 00 17', lat:1.8540, lng:9.7650, schedule:'L-D 7:00-23:00',                 emergency:true,  services:['Medicamentos','Urgencias','Cosméticos'] },
  // ── EBEBIYÍN ──
  { id:'f18', name:'Farmacia Ebebiyín',      barrio:'Centro',      city:'Ebebiyín',address:'Centro Ebebiyín',        phone:'+240 222 10 00 18', lat:2.1500, lng:11.3333, schedule:'L-S 8:00-20:00',                emergency:false, services:['Medicamentos','Parafarmacia'] },
  // ── MONGOMO ──
  { id:'f19', name:'Farmacia Mongomo',       barrio:'Centro',      city:'Mongomo', address:'Centro Mongomo',         phone:'+240 222 10 00 19', lat:1.6333, lng:13.6167, schedule:'L-S 8:00-20:00',                emergency:false, services:['Medicamentos','Inyectables'] },
];

type SaludTab = 'hospitales'|'farmacias'|'cita'|'urgencias';
type SaludItem = typeof HOSPITALS[0] | typeof PHARMACIES[0];

// Catálogo de medicamentos disponibles en GQ
const MEDICAMENTOS = [
  { id:'m1',  name:'Paracetamol 500mg',    cat:'Analgésico',      price:500,   stock:true,  desc:'Analgésico y antipirético. Caja 20 comprimidos.',    requiereReceta:false },
  { id:'m2',  name:'Ibuprofeno 400mg',      cat:'Antiinflamatorio',price:800,   stock:true,  desc:'Antiinflamatorio y analgésico. Caja 20 comprimidos.', requiereReceta:false },
  { id:'m3',  name:'Amoxicilina 500mg',     cat:'Antibiótico',     price:2500,  stock:true,  desc:'Antibiótico de amplio espectro. Caja 21 cápsulas.',   requiereReceta:true  },
  { id:'m4',  name:'Omeprazol 20mg',        cat:'Digestivo',       price:1200,  stock:true,  desc:'Protector gástrico. Caja 28 cápsulas.',              requiereReceta:false },
  { id:'m5',  name:'Metformina 850mg',      cat:'Antidiabético',   price:1800,  stock:true,  desc:'Control de glucemia en diabetes tipo 2.',            requiereReceta:true  },
  { id:'m6',  name:'Enalapril 10mg',        cat:'Antihipertensivo',price:1500,  stock:true,  desc:'Control de la presión arterial. Caja 30 comprimidos.',requiereReceta:true  },
  { id:'m7',  name:'Loratadina 10mg',       cat:'Antihistamínico', price:900,   stock:true,  desc:'Antialérgico. Caja 10 comprimidos.',                 requiereReceta:false },
  { id:'m8',  name:'Azitromicina 500mg',    cat:'Antibiótico',     price:3500,  stock:false, desc:'Antibiótico macrólido. Caja 3 comprimidos.',          requiereReceta:true  },
  { id:'m9',  name:'Vitamina C 1000mg',     cat:'Vitaminas',       price:1200,  stock:true,  desc:'Suplemento vitamínico. Caja 30 comprimidos.',         requiereReceta:false },
  { id:'m10', name:'Diclofenaco 50mg',      cat:'Antiinflamatorio',price:700,   stock:true,  desc:'Antiinflamatorio. Caja 20 comprimidos.',             requiereReceta:false },
  { id:'m11', name:'Ciprofloxacino 500mg',  cat:'Antibiótico',     price:2800,  stock:true,  desc:'Antibiótico quinolona. Caja 10 comprimidos.',         requiereReceta:true  },
  { id:'m12', name:'Salbutamol Inhalador',  cat:'Respiratorio',    price:4500,  stock:true,  desc:'Broncodilatador para asma. 200 dosis.',              requiereReceta:true  },
  { id:'m13', name:'Metronidazol 500mg',    cat:'Antiparasitario', price:1600,  stock:true,  desc:'Antiparasitario e antibacteriano. Caja 20 comp.',     requiereReceta:true  },
  { id:'m14', name:'Hidrocortisona Crema',  cat:'Dermatológico',   price:2200,  stock:true,  desc:'Crema antiinflamatoria tópica. Tubo 30g.',            requiereReceta:false },
  { id:'m15', name:'Suero Oral',            cat:'Rehidratación',   price:400,   stock:true,  desc:'Sales de rehidratación oral. Sobre 5g.',             requiereReceta:false },
];

export const SaludModal: React.FC<{ onClose:()=>void; userBalance:number; onDebit:(n:number)=>void; initTab?:SaludTab }> = ({ onClose, userBalance, onDebit, initTab='hospitales' }) => {
  const [tab, setTab] = React.useState<SaludTab>(initTab);
  const [selected, setSelected] = React.useState<any>(null);
  const [cityFilter, setCityFilter] = React.useState('Malabo');
  const [search, setSearch] = React.useState('');
  const [citaForm, setCitaForm] = React.useState({name:'',phone:'',date:'',specialty:'',hospital:'',notes:''});
  const [citaOk, setCitaOk] = React.useState(false);
  const [showMap, setShowMap] = React.useState(false);
  const [mapItem, setMapItem] = React.useState<any>(null);
  // Medicamentos
  const [medSearch, setMedSearch] = React.useState('');
  const [medCart, setMedCart] = React.useState<Array<{id:string;name:string;qty:number;price:number}>>([]);
  const [medScreen, setMedScreen] = React.useState<'search'|'cart'|'delivery'|'ok'>('search');
  const [deliveryForm, setDeliveryForm] = React.useState({name:'',phone:'',address:'',notes:''});
  const [showMedModal, setShowMedModal] = React.useState(false);

  // GPS — ordenar hospitales y farmacias por proximidad
  const { position: gpsPos } = useGPS({ watch: false, highAccuracy: false });

  const medResults = medSearch.length>=2 ? MEDICAMENTOS.filter(m=>m.name.toLowerCase().includes(medSearch.toLowerCase())||m.cat.toLowerCase().includes(medSearch.toLowerCase())) : [];
  const cartTotal = medCart.reduce((s,i)=>s+i.price*i.qty,0);
  const addToCart = (m:typeof MEDICAMENTOS[0]) => setMedCart(p=>{const ex=p.find(i=>i.id===m.id);return ex?p.map(i=>i.id===m.id?{...i,qty:i.qty+1}:i):[...p,{id:m.id,name:m.name,qty:1,price:m.price}];});
  const setDF = (k:string,v:string) => setDeliveryForm(p=>({...p,[k]:v}));

  const filteredHospitals = HOSPITALS.filter(h =>
    (cityFilter==='Todos'||h.city===cityFilter) &&
    (!search || h.name.toLowerCase().includes(search.toLowerCase()) || h.specialties.some(s=>s.toLowerCase().includes(search.toLowerCase())))
  );

  // Ordenar hospitales por distancia si hay GPS
  const sortedHospitals = gpsPos
    ? [...filteredHospitals].sort((a,b) => distanceKm(gpsPos.lat,gpsPos.lng,a.lat,a.lng) - distanceKm(gpsPos.lat,gpsPos.lng,b.lat,b.lng))
    : filteredHospitals;

  const [pharmCity, setPharmCity] = React.useState('Malabo');
  const [pharmBarrio, setPharmBarrio] = React.useState('Todos');
  const filteredPharmacies = PHARMACIES.filter(f =>
    (pharmCity==='Todos' || f.city===pharmCity) &&
    (pharmBarrio==='Todos' || f.barrio===pharmBarrio) &&
    (!search || f.name.toLowerCase().includes(search.toLowerCase()) || f.barrio.toLowerCase().includes(search.toLowerCase()))
  );
  const pharmCities = ['Malabo','Bata','Todos'];
  const pharmBarrios = ['Todos', ...Array.from(new Set(PHARMACIES.filter(f=>pharmCity==='Todos'||f.city===pharmCity).map(f=>f.barrio)))];
  const pharmByBarrio = pharmBarrios.filter(b=>b!=='Todos').reduce((acc,b)=>{
    const items = filteredPharmacies.filter(f=>f.barrio===b);
    if(items.length) acc[b]=items;
    return acc;
  },{} as Record<string,typeof PHARMACIES>);

  const openMap = (item: any) => { setMapItem(item); setShowMap(true); };

  const mapHtml = mapItem ? `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://cdn.maptiler.com/maptiler-sdk-js/latest/maptiler-sdk.css"/>
    <script src="https://cdn.maptiler.com/maptiler-sdk-js/latest/maptiler-sdk.umd.min.js"></script>
    <style>*{margin:0;padding:0}#map{width:100%;height:100vh}</style>
    </head><body><div id="map"></div><script>
    maptilersdk.config.apiKey = 'bg3FUa7es7Qn1TITIWjO';
    const map = new maptilersdk.Map({container:'map',style:maptilersdk.MapStyle.STREETS,center:[${mapItem.lng},${mapItem.lat}],zoom:15});
    map.on('load',function(){
      const el = document.createElement('div');
      el.style.cssText='background:#C0392B;border:3px solid #fff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,0.4)';
      el.textContent='${mapItem.type==='hospital'||!mapItem.type?'🏥':'💊'}';
      new maptilersdk.Marker({element:el}).setLngLat([${mapItem.lng},${mapItem.lat}])
        .setPopup(new maptilersdk.Popup({offset:25}).setHTML('<b>${mapItem.name}</b><br>${mapItem.address}'))
        .addTo(map).togglePopup();
      // Ruta desde GPS del usuario o Malabo centro
      navigator.geolocation.getCurrentPosition(function(pos){
        const from = pos.coords.longitude+','+pos.coords.latitude;
        fetch('https://router.project-osrm.org/route/v1/driving/'+from+';${mapItem.lng},${mapItem.lat}?overview=full&geometries=geojson')
          .then(r=>r.json()).then(d=>{
            if(d.routes&&d.routes[0]){
              map.addSource('route',{type:'geojson',data:{type:'Feature',properties:{},geometry:d.routes[0].geometry}});
              map.addLayer({id:'route',type:'line',source:'route',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#C0392B','line-width':4,'line-opacity':0.85}});
              const coords=d.routes[0].geometry.coordinates;
              const bounds=coords.reduce((b,c)=>b.extend(c),new maptilersdk.LngLatBounds(coords[0],coords[0]));
              map.fitBounds(bounds,{padding:60});
            }
          }).catch(()=>{});
      },function(){
        fetch('https://router.project-osrm.org/route/v1/driving/8.7737,3.7523;${mapItem.lng},${mapItem.lat}?overview=full&geometries=geojson')
          .then(r=>r.json()).then(d=>{if(d.routes&&d.routes[0]){map.addSource('route',{type:'geojson',data:{type:'Feature',properties:{},geometry:d.routes[0].geometry}});map.addLayer({id:'route',type:'line',source:'route',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#C0392B','line-width':4}});}}).catch(()=>{});
      });
    });
    </script></body></html>` : '';

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Map overlay */}
        {showMap&&mapItem&&(
          <div style={{position:'absolute',inset:0,zIndex:10,display:'flex',flexDirection:'column',borderRadius:'20px 20px 0 0',overflow:'hidden'}}>
            <div style={{background:'#C0392B',padding:'12px 16px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
              <button onClick={()=>setShowMap(false)} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:'32px',height:'32px',color:'#fff',cursor:'pointer',fontSize:'16px'}}>←</button>
              <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'700',color:'#fff'}}>{mapItem.name}</div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{mapItem.address}</div></div>
            </div>
            <iframe srcDoc={mapHtml} style={{flex:1,border:'none'}} sandbox="allow-scripts allow-same-origin" title="mapa"/>
          </div>
        )}

        <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'4px',flexShrink:0}}>
          <div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#D1D5DB'}}/>
        </div>

        {/* Header */}
        <div style={{padding:'4px 16px 10px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
          <button onClick={onClose} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}><div style={{fontSize:'17px',fontWeight:'700',color:'#111827'}}>Salud</div><div style={{fontSize:'12px',color:'#9CA3AF'}}>Guinea Ecuatorial · {HOSPITALS.length} centros · {PHARMACIES.length} farmacias</div></div>
          <button onClick={onClose} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'30px',height:'30px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'14px'}}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'0',padding:'0 16px 10px',flexShrink:0}}>
          {([['hospitales','🏥','Hospitales'],['farmacias','💊','Farmacias'],['cita','📅','Cita'],['urgencias','🚨','Urgencias']] as [SaludTab,string,string][]).map(([id,icon,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:tab===id?'#C0392B':'#fff',border:`1px solid ${tab===id?'#C0392B':'#E5E7EB'}`,borderRadius:'8px',padding:'8px 4px',fontSize:'10px',fontWeight:'700',color:tab===id?'#fff':'#6B7280',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',margin:'0 2px'}}>
              {icon==='hosp'&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
              {icon==='farm'&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2h3"/><path d="M19 3H9a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2z"/><line x1="14" y1="11" x2="14" y2="17"/><line x1="11" y1="14" x2="17" y2="14"/></svg>}
              {icon==='cita'&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              {icon==='urg'&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
              {label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        {(tab==='hospitales'||tab==='farmacias')&&(
          <div style={{padding:'0 16px 8px',flexShrink:0}}>
            <div style={{background:'#fff',borderRadius:'10px',padding:'0 12px',height:'40px',display:'flex',alignItems:'center',gap:'8px',border:'1px solid #F0F2F5'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tab==='hospitales'?'Buscar hospital o especialidad...':'Buscar farmacia...'} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
              {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:'14px'}}>✕</button>}
            </div>
          </div>
        )}

        {/* Filtro ciudad hospitales */}
        {tab==='hospitales'&&(
          <div style={{padding:'0 16px 8px',flexShrink:0,display:'flex',gap:'6px'}}>
            {['Malabo','Bata','Todos'].map(c=>(
              <button key={c} onClick={()=>setCityFilter(c)} style={{background:cityFilter===c?'#C0392B':'#fff',border:`1px solid ${cityFilter===c?'#C0392B':'#E5E7EB'}`,borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',color:cityFilter===c?'#fff':'#6B7280',cursor:'pointer'}}>{c}</button>
            ))}
          </div>
        )}

        <div style={{flex:1,overflowY:'auto',padding:'0 16px 24px'}}>

          {/* HOSPITALES */}
          {tab==='hospitales'&&<div>
            {sortedHospitals.map(h=>(
              <div key={h.id} style={{background:'#fff',borderRadius:'14px',marginBottom:'10px',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:'1px solid #F0F2F5'}}>
                <div style={{padding:'14px',display:'flex',alignItems:'flex-start',gap:'12px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#C0392B'}}><svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'3px'}}>
                      <div style={{fontSize:'13px',fontWeight:'700',color:'#111827',flex:1,marginRight:'8px'}}>{h.name}</div>
                      <div style={{display:'flex',alignItems:'center',gap:'2px',flexShrink:0}}>
                        <span style={{fontSize:'11px',color:'#F59E0B'}}>★</span>
                        <span style={{fontSize:'11px',fontWeight:'700',color:'#374151'}}>{h.rating}</span>
                      </div>
                    </div>
                    <div style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'6px'}}>📍 {h.address} · {h.city}</div>
                    <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'6px'}}>
                      {h.emergency&&<span style={{background:'#FEF2F2',color:'#C0392B',borderRadius:'6px',padding:'2px 7px',fontSize:'9px',fontWeight:'700',display:'flex',alignItems:'center',gap:'3px'}}><svg width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg>Urgencias 24h</span>}
                      <span style={{background:'#F3F4F6',color:'#6B7280',borderRadius:'6px',padding:'2px 7px',fontSize:'9px',fontWeight:'600'}}>{h.beds} camas</span>
                      <span style={{background:'#F3F4F6',color:'#6B7280',borderRadius:'6px',padding:'2px 7px',fontSize:'9px',fontWeight:'600'}}>{h.doctors} médicos</span>
                    </div>
                    <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                      {h.specialties.slice(0,3).map(s=><span key={s} style={{background:'#FEF2F2',color:'#C0392B',borderRadius:'6px',padding:'2px 7px',fontSize:'9px',fontWeight:'600'}}>{s}</span>)}
                    </div>
                  </div>
                </div>
                <div style={{borderTop:'1px solid #F0F2F5',padding:'8px 14px',display:'flex',gap:'6px'}}>
                  <button onClick={()=>openMap(h)} style={{flex:1,background:'#FEF2F2',border:'none',borderRadius:'8px',padding:'7px',fontSize:'10px',fontWeight:'700',color:'#C0392B',cursor:'pointer'}}>🗺️ Ver ruta</button>
                  <button onClick={()=>{setCitaForm(p=>({...p,hospital:h.name}));setTab('cita');}} style={{flex:1,background:'#F0FAF5',border:'none',borderRadius:'8px',padding:'7px',fontSize:'10px',fontWeight:'700',color:'#2E9E6B',cursor:'pointer'}}>📅 Pedir cita</button>
                  <a href={`tel:${h.phone}`} style={{flex:1,background:'#EFF5FD',border:'none',borderRadius:'8px',padding:'7px',fontSize:'10px',fontWeight:'700',color:'#1485EE',cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>📞 Llamar</a>
                </div>
              </div>
            ))}
          </div>}

          {/* FARMACIAS */}
          {tab==='farmacias'&&<div>
            {/* Botón buscar medicamentos */}
            <button onClick={()=>{setMedScreen('search');setShowMedModal(true);}} style={{width:'100%',background:'linear-gradient(135deg,#2E9E6B,#1B7A52)',border:'none',borderRadius:'14px',padding:'14px 16px',marginBottom:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',color:'#fff'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              <div style={{flex:1,textAlign:'left'}}>
                <div style={{fontSize:'14px',fontWeight:'700'}}>Buscar medicamentos</div>
                <div style={{fontSize:'11px',opacity:0.85}}>Busca, pide y recibe en casa · {MEDICAMENTOS.length} medicamentos</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            {/* Modal medicamentos */}
            {showMedModal&&(
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
                <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'88vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
                  {/* Header */}
                  <div style={{padding:'10px 16px 8px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0,background:'#fff',borderBottom:'1px solid #F0F2F5'}}>
                    <button onClick={()=>{if(medScreen==='search')setShowMedModal(false);else setMedScreen('search');}} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'30px',height:'30px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'14px'}}>←</button>
                    <div style={{flex:1,fontSize:'15px',fontWeight:'700',color:'#111827'}}>{medScreen==='search'?'Buscar medicamentos':medScreen==='cart'?`Carrito (${medCart.length})`:medScreen==='delivery'?'Datos de entrega':'Pedido confirmado'}</div>
                    {medScreen==='search'&&medCart.length>0&&<button onClick={()=>setMedScreen('cart')} style={{background:'#2E9E6B',border:'none',borderRadius:'10px',padding:'6px 12px',color:'#fff',fontSize:'11px',fontWeight:'700',cursor:'pointer'}}>🛒 {medCart.length}</button>}
                    <button onClick={()=>setShowMedModal(false)} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'12px'}}>✕</button>
                  </div>

                  <div style={{flex:1,overflowY:'auto',padding:'12px 16px 24px'}}>
                    {/* SEARCH */}
                    {medScreen==='search'&&<div>
                      <div style={{background:'#fff',borderRadius:'12px',padding:'0 14px',height:'48px',display:'flex',alignItems:'center',gap:'10px',border:'1.5px solid #E5E7EB',marginBottom:'12px'}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        <input value={medSearch} onChange={e=>setMedSearch(e.target.value)} placeholder="Nombre del medicamento o categoría..." style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#111827',fontFamily:'inherit'}} autoFocus/>
                        {medSearch&&<button onClick={()=>setMedSearch('')} style={{background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:'16px'}}>✕</button>}
                      </div>
                      {medSearch.length<2&&<div style={{textAlign:'center',padding:'30px 0',color:'#9CA3AF'}}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" style={{margin:'0 auto 10px',display:'block'}}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        <div style={{fontSize:'13px'}}>Escribe al menos 2 letras para buscar</div>
                        <div style={{fontSize:'11px',marginTop:'4px'}}>Ej: Paracetamol, Ibuprofeno, Amoxicilina...</div>
                      </div>}
                      {medSearch.length>=2&&medResults.length===0&&<div style={{textAlign:'center',padding:'30px 0',color:'#9CA3AF'}}>
                        <div style={{fontSize:'32px',marginBottom:'8px'}}>🔍</div>
                        <div style={{fontSize:'13px',fontWeight:'600',color:'#374151'}}>No encontrado</div>
                        <div style={{fontSize:'11px',marginTop:'4px'}}>Consulta con el farmacéutico</div>
                      </div>}
                      {medResults.map(m=>(
                        <div key={m.id} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #F0F2F5'}}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'8px'}}>
                            <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'#F0FAF5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="1.8" strokeLinecap="round"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2h3"/><path d="M19 3H9a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2z"/><line x1="14" y1="11" x2="14" y2="17"/><line x1="11" y1="14" x2="17" y2="14"/></svg>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2px'}}>
                                <div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{m.name}</div>
                                <div style={{fontSize:'13px',fontWeight:'800',color:'#2E9E6B',flexShrink:0,marginLeft:'8px'}}>{m.price.toLocaleString()} XAF</div>
                              </div>
                              <div style={{display:'flex',gap:'6px',alignItems:'center',marginBottom:'4px'}}>
                                <span style={{background:'#F0FAF5',color:'#2E9E6B',borderRadius:'6px',padding:'2px 7px',fontSize:'9px',fontWeight:'600'}}>{m.cat}</span>
                                {m.requiereReceta&&<span style={{background:'#FEF3C7',color:'#92400E',borderRadius:'6px',padding:'2px 7px',fontSize:'9px',fontWeight:'600'}}>📋 Receta</span>}
                                {!m.stock&&<span style={{background:'#FEF2F2',color:'#DC2626',borderRadius:'6px',padding:'2px 7px',fontSize:'9px',fontWeight:'600'}}>Sin stock</span>}
                              </div>
                              <div style={{fontSize:'11px',color:'#9CA3AF'}}>{m.desc}</div>
                            </div>
                          </div>
                          {m.stock&&<button onClick={()=>addToCart(m)} style={{width:'100%',background:medCart.find(i=>i.id===m.id)?'#F0FAF5':'linear-gradient(135deg,#2E9E6B,#1B7A52)',border:`1px solid ${medCart.find(i=>i.id===m.id)?'#2E9E6B':'transparent'}`,borderRadius:'8px',padding:'8px',color:medCart.find(i=>i.id===m.id)?'#2E9E6B':'#fff',fontSize:'12px',fontWeight:'700',cursor:'pointer'}}>
                            {medCart.find(i=>i.id===m.id)?`✓ En carrito (${medCart.find(i=>i.id===m.id)?.qty})`:'+ Añadir al carrito'}
                          </button>}
                        </div>
                      ))}
                    </div>}

                    {/* CART */}
                    {medScreen==='cart'&&<div>
                      {medCart.length===0?<div style={{textAlign:'center',padding:'40px 0',color:'#9CA3AF'}}><div style={{fontSize:'40px',marginBottom:'8px'}}>🛒</div><div>Carrito vacío</div></div>:(
                        <div>
                          {medCart.map(item=>(
                            <div key={item.id} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'10px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                              <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{item.name}</div><div style={{fontSize:'11px',color:'#9CA3AF'}}>{item.price.toLocaleString()} XAF/ud</div></div>
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <button onClick={()=>setMedCart(p=>p.map(i=>i.id===item.id?{...i,qty:Math.max(0,i.qty-1)}:i).filter(i=>i.qty>0))} style={{width:'26px',height:'26px',borderRadius:'50%',background:'#F3F4F6',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#374151'}}>−</button>
                                <span style={{fontSize:'13px',fontWeight:'700',color:'#111827',minWidth:'16px',textAlign:'center'}}>{item.qty}</span>
                                <button onClick={()=>setMedCart(p=>p.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i))} style={{width:'26px',height:'26px',borderRadius:'50%',background:'#2E9E6B',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'700',color:'#fff'}}>+</button>
                              </div>
                              <div style={{fontSize:'13px',fontWeight:'800',color:'#2E9E6B',minWidth:'60px',textAlign:'right'}}>{(item.price*item.qty).toLocaleString()} XAF</div>
                            </div>
                          ))}
                          <div style={{background:'#F0FAF5',borderRadius:'12px',padding:'14px',marginTop:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{fontSize:'14px',fontWeight:'700',color:'#374151'}}>Total</span>
                            <span style={{fontSize:'20px',fontWeight:'900',color:'#2E9E6B'}}>{cartTotal.toLocaleString()} XAF</span>
                          </div>
                          <button onClick={()=>setMedScreen('delivery')} style={{width:'100%',background:'linear-gradient(135deg,#2E9E6B,#1B7A52)',border:'none',borderRadius:'12px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer',marginTop:'12px'}}>
                            Continuar → Datos de entrega
                          </button>
                        </div>
                      )}
                    </div>}

                    {/* DELIVERY */}
                    {medScreen==='delivery'&&<div>
                      <div style={{background:'#F0FAF5',borderRadius:'12px',padding:'12px 14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'10px'}}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                        <div><div style={{fontSize:'13px',fontWeight:'700',color:'#2E9E6B'}}>Entrega a domicilio</div><div style={{fontSize:'11px',color:'#9CA3AF'}}>Entrega en 2-4 horas · Malabo y Bata</div></div>
                      </div>
                      {[{k:'name',l:'Nombre completo',t:'text'},{k:'phone',l:'Teléfono de contacto',t:'tel'},{k:'address',l:'Dirección de entrega',t:'text'},{k:'notes',l:'Instrucciones adicionales (opcional)',t:'text'}].map(f=>(
                        <div key={f.k} style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center',border:'1px solid #F0F2F5'}}>
                          <input type={f.t} placeholder={f.l} value={(deliveryForm as any)[f.k]} onChange={e=>setDF(f.k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
                        </div>
                      ))}
                      <div style={{background:'#fff',borderRadius:'12px',padding:'14px',marginBottom:'12px',border:'1px solid #F0F2F5'}}>
                        <div style={{fontSize:'12px',fontWeight:'700',color:'#9CA3AF',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Resumen del pedido</div>
                        {medCart.map(i=><div key={i.id} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #F3F4F6'}}><span style={{fontSize:'12px',color:'#374151'}}>{i.name} x{i.qty}</span><span style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{(i.price*i.qty).toLocaleString()} XAF</span></div>)}
                        <div style={{display:'flex',justifyContent:'space-between',paddingTop:'8px'}}><span style={{fontSize:'13px',fontWeight:'700',color:'#374151'}}>Total</span><span style={{fontSize:'16px',fontWeight:'900',color:'#2E9E6B'}}>{cartTotal.toLocaleString()} XAF</span></div>
                      </div>
                      <button onClick={()=>{if(deliveryForm.name&&deliveryForm.phone&&deliveryForm.address){onDebit(cartTotal);setMedScreen('ok');}}} style={{width:'100%',background:deliveryForm.name&&deliveryForm.phone&&deliveryForm.address?'linear-gradient(135deg,#2E9E6B,#1B7A52)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:deliveryForm.name&&deliveryForm.phone&&deliveryForm.address?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:deliveryForm.name&&deliveryForm.phone&&deliveryForm.address?'pointer':'default'}}>
                        Confirmar pedido · {cartTotal.toLocaleString()} XAF
                      </button>
                    </div>}

                    {/* SUCCESS */}
                    {medScreen==='ok'&&<div style={{textAlign:'center',padding:'40px 0'}}>
                      <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'#F0FAF5',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'40px'}}>✅</div>
                      <div style={{fontSize:'20px',fontWeight:'900',color:'#111827',marginBottom:'6px'}}>¡Pedido confirmado!</div>
                      <div style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'16px'}}>Entrega estimada: 2-4 horas</div>
                      <div style={{background:'#F0FAF5',borderRadius:'14px',padding:'14px',marginBottom:'20px',textAlign:'left'}}>
                        {[['Destinatario',deliveryForm.name],['Teléfono',deliveryForm.phone],['Dirección',deliveryForm.address],['Total',`${cartTotal.toLocaleString()} XAF`]].map(([l,v])=>(
                          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #D1FAE5'}}><span style={{fontSize:'12px',color:'#6B7280'}}>{l}</span><span style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{v}</span></div>
                        ))}
                      </div>
                      <button onClick={()=>{setShowMedModal(false);setMedCart([]);setMedSearch('');setMedScreen('search');setDeliveryForm({name:'',phone:'',address:'',notes:''}); }} style={{background:'linear-gradient(135deg,#2E9E6B,#1B7A52)',border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Cerrar</button>
                    </div>}
                  </div>
                </div>
              </div>
            )}
            {/* Filtros ciudad */}
            <div style={{display:'flex',gap:'6px',marginBottom:'10px',flexWrap:'wrap'}}>
              {pharmCities.map(c=>(
                <button key={c} onClick={()=>{setPharmCity(c);setPharmBarrio('Todos');}} style={{background:pharmCity===c?'#2E9E6B':'#fff',border:`1px solid ${pharmCity===c?'#2E9E6B':'#E5E7EB'}`,borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',color:pharmCity===c?'#fff':'#6B7280',cursor:'pointer'}}>{c}</button>
              ))}
            </div>
            {/* Filtros barrio */}
            {pharmBarrios.length>2&&(
              <div style={{display:'flex',gap:'5px',marginBottom:'12px',flexWrap:'wrap'}}>
                {pharmBarrios.map(b=>(
                  <button key={b} onClick={()=>setPharmBarrio(b)} style={{background:pharmBarrio===b?'#1B7A52':'#F3F4F6',border:'none',borderRadius:'16px',padding:'4px 11px',fontSize:'10px',fontWeight:'700',color:pharmBarrio===b?'#fff':'#6B7280',cursor:'pointer'}}>{b}</button>
                ))}
              </div>
            )}
            {/* Mosaico por barrio */}
            {Object.keys(pharmByBarrio).length===0&&(
              <div style={{textAlign:'center',padding:'30px 0',color:'#9CA3AF'}}>
                <div style={{fontSize:'32px',marginBottom:'8px'}}>💊</div>
                <div style={{fontSize:'13px'}}>No se encontraron farmacias</div>
              </div>
            )}
            {Object.entries(pharmByBarrio).map(([barrio,farmacias])=>(
              <div key={barrio} style={{marginBottom:'16px'}}>
                <div style={{fontSize:'11px',fontWeight:'800',color:'#6B7280',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px',paddingLeft:'2px'}}>
                  📍 {barrio} · {(farmacias as any[]).length} farmacia{(farmacias as any[]).length>1?'s':''}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  {(farmacias as any[]).map((f:any)=>(
                    <div key={f.id} onClick={()=>setSelected(selected?.id===f.id?null:f)} style={{background:'#fff',borderRadius:'12px',padding:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:`1.5px solid ${selected?.id===f.id?'#2E9E6B':'#F0F2F5'}`,cursor:'pointer',transition:'all 0.15s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'#F0FAF5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#2E9E6B'}}>
                          <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2h3'/><path d='M19 3H9a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2z'/><line x1='14' y1='11' x2='14' y2='17'/><line x1='11' y1='14' x2='17' y2='14'/></svg>
                        </div>
                        {f.emergency&&<span style={{background:'#FEF2F2',color:'#C0392B',borderRadius:'5px',padding:'1px 5px',fontSize:'8px',fontWeight:'800'}}>24h</span>}
                      </div>
                      <div style={{fontSize:'11px',fontWeight:'700',color:'#111827',marginBottom:'3px',lineHeight:'1.3'}}>{f.name}</div>
                      <div style={{fontSize:'10px',color:'#9CA3AF',marginBottom:'4px',lineHeight:'1.3'}}>{f.schedule.split('/')[0].trim()}</div>
                      <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'6px'}}>
                        {f.services.slice(0,2).map((s:string)=><span key={s} style={{background:'#F0FAF5',color:'#2E9E6B',borderRadius:'5px',padding:'1px 5px',fontSize:'8px',fontWeight:'600'}}>{s}</span>)}
                      </div>
                      {/* Expandido */}
                      {selected?.id===f.id&&(
                        <div style={{borderTop:'1px solid #F0F2F5',paddingTop:'8px',marginTop:'4px'}}>
                          <div style={{fontSize:'10px',color:'#6B7280',marginBottom:'6px'}}>📍 {f.address}</div>
                          <div style={{fontSize:'10px',color:'#2E9E6B',fontWeight:'600',marginBottom:'8px'}}>🕐 {f.schedule}</div>
                          <div style={{display:'flex',gap:'5px'}}>
                            <button onClick={e=>{e.stopPropagation();openMap(f);}} style={{flex:1,background:'#F0FAF5',border:'none',borderRadius:'7px',padding:'6px 4px',fontSize:'9px',fontWeight:'700',color:'#2E9E6B',cursor:'pointer'}}>🗺️ Ruta</button>
                            <a href={`tel:${f.phone}`} onClick={e=>e.stopPropagation()} style={{flex:1,background:'#EFF5FD',border:'none',borderRadius:'7px',padding:'6px 4px',fontSize:'9px',fontWeight:'700',color:'#1485EE',cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>📞 Llamar</a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>}

          {/* PEDIR CITA */}
          {tab==='cita'&&<div>
            {!citaOk?(
              <div>
                <div style={{background:'#FEF2F2',borderRadius:'12px',padding:'12px 14px',marginBottom:'14px',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                  <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='#C0392B' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>
                  <div><div style={{fontSize:'13px',fontWeight:'700',color:'#C0392B'}}>Solicitar cita médica</div><div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'2px'}}>Recibirás confirmación por teléfono en 24h</div></div>
                </div>
                {/* Hospital */}
                <div style={{fontSize:'12px',fontWeight:'600',color:'#9CA3AF',marginBottom:'6px'}}>Hospital / Clínica</div>
                <div style={{background:'#fff',borderRadius:'10px',overflow:'hidden',marginBottom:'10px',border:'1px solid #F0F2F5'}}>
                  <select value={citaForm.hospital} onChange={e=>setCitaForm(p=>({...p,hospital:e.target.value}))} style={{width:'100%',background:'none',border:'none',outline:'none',padding:'12px 14px',fontSize:'13px',color:'#111827',fontFamily:'inherit',cursor:'pointer'}}>
                    <option value="">Selecciona un centro</option>
                    {HOSPITALS.map(h=><option key={h.id} value={h.name}>{h.name} — {h.city}</option>)}
                  </select>
                </div>
                {/* Especialidad */}
                <div style={{fontSize:'12px',fontWeight:'600',color:'#9CA3AF',marginBottom:'6px'}}>Especialidad</div>
                <div style={{background:'#fff',borderRadius:'10px',overflow:'hidden',marginBottom:'10px',border:'1px solid #F0F2F5'}}>
                  <select value={citaForm.specialty} onChange={e=>setCitaForm(p=>({...p,specialty:e.target.value}))} style={{width:'100%',background:'none',border:'none',outline:'none',padding:'12px 14px',fontSize:'13px',color:'#111827',fontFamily:'inherit',cursor:'pointer'}}>
                    <option value="">Selecciona especialidad</option>
                    {['Medicina General','Cardiología','Neurología','Pediatría','Ginecología','Ortopedia','Cirugía','Urgencias','Laboratorio','Radiología'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Datos personales */}
                {[{k:'name',l:'Nombre completo',t:'text'},{k:'phone',l:'Teléfono de contacto',t:'tel'},{k:'date',l:'Fecha preferida (DD/MM/AAAA)',t:'text'},{k:'notes',l:'Síntomas o notas (opcional)',t:'text'}].map(f=>(
                  <div key={f.k} style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center',border:'1px solid #F0F2F5'}}>
                    <input type={f.t} placeholder={f.l} value={(citaForm as any)[f.k]} onChange={e=>setCitaForm(p=>({...p,[f.k]:e.target.value}))} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
                  </div>
                ))}
                <button onClick={()=>{if(citaForm.name&&citaForm.phone&&citaForm.hospital&&citaForm.specialty)setCitaOk(true);}} style={{width:'100%',background:citaForm.name&&citaForm.phone&&citaForm.hospital&&citaForm.specialty?'linear-gradient(135deg,#C0392B,#E74C3C)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:citaForm.name&&citaForm.phone&&citaForm.hospital&&citaForm.specialty?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:citaForm.name&&citaForm.phone&&citaForm.hospital&&citaForm.specialty?'pointer':'default',marginTop:'4px'}}>
                  Solicitar cita
                </button>
              </div>
            ):(
              <div style={{textAlign:'center',padding:'40px 0'}}>
                <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'40px'}}>✅</div>
                <div style={{fontSize:'20px',fontWeight:'900',color:'#111827',marginBottom:'8px'}}>¡Cita solicitada!</div>
                <div style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'16px'}}>{citaForm.hospital} · {citaForm.specialty}</div>
                <div style={{background:'#FEF2F2',borderRadius:'14px',padding:'16px',marginBottom:'20px',textAlign:'left'}}>
                  {[['Paciente',citaForm.name],['Teléfono',citaForm.phone],['Fecha preferida',citaForm.date||'A confirmar'],['Especialidad',citaForm.specialty]].map(([l,v])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #FECACA'}}>
                      <span style={{fontSize:'12px',color:'#6B7280'}}>{l}</span>
                      <span style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'20px'}}>Te llamaremos al {citaForm.phone} para confirmar la cita en las próximas 24h</div>
                <button onClick={()=>{setCitaOk(false);setCitaForm({name:'',phone:'',date:'',specialty:'',hospital:'',notes:''}); }} style={{background:'linear-gradient(135deg,#C0392B,#E74C3C)',border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Nueva cita</button>
              </div>
            )}
          </div>}

          {/* URGENCIAS */}
          {tab==='urgencias'&&<div>
            <div style={{background:'linear-gradient(135deg,#C0392B,#E74C3C)',borderRadius:'14px',padding:'16px',marginBottom:'14px',color:'#fff'}}>
              <div style={{fontSize:'16px',fontWeight:'800',marginBottom:'4px'}}>🚨 Urgencias</div>
              <div style={{fontSize:'12px',opacity:0.85,marginBottom:'12px'}}>Centros con urgencias 24h en Guinea Ecuatorial</div>
              <a href="tel:112" style={{display:'block',background:'rgba(255,255,255,0.2)',borderRadius:'10px',padding:'12px',textAlign:'center',color:'#fff',textDecoration:'none',fontSize:'16px',fontWeight:'800',marginBottom:'8px'}}>📞 Llamar al 112 — Emergencias</a>
              <a href="tel:+240333097000" style={{display:'block',background:'rgba(255,255,255,0.15)',borderRadius:'10px',padding:'10px',textAlign:'center',color:'#fff',textDecoration:'none',fontSize:'13px',fontWeight:'700'}}>🏥 Hospital General Malabo: +240 333 09 70 00</a>
            </div>
            {HOSPITALS.filter(h=>h.emergency).map(h=>(
              <div key={h.id} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',border:'1px solid #F0F2F5'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#C0392B'}}><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/></svg></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{h.name}</div>
                  <div style={{fontSize:'11px',color:'#9CA3AF'}}>{h.city} · {h.schedule}</div>
                </div>
                <div style={{display:'flex',gap:'6px'}}>
                  <button onClick={()=>openMap(h)} style={{background:'#FEF2F2',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'11px',fontWeight:'700',color:'#C0392B',cursor:'pointer'}}>🗺️</button>
                  <a href={`tel:${h.phone}`} style={{background:'#EFF5FD',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'11px',fontWeight:'700',color:'#1485EE',cursor:'pointer',textDecoration:'none'}}>📞</a>
                </div>
              </div>
            ))}
          </div>}

        </div>
      </div>
    </div>
  );
};

