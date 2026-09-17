const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will just add a line in App.tsx right before defining stores that removes it, or modify the initial state to ignore local storage for stores this time.
// Wait, the simplest way is to replace the localStorage.getItem('wtc_stores') part.

content = content.replace(
  "const saved = localStorage.getItem('wtc_stores');",
  "const saved = localStorage.getItem('wtc_stores_v2'); // FORCE REFRESH TO NEW DATA"
);
content = content.replace(
  "localStorage.setItem('wtc_stores',",
  "localStorage.setItem('wtc_stores_v2',"
);

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx modified");
