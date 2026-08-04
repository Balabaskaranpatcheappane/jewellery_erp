#!/usr/bin/env node
// Vendor-side product-key generator (KEEP THE PRIVATE KEY SECRET).
//
// Generate a new keypair:
//   node scripts/license-keygen.mjs --init
//   -> paste PUBLIC into apps/api LICENSE_PUBLIC_KEY (or the embedded default),
//      keep PRIVATE safe.
//
// Mint a product key (private key via env or --priv <file>):
//   LICENSE_PRIVATE_KEY="$(cat private.pem)" \
//     node scripts/license-keygen.mjs --sign --licensee "Azhagar Jewelry" --edition PRO --days 365
//   (omit --days for a perpetual key)
import { generateKeyPairSync, createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

if (args.includes('--init')) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  console.log('=== PUBLIC KEY (embed in app / LICENSE_PUBLIC_KEY) ===');
  console.log(publicKey.export({ type: 'spki', format: 'pem' }).toString().trim());
  console.log('\n=== PRIVATE KEY (keep secret, never commit) ===');
  console.log(privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().trim());
  process.exit(0);
}

if (args.includes('--sign')) {
  const licensee = get('--licensee');
  if (!licensee) {
    console.error('--licensee is required');
    process.exit(1);
  }
  const edition = get('--edition') ?? 'STANDARD';
  const days = get('--days') ? Number(get('--days')) : undefined;
  const privPem = process.env.LICENSE_PRIVATE_KEY ?? (get('--priv') && readFileSync(get('--priv'), 'utf8'));
  if (!privPem) {
    console.error('Provide the private key via LICENSE_PRIVATE_KEY env or --priv <file>');
    process.exit(1);
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = { licensee, edition, iat: now, ...(days ? { exp: now + days * 86400 } : {}) };
  const payloadBuf = Buffer.from(JSON.stringify(payload), 'utf8');
  const signature = sign(null, payloadBuf, createPrivateKey(privPem.replace(/\\n/g, '\n')));
  const key = `${payloadBuf.toString('base64url')}.${signature.toString('base64url')}`;
  console.log(key);
  process.exit(0);
}

console.error('Usage: --init | --sign --licensee <name> [--edition PRO] [--days 365] [--priv key.pem]');
process.exit(1);
