import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Mercado Pago Preference Route
  app.post('/api/mercadopago/create-preference', async (req, res) => {
    try {
      const { accessToken, preference } = req.body;
      if (!accessToken) {
        return res.status(400).json({ message: 'Access Token do Mercado Pago não informado.' });
      }

      const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preference)
      });

      const data = await mpRes.json();
      return res.status(mpRes.status).json(data);
    } catch (err: any) {
      console.error('Error creating Mercado Pago preference:', err);
      return res.status(500).json({ message: err.message || 'Erro ao processar preference' });
    }
  });

  // Test credentials route
  app.post('/api/mercadopago/test-connection', async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ success: false, message: 'Access Token não informado.' });
      }

      const mpRes = await fetch('https://api.mercadopago.com/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken.trim()}`
        }
      });

      const data = await mpRes.json();
      if (mpRes.ok) {
        return res.json({
          success: true,
          message: `Conexão bem sucedida com o Mercado Pago! Titular: ${data.first_name || ''} ${data.last_name || ''} (${data.email || data.nickname || 'ID: ' + data.id}).`,
          user: data
        });
      } else {
        return res.status(400).json({
          success: false,
          message: data.message || 'Access Token inválido ou expirado no Mercado Pago.'
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Erro ao conectar ao Mercado Pago' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pulsar Tecnologia server running on port ${PORT}`);
  });
}

startServer();
