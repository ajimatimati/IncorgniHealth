const fs = require('fs');
const path = require('path');
const scanDir = (dir) => {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      scanDir(p);
    } else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      const ext = fs.readFileSync(p, 'utf8');
      if (ext.includes('useEffect') && !ext.match(/import\s*\{[^}]*useEffect[^}]*\}\s*from\s*['"]react['"]/)) {
        console.log('MISSING IMPORT IN:', p);
      }
    }
  });
};
scanDir('./client/src');
