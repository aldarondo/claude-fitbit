import { readFileSync, writeFileSync, existsSync } from 'fs';

const TOKEN_FILE = new URL('../tokens.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function load() {
  if (!existsSync(TOKEN_FILE)) return {};
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(tokens) {
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf8');
}

export function getToken(user) {
  return load()[user] ?? null;
}

export function setToken(user, token) {
  const tokens = load();
  tokens[user] = token;
  save(tokens);
}

export function listUsers() {
  return Object.keys(load());
}
