import React from 'react';
import { liaAPI } from './api';

interface Msg { id:string; type:'user'|'assistant'; content:string; timestamp:string; isVoice?:boolean }

interface Props {
  messages: Msg[];
  inputValue: string;
  onInputChange: (v:string) => void;
  onSend: (msg:string) => void;
  onBack: () => void;
  userBalance: number;
}

// ── Animación de onda de voz ──────────────────────────────────────
const VoiceWave: React.FC<{active:boolean; color?:string}> = ({active, color='#00c8a0'}) => {
  const bars = [3,5,8,12,16,20,16,12,8,5,3,5,8,12,16,20,16,12,8,5,3];
  return (
    <div style={{display:'flex',alignItems:'center',gap:'2px',height:'32px',padding:'0 4px'}}>
      {bars.map((h,i)=>(
        <div key={i} style={{
          width:'3px', borderRadius:'2px',
          background:color,
          height: active ? `${h}px` : '3px',
          transition:`height ${0.1 + i*0.02}s ease`,
          animation: active ? `wave-bar ${0.6 + (i%4)*0.15}s ease-in-out infinite alternate` : 'none',
          animationDelay:`${i*0.04}s`,
          opacity: active ? 1 : 0.3,
        }}/>
      ))}
      <style>{`
        @keyframes wave-bar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
};

// ── Onda de respuesta de Lia (animación circular) ─────────────────
const LiaWave: React.FC<{speaking:boolean}> = ({speaking}) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'3px',height:'40px'}}>
    {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((_, i) => (
      <div key={i} style={{
        width:'4px', borderRadius:'3px',
        background:`linear-gradient(180deg,#00c8a0,#00b4e6)`,
        height: speaking ? `${8 + Math.sin(i * 0.8) * 14}px` : '4px',
        transition:'height 0.15s ease',
        animation: speaking ? `lia-wave ${0.5 + (i%5)*0.1}s ease-in-out infinite alternate` : 'none',
        animationDelay:`${i*0.06}s`,
      }}/>
    ))}
    <style>{`
      @keyframes lia-wave {
        from { transform: scaleY(0.3); opacity:0.6; }
        to   { transform: scaleY(1.4); opacity:1; }
      }
    `}</style>
  </div>
);

const SUGGESTIONS = [
  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="12" cy="15" r="2"/></svg>, text:'¿Cuál es mi saldo?' },
  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, text:'Resumen de actividad' },
  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/><path d="M4 11h8"/><path d="M4 7h4"/><path d="M4 15h4"/><rect x="2" y="9" width="4" height="12" rx="1"/></svg>, text:'Noticias de hoy' },
  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b4e6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>, text:'¿Cómo está el tiempo?' },
  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>, text:'Enviar dinero' },
  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, text:'Centros de salud' },
  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>, text:'Pedir un taxi' },
  { icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B5BD6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, text:'Supermercados cercanos' },
];

export const Lia25View: React.FC<Props> = ({ messages, inputValue, onInputChange, onSend, onBack, userBalance }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<any>(null);
  const synthRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  const [showSuggestions, setShowSuggestions] = React.useState(true);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [voiceMode, setVoiceMode] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [speakingMsgId, setSpeakingMsgId] = React.useState<string|null>(null);
  const [showAttach, setShowAttach] = React.useState(false);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 1) setShowSuggestions(false);
    // Auto-speak last assistant message
    const last = messages[messages.length - 1];
    if (last?.type === 'assistant' && last.id !== speakingMsgId) {
      speakText(last.content, last.id);
    }
  }, [messages]);

  // ── Síntesis de voz ──────────────────────────────────────────────
  const speakText = (text: string, msgId?: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'es-ES';
    utt.rate = 1.0;
    utt.pitch = 1.1;
    utt.volume = 1;
    // Buscar voz en español
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es')) || voices[0];
    if (esVoice) utt.voice = esVoice;
    utt.onstart = () => { setIsSpeaking(true); if(msgId) setSpeakingMsgId(msgId); };
    utt.onend = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    utt.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  // ── Reconocimiento de voz ────────────────────────────────────────
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Tu navegador no soporta reconocimiento de voz'); return; }
    const rec = new SpeechRecognition();
    rec.lang = 'es-ES';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onstart = () => { setIsRecording(true); setTranscript(''); };
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r:any) => r[0].transcript).join('');
      setTranscript(t);
      onInputChange(t);
    };
    rec.onend = () => {
      setIsRecording(false);
      if (transcript.trim()) { onSend(transcript); setTranscript(''); onInputChange(''); }
    };
    rec.onerror = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setShowSuggestions(false);
    stopSpeaking();
    onSend(inputValue);
  };

  const handleMicPress = () => {
    if (isRecording) stopRecording();
    else { stopSpeaking(); startRecording(); }
  };

  const handleFile = (accept: string, label: string) => {
    setShowAttach(false);
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept;
    inp.onchange = async () => {
      if (inp.files?.[0]) {
        const f = inp.files[0];
        const size = (f.size / 1024).toFixed(1);
        const preview = f.type.startsWith('image/') ? `📷 Imagen: ${f.name} (${size} KB)` :
                        f.type.startsWith('video/') ? `🎥 Video: ${f.name} (${size} KB)` :
                        `📄 Documento: ${f.name} (${size} KB)`;
        onSend(preview);
        setShowSuggestions(false);
        // Enviar al backend para análisis
        try {
          const result = await liaAPI.analyzeFile(f);
          if (result?.analysis) onSend(`🔍 Análisis de Lia-25:\n${result.analysis}`);
        } catch {
          // Backend no disponible — respuesta local
          onSend(`🔍 He recibido tu archivo "${f.name}". Puedo analizarlo cuando el servidor esté disponible.`);
        }
      }
    };
    inp.click();
  };

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'linear-gradient(160deg,#ffffff 0%,#f0fffe 40%,#e8f7ff 70%,#f5f0ff 100%)', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,200,160,0.1)', padding:'10px 16px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0, boxShadow:'0 1px 12px rgba(0,200,160,0.08)' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', padding:'4px', display:'flex' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {/* Avatar con onda cuando habla */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: isSpeaking ? '0 0 0 4px rgba(0,200,160,0.25), 0 0 0 8px rgba(0,200,160,0.1)' : '0 2px 8px rgba(0,200,160,0.3)', transition:'box-shadow 0.3s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/>
              <circle cx="8.5" cy="14" r="1.2" fill="#fff" stroke="none"/>
              <circle cx="15.5" cy="14" r="1.2" fill="#fff" stroke="none"/>
              <path d="M9 17c.83.63 1.94 1 3 1s2.17-.37 3-1"/>
              <line x1="12" y1="3" x2="12" y2="6"/>
            </svg>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'15px', fontWeight:'700', color:'#111827' }}>Lia-25</div>
          <div style={{ fontSize:'11px', color: isSpeaking ? '#00c8a0' : '#9CA3AF', fontWeight:'600', transition:'color 0.3s' }}>
            {isSpeaking ? '🔊 Hablando...' : isRecording ? '🎙️ Escuchando...' : '● Asistente inteligente'}
          </div>
        </div>
        {/* Botón parar voz */}
        {isSpeaking && (
          <button onClick={stopSpeaking} style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'20px', padding:'5px 12px', color:'#EF4444', fontSize:'11px', fontWeight:'700', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#EF4444"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            Parar
          </button>
        )}
        <button onClick={()=>setVoiceMode(p=>!p)} style={{ background:voiceMode?'#F0FDF9':'none', border:voiceMode?'1px solid #A7F3D0':'none', borderRadius:'50%', cursor:'pointer', color:voiceMode?'#00c8a0':'#6B7280', padding:'6px', display:'flex' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          </svg>
        </button>
      </div>

      {/* Área de mensajes */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 12px 8px', display:'flex', flexDirection:'column', gap:'8px' }}>

        {/* Bienvenida */}
        {messages.length <= 1 && showSuggestions && (
          <div style={{ textAlign:'center', padding:'20px 0 16px' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', boxShadow: isSpeaking ? '0 0 0 8px rgba(0,200,160,0.15), 0 0 0 16px rgba(0,200,160,0.07)' : '0 4px 16px rgba(0,200,160,0.3)', transition:'box-shadow 0.3s' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
                <rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/>
                <circle cx="8.5" cy="14" r="1.5" fill="#fff" stroke="none"/>
                <circle cx="15.5" cy="14" r="1.5" fill="#fff" stroke="none"/>
                <path d="M9 17c.83.63 1.94 1 3 1s2.17-.37 3-1"/>
                <line x1="12" y1="3" x2="12" y2="6"/>
              </svg>
            </div>
            {/* Onda de voz en bienvenida */}
            <div style={{ margin:'8px auto', width:'fit-content' }}>
              <LiaWave speaking={isSpeaking}/>
            </div>
            <div style={{ fontSize:'18px', fontWeight:'800', color:'#111827', marginBottom:'4px' }}>Hola, soy Lia-25</div>
            <div style={{ fontSize:'13px', color:'#6B7280', marginBottom:'20px' }}>Tu asistente inteligente  -  Habla o escribe</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', textAlign:'left' }}>
              {SUGGESTIONS.map((s,i)=>(
                <button key={i} onClick={()=>{ onSend(s.text); setShowSuggestions(false); }}
                  style={{ background:'#fff', border:'1px solid #F0F2F5', borderRadius:'12px', padding:'10px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', textAlign:'left' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#F9FAFB';}} onMouseLeave={e=>{e.currentTarget.style.background='#fff';}}>
                  <div style={{ flexShrink:0, width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</div>
                  <span style={{ fontSize:'12px', fontWeight:'500', color:'#374151', lineHeight:'1.3' }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {messages.map(msg => (
          <div key={msg.id} style={{ display:'flex', justifyContent:msg.type==='user'?'flex-end':'flex-start', alignItems:'flex-end', gap:'8px' }}>
            {msg.type==='assistant' && (
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#00c8a0,#00b4e6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:'2px', boxShadow: speakingMsgId===msg.id ? '0 0 0 4px rgba(0,200,160,0.2)' : 'none', transition:'box-shadow 0.3s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/>
                  <circle cx="8.5" cy="14" r="1.2" fill="#fff" stroke="none"/>
                  <circle cx="15.5" cy="14" r="1.2" fill="#fff" stroke="none"/>
                </svg>
              </div>
            )}
            <div style={{ maxWidth:'78%' }}>
              {/* Onda de voz sobre el mensaje del asistente cuando habla */}
              {msg.type==='assistant' && speakingMsgId===msg.id && (
                <div style={{ marginBottom:'4px', paddingLeft:'4px' }}>
                  <LiaWave speaking={true}/>
                </div>
              )}
              <div style={{
                background: msg.type==='user' ? 'linear-gradient(135deg,#00c8a0,#00b4e6)' : '#fff',
                borderRadius: msg.type==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding:'10px 14px',
                boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
                border: msg.type==='assistant' ? '1px solid #F0F2F5' : 'none',
              }}>
                <div style={{ fontSize:'13px', color:msg.type==='user'?'#fff':'#111827', lineHeight:'1.5', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                  {msg.content}
                </div>
              </div>
              <div style={{ fontSize:'10px', color:'#9CA3AF', marginTop:'3px', display:'flex', alignItems:'center', gap:'6px', justifyContent:msg.type==='user'?'flex-end':'flex-start', paddingLeft:msg.type==='assistant'?'4px':'0', paddingRight:msg.type==='user'?'4px':'0' }}>
                {msg.timestamp}
                {/* Botón reproducir mensaje */}
                {msg.type==='assistant' && (
                  <button onClick={()=>{ if(speakingMsgId===msg.id) stopSpeaking(); else speakText(msg.content, msg.id); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color: speakingMsgId===msg.id ? '#00c8a0' : '#D1D5DB', padding:0, display:'flex', transition:'color 0.2s' }}>
                    {speakingMsgId===msg.id
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="#00c8a0"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef}/>
      </div>

      {/* Chips rápidos */}
      {!showSuggestions && (
        <div style={{ display:'flex', gap:'6px', overflowX:'auto', padding:'6px 12px 0', scrollbarWidth:'none', flexShrink:0 }}>
          {[
            {icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, text:'Saldo'},
            {icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/><rect x="2" y="9" width="4" height="12" rx="1"/></svg>, text:'Noticias'},
            {icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>, text:'Taxi'},
            {icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>, text:'Enviar'},
            {icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, text:'Salud'},
            {icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>, text:'Compras'},
          ].map((s,i)=>(
            <button key={i} onClick={()=>onSend(s.text)}
              style={{ flexShrink:0, background:'#fff', border:'1px solid #E5E7EB', borderRadius:'20px', padding:'5px 12px', fontSize:'11px', fontWeight:'600', color:'#374151', cursor:'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'5px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
              {s.icon}{s.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderTop:'1px solid rgba(0,200,160,0.1)', padding:'10px 12px', display:'flex', alignItems:'center', gap:'8px', flexShrink:0, boxShadow:'0 -1px 12px rgba(0,200,160,0.06)' }}>

        {/* Botón adjuntar */}
        <button onClick={()=>setShowAttach(p=>!p)}
          style={{ width:'40px', height:'40px', borderRadius:'50%', background:showAttach?'#F0FDF9':'#F3F4F6', border:showAttach?'1px solid #A7F3D0':'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s', color:showAttach?'#00c8a0':'#6B7280' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {showAttach ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
          </svg>
        </button>

        {/* Micrófono */}
        <button onMouseDown={handleMicPress} onTouchStart={handleMicPress}
          style={{ width:'40px', height:'40px', borderRadius:'50%', background: isRecording ? 'linear-gradient(135deg,#EF4444,#F97316)' : '#F3F4F6', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s', boxShadow: isRecording ? '0 0 0 4px rgba(239,68,68,0.2)' : 'none' }}>
          {isRecording
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          }
        </button>

        {/* Campo de texto o onda */}
        {isRecording ? (
          <div style={{ flex:1, background:'#FEF2F2', borderRadius:'24px', padding:'0 14px', height:'40px', display:'flex', alignItems:'center', border:'1px solid #FECACA', gap:'8px' }}>
            <VoiceWave active={true} color="#EF4444"/>
            <span style={{ fontSize:'12px', color:'#EF4444', fontWeight:'600' }}>{transcript || 'Escuchando...'}</span>
          </div>
        ) : (
          <div style={{ flex:1, background:'#F3F4F6', borderRadius:'24px', padding:'0 14px', height:'40px', display:'flex', alignItems:'center', border:'1px solid #E5E7EB' }}>
            <input ref={inputRef} type="text" placeholder="Pregunta a Lia-25..." value={inputValue} onChange={e=>onInputChange(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); handleSend(); } }}
              style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }}/>
          </div>
        )}

        {/* Enviar */}
        <button onClick={handleSend} disabled={!inputValue.trim() && !transcript}
          style={{ width:'40px', height:'40px', borderRadius:'50%', background:(inputValue.trim()||transcript)?'linear-gradient(135deg,#00c8a0,#00b4e6)':'#E5E7EB', border:'none', cursor:(inputValue.trim()||transcript)?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={(inputValue.trim()||transcript)?'#fff':'#9CA3AF'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* Panel de adjuntos */}
      {showAttach && (
        <div style={{ background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid #F0F2F5', padding:'12px 16px 16px', flexShrink:0 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
            {[
              { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4e6" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, label:'Foto', bg:'#E0F7FF', action:()=>handleFile('image/*','Foto') },
              { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.7" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>, label:'Video', bg:'#EDE9FE', action:()=>handleFile('video/*','Video') },
              { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>, label:'Documento', bg:'#FEF3C7', action:()=>handleFile('.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx','Documento') },
              { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="1.7" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>, label:'Archivo', bg:'#D1FAE5', action:()=>handleFile('*','Archivo') },
            ].map((item,i)=>(
              <button key={i} onClick={item.action}
                style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', padding:'4px' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'16px', background:item.bg, display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.15s' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='scale(1.08)';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='scale(1)';}}>
                  {item.icon}
                </div>
                <span style={{ fontSize:'10px', color:'#374151', fontWeight:'500' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
