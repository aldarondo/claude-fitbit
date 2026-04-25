#!/usr/bin/env node
/**
 * CLI OAuth2 flow — opens browser, starts local callback server, saves token.
 * Usage: node src/authorize.js [user]
 */
import 'dotenv/config';
import http from 'http';
import { exchangeCode } from './auth.js';
import { setToken } from './tokenStore.js';

const PORT = 8770;
const user = process.argv[2] ?? process.env.FITBIT_DEFAULT_USER ?? 'charles';
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = 'activity heartrate sleep weight profile';

const { FITBIT_CLIENT_ID } = process.env;
if (!FITBIT_CLIENT_ID) {
  console.error('Set FITBIT_CLIENT_ID in .env first');
  process.exit(1);
}

const authUrl =
  `https://www.fitbit.com/oauth2/authorize` +
  `?response_type=code&client_id=${FITBIT_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}&expires_in=604800` +
  `&state=${user}`;

console.log(`\nOpen this URL in your browser:\n\n${authUrl}\n`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') return res.end();

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error || !code) {
    res.end(`OAuth error: ${error ?? 'no code'}`);
    server.close();
    return;
  }

  try {
    const token = await exchangeCode(code, REDIRECT_URI);
    setToken(user, token);
    res.end(`<html><body><h2>Authorized!</h2><p>Token saved for <strong>${user}</strong>. You can close this tab.</p></body></html>`);
    console.log(`\nToken saved for user "${user}" in tokens.json`);
  } catch (err) {
    res.end(`Token exchange failed: ${err.message}`);
    console.error('Token exchange failed:', err.message);
  }
  server.close();
});

server.listen(PORT, () => console.log(`Waiting for callback on port ${PORT}...`));
