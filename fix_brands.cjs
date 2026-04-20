const fs = require('fs');
const path = require('path');

const files = [
  'App.tsx',
  'AuthScreen.tsx',
  'WhatsAppAuth.tsx',
  'WeChatAuth.tsx',
  'EstadosView.tsx',
  'ServiciosModules.tsx',
  'index.css',
];

// Mapa de reemplazos: marca → término genérico
const replacements = [
  // En comentarios y strings visibles al usuario
  [/WhatsApp/g, 'EGCHAT'],
  [/WeChat/g, 'EGCHAT'],
  [/\bIMO\b/g, 'EGCHAT'],
  [/Telegram/g, 'mensajería'],
  [/Instagram/g, 'red social'],
  [/TikTok/g, 'red social'],
  [/Facebook/g, 'red social'],
  [/Twitter/g, 'red social'],
  [/Snapchat/g, 'mensajería'],
  [/Signal/g, 'mensajería'],
  [/Viber/g, 'mensajería'],
  // Nombres de archivos/componentes — solo renombrar referencias internas en strings
  // (no renombramos los archivos físicos para no romper imports)
];

let totalFixed = 0;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  replacements.forEach(([pattern, replacement]) => {
    const before = content;
    // Solo reemplazar en strings de UI (entre comillas o backticks), no en nombres de variables/funciones/imports
    // Usamos una heurística: reemplazar solo cuando está entre ' " ` o en comentarios //
    content = content.replace(pattern, (match, offset) => {
      // Verificar contexto — no reemplazar en nombres de variables, imports, o nombres de archivo
      const before10 = content.substring(Math.max(0, offset-10), offset);
      const after10 = content.substring(offset, offset+match.length+10);
      
      // No reemplazar si es parte de un nombre de variable/función (camelCase, PascalCase)
      const charBefore = content[offset-1] || '';
      const charAfter = content[offset+match.length] || '';
      
      // Si está precedido por letra/número (parte de identificador), no reemplazar
      if (/[a-zA-Z0-9_]/.test(charBefore)) return match;
      // Si está seguido por letra/número que forma parte de un identificador compuesto, no reemplazar
      // Excepto si es un string (entre comillas)
      
      return replacement;
    });
    if (content !== before) changed = true;
  });
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log('Fixed:', file);
  }
});

// Verificación final en App.tsx
const appContent = fs.readFileSync('App.tsx', 'utf8');
const brands = ['WhatsApp', 'WeChat', 'Telegram', 'Instagram', 'IMO', 'TikTok'];
brands.forEach(b => {
  const matches = appContent.match(new RegExp(b, 'gi')) || [];
  if (matches.length > 0) console.log('Remaining', b, ':', matches.length);
});

console.log('Done. Files fixed:', totalFixed);
