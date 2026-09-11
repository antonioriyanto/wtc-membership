const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

if (!html.includes('apple-touch-icon')) {
  html = html.replace('</head>', `
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#0f172a" />
  </head>`);
  fs.writeFileSync('index.html', html);
  console.log('HTML updated');
}
