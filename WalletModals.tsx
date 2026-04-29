import React from 'react';

// ── SVG icons profesionales sin fondo ────────────────────────────
const IcoBanco = ({c='#1B3A6B'}:{c?:string}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="10" width="18" height="11" rx="2"/><path d="M3 10l9-7 9 7"/><line x1="12" y1="10" x2="12" y2="21"/><line x1="7" y1="14" x2="7" y2="17"/><line x1="17" y1="14" x2="17" y2="17"/>
  </svg>
);
const IcoTransfer = ({c='#065F46'}:{c?:string}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);
const IcoCodigo = ({c='#92400E'}:{c?:string}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/><line x1="7" y1="17" x2="10" y2="17"/>
  </svg>
);
const IcoEfectivo = ({c='#4C1D95'}:{c?:string}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>
  </svg>
);
const IcoTarjeta = ({c='#1B3A6B'}:{c?:string}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>
  </svg>
);
const IcoAgente = ({c='#4C1D95'}:{c?:string}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

// ── Encabezado de sección suave ───────────────────────────────────
const SectionHead = ({title,sub,color,icon}:{title:string;sub:string;color:string;icon:React.ReactNode}) => (
  <div style={{background:color,borderRadius:'16px',padding:'16px 18px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'14px'}}>
    <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontSize:'15px',fontWeight:'800',color:'#fff'}}>{title}</div>
      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.75)',marginTop:'2px'}}>{sub}</div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════
// MODAL RECARGA
// ══════════════════════════════════════════════════════════════════
type RStep = 'menu'|'banco'|'transferencia'|'codigo'|'efectivo'|'confirm'|'success';

export const RecargaMonederoModal: React.FC<{onClose:()=>void;userBalance:number;onCredit:(n:number)=>void}> = ({onClose,userBalance,onCredit}) => {
  const [step,setStep] = React.useState<RStep>('menu');
  const [data,setData] = React.useState<Record<string,string>>({});
  const set = (k:string,v:string) => setData(p=>({...p,[k]:v}));
  const close = () => onClose();
  const goBack = () => step==='menu'?close():setStep('menu');
  const amountNum = parseInt(data.amount||'0');
  const isValid = amountNum>=1000;

  const METODOS = [
    {id:'banco',        label:'Desde banco',          sub:'Transferencia bancaria desde tu cuenta', color:'#1B3A6B', icon:<IcoBanco/>},
    {id:'transferencia',label:'Transferencia EGCHAT',  sub:'Recibe de otro usuario EGCHAT',          color:'#065F46', icon:<IcoTransfer c="#065F46"/>},
    {id:'codigo',       label:'Código de recarga',     sub:'Introduce un código de recarga prepago', color:'#92400E', icon:<IcoCodigo/>},
    {id:'efectivo',     label:'Depósito en efectivo',  sub:'En agentes autorizados EGCHAT',          color:'#4C1D95', icon:<IcoEfectivo/>},
  ];
  const TITLES:Record<RStep,string> = {menu:'Recargar monedero',banco:'Desde banco',transferencia:'Transferencia EGCHAT',codigo:'Código de recarga',efectivo:'Depósito en efectivo',confirm:'Confirmar recarga',success:'¡Recarga completada!'};

  const Field = ({k,l,t,icon}:{k:string;l:string;t:string;icon:React.ReactNode}) => (
    <div style={{background:'#fff',borderRadius:'10px',padding:'0 14px',height:'52px',display:'flex',alignItems:'center',border:'1px solid #F0F2F5',gap:'10px',marginBottom:'8px'}}>
      <div style={{color:'#9CA3AF',flexShrink:0}}>{icon}</div>
      <input type={t} placeholder={l} value={data[k]||''} onChange={e=>set(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#111827',fontFamily:'inherit'}}/>
    </div>
  );

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:4000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
      <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'4px',flexShrink:0}}><div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#D1D5DB'}}/></div>
        <div style={{padding:'4px 16px 12px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0,background:'#fff',borderBottom:'1px solid #F0F2F5'}}>
          <button onClick={goBack} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}><div style={{fontSize:'16px',fontWeight:'700',color:'#111827'}}>{TITLES[step]}</div><div style={{fontSize:'11px',color:'#9CA3AF'}}>Saldo: {userBalance.toLocaleString()} XAF</div></div>
          <button onClick={close} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'30px',height:'30px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'14px'}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 32px'}}>

          {step==='menu'&&<div>
            <SectionHead title="Monedero EGCHAT" sub={`${userBalance.toLocaleString()} XAF disponibles`} color="linear-gradient(135deg,#1A3A6B,#0E5F8A)" icon={<IcoTarjeta c="#fff"/>}/>
            <div style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Método de recarga</div>
            {METODOS.map(m=>(
              <button key={m.id} onClick={()=>setStep(m.id as RStep)} style={{width:'100%',background:'#fff',border:'1px solid #F0F2F5',borderRadius:'14px',padding:'14px',marginBottom:'8px',cursor:'pointer',outline:'none',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',textAlign:'left'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#F9FAFB';}} onMouseLeave={e=>{e.currentTarget.style.background='#fff';}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:m.color}}>{m.icon}</div>
                <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'700',color:'#111827'}}>{m.label}</div><div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'2px'}}>{m.sub}</div></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>}

          {step==='banco'&&<div>
            <SectionHead title="Transferencia bancaria" sub="Datos para realizar el ingreso" color="linear-gradient(135deg,#1B3A6B,#2A5298)" icon={<IcoBanco c="#fff"/>}/>
            <div style={{background:'#EFF5FD',borderRadius:'12px',padding:'14px',marginBottom:'14px',border:'1px solid #BFDBFE'}}>
              {[['Beneficiario','EGCHAT S.A.'],['Banco','BANGE / CCEI / BGFI'],['Cuenta','GQ-EGCHAT-001-2026'],['Concepto','Recarga EGCHAT + tu teléfono']].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #DBEAFE'}}>
                  <span style={{fontSize:'11px',color:'#6B7280'}}>{l}</span><span style={{fontSize:'11px',fontWeight:'700',color:'#1B3A6B'}}>{v}</span>
                </div>
              ))}
            </div>
            <Field k="amount" l="Importe (mín. 1,000 XAF)" t="number" icon={<IcoEfectivo c="#9CA3AF"/>}/>
            <div style={{background:'#fff',borderRadius:'10px',padding:'0 14px',height:'52px',display:'flex',alignItems:'center',border:'1px solid #F0F2F5',gap:'10px',marginBottom:'14px'}}>
              <IcoBanco c="#9CA3AF"/>
              <select value={data.banco||''} onChange={e=>set('banco',e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit',cursor:'pointer'}}>
                <option value="">Selecciona tu banco</option>
                {['BANGE','CCEI Bank','BGFI Bank','Ecobank','Societe Generale'].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div style={{background:'#FEF3C7',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',fontSize:'11px',color:'#92400E',display:'flex',gap:'8px',alignItems:'flex-start'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>La recarga se acredita en 1-24h tras confirmar la transferencia.</span>
            </div>
            <button onClick={()=>{if(isValid&&data.banco)setStep('confirm');}} style={{width:'100%',background:isValid&&data.banco?'linear-gradient(135deg,#1B3A6B,#0E5F8A)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:isValid&&data.banco?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:isValid&&data.banco?'pointer':'default'}}>
              Confirmar {isValid?` -  ${amountNum.toLocaleString()} XAF`:''}
            </button>
          </div>}

          {step==='transferencia'&&<div>
            <SectionHead title="Transferencia EGCHAT" sub="Solicita dinero a otro usuario" color="linear-gradient(135deg,#065F46,#00c8a0)" icon={<IcoTransfer c="#fff"/>}/>
            <div style={{background:'#fff',borderRadius:'14px',padding:'20px',marginBottom:'14px',textAlign:'center',border:'1px solid #F0F2F5'}}>
              <div style={{width:'100px',height:'100px',margin:'0 auto 12px',background:'#F0FDF9',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg>
              </div>
              <div style={{fontSize:'13px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>+240 222 *** ***</div>
              <div style={{fontSize:'11px',color:'#9CA3AF'}}>Muestra este QR para recibir</div>
            </div>
            <Field k="amount" l="Importe a solicitar (XAF)" t="number" icon={<IcoEfectivo c="#9CA3AF"/>}/>
            <Field k="remitente" l="Teléfono del remitente (opcional)" t="tel" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}/>
            <button onClick={()=>setStep('success')} style={{width:'100%',background:'linear-gradient(135deg,#065F46,#00c8a0)',border:'none',borderRadius:'12px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Generar solicitud de pago</button>
          </div>}

          {step==='codigo'&&<div>
            <SectionHead title="Código de recarga" sub="Canjea tu voucher prepago" color="linear-gradient(135deg,#92400E,#D97706)" icon={<IcoCodigo c="#fff"/>}/>
            <div style={{background:'#fff',borderRadius:'12px',padding:'16px 14px',marginBottom:'14px',border:'1.5px solid #F0F2F5'}}>
              <div style={{fontSize:'11px',color:'#9CA3AF',marginBottom:'8px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px'}}>Código de 16 dígitos</div>
              <input type="text" placeholder="XXXX-XXXX-XXXX-XXXX" maxLength={19} value={data.codigo||''} onChange={e=>{let v=e.target.value.replace(/[^0-9]/g,'').slice(0,16);v=v.replace(/(.{4})/g,'$1-').replace(/-$/,'');set('codigo',v);}} style={{width:'100%',background:'none',border:'none',outline:'none',fontSize:'20px',fontWeight:'800',color:'#111827',fontFamily:'monospace',letterSpacing:'3px',textAlign:'center',boxSizing:'border-box'}}/>
            </div>
            <div style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Denominaciones</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
              {[1000,2000,5000,10000,25000,50000].map(v=>(
                <button key={v} onClick={()=>set('amount',String(v))} style={{background:data.amount===String(v)?'#FFFBEB':'#fff',border:`1.5px solid ${data.amount===String(v)?'#F59E0B':'#F0F2F5'}`,borderRadius:'10px',padding:'10px 6px',cursor:'pointer',textAlign:'center'}}>
                  <div style={{fontSize:'12px',fontWeight:'800',color:data.amount===String(v)?'#92400E':'#111827'}}>{v.toLocaleString()}</div>
                  <div style={{fontSize:'9px',color:'#9CA3AF'}}>XAF</div>
                </button>
              ))}
            </div>
            <button onClick={()=>{if(data.codigo&&data.codigo.replace(/-/g,'').length===16){onCredit(parseInt(data.amount||'5000'));setStep('success');}}} style={{width:'100%',background:data.codigo&&data.codigo.replace(/-/g,'').length===16?'linear-gradient(135deg,#92400E,#D97706)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:data.codigo&&data.codigo.replace(/-/g,'').length===16?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:data.codigo&&data.codigo.replace(/-/g,'').length===16?'pointer':'default'}}>Canjear código</button>
          </div>}

          {step==='efectivo'&&<div>
            <SectionHead title="Depósito en efectivo" sub="Agentes autorizados EGCHAT" color="linear-gradient(135deg,#4C1D95,#6B5BD6)" icon={<IcoAgente c="#fff"/>}/>
            {[
              {nombre:'Agente EGCHAT Centro',dir:'Av. de la Independencia, Malabo',horario:'L-S 8:00-20:00',tel:'+240 222 30 00 01'},
              {nombre:'Agente EGCHAT Caracolas',dir:'Barrio Caracolas, Malabo',horario:'L-D 8:00-21:00',tel:'+240 222 30 00 02'},
              {nombre:'Agente EGCHAT Ela Nguema',dir:'Ela Nguema, Malabo',horario:'L-S 8:00-19:00',tel:'+240 222 30 00 03'},
              {nombre:'Agente EGCHAT Bata Centro',dir:'Centro de Bata',horario:'L-D 8:00-21:00',tel:'+240 222 30 00 04'},
            ].map(a=>(
              <div key={a.nombre} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',border:'1px solid #F0F2F5',display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#4C1D95'}}><IcoAgente c="#4C1D95"/></div>
                <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{a.nombre}</div><div style={{fontSize:'10px',color:'#9CA3AF'}}>📍 {a.dir}  -  🕐 {a.horario}</div></div>
                <a href={`tel:${a.tel}`} style={{background:'#F5F3FF',border:'none',borderRadius:'8px',padding:'7px 10px',fontSize:'11px',fontWeight:'700',color:'#4C1D95',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px'}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Llamar
                </a>
              </div>
            ))}
            <div style={{background:'#F5F3FF',borderRadius:'12px',padding:'12px 14px',marginTop:'4px',fontSize:'12px',color:'#4C1D95',fontWeight:'600',textAlign:'center',border:'1px solid #DDD6FE'}}>
              Muestra tu número al agente: <span style={{fontWeight:'900'}}>+240 222 *** ***</span>
            </div>
          </div>}

          {step==='confirm'&&<div>
            <SectionHead title="Confirmar recarga" sub="Revisa los datos antes de continuar" color="linear-gradient(135deg,#1B3A6B,#2A5298)" icon={<IcoBanco c="#fff"/>}/>
            <div style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'14px',border:'1px solid #F0F2F5'}}>
              {[['Método','Transferencia bancaria'],['Banco',data.banco||''],['Importe',`${amountNum.toLocaleString()} XAF`],['Cuenta destino','GQ-EGCHAT-001-2026']].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F3F4F6'}}>
                  <span style={{fontSize:'12px',color:'#6B7280'}}>{l}</span><span style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',paddingTop:'10px'}}>
                <span style={{fontSize:'14px',fontWeight:'700',color:'#374151'}}>Total</span>
                <span style={{fontSize:'20px',fontWeight:'900',color:'#1B3A6B'}}>{amountNum.toLocaleString()} XAF</span>
              </div>
            </div>
            <button onClick={()=>setStep('success')} style={{width:'100%',background:'linear-gradient(135deg,#1B3A6B,#0E5F8A)',border:'none',borderRadius:'12px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>He realizado la transferencia</button>
          </div>}

          {step==='success'&&<div style={{textAlign:'center',padding:'30px 0'}}>
            <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'linear-gradient(135deg,#00c8a0,#00b4e6)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:'0 8px 24px rgba(0,200,160,0.3)'}}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{fontSize:'20px',fontWeight:'900',color:'#111827',marginBottom:'6px'}}>{data.codigo?'¡Código canjeado!':data.remitente?'¡Solicitud enviada!':'¡Solicitud registrada!'}</div>
            <div style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'20px',lineHeight:'1.5',padding:'0 16px'}}>{data.codigo?`+${parseInt(data.amount||'5000').toLocaleString()} XAF añadidos`:data.remitente?'El usuario recibirá tu solicitud':'Se acreditará en breve.'}</div>
            <div style={{background:'#F0FDF9',borderRadius:'14px',padding:'16px',marginBottom:'20px',textAlign:'left',border:'1px solid #A7F3D0'}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:'#065F46',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Referencia</div>
              <div style={{fontSize:'14px',fontWeight:'800',color:'#111827',fontFamily:'monospace'}}>EGC-REC-{Date.now().toString().slice(-8)}</div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:'10px',paddingTop:'10px',borderTop:'1px solid #D1FAE5'}}>
                <span style={{fontSize:'12px',color:'#6B7280'}}>Saldo actual</span>
                <span style={{fontSize:'16px',fontWeight:'900',color:'#00c8a0'}}>{userBalance.toLocaleString()} XAF</span>
              </div>
            </div>
            <button onClick={close} style={{background:'linear-gradient(135deg,#00c8a0,#00b4e6)',border:'none',borderRadius:'12px',padding:'13px 40px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Cerrar</button>
          </div>}

        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MODAL RETIRO
// ══════════════════════════════════════════════════════════════════
type WStep = 'menu'|'tarjeta'|'banco'|'agente'|'confirm'|'success';

export const RetiroMonederoModal: React.FC<{onClose:()=>void;userBalance:number;onDebit:(n:number)=>void}> = ({onClose,userBalance,onDebit}) => {
  const [step,setStep] = React.useState<WStep>('menu');
  const [data,setData] = React.useState<Record<string,string>>({});
  const set = (k:string,v:string) => setData(p=>({...p,[k]:v}));
  const close = () => onClose();
  const goBack = () => step==='menu'?close():setStep('menu');
  const amountNum = parseInt(data.amount||'0');
  const isValid = amountNum>=1000 && amountNum<=userBalance;

  const METODOS = [
    {id:'tarjeta',label:'Retirar a tarjeta',    sub:'Tarjeta bancaria vinculada  -  1-3 días', color:'#1B3A6B', icon:<IcoTarjeta/>},
    {id:'banco',  label:'Transferencia bancaria',sub:'A tu cuenta bancaria en GQ  -  1-2 días', color:'#065F46', icon:<IcoBanco c="#065F46"/>},
    {id:'agente', label:'Retirar en agente',     sub:'Efectivo inmediato en agentes EGCHAT',  color:'#4C1D95', icon:<IcoAgente/>},
  ];
  const TITLES:Record<WStep,string> = {menu:'Retirar dinero',tarjeta:'Retirar a tarjeta',banco:'Transferencia bancaria',agente:'Retirar en agente',confirm:'Confirmar retiro',success:'¡Retiro procesado!'};

  const Field = ({k,l,t,icon}:{k:string;l:string;t:string;icon:React.ReactNode}) => (
    <div style={{background:'#fff',borderRadius:'10px',padding:'0 14px',height:'52px',display:'flex',alignItems:'center',border:'1px solid #F0F2F5',gap:'10px',marginBottom:'8px'}}>
      <div style={{color:'#9CA3AF',flexShrink:0}}>{icon}</div>
      <input type={t} placeholder={l} value={data[k]||''} onChange={e=>set(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#111827',fontFamily:'inherit'}}/>
    </div>
  );

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:4000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
      <div style={{background:'rgba(247,248,250,0.55)',backdropFilter:'blur(28px) saturate(180%)',WebkitBackdropFilter:'blur(28px) saturate(180%)',borderRadius:'20px 20px 0 0',border:'1.5px solid rgba(255,255,255,0.6)',borderBottom:'none',width:'100%',maxWidth:'420px',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'center',paddingTop:'10px',paddingBottom:'4px',flexShrink:0}}><div style={{width:'36px',height:'4px',borderRadius:'2px',background:'#D1D5DB'}}/></div>
        <div style={{padding:'4px 16px 12px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0,background:'#fff',borderBottom:'1px solid #F0F2F5'}}>
          <button onClick={goBack} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}><div style={{fontSize:'16px',fontWeight:'700',color:'#111827'}}>{TITLES[step]}</div><div style={{fontSize:'11px',color:'#9CA3AF'}}>Disponible: {userBalance.toLocaleString()} XAF</div></div>
          <button onClick={close} style={{background:'#EAECEF',border:'none',borderRadius:'50%',width:'30px',height:'30px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6B7280',fontSize:'14px'}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px 32px'}}>

          {step==='menu'&&<div>
            <SectionHead title="Retirar dinero" sub={`${userBalance.toLocaleString()} XAF disponibles`} color="linear-gradient(135deg,#4C1D95,#6B5BD6)" icon={<IcoEfectivo c="#fff"/>}/>
            <div style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Método de retiro</div>
            {METODOS.map(m=>(
              <button key={m.id} onClick={()=>setStep(m.id as WStep)} style={{width:'100%',background:'#fff',border:'1px solid #F0F2F5',borderRadius:'14px',padding:'14px',marginBottom:'8px',cursor:'pointer',outline:'none',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',textAlign:'left'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#F9FAFB';}} onMouseLeave={e=>{e.currentTarget.style.background='#fff';}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:m.color}}>{m.icon}</div>
                <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'700',color:'#111827'}}>{m.label}</div><div style={{fontSize:'11px',color:'#9CA3AF',marginTop:'2px'}}>{m.sub}</div></div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>}

          {step==='tarjeta'&&<div>
            <SectionHead title="Retirar a tarjeta" sub="Transferencia a tarjeta bancaria" color="linear-gradient(135deg,#1B3A6B,#2A5298)" icon={<IcoTarjeta c="#fff"/>}/>
            <Field k="amount" l="Importe a retirar (mín. 1,000 XAF)" t="number" icon={<IcoEfectivo c="#9CA3AF"/>}/>
            <Field k="cardNumber" l="Últimos 4 dígitos de la tarjeta" t="text" icon={<IcoTarjeta c="#9CA3AF"/>}/>
            <Field k="pin" l="PIN de confirmación" t="password" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}/>
            {amountNum>userBalance&&amountNum>0&&<div style={{background:'#FEF2F2',borderRadius:'10px',padding:'10px 14px',marginBottom:'8px',fontSize:'11px',color:'#C0392B',fontWeight:'600',display:'flex',gap:'6px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Saldo insuficiente</div>}
            <button onClick={()=>{if(isValid&&data.cardNumber&&data.pin)setStep('confirm');}} style={{width:'100%',background:isValid&&data.cardNumber&&data.pin?'linear-gradient(135deg,#1B3A6B,#0E5F8A)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:isValid&&data.cardNumber&&data.pin?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:isValid&&data.cardNumber&&data.pin?'pointer':'default',marginTop:'6px'}}>
              Continuar {isValid?` -  ${amountNum.toLocaleString()} XAF`:''}
            </button>
          </div>}

          {step==='banco'&&<div>
            <SectionHead title="Transferencia bancaria" sub="A tu cuenta bancaria en GQ" color="linear-gradient(135deg,#065F46,#00c8a0)" icon={<IcoBanco c="#fff"/>}/>
            <Field k="amount" l="Importe a retirar (mín. 1,000 XAF)" t="number" icon={<IcoEfectivo c="#9CA3AF"/>}/>
            <Field k="banco" l="Banco destino" t="text" icon={<IcoBanco c="#9CA3AF"/>}/>
            <Field k="cuenta" l="Número de cuenta bancaria" t="text" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/></svg>}/>
            <Field k="titular" l="Titular de la cuenta" t="text" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.7" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}/>
            {amountNum>userBalance&&amountNum>0&&<div style={{background:'#FEF2F2',borderRadius:'10px',padding:'10px 14px',marginBottom:'8px',fontSize:'11px',color:'#C0392B',fontWeight:'600',display:'flex',gap:'6px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Saldo insuficiente</div>}
            <button onClick={()=>{if(isValid&&data.banco&&data.cuenta&&data.titular)setStep('confirm');}} style={{width:'100%',background:isValid&&data.banco&&data.cuenta&&data.titular?'linear-gradient(135deg,#065F46,#00c8a0)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:isValid&&data.banco&&data.cuenta&&data.titular?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:isValid&&data.banco&&data.cuenta&&data.titular?'pointer':'default',marginTop:'6px'}}>
              Continuar {isValid?` -  ${amountNum.toLocaleString()} XAF`:''}
            </button>
          </div>}

          {step==='agente'&&<div>
            <SectionHead title="Retirar en agente" sub="Efectivo inmediato en agentes EGCHAT" color="linear-gradient(135deg,#4C1D95,#6B5BD6)" icon={<IcoAgente c="#fff"/>}/>
            <Field k="amount" l="Importe a retirar (mín. 1,000 XAF)" t="number" icon={<IcoEfectivo c="#9CA3AF"/>}/>
            {amountNum>userBalance&&amountNum>0&&<div style={{background:'#FEF2F2',borderRadius:'10px',padding:'10px 14px',marginBottom:'8px',fontSize:'11px',color:'#C0392B',fontWeight:'600',display:'flex',gap:'6px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Saldo insuficiente</div>}
            {[
              {nombre:'Agente EGCHAT Centro',dir:'Av. de la Independencia, Malabo',tel:'+240 222 30 00 01'},
              {nombre:'Agente EGCHAT Caracolas',dir:'Barrio Caracolas, Malabo',tel:'+240 222 30 00 02'},
              {nombre:'Agente EGCHAT Bata Centro',dir:'Centro de Bata',tel:'+240 222 30 00 04'},
            ].map(a=>(
              <div key={a.nombre} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',border:'1px solid #F0F2F5',display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#4C1D95'}}><IcoAgente c="#4C1D95"/></div>
                <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{a.nombre}</div><div style={{fontSize:'10px',color:'#9CA3AF'}}>📍 {a.dir}</div></div>
                <a href={`tel:${a.tel}`} style={{background:'#F5F3FF',border:'none',borderRadius:'8px',padding:'7px 10px',fontSize:'11px',fontWeight:'700',color:'#4C1D95',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px'}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Llamar
                </a>
              </div>
            ))}
            <button onClick={()=>{if(isValid)setStep('confirm');}} style={{width:'100%',background:isValid?'linear-gradient(135deg,#4C1D95,#6B5BD6)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:isValid?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:isValid?'pointer':'default',marginTop:'8px'}}>
              Generar código de retiro {isValid?` -  ${amountNum.toLocaleString()} XAF`:''}
            </button>
          </div>}

          {step==='confirm'&&<div>
            <SectionHead title="Confirmar retiro" sub="Revisa antes de confirmar" color="linear-gradient(135deg,#C0392B,#E74C3C)" icon={<IcoEfectivo c="#fff"/>}/>
            <div style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'14px',border:'1px solid #F0F2F5'}}>
              {[['Importe',`${amountNum.toLocaleString()} XAF`],['Método',data.cardNumber?'Tarjeta bancaria':data.cuenta?'Transferencia bancaria':'Agente EGCHAT'],['Saldo tras retiro',`${(userBalance-amountNum).toLocaleString()} XAF`]].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #F3F4F6'}}>
                  <span style={{fontSize:'12px',color:'#6B7280'}}>{l}</span><span style={{fontSize:'12px',fontWeight:'700',color:'#111827'}}>{v}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',paddingTop:'10px'}}>
                <span style={{fontSize:'14px',fontWeight:'700',color:'#374151'}}>Total a retirar</span>
                <span style={{fontSize:'20px',fontWeight:'900',color:'#C0392B'}}>{amountNum.toLocaleString()} XAF</span>
              </div>
            </div>
            <div style={{background:'#FEF2F2',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',fontSize:'11px',color:'#C0392B',display:'flex',gap:'8px',alignItems:'flex-start'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>Esta operación debitará {amountNum.toLocaleString()} XAF de tu monedero. No se puede deshacer.</span>
            </div>
            <button onClick={()=>{onDebit(amountNum);setStep('success');}} style={{width:'100%',background:'linear-gradient(135deg,#C0392B,#E74C3C)',border:'none',borderRadius:'12px',padding:'14px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer',marginBottom:'8px'}}>
              Confirmar retiro  -  {amountNum.toLocaleString()} XAF
            </button>
            <button onClick={()=>setStep('menu')} style={{width:'100%',background:'none',border:'none',padding:'10px',color:'#9CA3AF',fontSize:'12px',cursor:'pointer'}}>Cancelar</button>
          </div>}

          {step==='success'&&<div style={{textAlign:'center',padding:'30px 0'}}>
            <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'linear-gradient(135deg,#4C1D95,#6B5BD6)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',boxShadow:'0 8px 24px rgba(76,29,149,0.3)'}}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{fontSize:'20px',fontWeight:'900',color:'#111827',marginBottom:'6px'}}>¡Retiro procesado!</div>
            <div style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'20px',lineHeight:'1.5',padding:'0 16px'}}>{data.cardNumber?'Llegará a tu tarjeta en 1-3 días hábiles.':data.cuenta?'Llegará a tu cuenta en 1-2 días hábiles.':'Acude al agente con tu código.'}</div>
            <div style={{background:'#F5F3FF',borderRadius:'14px',padding:'16px',marginBottom:'20px',textAlign:'left',border:'1px solid #DDD6FE'}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:'#4C1D95',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Referencia</div>
              <div style={{fontSize:'14px',fontWeight:'800',color:'#111827',fontFamily:'monospace'}}>EGC-RET-{Date.now().toString().slice(-8)}</div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:'10px',paddingTop:'10px',borderTop:'1px solid #DDD6FE'}}>
                <span style={{fontSize:'12px',color:'#6B7280'}}>Nuevo saldo</span>
                <span style={{fontSize:'16px',fontWeight:'900',color:'#4C1D95'}}>{userBalance.toLocaleString()} XAF</span>
              </div>
            </div>
            <button onClick={close} style={{background:'linear-gradient(135deg,#4C1D95,#6B5BD6)',border:'none',borderRadius:'12px',padding:'13px 40px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Cerrar</button>
          </div>}

        </div>
      </div>
    </div>
  );
};
