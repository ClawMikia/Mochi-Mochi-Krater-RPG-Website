const fs = require('fs');
const content = fs.readFileSync('./js/monsters.js', 'utf8');
const monsters = [];
content.match(/\{[^}]*name:\s*"([^"]+)"[^}]*type:\s*"([^"]+)"[^}]*\}/gs).forEach(m => {
  const nameMatch = m.match(/name:\s*"([^"]+)"/);
  const typeMatch = m.match(/type:\s*"([^"]+)"/);
  if (nameMatch && typeMatch) monsters.push({name: nameMatch[1], type: typeMatch[1]});
});

const pngFiles = fs.readdirSync('./assets/characters').filter(f => f.endsWith('.png')).map(f => f.replace('.png', ''));
const missing = monsters.filter(m => !pngFiles.includes(m.name));

console.log('Total monsters in DB:', monsters.length);
console.log('PNG files found:', pngFiles.length);
console.log('\nMonsters WITH PNG files:', monsters.length - missing.length);
console.log('\nMonsters missing PNG files:');
missing.forEach(m => console.log(m.name + ' (' + m.type + ')'));
console.log('\nTotal missing:', missing.length);