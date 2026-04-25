import 'dotenv/config';
import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createServer } from './server.js';
import { exchangeCode, refreshIfNeeded } from './auth.js';
import { setToken } from './tokenStore.js';

const app = express();
const PORT = process.env.PORT ?? 8770;
const HOST = process.env.SERVER_HOST ?? '0.0.0.0';

const REDIRECT_URI = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/callback`;
const SCOPES = 'activity heartrate sleep weight profile';

// Browser auth UI
app.get('/', (req, res) => {
  const { FITBIT_CLIENT_ID } = process.env;
  const authUrl =
    `https://www.fitbit.com/oauth2/authorize` +
    `?response_type=code&client_id=${FITBIT_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPES)}&expires_in=604800`;
  res.send(`<html><body>
    <h2>claude-fitbit</h2>
    <p><a href="${authUrl}">Authorize with Fitbit</a></p>
  </body></html>`);
});

app.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.status(400).send(`OAuth error: ${error ?? 'no code'}`);
  try {
    const token = await exchangeCode(code, REDIRECT_URI);
    const user = req.query.state ?? process.env.FITBIT_DEFAULT_USER ?? 'charles';
    setToken(user, token);
    res.send(`<html><body><h2>Authorized!</h2><p>Token saved for user <strong>${user}</strong>.</p></body></html>`);
  } catch (err) {
    res.status(500).send(`Token exchange failed: ${err.message}`);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// MCP SSE endpoint
const transports = new Map();
app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  transports.set(transport.sessionId, transport);
  res.on('close', () => transports.delete(transport.sessionId));
  const server = createServer();
  await server.connect(transport);
});

app.post('/messages', express.raw({ type: '*/*' }), async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);
  if (!transport) return res.status(404).send('Session not found');
  await transport.handlePostMessage(req, res);
});

app.listen(PORT, HOST, () => {
  process.stderr.write(`claude-fitbit listening on ${HOST}:${PORT}\n`);
});
