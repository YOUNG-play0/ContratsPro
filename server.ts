import path from 'path';
import express from 'express';
import { app } from './api/index.js';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

// Vite middleware & start server (for local dev and standard container hosting)
export async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the server if not running inside a serverless platform like Vercel
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
