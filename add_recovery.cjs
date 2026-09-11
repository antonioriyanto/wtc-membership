const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const script = `
    <script>
      window.addEventListener('error', function(e) {
        if (e.message && (e.message.includes('Unexpected token') || e.message.includes('SyntaxError') || e.message.includes('script error'))) {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (let registration of registrations) {
                registration.unregister();
              }
              if (registrations.length > 0) {
                window.location.reload();
              }
            });
          }
        }
      });
    </script>
  </head>`;

if (!html.includes('window.addEventListener(\'error\'')) {
  html = html.replace('</head>', script);
  fs.writeFileSync('index.html', html);
  console.log('Recovery script added');
}
