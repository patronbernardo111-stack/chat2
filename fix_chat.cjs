const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf8');

let fixes = 0;

// FIX 1: Añadir created_at al mapeo de mensajes del backend
const old1 = "text: m.text || '', time: new Date(m.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),\n          status:";
const new1 = "text: m.text || '', time: new Date(m.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),\n          created_at: m.created_at,\n          status:";
if (c.includes(old1)) { c = c.replace(old1, new1); fixes++; console.log('Fix1: created_at added'); }
else console.log('Fix1: already applied or not found');

// FIX 2: Añadir refs para scroll
const old2 = "  const chatRecordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);";
const new2 = "  const chatRecordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);\n  const messagesEndRef = useRef<HTMLDivElement>(null);\n  const isAtBottomRef = useRef<boolean>(true);";
if (c.includes(old2) && !c.includes('messagesEndRef')) { c = c.replace(old2, new2); fixes++; console.log('Fix2: refs added'); }
else console.log('Fix2: already applied');

// FIX 3: useEffects de scroll inteligente
const old3 = "  // Geolocalización automática + clima real (Open-Meteo, sin API key)";
const new3 = `  // Scroll al fondo al ABRIR un chat
  React.useEffect(() => {
    if (!selectedChat) return;
    isAtBottomRef.current = true;
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }); }, 100);
  }, [selectedChat?.id]);

  // Scroll automático SOLO si el usuario está abajo
  React.useEffect(() => {
    if (!selectedChat) return;
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Geolocalización automática + clima real (Open-Meteo, sin API key)`;
if (c.includes(old3) && !c.includes('isAtBottomRef.current = true')) { c = c.replace(old3, new3); fixes++; console.log('Fix3: scroll useEffects added'); }
else console.log('Fix3: already applied');

// FIX 4: Sort en el render de mensajes
const old4 = '{msgs.map((msg) => (';
const new4 = '{[...msgs].filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i).sort((a,b)=>{const ts=(m)=>{if(m.created_at){const d=new Date(m.created_at);if(!isNaN(d.getTime()))return d.getTime();}if(m.timestamp){const d=new Date(m.timestamp);if(!isNaN(d.getTime()))return d.getTime();}const n=parseInt((m.id?.toString()||"").replace(/\\D/g,"")||"0");return n>1e12?n:0;};return ts(a)-ts(b);}).map((msg) => (';
if (c.includes(old4)) { c = c.replace(old4, new4); fixes++; console.log('Fix4: sort added'); }
else console.log('Fix4: already applied or not found');

// FIX 5: Añadir ref al final de mensajes y spacer
const old5 = '{/* Panel adjuntar */}';
if (!c.includes('ref={messagesEndRef}') && c.includes(old5)) {
  // Buscar el cierre del div de mensajes antes del panel adjuntar
  const panelIdx = c.indexOf(old5);
  const divClose = c.lastIndexOf('</div>\n\n              {/* Panel adjuntar', panelIdx);
  if (divClose > 0) {
    const before = c.substring(0, divClose);
    const after = c.substring(divClose);
    c = before + '\n                <div ref={messagesEndRef} style={{ height: 1 }} />' + after;
    fixes++;
    console.log('Fix5: messagesEndRef anchor added');
  }
}

fs.writeFileSync('App.tsx', c, 'utf8');
console.log(`\nTotal fixes applied: ${fixes}`);
console.log('created_at:', c.includes('created_at: m.created_at'));
console.log('messagesEndRef:', c.includes('messagesEndRef'));
console.log('isAtBottomRef:', c.includes('isAtBottomRef'));
console.log('sort:', c.includes('findIndex(x=>x.id===m.id)'));
