import React, { useState } from 'react';

// ─── DATOS ────────────────────────────────────────────────────────────────────

const RESTAURANTES = [
  { id:'r1', nombre:'Restaurante La Estancia', ciudad:'Malabo', barrio:'Centro', tipo:'Internacional', especialidad:'Carnes y parrilla', precio:'$$', horario:'12:00-23:00', tel:'+240 222 25 00 01', menu:[{plato:'Chuleton de ternera',precio:18000},{plato:'Pollo a la brasa',precio:9000},{plato:'Ensalada mixta',precio:4500},{plato:'Paella valenciana',precio:14000}] },
  { id:'r2', nombre:'Restaurante El Patio', ciudad:'Malabo', barrio:'Caracolas', tipo:'Africana/Espanola', especialidad:'Cocina fusion', precio:'$$', horario:'11:00-22:00', tel:'+240 222 25 00 02', menu:[{plato:'Sopa de pescado',precio:6000},{plato:'Ndole con plantain',precio:8000},{plato:'Arroz con pollo',precio:7500},{plato:'Pescado a la plancha',precio:11000}] },
  { id:'r3', nombre:'Restaurante Bahia', ciudad:'Malabo', barrio:'Puerto', tipo:'Mariscos', especialidad:'Pescados y mariscos frescos', precio:'$$$', horario:'12:00-23:30', tel:'+240 222 25 00 03', menu:[{plato:'Langosta a la plancha',precio:35000},{plato:'Gambas al ajillo',precio:15000},{plato:'Ceviche de corvina',precio:12000},{plato:'Paella de mariscos',precio:22000}] },
  { id:'r4', nombre:'Cocina Tipica Malabo', ciudad:'Malabo', barrio:'Ela Nguema', tipo:'Ecuatoguineana', especialidad:'Platos tradicionales GQ', precio:'$', horario:'08:00-21:00', tel:'+240 222 25 00 04', menu:[{plato:'Sopa de mboa',precio:3500},{plato:'Ekwang',precio:4000},{plato:'Eru con fufu',precio:4500},{plato:'Pescado ahumado con yuca',precio:5000}] },
  { id:'r5', nombre:'Restaurante Sipopo', ciudad:'Malabo', barrio:'Sipopo', tipo:'Internacional', especialidad:'Alta cocina', precio:'$$$', horario:'13:00-23:00', tel:'+240 222 25 00 05', menu:[{plato:'Filete de res',precio:25000},{plato:'Salmon al horno',precio:20000},{plato:'Risotto de setas',precio:16000},{plato:'Tiramisu',precio:6000}] },
  { id:'r6', nombre:'Restaurante Bata Centro', ciudad:'Bata', barrio:'Centro', tipo:'Africana/Internacional', especialidad:'Cocina variada', precio:'$$', horario:'10:00-22:00', tel:'+240 222 25 00 06', menu:[{plato:'Pollo yassa',precio:8000},{plato:'Thieboudienne',precio:9000},{plato:'Brochetas mixtas',precio:10000},{plato:'Ensalada de aguacate',precio:4000}] },
  { id:'r7', nombre:'La Terraza Bata', ciudad:'Bata', barrio:'Litoral', tipo:'Mariscos/Espanola', especialidad:'Vistas al mar', precio:'$$', horario:'12:00-23:00', tel:'+240 222 25 00 07', menu:[{plato:'Pulpo a la gallega',precio:14000},{plato:'Merluza al vapor',precio:11000},{plato:'Calamares fritos',precio:8000},{plato:'Arroz negro',precio:13000}] },
  { id:'r8', nombre:'Restaurante Nkolombong', ciudad:'Bata', barrio:'Nkolombong', tipo:'Ecuatoguineana', especialidad:'Comida tradicional', precio:'$', horario:'07:00-20:00', tel:'+240 222 25 00 08', menu:[{plato:'Sopa de cabra',precio:4000},{plato:'Plantain frito con frijoles',precio:2500},{plato:'Pollo con salsa de cacahuete',precio:6000},{plato:'Agua de coco natural',precio:1000}] },
  { id:'r9', nombre:'Restaurante Ebebiyin', ciudad:'Ebebiyin', barrio:'Centro', tipo:'Africana', especialidad:'Cocina continental', precio:'$', horario:'08:00-21:00', tel:'+240 222 25 00 09', menu:[{plato:'Sopa de verduras',precio:2500},{plato:'Pollo asado',precio:5500},{plato:'Arroz con frijoles',precio:3000},{plato:'Platano maduro frito',precio:1500}] },
  { id:'r10', nombre:'Restaurante Mongomo', ciudad:'Mongomo', barrio:'Centro', tipo:'Africana', especialidad:'Platos locales', precio:'$', horario:'08:00-20:00', tel:'+240 222 25 00 10', menu:[{plato:'Caldo de pescado',precio:3000},{plato:'Yuca con pollo',precio:4500},{plato:'Arroz jollof',precio:3500},{plato:'Zumo de frutas tropicales',precio:1200}] },
];

const AEROLINEAS = [
  { id:'ceiba', nombre:'Ceiba Intercontinental', iata:'C2', pais:'Guinea Ecuatorial', logo:'plane', color:'#1B3A6B',
    rutas:[{origen:'Malabo (SSG)',destino:'Bata (BSG)',duracion:'45 min',precio:45000,frecuencia:'Diario'},{origen:'Malabo (SSG)',destino:'Madrid (MAD)',duracion:'7h 30min',precio:380000,frecuencia:'3x semana'},{origen:'Malabo (SSG)',destino:'Paris (CDG)',duracion:'8h',precio:420000,frecuencia:'2x semana'},{origen:'Malabo (SSG)',destino:'Libreville (LBV)',duracion:'1h 10min',precio:85000,frecuencia:'Diario'},{origen:'Malabo (SSG)',destino:'Douala (DLA)',duracion:'1h 20min',precio:90000,frecuencia:'Diario'},{origen:'Bata (BSG)',destino:'Malabo (SSG)',duracion:'45 min',precio:45000,frecuencia:'Diario'}]},
  { id:'iberia', nombre:'Iberia', iata:'IB', pais:'Espana', logo:'es', color:'#C0392B',
    rutas:[{origen:'Madrid (MAD)',destino:'Malabo (SSG)',duracion:'7h 30min',precio:350000,frecuencia:'3x semana'},{origen:'Malabo (SSG)',destino:'Madrid (MAD)',duracion:'7h 30min',precio:350000,frecuencia:'3x semana'}]},
  { id:'airfrance', nombre:'Air France', iata:'AF', pais:'Francia', logo:'fr', color:'#003087',
    rutas:[{origen:'Paris (CDG)',destino:'Malabo (SSG)',duracion:'8h',precio:390000,frecuencia:'2x semana'},{origen:'Malabo (SSG)',destino:'Paris (CDG)',duracion:'8h',precio:390000,frecuencia:'2x semana'}]},
  { id:'ethiopian', nombre:'Ethiopian Airlines', iata:'ET', pais:'Etiopia', logo:'et', color:'#078930',
    rutas:[{origen:'Addis Abeba (ADD)',destino:'Malabo (SSG)',duracion:'6h 30min',precio:280000,frecuencia:'3x semana'},{origen:'Malabo (SSG)',destino:'Nairobi (NBO)',duracion:'7h',precio:310000,frecuencia:'2x semana'}]},
  { id:'rwandair', nombre:'RwandAir', iata:'WB', pais:'Ruanda', logo:'rw', color:'#20603D',
    rutas:[{origen:'Kigali (KGL)',destino:'Malabo (SSG)',duracion:'5h 30min',precio:260000,frecuencia:'2x semana'},{origen:'Malabo (SSG)',destino:'Kigali (KGL)',duracion:'5h 30min',precio:260000,frecuencia:'2x semana'}]},
];

const COMPANIAS_GAS = [
  { id:'gepetrol', nombre:'GEPetrol', color:'#C0392B',
    estaciones:[
      {nombre:'GEPetrol Malabo Centro',ciudad:'Malabo',barrio:'Centro',horario:'24h',tel:'+240 333 09 50 01',g95:650,diesel:580,glp:450},
      {nombre:'GEPetrol Caracolas',ciudad:'Malabo',barrio:'Caracolas',horario:'06:00-22:00',tel:'+240 333 09 50 02',g95:650,diesel:580,glp:450},
      {nombre:'GEPetrol Ela Nguema',ciudad:'Malabo',barrio:'Ela Nguema',horario:'06:00-22:00',tel:'+240 333 09 50 03',g95:650,diesel:580,glp:450},
      {nombre:'GEPetrol Bata Centro',ciudad:'Bata',barrio:'Centro',horario:'24h',tel:'+240 333 09 50 04',g95:650,diesel:580,glp:450},
      {nombre:'GEPetrol Bata Norte',ciudad:'Bata',barrio:'Nkolombong',horario:'06:00-22:00',tel:'+240 333 09 50 05',g95:650,diesel:580,glp:450},
      {nombre:'GEPetrol Ebebiyin',ciudad:'Ebebiyin',barrio:'Centro',horario:'07:00-21:00',tel:'+240 333 09 50 06',g95:650,diesel:580,glp:450},
      {nombre:'GEPetrol Mongomo',ciudad:'Mongomo',barrio:'Centro',horario:'07:00-21:00',tel:'+240 333 09 50 07',g95:650,diesel:580,glp:450},
    ]},
  { id:'total', nombre:'TotalEnergies', color:'#E31837',
    estaciones:[
      {nombre:'Total Malabo Puerto',ciudad:'Malabo',barrio:'Puerto',horario:'24h',tel:'+240 333 09 51 01',g95:660,diesel:590,glp:460},
      {nombre:'Total Malabo II',ciudad:'Malabo',barrio:'Malabo II',horario:'06:00-23:00',tel:'+240 333 09 51 02',g95:660,diesel:590,glp:460},
      {nombre:'Total Sipopo',ciudad:'Malabo',barrio:'Sipopo',horario:'06:00-22:00',tel:'+240 333 09 51 03',g95:660,diesel:590,glp:460},
      {nombre:'Total Bata Litoral',ciudad:'Bata',barrio:'Litoral',horario:'24h',tel:'+240 333 09 51 04',g95:660,diesel:590,glp:460},
    ]},
  { id:'oryx', nombre:'Oryx', color:'#FF6B00',
    estaciones:[
      {nombre:'Oryx Malabo Aeropuerto',ciudad:'Malabo',barrio:'Aeropuerto',horario:'05:00-23:00',tel:'+240 333 09 52 01',g95:655,diesel:585,glp:455},
      {nombre:'Oryx Malabo Centro',ciudad:'Malabo',barrio:'Centro',horario:'06:00-22:00',tel:'+240 333 09 52 02',g95:655,diesel:585,glp:455},
      {nombre:'Oryx Bata',ciudad:'Bata',barrio:'Centro',horario:'06:00-22:00',tel:'+240 333 09 52 03',g95:655,diesel:585,glp:455},
    ]},
];

// ─── RESTAURANTES ─────────────────────────────────────────────────────────────
export const RestaurantesModule: React.FC = () => {
  const [city, setCity] = useState('Malabo');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [view, setView] = useState<'list'|'menu'|'reserva'|'ok'>('list');
  const [form, setForm] = useState({name:'',phone:'',date:'',hora:'',personas:'2',notas:''});

  const filtered = RESTAURANTES.filter(r =>
    (city === 'Todos' || r.ciudad === city) &&
    (!search || r.nombre.toLowerCase().includes(search.toLowerCase()) || r.tipo.toLowerCase().includes(search.toLowerCase()))
  );
  const precioColor = (p:string) => p==='$'?'#16A34A':p==='$$'?'#C47D2A':'#C0392B';
  const precioLabel = (p:string) => p==='$'?'Economico':p==='$$'?'Moderado':'Premium';

  if (view === 'ok') return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:'48px',marginBottom:'12px'}}>checkmark</div>
      <div style={{fontSize:'18px',fontWeight:'800',color:'#111827',marginBottom:'6px'}}>Reserva confirmada!</div>
      <div style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'4px'}}>{selected?.nombre}</div>
      <div style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'20px'}}>{form.date} - {form.hora} - {form.personas} personas</div>
      <button onClick={()=>{setView('list');setSelected(null);setForm({name:'',phone:'',date:'',hora:'',personas:'2',notas:''}); }} style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Ver mas restaurantes</button>
    </div>
  );

  if (view === 'reserva' && selected) return (
    <div style={{padding:'14px 16px 24px'}}>
      <div style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',borderRadius:'12px',padding:'14px',marginBottom:'14px',display:'flex',alignItems:'center',gap:'12px'}}>
        <div style={{fontSize:'28px'}}>rest</div>
        <div><div style={{fontSize:'15px',fontWeight:'800',color:'#fff'}}>{selected.nombre}</div><div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{selected.barrio} - {selected.ciudad}</div></div>
      </div>
      {([{k:'name',l:'Tu nombre completo',t:'text'},{k:'phone',l:'Telefono de contacto',t:'tel'},{k:'date',l:'Fecha (DD/MM/AAAA)',t:'text'},{k:'hora',l:'Hora de llegada',t:'text'},{k:'personas',l:'Numero de personas',t:'number'},{k:'notas',l:'Notas especiales (opcional)',t:'text'}] as {k:keyof typeof form,l:string,t:string}[]).map(f=>(
        <div key={f.k} style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',display:'flex',alignItems:'center',height:'50px',border:'1px solid #F0F2F5'}}>
          <input type={f.t} placeholder={f.l} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
        </div>
      ))}
      <button onClick={()=>{if(form.name&&form.phone&&form.date&&form.hora)setView('ok');}} style={{width:'100%',background:form.name&&form.phone&&form.date&&form.hora?'linear-gradient(135deg,#92400E,#F59E0B)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.name&&form.phone&&form.date&&form.hora?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Confirmar reserva</button>
    </div>
  );

  if (view === 'menu' && selected) return (
    <div style={{padding:'0 0 24px'}}>
      <div style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',padding:'16px'}}>
        <button onClick={()=>setView('list')} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'8px',padding:'6px 12px',color:'#fff',fontSize:'12px',fontWeight:'700',cursor:'pointer',marginBottom:'10px'}}>Volver</button>
        <div style={{fontSize:'17px',fontWeight:'800',color:'#fff'}}>{selected.nombre}</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{selected.tipo} - {selected.barrio}, {selected.ciudad}</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)',marginTop:'2px'}}>{selected.horario} - {selected.tel}</div>
      </div>
      <div style={{padding:'14px 16px 0'}}>
        <div style={{fontSize:'12px',fontWeight:'700',color:'#9CA3AF',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Menu</div>
        {selected.menu.map((item:any,i:number)=>(
          <div key={i} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>{item.plato}</div>
            <div style={{fontSize:'14px',fontWeight:'800',color:'#C47D2A'}}>{item.precio.toLocaleString()} XAF</div>
          </div>
        ))}
        <button onClick={()=>setView('reserva')} style={{width:'100%',background:'linear-gradient(135deg,#92400E,#F59E0B)',border:'none',borderRadius:'12px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer',marginTop:'8px'}}>Reservar mesa</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:'0 0 24px'}}>
      <div style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',padding:'16px 16px 12px'}}>
        <div style={{fontSize:'18px',fontWeight:'800',color:'#fff',marginBottom:'4px'}}>Restaurantes</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)',marginBottom:'10px'}}>Guinea Ecuatorial - Por ubicacion</div>
        <div style={{background:'rgba(255,255,255,0.2)',borderRadius:'10px',padding:'0 12px',height:'38px',display:'flex',alignItems:'center',gap:'8px'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar restaurante..." style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#fff',fontFamily:'inherit'}}/>
        </div>
      </div>
      <div style={{display:'flex',gap:'6px',padding:'10px 16px 6px',overflowX:'auto'}}>
        {['Malabo','Bata','Ebebiyin','Mongomo','Todos'].map(c=>(
          <button key={c} onClick={()=>setCity(c)} style={{flexShrink:0,background:city===c?'#C47D2A':'#fff',border:`1px solid ${city===c?'#C47D2A':'#E5E7EB'}`,borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',color:city===c?'#fff':'#6B7280',cursor:'pointer'}}>{c}</button>
        ))}
      </div>
      <div style={{padding:'0 16px'}}>
        {filtered.length===0 && <div style={{textAlign:'center',padding:'30px 0',color:'#9CA3AF',fontSize:'13px'}}>Sin resultados</div>}
        {filtered.map(r=>(
          <div key={r.id} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'10px',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid #F0F2F5'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
              <div style={{fontSize:'15px',fontWeight:'700',color:'#111827',flex:1}}>{r.nombre}</div>
              <span style={{background:precioColor(r.precio)+'15',color:precioColor(r.precio),fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'8px',flexShrink:0,marginLeft:'8px'}}>{precioLabel(r.precio)}</span>
            </div>
            <div style={{fontSize:'12px',color:'#6B7280',marginBottom:'4px'}}>{r.tipo} - {r.especialidad}</div>
            <div style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'10px'}}>{r.barrio}, {r.ciudad} - {r.horario}</div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>{setSelected(r);setView('menu');}} style={{flex:1,background:'#FEF3C7',border:'1px solid #FDE68A',borderRadius:'10px',padding:'9px',fontSize:'12px',fontWeight:'700',color:'#92400E',cursor:'pointer'}}>Ver menu</button>
              <button onClick={()=>{setSelected(r);setView('reserva');}} style={{flex:1,background:'linear-gradient(135deg,#92400E,#F59E0B)',border:'none',borderRadius:'10px',padding:'9px',fontSize:'12px',fontWeight:'700',color:'#fff',cursor:'pointer'}}>Reservar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── VUELOS ───────────────────────────────────────────────────────────────────
export const VuelosModule: React.FC = () => {
  const [view, setView] = useState<'airlines'|'routes'|'book'|'ok'>('airlines');
  const [airline, setAirline] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [trip, setTrip] = useState('Ida');
  const [clase, setClase] = useState('Turista');
  const [form, setForm] = useState({name:'',dni:'',phone:'',date:'',pax:'1',payMethod:''});

  const total = route ? Math.round(route.precio * (clase==='Business'?1.8:1) * (trip==='Ida y vuelta'?2:1) * parseInt(form.pax||'1')) : 0;

  if (view==='ok') return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:'48px',marginBottom:'12px'}}>ok</div>
      <div style={{fontSize:'18px',fontWeight:'800',color:'#111827',marginBottom:'6px'}}>Reserva confirmada!</div>
      <div style={{fontSize:'13px',color:'#6B7280',marginBottom:'4px'}}>{airline?.nombre} - {route?.origen} a {route?.destino}</div>
      <div style={{fontSize:'20px',fontWeight:'900',color:'#1B3A6B',marginBottom:'20px'}}>{total.toLocaleString()} XAF</div>
      <button onClick={()=>{setView('airlines');setAirline(null);setRoute(null);setForm({name:'',dni:'',phone:'',date:'',pax:'1',payMethod:''}); }} style={{background:'linear-gradient(135deg,#1B3A6B,#00b4e6)',border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Ver mas vuelos</button>
    </div>
  );

  if (view==='book' && route) return (
    <div style={{padding:'14px 16px 24px'}}>
      <div style={{background:'linear-gradient(135deg,#1B3A6B,#00b4e6)',borderRadius:'12px',padding:'14px',marginBottom:'14px'}}>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginBottom:'2px'}}>{airline?.nombre}</div>
        <div style={{fontSize:'15px',fontWeight:'800',color:'#fff'}}>{route.origen} a {route.destino}</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)',marginTop:'2px'}}>{route.duracion} - {route.frecuencia}</div>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
        {['Ida','Ida y vuelta'].map(t=>(<button key={t} onClick={()=>setTrip(t)} style={{flex:1,background:trip===t?'#1B3A6B':'#fff',border:`1.5px solid ${trip===t?'#1B3A6B':'#E5E7EB'}`,borderRadius:'10px',padding:'9px',fontSize:'12px',fontWeight:'700',color:trip===t?'#fff':'#6B7280',cursor:'pointer'}}>{t}</button>))}
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
        {['Turista','Business'].map(c=>(<button key={c} onClick={()=>setClase(c)} style={{flex:1,background:clase===c?'#00b4e6':'#fff',border:`1.5px solid ${clase===c?'#00b4e6':'#E5E7EB'}`,borderRadius:'10px',padding:'9px',fontSize:'12px',fontWeight:'700',color:clase===c?'#fff':'#6B7280',cursor:'pointer'}}>{c}</button>))}
      </div>
      {([{k:'name',l:'Nombre completo',t:'text'},{k:'dni',l:'Pasaporte / DNI',t:'text'},{k:'phone',l:'Telefono',t:'tel'},{k:'date',l:'Fecha salida (DD/MM/AAAA)',t:'text'},{k:'pax',l:'Num. pasajeros',t:'number'}] as {k:keyof typeof form,l:string,t:string}[]).map(f=>(
        <div key={f.k} style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',display:'flex',alignItems:'center',height:'50px',border:'1px solid #F0F2F5'}}>
          <input type={f.t} placeholder={f.l} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
        </div>
      ))}
      {parseInt(form.pax||'0')>0 && <div style={{background:'#EFF5FD',borderRadius:'10px',padding:'12px 14px',marginBottom:'12px',border:'1px solid #BFDBFE'}}><div style={{fontSize:'11px',color:'#1B3A6B',marginBottom:'4px',fontWeight:'600'}}>Total estimado</div><div style={{fontSize:'22px',fontWeight:'900',color:'#1B3A6B'}}>{total.toLocaleString()} XAF</div><div style={{fontSize:'10px',color:'#6B7280'}}>{form.pax} pax - {clase} - {trip}</div></div>}
      <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
        {[{id:'wallet',label:'EGCHAT',icon:'wallet'},{id:'bank',label:'Banco',icon:'bank'},{id:'card',label:'Tarjeta',icon:'card'}].map(m=>(<button key={m.id} onClick={()=>setForm(p=>({...p,payMethod:m.id}))} style={{flex:1,background:form.payMethod===m.id?'#EFF5FD':'#F9FAFB',border:`1.5px solid ${form.payMethod===m.id?'#00b4e6':'#E5E7EB'}`,borderRadius:'10px',padding:'10px 4px',fontSize:'10px',fontWeight:'700',color:form.payMethod===m.id?'#1B3A6B':'#6B7280',cursor:'pointer'}}>{m.label}</button>))}
      </div>
      <button onClick={()=>{if(form.name&&form.dni&&form.phone&&form.date&&form.payMethod)setView('ok');}} style={{width:'100%',background:form.name&&form.dni&&form.phone&&form.date&&form.payMethod?'linear-gradient(135deg,#1B3A6B,#00b4e6)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.name&&form.dni&&form.phone&&form.date&&form.payMethod?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Reservar vuelo</button>
    </div>
  );

  if (view==='routes' && airline) return (
    <div style={{padding:'0 0 24px'}}>
      <div style={{background:`linear-gradient(135deg,${airline.color},#00b4e6)`,padding:'16px'}}>
        <button onClick={()=>setView('airlines')} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'8px',padding:'6px 12px',color:'#fff',fontSize:'12px',fontWeight:'700',cursor:'pointer',marginBottom:'10px'}}>Volver</button>
        <div style={{fontSize:'17px',fontWeight:'800',color:'#fff'}}>{airline.nombre}</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{airline.rutas.length} rutas disponibles</div>
      </div>
      <div style={{padding:'14px 16px 0'}}>
        {airline.rutas.map((r:any,i:number)=>(
          <div key={i} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'10px',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid #F0F2F5'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
              <div><div style={{fontSize:'14px',fontWeight:'800',color:'#111827'}}>{r.origen} a {r.destino}</div><div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'2px'}}>{r.duracion} - {r.frecuencia}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:'16px',fontWeight:'900',color:airline.color}}>{r.precio.toLocaleString()}</div><div style={{fontSize:'9px',color:'#9CA3AF'}}>XAF/pax</div></div>
            </div>
            <button onClick={()=>{setRoute(r);setView('book');}} style={{width:'100%',background:`linear-gradient(135deg,${airline.color},#00b4e6)`,border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'700',color:'#fff',cursor:'pointer'}}>Reservar este vuelo</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{padding:'0 0 24px'}}>
      <div style={{background:'linear-gradient(135deg,#1B3A6B,#00b4e6)',padding:'16px 16px 12px'}}>
        <div style={{fontSize:'18px',fontWeight:'800',color:'#fff',marginBottom:'4px'}}>Vuelos</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>Aerolineas que operan en Guinea Ecuatorial</div>
      </div>
      <div style={{padding:'14px 16px 0'}}>
        {AEROLINEAS.map(a=>(
          <div key={a.id} onClick={()=>{setAirline(a);setView('routes');}} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'10px',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid #F0F2F5',display:'flex',alignItems:'center',gap:'14px'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#F9FAFB';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';}}>
            <div style={{width:'48px',height:'48px',borderRadius:'12px',background:a.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:'800',color:a.color,flexShrink:0}}>{a.iata}</div>
            <div style={{flex:1}}><div style={{fontSize:'15px',fontWeight:'700',color:'#111827'}}>{a.nombre}</div><div style={{fontSize:'11px',color:'#9CA3AF'}}>{a.pais} - {a.rutas.length} rutas - IATA: {a.iata}</div></div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── GASOLINERAS ──────────────────────────────────────────────────────────────
interface GasolinerasProps { onDebit: (n: number) => void; }

export const GasolinerasModule: React.FC<GasolinerasProps> = ({ onDebit }) => {
  const [view, setView] = useState<'companies'|'stations'|'pay'|'ok'>('companies');
  const [company, setCompany] = useState<any>(null);
  const [station, setStation] = useState<any>(null);
  const [fuelType, setFuelType] = useState<'g95'|'diesel'|'glp'>('g95');
  const [city, setCity] = useState('Malabo');
  const [liters, setLiters] = useState('');
  const [plate, setPlate] = useState('');
  const [payMethod, setPayMethod] = useState('');

  const FUELS = [{id:'g95' as const,label:'Gasolina 95',color:'#FA9D3B',icon:'gas'},{id:'diesel' as const,label:'Diesel',color:'#576B95',icon:'truck'},{id:'glp' as const,label:'Gas Licuado (GLP)',color:'#07C160',icon:'fire'}];
  const pricePerL = station ? station[fuelType] : 650;
  const total = pricePerL * parseInt(liters||'0');

  if (view==='ok') return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:'48px',marginBottom:'12px'}}>ok</div>
      <div style={{fontSize:'18px',fontWeight:'800',color:'#111827',marginBottom:'6px'}}>Pago confirmado!</div>
      <div style={{fontSize:'13px',color:'#6B7280',marginBottom:'4px'}}>{station?.nombre}</div>
      <div style={{fontSize:'13px',color:'#6B7280',marginBottom:'4px'}}>{FUELS.find(f=>f.id===fuelType)?.label} - {liters}L - Matricula: {plate}</div>
      <div style={{fontSize:'22px',fontWeight:'900',color:'#C47D2A',marginBottom:'20px'}}>{total.toLocaleString()} XAF</div>
      <button onClick={()=>{setView('companies');setCompany(null);setStation(null);setLiters('');setPlate('');setPayMethod('');}} style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Nueva recarga</button>
    </div>
  );

  if (view==='pay' && station) return (
    <div style={{padding:'14px 16px 24px'}}>
      <div style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',borderRadius:'12px',padding:'14px',marginBottom:'14px'}}>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginBottom:'2px'}}>{station.nombre} - {station.ciudad}</div>
        <div style={{fontSize:'15px',fontWeight:'800',color:'#fff'}}>{FUELS.find(f=>f.id===fuelType)?.label}</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.9)',marginTop:'2px'}}>{pricePerL} XAF/L</div>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
        {FUELS.map(f=>(<button key={f.id} onClick={()=>setFuelType(f.id)} style={{flex:1,background:fuelType===f.id?f.color+'20':'#fff',border:`1.5px solid ${fuelType===f.id?f.color:'#E5E7EB'}`,borderRadius:'10px',padding:'8px 4px',fontSize:'10px',fontWeight:'700',color:fuelType===f.id?f.color:'#6B7280',cursor:'pointer'}}>{f.label.split(' ')[0]}<br/>{station[f.id]} XAF/L</button>))}
      </div>
      <div style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',display:'flex',alignItems:'center',height:'50px',border:'1px solid #F0F2F5'}}>
        <input type="text" placeholder="Matricula del vehiculo" value={plate} onChange={e=>setPlate(e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
      </div>
      <div style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',display:'flex',alignItems:'center',height:'50px',border:'1px solid #F0F2F5'}}>
        <input type="number" placeholder="Litros a cargar" value={liters} onChange={e=>setLiters(e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
      </div>
      {parseInt(liters||'0')>0 && <div style={{background:'#FEF3C7',borderRadius:'10px',padding:'12px 14px',marginBottom:'12px',border:'1px solid #FDE68A'}}><div style={{fontSize:'11px',color:'#92400E',marginBottom:'4px',fontWeight:'600'}}>Total a pagar</div><div style={{fontSize:'24px',fontWeight:'900',color:'#C47D2A'}}>{total.toLocaleString()} XAF</div><div style={{fontSize:'11px',color:'#92400E'}}>{liters}L x {pricePerL} XAF/L</div></div>}
      <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
        {[{id:'wallet',label:'EGCHAT'},{id:'bank',label:'Banco'},{id:'cash',label:'Efectivo'}].map(m=>(<button key={m.id} onClick={()=>setPayMethod(m.id)} style={{flex:1,background:payMethod===m.id?'#FEF3C7':'#F9FAFB',border:`1.5px solid ${payMethod===m.id?'#F59E0B':'#E5E7EB'}`,borderRadius:'10px',padding:'10px 4px',fontSize:'10px',fontWeight:'700',color:payMethod===m.id?'#92400E':'#6B7280',cursor:'pointer'}}>{m.label}</button>))}
      </div>
      <button onClick={()=>{if(plate&&parseInt(liters||'0')>0&&payMethod){onDebit(total);setView('ok');}}} style={{width:'100%',background:plate&&parseInt(liters||'0')>0&&payMethod?'linear-gradient(135deg,#92400E,#F59E0B)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:plate&&parseInt(liters||'0')>0&&payMethod?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Pagar {total>0?`${total.toLocaleString()} XAF`:''}</button>
    </div>
  );

  if (view==='stations' && company) return (
    <div style={{padding:'0 0 24px'}}>
      <div style={{background:`linear-gradient(135deg,${company.color},#C47D2A)`,padding:'16px'}}>
        <button onClick={()=>setView('companies')} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'8px',padding:'6px 12px',color:'#fff',fontSize:'12px',fontWeight:'700',cursor:'pointer',marginBottom:'10px'}}>Volver</button>
        <div style={{fontSize:'17px',fontWeight:'800',color:'#fff'}}>{company.nombre}</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{company.estaciones.length} estaciones en Guinea Ecuatorial</div>
      </div>
      <div style={{display:'flex',gap:'6px',padding:'10px 16px 6px',overflowX:'auto'}}>
        {['Malabo','Bata','Ebebiyin','Mongomo','Todas'].map(c=>(<button key={c} onClick={()=>setCity(c)} style={{flexShrink:0,background:city===c?company.color:'#fff',border:`1px solid ${city===c?company.color:'#E5E7EB'}`,borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',color:city===c?'#fff':'#6B7280',cursor:'pointer'}}>{c}</button>))}
      </div>
      <div style={{padding:'0 16px'}}>
        {company.estaciones.filter((s:any)=>city==='Todas'||s.ciudad===city).map((s:any,i:number)=>(
          <div key={i} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'10px',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid #F0F2F5'}}>
            <div style={{fontSize:'14px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>{s.nombre}</div>
            <div style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'8px'}}>{s.barrio}, {s.ciudad} - {s.horario}</div>
            <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
              {FUELS.map(f=>(<div key={f.id} style={{flex:1,background:f.color+'12',borderRadius:'8px',padding:'6px',textAlign:'center'}}><div style={{fontSize:'9px',color:f.color,fontWeight:'700'}}>{f.label.split(' ')[0]}</div><div style={{fontSize:'13px',fontWeight:'800',color:f.color}}>{s[f.id]}</div><div style={{fontSize:'8px',color:'#9CA3AF'}}>XAF/L</div></div>))}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(s.nombre+' '+s.ciudad+' Guinea Ecuatorial')}`} target="_blank" rel="noopener noreferrer" style={{flex:1,background:'#EFF5FD',border:'1px solid #BFDBFE',borderRadius:'10px',padding:'9px',fontSize:'12px',fontWeight:'700',color:'#1B3A6B',cursor:'pointer',textDecoration:'none',textAlign:'center' as const}}>GPS</a>
              <button onClick={()=>{setStation(s);setView('pay');}} style={{flex:2,background:`linear-gradient(135deg,${company.color},#C47D2A)`,border:'none',borderRadius:'10px',padding:'9px',fontSize:'12px',fontWeight:'700',color:'#fff',cursor:'pointer'}}>Pagar combustible</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{padding:'0 0 24px'}}>
      <div style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',padding:'16px 16px 12px'}}>
        <div style={{fontSize:'18px',fontWeight:'800',color:'#fff',marginBottom:'4px'}}>Gasolineras</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>Companias en Guinea Ecuatorial - Precios actualizados</div>
      </div>
      <div style={{padding:'14px 16px 0'}}>
        <div style={{background:'#FEF3C7',borderRadius:'12px',padding:'12px 14px',marginBottom:'14px',border:'1px solid #FDE68A'}}>
          <div style={{fontSize:'11px',fontWeight:'700',color:'#92400E',marginBottom:'6px'}}>Precios de referencia (XAF/L)</div>
          <div style={{display:'flex',gap:'8px'}}>
            {FUELS.map(f=>(<div key={f.id} style={{flex:1,textAlign:'center'}}><div style={{fontSize:'9px',color:f.color,fontWeight:'700'}}>{f.label.split(' ')[0]}</div><div style={{fontSize:'16px',fontWeight:'900',color:f.color}}>{f.id==='g95'?650:f.id==='diesel'?580:450}</div></div>))}
          </div>
        </div>
        {COMPANIAS_GAS.map(c=>(
          <div key={c.id} onClick={()=>{setCompany(c);setCity('Malabo');setView('stations');}} style={{background:'#fff',borderRadius:'14px',padding:'14px',marginBottom:'10px',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.07)',border:'1px solid #F0F2F5',display:'flex',alignItems:'center',gap:'14px'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#F9FAFB';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#fff';}}>
            <div style={{width:'48px',height:'48px',borderRadius:'12px',background:c.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'800',color:c.color,flexShrink:0}}>{c.nombre.slice(0,3).toUpperCase()}</div>
            <div style={{flex:1}}><div style={{fontSize:'15px',fontWeight:'700',color:'#111827'}}>{c.nombre}</div><div style={{fontSize:'11px',color:'#9CA3AF'}}>{c.estaciones.length} estaciones - Malabo, Bata y mas</div></div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
    </div>
  );
};
