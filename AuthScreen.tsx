import React, { useState, useRef } from 'react';
import { authAPI } from './api';
import { MessageCircle, CreditCard, Bot, UserPlus, LogIn } from 'lucide-react';
import { AvatarCropModal } from './AvatarCropModal';

// Usar la misma base URL que el authAPI
const _apiUrl = (import.meta as any).env?.VITE_API_URL || '';
const BASE = (!_apiUrl || _apiUrl.startsWith('/')) ? 'https://egchat-api.onrender.com/api' : _apiUrl;

const COUNTRIES = [
  {code:'GQ',name:'Guinea Ecuatorial',phone:'+240'},
  {code:'CM',name:'Camerun',phone:'+237'},
  {code:'GA',name:'Gabon',phone:'+241'},
  {code:'NG',name:'Nigeria',phone:'+234'},
  {code:'ES',name:'Espana',phone:'+34'},
  {code:'FR',name:'Francia',phone:'+33'},
  {code:'GB',name:'Reino Unido',phone:'+44'},
  {code:'US',name:'Estados Unidos',phone:'+1'},
  {code:'DE',name:'Alemania',phone:'+49'},
  {code:'IT',name:'Italia',phone:'+39'},
  {code:'PT',name:'Portugal',phone:'+351'},
  {code:'BR',name:'Brasil',phone:'+55'},
  {code:'MX',name:'Mexico',phone:'+52'},
  {code:'CN',name:'China',phone:'+86'},
  {code:'IN',name:'India',phone:'+91'},
  {code:'JP',name:'Japon',phone:'+81'},
  {code:'RU',name:'Rusia',phone:'+7'},
  {code:'ZA',name:'Sudafrica',phone:'+27'},
  {code:'EG',name:'Egipto',phone:'+20'},
  {code:'MA',name:'Marruecos',phone:'+212'},
];

const Eye = ({o}:{o:boolean}) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    {o?<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8"/><circle cx="12" cy="12" r="3"/></>}
  </svg>
);

const getCountryFlag = (countryCode: string) => {
  if (countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface Props { onAuth:(user:any)=>void }

export default function AuthScreen({onAuth}:Props) {
  const [sc, setSc] = useState<'welcome'|'login'|'reg'|'recover'>('welcome');
  const [countryCode, setCountryCode] = useState('+240');
  const [phone, setPhone] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [showP, setShowP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [step, setStep] = useState(1);
  const [serverReady, setServerReady] = useState(false);
  // Recuperación de cuenta
  const [recoverStep, setRecoverStep] = useState<1|2|3>(1);
  const [recoverCode, setRecoverCode] = useState('');
  const [recoverPass, setRecoverPass] = useState('');
  const [recoverPass2, setRecoverPass2] = useState('');
  const [recoverOk, setRecoverOk] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Despertar Render al cargar la pantalla
  React.useEffect(() => {
    const wake = async () => {
      try {
        await fetch(`${BASE.replace('/api','')}/health`);
        setServerReady(true);
      } catch {
        setServerReady(true); // continuar aunque falle
      }
    };
    wake();
  }, []);

  const selCountry = COUNTRIES.find(c=>c.phone===countryCode) || COUNTRIES[0];
  const initials = name.trim().split(' ').filter(Boolean).map((w:string)=>w[0].toUpperCase()).slice(0,2).join('');
  const fullPhone = countryCode + phone.replace(/\s/g,'');

  const doLogin = async()=>{
    if(!phone||!pass){setErr('Rellena todos los campos');return;}
    setLoading(true);setErr('');

    // Debug: mostrar qué datos se están enviando
    console.log('🔍 Intentando login con:', {
      phone: fullPhone,
      password: pass ? '***' : '',
      countryCode,
      phoneRaw: phone
    });

    try{
      const r=await authAPI.login(fullPhone,pass);
      console.log('✅ Login exitoso:', r);
      onAuth(r.user);
    }
    catch(e:any){
      console.error('❌ Error en login:', e);

      // Mejorar mensajes de error para el usuario
      if(e.message?.includes('credenciales') || e.message?.includes('password') || e.message?.includes('usuario') || e.message?.includes('invalid')) {
        setErr('Usuario o contraseña incorrectos. Verifica que tus datos sean correctos.');
      } else if(e.message?.includes('network') || e.message?.includes('fetch') || e.message?.includes('Failed to fetch')) {
        setErr('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.');
      } else if(e.message?.includes('401') || e.message?.includes('Unauthorized')) {
        setErr('Credenciales inválidas. El usuario no existe o la contraseña es incorrecta.');
      } else if(e.message?.includes('500') || e.message?.includes('Internal Server Error')) {
        setErr('Error del servidor. Intenta de nuevo en unos minutos.');
      } else {
        setErr(e.message || 'Error al iniciar sesión. Revisa la consola para más detalles.');
      }
    }
    finally{setLoading(false);}
  };

  const doReg = async()=>{
    setLoading(true);setErr('');
    try{
      // Registrar sin avatar primero (evita payload grande)
      const r=await authAPI.register({full_name:name,phone:fullPhone,password:pass,avatar_url:undefined});
      localStorage.setItem('user_name',name);
      // Subir avatar después del registro si existe
      if(avatar){
        try{
          // Convertir base64 a File y subir
          const res=await fetch(avatar);
          const blob=await res.blob();
          const file=new File([blob],'avatar.jpg',{type:'image/jpeg'});
          const up=await (await import('./api')).userAPI.uploadAvatar(file);
          if(up?.avatar_url) localStorage.setItem('user_avatar',up.avatar_url);
          else localStorage.setItem('user_avatar',avatar);
        }catch{
          localStorage.setItem('user_avatar',avatar);
        }
      }
      onAuth(r.user);
    }
    catch(e:any){
      const msg = e.message || '';
      if(msg.includes('ya está registrado') || msg.includes('409') || msg.includes('already')) {
        setErr('Este número ya está registrado. Usa "Ya tengo cuenta" para iniciar sesión.');
      } else if(msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setErr('Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else if(msg.includes('500') || msg.includes('Internal')) {
        setErr('Error del servidor. Intenta de nuevo en unos segundos.');
      } else {
        setErr(msg || 'Error al registrarse. Intenta de nuevo.');
      }
    }
    finally{setLoading(false);}
  };

  const pickImg = () => {
    avatarInputRef.current?.click();
  };

  const BG = 'linear-gradient(160deg,rgba(0,200,160,0.12) 0%,rgba(0,180,230,0.08) 50%,rgba(180,255,0,0.06) 100%)';
  const inp:React.CSSProperties={width:'100%',background:'#fff',border:'1.5px solid #E5E7EB',borderRadius:'10px',padding:'12px 14px',fontSize:'15px',color:'#111',outline:'none',boxSizing:'border-box',fontFamily:'inherit'};
  const btnG:React.CSSProperties={width:'100%',background:'#22c55e',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'800',cursor:'pointer'};
  const btnO:React.CSSProperties={width:'100%',background:'#fff',color:'#374151',border:'1.5px solid #E5E7EB',borderRadius:'12px',padding:'13px',fontSize:'15px',fontWeight:'700',cursor:'pointer'};
  const lbl:React.CSSProperties={fontSize:'12px',fontWeight:'600',color:'#6B7280',display:'block',marginBottom:'5px'};
  const Err=()=>err?<div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'8px',padding:'9px 12px',marginBottom:'12px',color:'#DC2626',fontSize:'13px'}}>⚠️ {err}</div>:null;
  const Prog=({n}:{n:number})=><div style={{display:'flex',gap:'4px',marginBottom:'16px'}}>{[1,2,3].map(i=><div key={i} style={{flex:1,height:'3px',borderRadius:'2px',background:i<=n?'#22c55e':'#E5E7EB'}}/>)}</div>;

  const countrySelector = (
    <div style={{marginBottom:'8px'}}>
      <label style={lbl}>País</label>
      <div style={{position:'relative'}}>
        <div style={{...inp,display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}}>
          <span style={{fontSize:'18px',flexShrink:0}}>{getCountryFlag(selCountry.code)}</span>
          <span style={{flex:1,fontSize:'14px',color:'#111',fontWeight:'500'}}>{selCountry.name}:</span>
        </div>
        <select value={countryCode} onChange={e=>setCountryCode(e.target.value)}
          style={{position:'absolute',inset:0,opacity:0,cursor:'pointer'}}>
          {COUNTRIES.map(c=><option key={c.phone} value={c.phone}>{c.name}</option>)}
        </select>
      </div>
    </div>
  );

  const phoneInput = (
    <div style={{marginBottom:'12px'}}>
      <label style={lbl}>Teléfono</label>
      <div style={{display:'flex',alignItems:'center',border:'1.5px solid #E5E7EB',borderRadius:'10px',background:'#fff',overflow:'hidden'}}>
        <span style={{padding:'0 12px',fontSize:'14px',fontWeight:'700',color:'#374151',borderRight:'1.5px solid #E5E7EB',height:'46px',display:'flex',alignItems:'center',flexShrink:0,background:'#F9FAFB'}}>{countryCode}</span>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="222 XXX XXX" type="tel" autoComplete="off" style={{flex:1,background:'none',border:'none',outline:'none',padding:'0 12px',fontSize:'15px',color:'#111',fontFamily:'inherit',height:'46px'}}/>
      </div>
    </div>
  );

  if(sc==='welcome') return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',padding:'36px 20px 28px',maxWidth:'420px',margin:'0 auto',overflowY:'auto',WebkitOverflowScrolling:'touch'} as any}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
        <div style={{width:'160px',height:'160px',borderRadius:'20px',background:'white',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.1)',border:'2px solid rgba(255,255,255,0.8)'}}>
          <img src="/logo-transparent.png" alt="EgChat" style={{width:140,height:140,objectFit:'contain',animation:'spin 20s linear infinite'}}/>
        </div>
        <div style={{textAlign:'center',marginTop:'4px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',flexWrap:'wrap',marginBottom:'4px'}}>
            {['GQ','CM','GA','NG','ES','FR','GB','US'].map(code=>(
              <span key={code} style={{fontSize:'22px',lineHeight:1}}>{String.fromCodePoint(...code.toUpperCase().split('').map(c=>127397+c.charCodeAt(0)))}</span>
            ))}
          </div>
          <p style={{fontSize:'13px',color:'#6B7280',margin:'4px 0 0',fontWeight:'500'}}>Tu plataforma de pagos y servicios</p>
        </div>
      </div>
      <div style={{width:'100%',background:'rgba(255,255,255,0.8)',backdropFilter:'blur(16px)',borderRadius:'20px',padding:'20px',display:'flex',flexDirection:'column',gap:'16px',border:'1px solid rgba(255,255,255,0.9)',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}}>
        {[
          {icon: MessageCircle, title:'Chats Tiempo Real',sub:'Mensajes instantáneos'},
          {icon: CreditCard, title:'Pagos Seguros XAF',sub:'Transferencias rápidas'},
          {icon: Bot, title:'IA Lia-25',sub:'Asistente 24/7'},
        ].map(f=>(
          <div key={f.title} style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'2px solid rgba(34, 197, 94, 0.3)'}}>
              <f.icon size={20} color="#22c55e"/>
            </div>
            <div>
              <div style={{fontSize:'14px',fontWeight:'700',color:'#111827',marginBottom:'2px'}}>{f.title}</div>
              <div style={{fontSize:'12px',color:'#6B7280'}}>{f.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{width:'100%',display:'flex',flexDirection:'column',gap:'12px'}}>
        <button onClick={()=>setSc('reg')} style={{...btnG,borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',boxShadow:'0 4px 16px rgba(34, 197, 94, 0.3)',border:'none',transition:'all 0.2s ease',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
          <UserPlus size={18}/>
          {serverReady ? 'Crear Cuenta' : 'Conectando...'}
        </button>
        <button onClick={()=>setSc('login')} style={{...btnO,borderRadius:'14px',padding:'15px',fontSize:'16px',fontWeight:'600',border:'2px solid #E5E7EB',transition:'all 0.2s ease',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
          <LogIn size={18}/>
          {serverReady ? 'Ya tengo cuenta' : '⏳ Cargando...'}
        </button>
        <p style={{fontSize:'11px',color:'#9CA3AF',textAlign:'center',margin:'8px 0 0',fontWeight:'500'}}>v2.5.1 | Guinea Ecuatorial</p>
      </div>
    </div>
  );

  if(sc==='login') return (
    <div style={{height:'100vh',height:'100dvh',background:BG,display:'flex',flexDirection:'column',maxWidth:'420px',margin:'0 auto',overflowY:'auto',WebkitOverflowScrolling:'touch'} as any}>
      <div style={{padding:'36px 20px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
        <div style={{width:'80px',height:'80px',borderRadius:'16px',background:'white',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.1)',border:'2px solid rgba(255,255,255,0.8)'}}>
          <img src="/logo-transparent.png" alt="EgChat" style={{width:60,height:60,objectFit:'contain',animation:'spin 20s linear infinite'}}/>
        </div>
        <div style={{textAlign:'center',marginTop:'4px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',flexWrap:'wrap'}}>
            {['GQ','CM','GA','NG','ES','FR','GB','US'].map(code=>(
              <span key={code} style={{fontSize:'18px',lineHeight:1}}>{String.fromCodePoint(...code.toUpperCase().split('').map(c=>127397+c.charCodeAt(0)))}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{flex:1,padding:'12px 20px 28px'}}>
        <h2 style={{fontSize:'20px',fontWeight:'800',color:'#111827',margin:'0 0 6px',textAlign:'center'}}>Iniciar sesión</h2>
        <p style={{fontSize:'14px',color:'#6B7280',margin:'0 0 20px',textAlign:'center'}}>Introduce tu teléfono y contraseña</p>
        {countrySelector}
        {phoneInput}
        <div style={{marginBottom:'16px'}}>
          <label style={lbl}>Contraseña</label>
          <div style={{position:'relative'}}>
            <input value={pass} onChange={e=>setPass(e.target.value)} type={showP?'text':'password'} placeholder="Tu contraseña" onKeyDown={e=>e.key==='Enter'&&doLogin()} style={{...inp,paddingRight:'42px'}}/>
            <button onClick={()=>setShowP(p=>!p)} style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9CA3AF'}}><Eye o={showP}/></button>
          </div>
        </div>
        <Err/>
        <button onClick={doLogin} disabled={loading} style={{...btnG,borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',boxShadow:'0 4px 16px rgba(34, 197, 94, 0.3)',border:'none',transition:'all 0.2s ease',marginBottom:'12px',opacity:loading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
          <LogIn size={18}/>
          {loading?'Entrando...':'Entrar'}
        </button>
        <button onClick={()=>{setSc('recover');setErr('');setRecoverStep(1);setPhone('');setRecoverCode('');setRecoverPass('');setRecoverPass2('');setRecoverOk(false);}} style={{background:'none',border:'none',color:'#00c8a0',fontSize:'13px',fontWeight:'600',cursor:'pointer',width:'100%',padding:'6px',marginBottom:'8px'}}>¿Olvidaste tu contraseña?</button>
        <button onClick={()=>{setSc('reg');setErr('');setStep(1);}} style={{...btnO,borderRadius:'14px',padding:'15px',fontSize:'16px',fontWeight:'600',border:'2px solid #E5E7EB',transition:'all 0.2s ease',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
          <UserPlus size={18}/>
          Crear cuenta nueva
        </button>
        <button onClick={()=>{setSc('welcome');setErr('');}} style={{background:'none',border:'none',color:'#9CA3AF',fontSize:'14px',cursor:'pointer',width:'100%',marginTop:'16px',padding:'8px',borderRadius:'8px',transition:'all 0.2s ease'}}>← Volver al inicio</button>
      </div>
    </div>
  );

  if(sc==='recover') return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',maxWidth:'420px',margin:'0 auto',overflowY:'auto',WebkitOverflowScrolling:'touch'} as any}>
      <div style={{padding:'36px 20px 14px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}>
        <div style={{width:'80px',height:'80px',borderRadius:'16px',background:'white',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.1)'}}>
          <img src="/logo-transparent.png" alt="EgChat" style={{width:60,height:60,objectFit:'contain',animation:'spin 20s linear infinite'}}/>
        </div>
      </div>
      <div style={{flex:1,padding:'12px 20px 28px'}}>
        {recoverOk ? (
          <div style={{textAlign:'center',paddingTop:'20px'}}>
            <div style={{fontSize:'56px',marginBottom:'16px'}}>✅</div>
            <h2 style={{fontSize:'20px',fontWeight:'800',color:'#111827',margin:'0 0 8px'}}>¡Contraseña cambiada!</h2>
            <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button onClick={()=>{setSc('login');setErr('');setPhone('');setPass('');}} style={{...btnG,borderRadius:'14px',padding:'14px',fontSize:'15px',fontWeight:'700',border:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              <LogIn size={18}/>Ir a iniciar sesión
            </button>
          </div>
        ) : recoverStep===1 ? (<>
          <h2 style={{fontSize:'20px',fontWeight:'800',color:'#111827',margin:'0 0 6px',textAlign:'center'}}>Recuperar cuenta</h2>
          <p style={{fontSize:'14px',color:'#6B7280',margin:'0 0 20px',textAlign:'center'}}>Introduce tu número de teléfono y te enviaremos un código</p>
          {countrySelector}
          {phoneInput}
          <Err/>
          <button onClick={async()=>{
            if(!phone){setErr('Introduce tu número de teléfono');return;}
            setLoading(true);setErr('');
            try{
              await authAPI.sendVerification(fullPhone,'sms');
              setRecoverStep(2);
            }catch(e:any){setErr(e.message||'Error al enviar el código');}
            finally{setLoading(false);}
          }} disabled={loading||!phone.trim()} style={{...btnG,borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',border:'none',opacity:phone.trim()&&!loading?1:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
            {loading?'Enviando...':'Enviar código SMS'}
          </button>
        </>) : recoverStep===2 ? (<>
          <h2 style={{fontSize:'20px',fontWeight:'800',color:'#111827',margin:'0 0 6px',textAlign:'center'}}>Introduce el código</h2>
          <p style={{fontSize:'14px',color:'#6B7280',margin:'0 0 20px',textAlign:'center'}}>Enviamos un código a <strong>{fullPhone}</strong></p>
          <div style={{marginBottom:'16px'}}>
            <label style={lbl}>Código de verificación</label>
            <input value={recoverCode} onChange={e=>setRecoverCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} style={{...inp,textAlign:'center',fontSize:'24px',fontWeight:'800',letterSpacing:'8px'}}/>
          </div>
          <Err/>
          <button onClick={async()=>{
            if(recoverCode.length<4){setErr('Introduce el código completo');return;}
            setLoading(true);setErr('');
            try{
              const r=await authAPI.verifyCode(fullPhone,recoverCode);
              if(r.verified) setRecoverStep(3);
              else setErr('Código incorrecto. Inténtalo de nuevo.');
            }catch(e:any){setErr(e.message||'Código inválido');}
            finally{setLoading(false);}
          }} disabled={loading||recoverCode.length<4} style={{...btnG,borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',border:'none',opacity:recoverCode.length>=4&&!loading?1:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'12px'}}>
            {loading?'Verificando...':'Verificar código'}
          </button>
          <button onClick={async()=>{
            setLoading(true);setErr('');
            try{await authAPI.sendVerification(fullPhone,'sms');setErr('');}
            catch(e:any){setErr(e.message||'Error al reenviar');}
            finally{setLoading(false);}
          }} style={{background:'none',border:'none',color:'#00c8a0',fontSize:'13px',fontWeight:'600',cursor:'pointer',width:'100%',padding:'6px'}}>
            {loading?'Enviando...':'Reenviar código'}
          </button>
        </>) : (<>
          <h2 style={{fontSize:'20px',fontWeight:'800',color:'#111827',margin:'0 0 6px',textAlign:'center'}}>Nueva contraseña</h2>
          <p style={{fontSize:'14px',color:'#6B7280',margin:'0 0 20px',textAlign:'center'}}>Crea una contraseña segura para tu cuenta</p>
          <div style={{marginBottom:'14px'}}>
            <label style={lbl}>Nueva contraseña</label>
            <div style={{position:'relative'}}>
              <input value={recoverPass} onChange={e=>setRecoverPass(e.target.value)} type={showP?'text':'password'} placeholder="Mínimo 6 caracteres" style={{...inp,paddingRight:'42px'}}/>
              <button onClick={()=>setShowP(p=>!p)} style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9CA3AF'}}><Eye o={showP}/></button>
            </div>
          </div>
          <div style={{marginBottom:'16px'}}>
            <label style={lbl}>Confirmar contraseña</label>
            <input value={recoverPass2} onChange={e=>setRecoverPass2(e.target.value)} type="password" placeholder="Repite la contraseña" style={{...inp,borderColor:recoverPass2&&recoverPass!==recoverPass2?'#EF4444':'#E5E7EB'}}/>
            {recoverPass2&&recoverPass!==recoverPass2&&<p style={{fontSize:'12px',color:'#EF4444',margin:'4px 0 0'}}>Las contraseñas no coinciden</p>}
          </div>
          <Err/>
          <button onClick={async()=>{
            if(recoverPass.length<6){setErr('La contraseña debe tener al menos 6 caracteres');return;}
            if(recoverPass!==recoverPass2){setErr('Las contraseñas no coinciden');return;}
            setLoading(true);setErr('');
            try{
              await authAPI.resetPassword(fullPhone,recoverCode,recoverPass);
              setRecoverOk(true);
            }catch(e:any){setErr(e.message||'Error al cambiar la contraseña');}
            finally{setLoading(false);}
          }} disabled={loading||recoverPass.length<6||recoverPass!==recoverPass2} style={{...btnG,borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',border:'none',opacity:recoverPass.length>=6&&recoverPass===recoverPass2&&!loading?1:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
            {loading?'Guardando...':'Guardar nueva contraseña'}
          </button>
        </>)}
        {!recoverOk&&<button onClick={()=>{setSc('login');setErr('');}} style={{background:'none',border:'none',color:'#9CA3AF',fontSize:'14px',cursor:'pointer',width:'100%',marginTop:'16px',padding:'8px',borderRadius:'8px'}}>← Volver al login</button>}
      </div>
    </div>
  );

  return (
    <React.Fragment>
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',maxWidth:'420px',margin:'0 auto',overflowY:'auto',WebkitOverflowScrolling:'touch'} as any}>
      <div style={{padding:'32px 20px 12px'}}>
        <button onClick={()=>{step===1?setSc('welcome'):setStep(s=>s-1);setErr('');}} style={{background:'none',border:'none',color:'#374151',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontSize:'14px',fontWeight:'600',marginBottom:'8px',padding:'8px',borderRadius:'8px',transition:'all 0.2s ease'}}>
          ← Atrás
        </button>
        <h2 style={{fontSize:'20px',fontWeight:'900',color:'#111827',margin:'0 0 4px',textAlign:'center'}}>Crear Cuenta</h2>
        <p style={{fontSize:'14px',color:'#6B7280',margin:'0 0 12px',textAlign:'center'}}>Paso {step} de 3</p>
        <Prog n={step}/>
      </div>
      <div style={{flex:1,padding:'0 20px 28px',overflowY:'auto'}}>
        {step===1&&<>
          <div style={{marginBottom:'12px'}}><label style={lbl}>Nombre Completo</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={inp}/></div>

          {/* Foto de perfil — OBLIGATORIA con zoom/recorte */}
          <div style={{marginBottom:'20px'}}>
            <label style={{...lbl, marginBottom:'8px'}}>Foto de Perfil <span style={{color:'#9CA3AF',fontWeight:'400'}}>(opcional)</span></label>
            <div
              onClick={pickImg}
              style={{
                width:'100%', height:'200px',
                borderRadius:'16px',
                background: avatar ? 'transparent' : '#F3F4F6',
                border: avatar ? '3px solid #22c55e' : '3px dashed #D1D5DB',
                overflow:'hidden',
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                cursor:'pointer', position:'relative',
                transition:'all 0.2s ease',
              }}
            >
              {avatar ? (
                <>
                  <img
                    src={avatar}
                    alt="Foto de perfil"
                    style={{
                      width:'100%', height:'100%',
                      objectFit:'cover',
                      objectPosition:'center',
                    }}
                  />
                  {/* Overlay para cambiar */}
                  <div style={{
                    position:'absolute', inset:0,
                    background:'rgba(0,0,0,0.35)',
                    display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center',
                    opacity:0, transition:'opacity 0.2s',
                  }}
                    onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                    onMouseLeave={e=>(e.currentTarget.style.opacity='0')}
                  >
                    <span style={{fontSize:'28px'}}>📷</span>
                    <span style={{color:'#fff', fontSize:'13px', fontWeight:'700', marginTop:'4px'}}>Cambiar foto</span>
                  </div>
                  {/* Badge OK */}
                  <div style={{position:'absolute',top:'8px',right:'8px',background:'#22c55e',borderRadius:'50%',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
                    <span style={{color:'#fff',fontSize:'14px'}}>✓</span>
                  </div>
                </>
              ) : (
                <>
                  <span style={{fontSize:'48px',marginBottom:'8px'}}>📷</span>
                  <span style={{fontSize:'15px',fontWeight:'700',color:'#374151'}}>Subir foto de perfil</span>
                  <span style={{fontSize:'12px',color:'#9CA3AF',marginTop:'4px'}}>Toca para seleccionar</span>
                  <span style={{fontSize:'11px',color:'#9CA3AF',marginTop:'6px',fontWeight:'500'}}>Puedes añadirla después</span>
                </>
              )}
            </div>
            {avatar && (
              <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                <button
                  onClick={e=>{e.stopPropagation();pickImg();}}
                  style={{flex:1,background:'#F3F4F6',border:'none',borderRadius:'8px',padding:'8px',fontSize:'12px',fontWeight:'600',color:'#374151',cursor:'pointer'}}
                >
                  📷 Cambiar foto
                </button>
                <button
                  onClick={e=>{e.stopPropagation();setAvatar('');}}
                  style={{background:'#FEF2F2',border:'none',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',fontWeight:'600',color:'#ef4444',cursor:'pointer'}}
                >
                  ✕
                </button>
              </div>
            )}
            <p style={{fontSize:'11px',color:'#9CA3AF',marginTop:'6px',textAlign:'center'}}>
              JPG, PNG o GIF  -  La imagen se ajusta automáticamente
            </p>
          </div>

          <button
            onClick={()=>{ setErr(''); setStep(2); }}
            disabled={!name.trim()}
            style={{...btnG,borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',boxShadow:'0 4px 16px rgba(34, 197, 94, 0.3)',border:'none',transition:'all 0.2s ease',opacity:name.trim()?1:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}
          >
            <UserPlus size={18}/>
            {!name.trim() ? 'Escribe tu nombre primero' : 'Continuar →'}
          </button>
        </>}
        {step===2&&<>
          {countrySelector}
          {phoneInput}
          <Err/>
          <button onClick={async ()=>{
            // Validar que el teléfono tenga al menos 6 dígitos
            const digits = phone.replace(/\D/g,'');
            if(digits.length < 6){setErr('Introduce un número de teléfono válido');return;}
            setErr('');
            setLoading(true);
            try {
              const r = await fetch(`${BASE}/auth/check-phone`, {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({phone: fullPhone})
              });
              const d = await r.json().catch(()=>({}));
              if(d.exists){setErr('Este número ya está registrado. Inicia sesión.');setLoading(false);return;}
            } catch {
              // Si el servidor no responde, continuar igualmente
              // El registro fallará con error claro si el número ya existe
            }
            setLoading(false);
            setStep(3);
          }} disabled={!phone.trim()||loading} style={{...btnG,borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',boxShadow:'0 4px 16px rgba(34, 197, 94, 0.3)',border:'none',transition:'all 0.2s ease',opacity:phone.trim()&&!loading?1:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
            <LogIn size={18}/>
            {loading?'Verificando...':'Continuar al paso 3'}
          </button>
        </>}
        {step===3&&<>
          <div style={{marginBottom:'14px'}}>
            <label style={lbl}>Contraseña (mínimo 6 caracteres)</label>
            <div style={{position:'relative'}}>
              <input value={pass} onChange={e=>setPass(e.target.value)} type={showP?'text':'password'} placeholder="Crea una contraseña fuerte" style={{...inp,paddingRight:'42px'}}/>
              <button onClick={()=>setShowP(p=>!p)} style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9CA3AF'}}><Eye o={showP}/></button>
            </div>
          </div>
          <div style={{marginBottom:'14px'}}>
            <label style={lbl}>Confirmar Contraseña</label>
            <input value={pass2} onChange={e=>setPass2(e.target.value)} type="password" placeholder="Repite tu contraseña" style={{...inp,borderColor:pass2&&pass!==pass2?'#EF4444':'#E5E7EB'}}/>
            {pass2&&pass!==pass2&&<p style={{fontSize:'12px',color:'#EF4444',margin:'4px 0 0'}}>Las contraseñas no coinciden</p>}
          </div>
          <Err/>
          <button onClick={doReg} disabled={loading||pass!==pass2||pass.length<6} style={{...btnG,borderRadius:'14px',padding:'16px',fontSize:'16px',fontWeight:'700',boxShadow:'0 4px 16px rgba(34, 197, 94, 0.3)',border:'none',transition:'all 0.2s ease',opacity:pass===pass2&&!loading&&pass.length>=6?1:0.5,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
            <UserPlus size={18}/>
            {loading?'Creando cuenta...':'Registrarme'}
          </button>
        </>}
      </div>
    </div>

    {/* Input de archivo para avatar — real en el DOM para compatibilidad móvil */}
    <input
      ref={avatarInputRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={e => {
        const f = e.target.files?.[0];
        if (f) {
          const reader = new FileReader();
          reader.onload = ev => {
            setCropImageUrl(ev.target?.result as string);
          };
          reader.readAsDataURL(f);
        }
        // Reset para permitir seleccionar el mismo archivo de nuevo
        if (avatarInputRef.current) avatarInputRef.current.value = '';
      }}
    />

    {/* Crop modal — aparece al seleccionar foto */}
    {cropImageUrl && (
      <AvatarCropModal
        imageUrl={cropImageUrl}
        onSave={(croppedUrl) => {
          setAvatar(croppedUrl);
          setCropImageUrl(null);
          setErr('');
        }}
        onClose={() => setCropImageUrl(null)}
      />
    )}
  </React.Fragment>
  );
}
