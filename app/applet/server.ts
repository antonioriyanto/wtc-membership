import express from 'express';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ==========================================
  // API ROUTES (Put all server-side logic here)
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Watch Club Omnichannel Backend is running!' });
  });

  // Example placeholder for the secure Add Points API
  app.post('/api/loyalty/add-points', async (req, res) => {
    // This will be implemented in the next steps using firebase-admin
    res.status(501).json({ error: 'Not implemented yet' });
  });


  // ==========================================
  // VITE & STATIC FILES MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Use Vite's middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve static files from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support client-side routing
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 for container accessibility
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Watch Club Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
