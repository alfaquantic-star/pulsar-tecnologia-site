import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function mercadoPagoDevPlugin(): Plugin {
  return {
    name: 'mercadopago-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/mercadopago/create-preference' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { accessToken, preference } = JSON.parse(body || '{}');
              if (!accessToken) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: 'Access Token do Mercado Pago não informado.' }));
                return;
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
              res.statusCode = mpRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: err.message || 'Erro ao processar requisição Mercado Pago' }));
            }
          });
          return;
        }

        if (req.url === '/api/mercadopago/test-connection' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { accessToken } = JSON.parse(body || '{}');
              if (!accessToken) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: 'Access Token não informado.' }));
                return;
              }

              const mpRes = await fetch('https://api.mercadopago.com/users/me', {
                headers: {
                  'Authorization': `Bearer ${accessToken.trim()}`
                }
              });

              const data = await mpRes.json();
              if (mpRes.ok) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: true, 
                  message: `Conexão bem sucedida com o Mercado Pago! Titular: ${data.first_name || ''} ${data.last_name || ''} (${data.email || data.nickname || 'ID: ' + data.id}).`,
                  user: data 
                }));
              } else {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: false, 
                  message: data.message || 'Access Token inválido ou expirado no Mercado Pago.' 
                }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err.message || 'Erro ao conectar ao Mercado Pago' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), mercadoPagoDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

