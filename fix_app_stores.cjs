const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  "if (Array.isArray(parsed) && parsed.length > 0) return parsed;",
  "if (Array.isArray(parsed) && parsed.length >= 40) return parsed; // Force reload if old small array"
);

fs.writeFileSync('src/App.tsx', app);
console.log('App stores load logic fixed');
