#!/usr/bin/env node
import { parseArgs } from 'node:util';

const CLIENTS = {
  admin: 'bike-rental-admin',
  operator: 'bike-rental-operator',
  platform: 'bike-rental-platform',
};

const { values } = parseArgs({
  options: {
    api: { type: 'string', default: process.env.BIKE_API_URL ?? 'http://localhost:8080' },
    app: { type: 'string', default: 'admin' },
    roles: { type: 'string' },
    user: { type: 'string' },
    tenant: { type: 'string' },
    at: { type: 'string' },
    rt: { type: 'string' },
    'no-refresh': { type: 'boolean', default: false },
    users: { type: 'boolean', default: false },
    field: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

const USAGE = `Usage:
  node scripts/dev-auth.mjs --users
  node scripts/dev-auth.mjs --app admin --roles ADMIN [--user dev.admin.acme] [--tenant <id>]
                            [--at PT30S] [--rt PT10M] [--no-refresh] [--field access_token]

Requires the backend running with the "dev" profile (/api/dev/auth/**).`;

if (values.help) {
  console.log(USAGE);
  process.exit(0);
}

const api = values.api.replace(/\/+$/, '');

async function call(path, init) {
  const response = await fetch(`${api}${path}`, init).catch((error) => {
    console.error(`dev-auth: cannot reach ${api} (${error.message})`);
    process.exit(2);
  });
  if (response.status === 404) {
    console.error(
      'dev-auth: /api/dev/auth/** returned 404 — start the backend with the dev profile.',
    );
    process.exit(3);
  }
  if (!response.ok) {
    console.error(`dev-auth: ${response.status} ${await response.text()}`);
    process.exit(1);
  }
  return response.json();
}

if (values.users) {
  console.log(JSON.stringify(await call('/api/dev/auth/users'), null, 2));
  process.exit(0);
}

const clientId = CLIENTS[values.app];
if (!clientId || !values.roles) {
  console.error(USAGE);
  process.exit(1);
}

const body = {
  clientId,
  roles: values.roles.split(',').map((role) => role.trim()),
  username: values.user,
  tenantId: values.tenant,
  accessTokenTtl: values.at,
  refreshTokenTtl: values.rt,
  includeRefreshToken: !values['no-refresh'],
};

const tokens = await call('/api/dev/auth/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

if (values.field) {
  console.log(tokens[values.field] ?? '');
} else {
  const { access_token, refresh_token, id_token, expires_in, refresh_expires_in } = tokens;
  console.log(
    JSON.stringify(
      { access_token, refresh_token, id_token, expires_in, refresh_expires_in },
      null,
      2,
    ),
  );
}
