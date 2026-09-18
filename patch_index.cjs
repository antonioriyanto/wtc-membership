const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldScript = `window.addEventListener('error', function(e) {
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
      });`;

const newScript = `function clearSWAndReload() {
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
      window.addEventListener('error', function(e) {
        if (e.message && (e.message.includes('Unexpected token') || e.message.includes('SyntaxError') || e.message.includes('script error'))) {
          clearSWAndReload();
        }
      });
      window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.message && (e.reason.message.includes('Unexpected token') || e.reason.message.includes('SyntaxError') || e.reason.message.includes('JSON'))) {
          clearSWAndReload();
        }
      });`;

html = html.replace(oldScript, newScript);
fs.writeFileSync('index.html', html);
