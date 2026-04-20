const fs = require('fs');
const f = fs.readFileSync('App.tsx', 'utf8');
const lines = f.split('\n');
const panelLines = ['recientes','caras','gestos','personas','animales','comida','viajes','objetos','simbolos','custom'];
const results = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("'👁'")) {
    const isPanel = panelLines.some(p => line.includes(p));
    if (!isPanel) {
      results.push('L'+(i+1)+': '+line.trim().substring(0,120));
    }
  }
}
console.log(results.length + ' lines with eye emoji outside panel:');
results.slice(0,30).forEach(r => console.log(r));
