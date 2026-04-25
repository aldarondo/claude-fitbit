import axios from 'axios';
import { getToken, setToken } from './tokenStore.js';

const TOKEN_URL = 'https://api.fitbit.com/oauth2/token';

function basicAuth() {
  const { FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET } = process.env;
  return Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64');
}

export async function refreshIfNeeded(user) {
  const token = getToken(user);
  if (!token) throw new Error(`No token for user "${user}" — run node src/authorize.js first`);

  const expiresAt = token.obtained_at + token.expires_in * 1000;
  if (Date.now() < expiresAt - 60_000) return token;

  const { data } = await axios.post(
    TOKEN_URL,
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: token.refresh_token }),
    { headers: { Authorization: `Basic ${basicAuth()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const refreshed = { ...data, obtained_at: Date.now() };
  setToken(user, refreshed);
  return refreshed;
}

export async function exchangeCode(code, redirectUri) {
  const { data } = await axios.post(
    TOKEN_URL,
    new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
    { headers: { Authorization: `Basic ${basicAuth()}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return { ...data, obtained_at: Date.now() };
}
