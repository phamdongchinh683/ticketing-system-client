import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const configPath = path.join(root, 'public', 'firebase-config.js');

function parseEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const txt = fs.readFileSync(filePath, 'utf8');
  for (const line of txt.split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i < 0) continue;
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

const env = { ...parseEnv(envPath), ...process.env };
const required = [
  'NG_APP_FIREBASE_API_KEY',
  'NG_APP_FIREBASE_AUTH_DOMAIN',
  'NG_APP_FIREBASE_PROJECT_ID',
  'NG_APP_FIREBASE_STORAGE_BUCKET',
  'NG_APP_FIREBASE_MESSAGING_SENDER_ID',
  'NG_APP_FIREBASE_APP_ID',
];

const missing = required.filter((k) => !env[k]);
if (missing.length) {
  console.error('Missing env vars for firebase-messaging-sw.js:', missing.join(', '));
  process.exit(1);
}

const configJs = `// AUTO-GENERATED FILE. DO NOT COMMIT REAL VALUES.
self.__FIREBASE_CONFIG__ = {
  apiKey: ${JSON.stringify(env.NG_APP_FIREBASE_API_KEY)},
  authDomain: ${JSON.stringify(env.NG_APP_FIREBASE_AUTH_DOMAIN)},
  projectId: ${JSON.stringify(env.NG_APP_FIREBASE_PROJECT_ID)},
  storageBucket: ${JSON.stringify(env.NG_APP_FIREBASE_STORAGE_BUCKET)},
  messagingSenderId: ${JSON.stringify(env.NG_APP_FIREBASE_MESSAGING_SENDER_ID)},
  appId: ${JSON.stringify(env.NG_APP_FIREBASE_APP_ID)},
};
`;

fs.writeFileSync(configPath, configJs, 'utf8');
console.log('Generated public/firebase-config.js from .env');
