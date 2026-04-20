const fs = require('fs');
let f = fs.readFileSync('App.tsx', 'utf8');

// Fix template literals with ??
f = f.replace(/`\?\? \$\{myName\}/g, '`👤 ${myName}');
f = f.replace(/`\?\? \$\{myPhone\}/g, '`📱 ${myPhone}');
f = f.replace(/`📌 Transferencia\n\?\? \$\{amount/g, '`💸 Transferencia\n💰 ${amount');
f = f.replace(/\?\? Formatos soportados/g, '📁 Formatos soportados');
f = f.replace(/M\?x\. recomendado/g, 'Máx. recomendado');
f = f.replace(/\?\? Encu\?ntralo en tu factura o en el medidor/g, '📋 Encuéntralo en tu factura o en el medidor');
f = f.replace(/\?\? Encu\?ntralo en tu factura de agua/g, '📋 Encuéntralo en tu factura de agua');
f = f.replace(/\?\? Encu\?ntralo en tu factura/g, '📋 Encuéntralo en tu factura');
f = f.replace(/\?\? Consultar factura/g, '🔍 Consultar factura');
f = f.replace(/<span>\?\?<\/span>/g, '<span>ℹ️</span>');
f = f.replace(/caption \? `\?\? \$\{caption\}` : '/g, "caption ? `📷 ${caption}` : '");
f = f.replace(/: '📷 Foto'/g, ": '📷 Foto'");

// Fix remaining ?? in template literals
f = f.replace(/`\?\? /g, '`📌 ');
f = f.replace(/\n\?\? /g, '\n📌 ');

fs.writeFileSync('App.tsx', f, 'utf8');

const remaining = (f.match(/'[^']*\?\?[^']*'/g) || []).filter(m => !m.includes('??=')).length;
const remainingTemplate = (f.match(/`[^`]*\?\?[^`]*`/g) || []).length;
console.log('Remaining ?? in strings:', remaining);
console.log('Remaining ?? in templates:', remainingTemplate);
console.log('Done');
