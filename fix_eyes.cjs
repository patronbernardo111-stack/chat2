const fs = require('fs');
let f = fs.readFileSync('App.tsx', 'utf8');

// 1. Custom emojis labels (were real emojis before corruption)
f = f.replace("{ id:'1', label:'👁', title:'Rico',    source:'created' }", "{ id:'1', label:'🦁', title:'Rico',    source:'created' }");
f = f.replace("{ id:'2', label:'👁', title:'Leon GQ', source:'created' }", "{ id:'2', label:'🌍', title:'Leon GQ', source:'created' }");
f = f.replace("{ id:'4', label:'👁', title:'Verde GQ',source:'created' }", "{ id:'4', label:'💚', title:'Verde GQ',source:'created' }");
f = f.replace("{ id:'5', label:'👁', title:'Medalla', source:'copied', from:'Juan' }", "{ id:'5', label:'🏅', title:'Medalla', source:'copied', from:'Juan' }");
f = f.replace("{ id:'6', label:'👁', title:'Fuerza',  source:'copied', from:'María Garcia' }", "{ id:'6', label:'💪', title:'Fuerza',  source:'copied', from:'María Garcia' }");

// 2. Call type icon
f = f.replace("const icon = type === 'video' ? '👁' : '🙈'", "const icon = type === 'video' ? '📹' : '📞'");

// 3. Layout icons
f = f.replace("{ id: 'default',   label: 'Estndar',    desc: 'Balance + tarjetas',       icon: '👁' }", "{ id: 'default',   label: 'Estándar',    desc: 'Balance + tarjetas',       icon: '🏠' }");
f = f.replace("{ id: 'cards',     label: 'Tarjetas',    desc: 'Grid de servicios grande',  icon: '👁' }", "{ id: 'cards',     label: 'Tarjetas',    desc: 'Grid de servicios grande',  icon: '🏠' }");
f = f.replace("{ id: 'news',      label: 'Noticias',    desc: 'Noticias en portada',       icon: '👁' }", "{ id: 'news',      label: 'Noticias',    desc: 'Noticias en portada',       icon: '📰' }");
f = f.replace("{ id: 'finance',   label: 'Finanzas',    desc: 'Enfocado en cartera',       icon: '👁' }", "{ id: 'finance',   label: 'Finanzas',    desc: 'Enfocado en cartera',       icon: '💳' }");

// 4. Balance visibility eye icon
f = f.replace(/isBalanceVisible\('home-minimal'\) \? '👁' : '🙈'/g, "isBalanceVisible('home-minimal') ? '🙈' : '👁'");
f = f.replace(/isBalanceVisible\('fin-transfer'\) \? '👁' : '🙈'/g, "isBalanceVisible('fin-transfer') ? '🙈' : '👁'");
f = f.replace(/isBalanceVisible\('fin-invest'\) \? '👁' : '🙈'/g, "isBalanceVisible('fin-invest') ? '🙈' : '👁'");

// 5. Message type detection - startsWith eye emoji (was 📄, 📎, 🎥, 🎵)
f = f.replace(/msg\.text\?\.startsWith\('👁'\) \|\| msg\.text\?\.startsWith\('👁'\)/g, "msg.text?.startsWith('📄') || msg.text?.startsWith('📎')");
// First standalone startsWith eye after the above
f = f.replace(/\) : msg\.text\?\.startsWith\('👁'\) \? \(\s*\/\* -- VIDEO/g, ") : msg.text?.startsWith('🎥') ? (\n                        /* -- VIDEO");
// Audio
f = f.replace(/msg\.text\?\.startsWith\('👁'\)\s*\? \(\(\) => \{/g, "msg.text?.startsWith('🎵') ? (() => {");

// 6. Copied emoji examples
f = f.replace("{ id: Date.now().toString(), label: '👁', title: 'De Juan', source: 'copied' as const, from: 'Juan' }", "{ id: Date.now().toString(), label: '🏅', title: 'De Juan', source: 'copied' as const, from: 'Juan' }");
f = f.replace("{ id: (Date.now()+1).toString(), label: '👁', title: 'De María', source: 'copied' as const, from: 'María' }", "{ id: (Date.now()+1).toString(), label: '💪', title: 'De María', source: 'copied' as const, from: 'María' }");

// 7. Quick reactions row
f = f.replace("{['👁','👁','👁','👁','👁','👁','👁'].map((emoji, i) => (", "{['👍','❤️','😂','😮','😢','🙏','🔥'].map((emoji, i) => (");

// 8. Payment method icons (wallet, bank, cash)
f = f.replace(/\{id:'wallet',label:'EGCHAT Wallet',icon:'👁'\}/g, "{id:'wallet',label:'EGCHAT Wallet',icon:'💳'}");
f = f.replace(/\{id:'wallet',label:'EGCHAT',icon:'👁'\}/g, "{id:'wallet',label:'EGCHAT',icon:'💳'}");
f = f.replace(/\{id:'bank',label:'Banco',icon:'👁'\}/g, "{id:'bank',label:'Banco',icon:'🏦'}");
f = f.replace(/\{id:'cash',label:'Efectivo',icon:'👁'\}/g, "{id:'cash',label:'Efectivo',icon:'💵'}");

// 9. Form field icons (person, qty, etc.)
f = f.replace(/\{key:'student',placeholder:'Nombre del estudiante',type:'text',icon:'👁'\}/g, "{key:'student',placeholder:'Nombre del estudiante',type:'text',icon:'👤'}");
f = f.replace(/\{key:'institution',placeholder:'Centro educa/g, "{key:'institution',placeholder:'Centro educa");
f = f.replace(/,icon:'👁'\},\{key:'institution'/g, ",icon:'👤'},{key:'institution'");
f = f.replace(/\{key:'name',placeholder:'Nombre completo',type:'text',icon:'👁'\}/g, "{key:'name',placeholder:'Nombre completo',type:'text',icon:'👤'}");
f = f.replace(/\{key:'qty',placeholder:'Cantidad de billetes',type:'n/g, "{key:'qty',placeholder:'Cantidad de billetes',type:'n");
f = f.replace(/,icon:'👁'\},\{key:'qty'/g, ",icon:'👤'},{key:'qty'");
f = f.replace(/\{key:'sender',placeholder:'Remitente \(nombre\)',type:'text',icon:'👁'\}/g, "{key:'sender',placeholder:'Remitente (nombre)',type:'text',icon:'👤'}");
f = f.replace(/\{key:'dest',placeholder:'Destinatario \(nombre\)/g, "{key:'dest',placeholder:'Destinatario (nombre)");
f = f.replace(/,icon:'👁'\},\{key:'dest'/g, ",icon:'👤'},{key:'dest'");
f = f.replace(/\{key:'nif',placeholder:'NIF \/ DNI del contribuyente',type:'text',icon:'👁'\}/g, "{key:'nif',placeholder:'NIF / DNI del contribuyente',type:'text',icon:'👤'}");
f = f.replace(/\{key:'ref',placeholder:'Referencia de pago/g, "{key:'ref',placeholder:'Referencia de pago");
f = f.replace(/,icon:'👁'\},\{key:'ref'/g, ",icon:'📋'},{key:'ref'");
f = f.replace(/\{key:'name',placeholder:'Tu nombre completo',type:'text',icon:'👁'\}/g, "{key:'name',placeholder:'Tu nombre completo',type:'text',icon:'👤'}");
f = f.replace(/\{key:'address',placeholder:'dirección de entrega/g, "{key:'address',placeholder:'dirección de entrega");
f = f.replace(/,icon:'👁'\},\{key:'address'/g, ",icon:'👤'},{key:'address'");

// 10. Any remaining eye emojis in icon fields
f = f.replace(/,icon:'👁'\}/g, ",icon:'📋'}");
f = f.replace(/icon:'👁'/g, "icon:'📋'");

// Final check
const eyeCount = (f.match(/'👁'/g)||[]).length;
console.log('Remaining eye emojis:', eyeCount);

fs.writeFileSync('App.tsx', f, 'utf8');
console.log('✅ All eye emojis fixed');
