import React, { useState } from 'react';

const BANKS = [
  { id:'bange',   name:'BANGE',       full:'Banco Nacional de Guinea Ecuatorial',                        founded:2006, color:'#003082', color2:'#0052CC', initials:'BN', desc:'Banco nacional con capital ecuatoguineano. Principal institución financiera del Estado.',          address:'Av. de la Independencia, Malabo', phone:'+240 333 09 10 00', web:'bange.gq',      swift:'BANGEGQXX', branches:8, atms:12, services:['Cuenta Corriente','Cuenta de Ahorros','Transferencias Nacionales','Transferencias CEMAC','Préstamos Personales','Préstamos Empresariales','Hipotecas','Tarjeta de Débito','Tarjeta de Crédito','Pago de Facturas','Cambio de Divisas','Banca Digital','Depósitos a Plazo','Seguros Bancarios'], accounts:[{type:'Cuenta Corriente',number:'****4521',balance:45200},{type:'Cuenta Ahorros',number:'****8834',balance:120000}] },
  { id:'ccei',    name:'CCEI Bank GE', full:"Crédit Communautaire d'Afrique — Guinea Ecuatorial",       founded:1994, color:'#C8102E', color2:'#E8192C', initials:'CC', desc:'Filial del grupo Afriland First Bank. Pionero en Guinea Ecuatorial desde 1994.',               address:'Calle del Presidente Obiang, Malabo', phone:'+240 333 09 20 00', web:'cceibank.gq', swift:'CCEIGQXX', branches:6, atms:9,  services:['Cuenta Corriente','Cuenta de Ahorros','Transferencias Internacionales','Pagos Móviles','Consulta de Cuenta','Inversiones','Tarjetas Bancarias','Seguros','Créditos Personales','Créditos Empresariales','Comercio Exterior','Banca Digital','Depósitos a Plazo','Remesas Internacionales'], accounts:[{type:'Cuenta Corriente',number:'****7712',balance:80000}] },
  { id:'bgfi',    name:'BGFIBank GE',  full:'Banque Gabonaise et Française Internationale — GE',         founded:2001, color:'#00539B', color2:'#0070CC', initials:'BG', desc:'Grupo financiero panafricano en 10 países. Especializado en empresas y grandes cuentas.',    address:'Av. Hassan II, Malabo',              phone:'+240 333 09 30 00', web:'bgfi.gq',      swift:'BGFIGQXX',  branches:5, atms:7,  services:['Banca Corporativa','Banca Personal','Pagos QR','Consultas Online','Créditos','Ahorros','Comercio Exterior','Financiamiento de Proyectos','Gestión de Tesorería','Tarjetas Premium','Banca Digital','Inversiones','Seguros Corporativos','Leasing'], accounts:[] },
  { id:'ecobank', name:'Ecobank GE',   full:'Ecobank Equatorial Guinea — Ecobank Transnational Inc.',    founded:2010, color:'#00A3E0', color2:'#0077B6', initials:'EC', desc:'Banco panafricano en 35 países. Líder en banca móvil y pagos digitales en África.',          address:'Calle de Argelia, Malabo',           phone:'+240 333 09 40 00', web:'ecobank.com',  swift:'ECOBGQXX',  branches:4, atms:8,  services:['Banca Móvil Xpress','Transferencias Pan-Africanas','Cuenta Corriente','Cuenta de Ahorros','Tarjeta Ecobank','Pagos Móviles','Préstamos Personales','Préstamos PYME','Remesas Internacionales','Cambio de Divisas','Banca Digital','Depósitos','Seguros','Inversiones'], accounts:[] },
  { id:'cbge',    name:'CBGE',         full:'Commercial Bank Guinée Equatoriale',                        founded:2008, color:'#1B5E20', color2:'#2E7D32', initials:'CB', desc:'Filial del Commercial Bank Group. Enfocado en financiamiento comercial y empresarial.',      address:'Av. de la Libertad, Malabo',         phone:'+240 333 09 50 00', web:'cbge.gq',      swift:'CBGEGQXX',  branches:3, atms:5,  services:['Cuenta Corriente Empresarial','Financiamiento Comercial','Cartas de Crédito','Garantías Bancarias','Préstamos Empresariales','Gestión de Tesorería','Pagos Internacionales','Cambio de Divisas','Banca Digital','Depósitos Empresariales','Consultoría Financiera','Leasing Empresarial'], accounts:[] },
];

type Bank = typeof BANKS[0];
type BScreen = 'home'|'detail'|'transfer'|'loan'|'bills'|'invest'|'cards'|'history'|'success';

export const BancosModal: React.FC<{ onClose:()=>void; userBalance:number; onDebit:(n:number)=>void }> = ({ onClose, userBalance, onDebit }) => {
  const [screen, setScreen] = useState<BScreen>('home');
  const [bank, setBank]     = useState<Bank|null>(null);
  const [form, setForm]     = useState<Record<string,string>>({});
  const [msg,  setMsg]      = useState('');

  const totalBalance = BANKS.flatMap(b => b.accounts).reduce((s,a) => s + a.balance, 0);
  const grad = bank ? `linear-gradient(135deg,${bank.color},${bank.color2})` : 'linear-gradient(135deg,#1485EE,#0052CC)';
  const setF = (k:string, v:string) => setForm(p => ({...p,[k]:v}));
  const ok   = (m:string) => { setMsg(m); setScreen('success'); setForm({}); };
  const back = () => { if(screen==='home'){onClose();} else if(screen==='detail'){setScreen('home');} else if(screen==='success'){setScreen('detail');} else {setScreen('detail');} };

  const title: Record<BScreen,string> = { home:'Bancos', detail:bank?.name||'', transfer:'Transferencia', loan:'Préstamos', bills:'Pagar Factura', invest:'Inversiones', cards:'Mis Tarjetas', history:'Historial', success:'Completado' };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:3000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'#F0F4F8',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:'420px',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* Header */}
        <div style={{background:grad,padding:'14px 16px 12px',display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
          <button onClick={back} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:'16px'}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px',fontWeight:'800',color:'#fff'}}>{title[screen]}</div>
            {screen==='home' && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>Guinea Ecuatorial  -  {BANKS.length} bancos</div>}
            {screen==='detail' && bank && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{bank.full}</div>}
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:'16px'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'12px 14px 24px'}}>


          {/* HOME */}
          {screen==='home' && <div>
            <div style={{background:'linear-gradient(135deg,#1485EE,#0052CC)',borderRadius:'16px',padding:'18px',marginBottom:'14px',color:'#fff'}}>
              <div style={{fontSize:'11px',opacity:0.8,marginBottom:'4px'}}>Saldo total en todos los bancos</div>
              <div style={{fontSize:'30px',fontWeight:'900',letterSpacing:'-1px'}}>{totalBalance.toLocaleString()} <span style={{fontSize:'14px',fontWeight:'500',opacity:0.8}}>XAF</span></div>
              <div style={{fontSize:'11px',opacity:0.7,marginTop:'4px'}}>{BANKS.filter(b=>b.accounts.length>0).length} cuentas activas  -  {BANKS.length} bancos</div>
            </div>
            {BANKS.filter(b=>b.accounts.length>0).flatMap(b=>b.accounts.map(a=>({...a,bank:b}))).map((a,i)=>(
              <div key={i} onClick={()=>{setBank(a.bank);setScreen('detail');}} style={{background:'#fff',borderRadius:'14px',padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:'8px'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`linear-gradient(135deg,${a.bank.color},${a.bank.color2})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'13px',fontWeight:'900',flexShrink:0}}>{a.bank.initials}</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{a.bank.name}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{a.type}  -  {a.number}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'16px',fontWeight:'800',color:'#1A2B4A'}}>{a.balance.toLocaleString()}</div><div style={{fontSize:'10px',color:'#8A9BB5'}}>XAF</div></div>
              </div>
            ))}
            <div style={{fontSize:'12px',fontWeight:'700',color:'#8A9BB5',textTransform:'uppercase',letterSpacing:'1px',margin:'16px 0 10px'}}>Todos los bancos</div>
            {BANKS.map(b=>(
              <div key={b.id} onClick={()=>{setBank(b);setScreen('detail');}} style={{background:'#fff',borderRadius:'14px',padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:'8px',transition:'transform 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateX(4px)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateX(0)';}}>
                <div style={{width:'50px',height:'50px',borderRadius:'14px',background:`linear-gradient(135deg,${b.color},${b.color2})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'16px',fontWeight:'900',flexShrink:0}}>{b.initials}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'14px',fontWeight:'800',color:'#1A2B4A'}}>{b.name}</div>
                  <div style={{fontSize:'11px',color:'#8A9BB5',marginTop:'2px'}}>{b.full}</div>
                  <div style={{display:'flex',gap:'6px',marginTop:'4px'}}>
                    <span style={{background:`${b.color}15`,color:b.color,borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:'600'}}>{b.branches} sucursales</span>
                    <span style={{background:'#F3F4F6',color:'#6B7280',borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:'600'}}>{b.atms} ATMs</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>}


          {/* DETAIL */}
          {screen==='detail' && bank && <div>
            <div style={{background:'#fff',borderRadius:'16px',padding:'18px',marginBottom:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'14px'}}>
                <div style={{width:'60px',height:'60px',borderRadius:'16px',background:grad,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'20px',fontWeight:'900',flexShrink:0}}>{bank.initials}</div>
                <div>
                  <div style={{fontSize:'18px',fontWeight:'900',color:'#1A2B4A'}}>{bank.name}</div>
                  <div style={{fontSize:'11px',color:'#8A9BB5'}}>Fundado en {bank.founded}  -  SWIFT: {bank.swift}</div>
                </div>
              </div>
              <div style={{fontSize:'12px',color:'#5A7090',lineHeight:'1.5',marginBottom:'12px'}}>{bank.desc}</div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                <span style={{background:`${bank.color}12`,color:bank.color,borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>📍 {bank.address}</span>
                <span style={{background:'#F0F4F8',color:'#5A7090',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>📞 {bank.phone}</span>
                <span style={{background:'#F0F4F8',color:'#5A7090',borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>🌍 {bank.web}</span>
              </div>
            </div>
            {bank.accounts.length>0 && <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',fontWeight:'700',color:'#8A9BB5',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Mis cuentas</div>
              {bank.accounts.map((a,i)=>(
                <div key={i} style={{background:grad,borderRadius:'14px',padding:'16px',marginBottom:'8px',color:'#fff'}}>
                  <div style={{fontSize:'11px',opacity:0.8,marginBottom:'4px'}}>{a.type}  -  {a.number}</div>
                  <div style={{fontSize:'26px',fontWeight:'900'}}>{a.balance.toLocaleString()} <span style={{fontSize:'13px',fontWeight:'500',opacity:0.8}}>XAF</span></div>
                </div>
              ))}
            </div>}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'14px'}}>
              {([['transfer','↗','Transferir','#1485EE'],['bills','📄','Pagar Factura','#FA9D3B'],['loan','💰','Préstamos','#07C160'],['invest','📈','Inversiones','#576B95'],['cards','💳','Tarjetas','#FA5151'],['history','📋','Historial','#8A9BB5']] as [BScreen,string,string,string][]).map(([id,icon,label,color])=>(
                <button key={id} onClick={()=>setScreen(id)} style={{background:'#fff',border:'none',borderRadius:'12px',padding:'14px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>{icon}</div>
                  <div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div>
                </button>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:'14px',padding:'14px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:'12px',fontWeight:'700',color:'#8A9BB5',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Servicios disponibles</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                {bank.services.map(s=><span key={s} style={{background:`${bank.color}10`,color:bank.color,borderRadius:'8px',padding:'4px 10px',fontSize:'11px',fontWeight:'600'}}>{s}</span>)}
              </div>
            </div>
          </div>}


          {/* TRANSFER */}
          {screen==='transfer' && bank && <div>
            {([['local','Transferencia Local','Entre cuentas del mismo banco','#1485EE'],['inter','Transferencia Interna','Entre bancos de Guinea Ec.','#07C160'],['cemac','Transferencia CEMAC','Camerún, Gabón, Congo...','#576B95'],['intl','Transferencia Internacional','Fuera de la zona CEMAC','#FA9D3B']] as [string,string,string,string][]).map(([id,label,sub,color])=>(
              <div key={id} onClick={()=>setF('tt',id)} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${form.tt===id?color:'transparent'}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
                <div><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{sub}</div></div>
              </div>
            ))}
            {form.tt && <div style={{background:'#fff',borderRadius:'14px',padding:'14px',marginTop:'4px'}}>
              {([['recipient','Destinatario / IBAN / Teléfono','text'],['amount','Monto (XAF)','number'],['concept','Concepto (opcional)','text']] as [string,string,string][]).map(([k,l,t])=>(
                <div key={k} style={{background:'#F8FAFC',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}>
                  <input type={t} placeholder={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:'1px solid #F0F4F8'}}>
                <span style={{fontSize:'12px',color:'#8A9BB5'}}>Saldo disponible</span>
                <span style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{userBalance.toLocaleString()} XAF</span>
              </div>
              <button onClick={()=>{if(form.recipient&&form.amount){onDebit(parseInt(form.amount));ok(`Transferencia de ${parseInt(form.amount).toLocaleString()} XAF a ${form.recipient} completada.`);}}} style={{width:'100%',background:form.recipient&&form.amount?grad:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.recipient&&form.amount?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.recipient&&form.amount?'pointer':'default',marginTop:'8px'}}>Confirmar transferencia</button>
            </div>}
          </div>}

          {/* LOAN */}
          {screen==='loan' && bank && <div>
            {([['personal','Préstamo Personal','Hasta 5,000,000 XAF','12% anual','#FA9D3B'],['negocio','Préstamo Negocio','Hasta 50,000,000 XAF','9% anual','#1485EE'],['hipoteca','Hipoteca','Hasta 200,000,000 XAF','7% anual','#576B95'],['micro','Microcrédito','Hasta 500,000 XAF','15% anual','#07C160']] as [string,string,string,string,string][]).map(([id,label,sub,rate,color])=>(
              <div key={id} onClick={()=>setF('lt',id)} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${form.lt===id?color:'transparent'}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>
                </div>
                <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{sub}  -  <span style={{color,fontWeight:'600'}}>{rate}</span></div></div>
              </div>
            ))}
            {form.lt && <div style={{background:'#fff',borderRadius:'14px',padding:'14px',marginTop:'4px'}}>
              {([['amount','Monto solicitado (XAF)','number'],['months','Plazo en meses (6-60)','number'],['income','Ingreso mensual (XAF)','number']] as [string,string,string][]).map(([k,l,t])=>(
                <div key={k} style={{background:'#F8FAFC',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}>
                  <input type={t} placeholder={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/>
                </div>
              ))}
              {form.amount&&form.months && <div style={{background:'#F0FDF4',borderRadius:'10px',padding:'12px 14px',marginBottom:'10px'}}><div style={{fontSize:'11px',color:'#8A9BB5',marginBottom:'4px'}}>Cuota mensual estimada</div><div style={{fontSize:'22px',fontWeight:'800',color:'#07C160'}}>{Math.round(parseInt(form.amount)*1.12/parseInt(form.months)).toLocaleString()} XAF</div></div>}
              <button onClick={()=>{if(form.amount&&form.months)ok(`Solicitud de préstamo por ${parseInt(form.amount).toLocaleString()} XAF enviada a ${bank.name}.`);}} style={{width:'100%',background:form.amount&&form.months?grad:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.amount&&form.months?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.amount&&form.months?'pointer':'default'}}>Solicitar préstamo</button>
            </div>}
          </div>}


          {/* BILLS */}
          {screen==='bills' && bank && <div>
            {([['elec','Electricidad','SEGESA / ENERGE','#FA9D3B'],['agua','Agua','SNGE','#1485EE'],['gas','Gas','GEPetrol','#FA5151'],['tax','Impuestos','DGI / Hacienda','#07C160'],['edu','Educación','Colegios / Univ.','#576B95'],['other','Otro','Referencia manual','#8A9BB5']] as [string,string,string,string][]).map(([id,label,sub,color])=>(
              <div key={id} onClick={()=>setF('bt',id)} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${form.bt===id?color:'transparent'}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                </div>
                <div><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{sub}</div></div>
              </div>
            ))}
            {form.bt && <div style={{background:'#fff',borderRadius:'14px',padding:'14px',marginTop:'4px'}}>
              {([['ref','Número de referencia / Contrato','text'],['amount','Monto a pagar (XAF)','number']] as [string,string,string][]).map(([k,l,t])=>(
                <div key={k} style={{background:'#F8FAFC',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}>
                  <input type={t} placeholder={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/>
                </div>
              ))}
              <button onClick={()=>{if(form.ref&&form.amount){onDebit(parseInt(form.amount));ok(`Pago de factura por ${parseInt(form.amount).toLocaleString()} XAF completado.`);}}} style={{width:'100%',background:form.ref&&form.amount?grad:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.ref&&form.amount?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.ref&&form.amount?'pointer':'default'}}>Pagar factura</button>
            </div>}
          </div>}

          {/* INVEST */}
          {screen==='invest' && bank && <div>
            {([['plazo','Depósito a Plazo','3-24 meses','+6% anual','#07C160'],['fondos','Fondos de Inversión','Cartera diversif.','+8-12% anual','#1485EE'],['bonos','Bonos del Estado','Renta fija CEMAC','+5% anual','#576B95'],['acciones','Acciones BVMAC','Bolsa de Libreville','Variable','#FA9D3B']] as [string,string,string,string,string][]).map(([id,label,sub,rate,color])=>(
              <div key={id} onClick={()=>setF('it',id)} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',border:`1.5px solid ${form.it===id?color:'transparent'}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
                <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{sub}</div></div>
                <div style={{fontSize:'12px',fontWeight:'800',color}}>{rate}</div>
              </div>
            ))}
            {form.it && <div style={{background:'#fff',borderRadius:'14px',padding:'14px',marginTop:'4px'}}>
              {([['amount','Monto a invertir (XAF)','number'],['months','Plazo en meses','number']] as [string,string,string][]).map(([k,l,t])=>(
                <div key={k} style={{background:'#F8FAFC',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',height:'48px',display:'flex',alignItems:'center'}}>
                  <input type={t} placeholder={l} value={form[k]||''} onChange={e=>setF(k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'14px',color:'#1A2B4A',fontFamily:'inherit'}}/>
                </div>
              ))}
              {form.amount&&form.months && <div style={{background:'#F0FDF4',borderRadius:'10px',padding:'12px 14px',marginBottom:'10px'}}><div style={{fontSize:'11px',color:'#8A9BB5',marginBottom:'4px'}}>Ganancia estimada</div><div style={{fontSize:'22px',fontWeight:'800',color:'#07C160'}}>+{Math.round(parseInt(form.amount)*0.08*parseInt(form.months)/12).toLocaleString()} XAF</div></div>}
              <button onClick={()=>{if(form.amount&&form.months)ok(`Inversión de ${parseInt(form.amount).toLocaleString()} XAF registrada en ${bank.name}.`);}} style={{width:'100%',background:form.amount&&form.months?grad:'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.amount&&form.months?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:form.amount&&form.months?'pointer':'default'}}>Invertir ahora</button>
            </div>}
          </div>}

          {/* CARDS */}
          {screen==='cards' && bank && <div>
            <div style={{background:grad,borderRadius:'16px',padding:'20px',marginBottom:'12px',color:'#fff'}}>
              <div style={{fontSize:'11px',opacity:0.8,marginBottom:'8px'}}>Tarjeta de Débito  -  {bank.name}</div>
              <div style={{fontSize:'20px',fontWeight:'800',letterSpacing:'2px',marginBottom:'12px'}}>**** **** **** 4521</div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div><div style={{fontSize:'10px',opacity:0.7}}>TITULAR</div><div style={{fontSize:'13px',fontWeight:'700'}}>USUARIO EGCHAT</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'10px',opacity:0.7}}>VENCE</div><div style={{fontSize:'13px',fontWeight:'700'}}>12/28</div></div>
              </div>
            </div>
            {([['🔒','Bloquear tarjeta','#FA5151'],['🔑','Ver PIN','#576B95'],['📊','Límite de gasto','#1485EE'],['💳','Solicitar nueva tarjeta','#07C160']] as [string,string,string][]).map(([icon,label,color],i)=>(
              <button key={i} style={{width:'100%',background:'#fff',border:'none',borderRadius:'12px',padding:'13px 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px',textAlign:'left',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{icon}</div>
                <div style={{fontSize:'13px',fontWeight:'700',color:'#1A2B4A'}}>{label}</div>
              </button>
            ))}
          </div>}

          {/* HISTORY */}
          {screen==='history' && bank && <div>
            {([['in','Depósito salario',150000,'01/03/2026'],['out','Transferencia a Maria',25000,'05/03/2026'],['out','Pago electricidad',8500,'10/03/2026'],['in','Reembolso seguro',35000,'15/03/2026'],['out','Recarga móvil',5000,'18/03/2026'],['out','Pago agua SNGE',3200,'20/03/2026']] as [string,string,number,string][]).map(([type,desc,amount,date],i)=>(
              <div key={i} style={{background:'#fff',borderRadius:'12px',padding:'13px 14px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
                <div style={{width:'38px',height:'38px',borderRadius:'10px',background:type==='in'?'#F0FDF4':'#FFF1F2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>{type==='in'?'↓':'↑'}</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',fontWeight:'600',color:'#1A2B4A'}}>{desc}</div><div style={{fontSize:'11px',color:'#8A9BB5'}}>{date}</div></div>
                <div style={{fontWeight:'700',fontSize:'14px',color:type==='in'?'#16A34A':'#DC2626'}}>{type==='in'?'+':'-'}{amount.toLocaleString()} XAF</div>
              </div>
            ))}
          </div>}

          {/* SUCCESS */}
          {screen==='success' && <div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'#F0FDF4',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:'36px'}}>✅</div>
            <div style={{fontSize:'18px',fontWeight:'800',color:'#1A2B4A',marginBottom:'8px'}}>Operación completada</div>
            <div style={{fontSize:'13px',color:'#8A9BB5',marginBottom:'24px',lineHeight:'1.5',padding:'0 20px'}}>{msg}</div>
            <button onClick={()=>setScreen('detail')} style={{background:grad,border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Volver al banco</button>
          </div>}

        </div>
      </div>
    </div>
  );
};
