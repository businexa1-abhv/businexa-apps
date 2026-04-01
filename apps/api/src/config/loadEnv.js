/**
 * Loads env in order:
 * 1) apps/api/.env (optional base / legacy single file)
 * 2) apps/api/.env.<BUSINEXA_ENV> — overrides (businexaDev | businexaProd)
 *
 * Resolution:
 * - BUSINEXA_ENV if set (shell, CI, or .env)
 * - else NODE_ENV === 'production' → businexaProd
 * - else → businexaDev
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const apiRoot = path.join(__dirname, '..', '..');

function resolveBusinexaEnv() {
  const fromEnv = process.env.BUSINEXA_ENV && String(process.env.BUSINEXA_ENV).trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'production') return 'businexaProd';
  return 'businexaDev';
}

function loadEnv() {
  const basePath = path.join(apiRoot, '.env');
  if (fs.existsSync(basePath)) {
    dotenv.config({ path: basePath });
  }

  const envName = resolveBusinexaEnv();
  const specificPath = path.join(apiRoot, `.env.${envName}`);

  if (fs.existsSync(specificPath)) {
    dotenv.config({ path: specificPath, override: true });
  } else if (envName === 'businexaProd') {
    // eslint-disable-next-line no-console
    console.warn(
      `[env] Missing ${specificPath} — using only .env / process environment. Add .env.businexaProd on the server.`
    );
  }

  process.env.BUSINEXA_ENV = envName;
}

loadEnv();

module.exports = { loadEnv, resolveBusinexaEnv };
