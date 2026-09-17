const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const middlewareSection = `  // Vite middleware for development`;
const newEndpointSection = `
  // Secure Authentication Endpoint to mint Custom Tokens for Cashiers & HO Admins
  app.post('/api/auth/employee-login', express.json(), async (req, res) => {
    try {
      const { username, pin, type, storeId } = req.body;
      
      if (!username || !pin) {
        return res.status(400).json({ error: 'Username dan PIN wajib diisi' });
      }

      const uid = username.trim().toUpperCase();
      let customToken = '';

      if (type === 'HO' && (username.toLowerCase() === 'admin' || username.toLowerCase() === 'ho') && pin.toLowerCase() === 'wtc26') {
        customToken = await getAuth().createCustomToken('HO_ADMIN_USER', { role: 'HO_ADMIN' });
      } else if (type === 'CASHIER') {
        customToken = await getAuth().createCustomToken(\`CASHIER_\${uid}\`, { role: 'CASHIER', storeId: storeId || uid });
      } else {
        return res.status(401).json({ error: 'Kredensial tidak valid' });
      }

      res.status(200).json({ success: true, token: customToken });
    } catch (error: any) {
      console.error('Auth Error:', error.message);
      res.status(500).json({ success: false, error: 'Gagal membuat sesi login' });
    }
  });
  
  // Vite middleware for development`;

// If we put it inside the previous block, it might have been missed or added to the wrong place.
// Let's replace the Vite middleware hook to ensure it's loaded before wildcard routes.
server = server.replace(middlewareSection, newEndpointSection);
fs.writeFileSync('server.ts', server);
