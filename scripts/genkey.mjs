import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const priv = createPrivateKey(readFileSync('private.pem'));

const now = Math.floor(Date.now() / 1000);
const payload = {
  licensee: 'Shop Name',        // <- change
  edition: 'PRO',               // <- change
  iat: now,
  //exp: now + 365 * 86400,       // <- remove this line for a perpetual key
};

const bytes = Buffer.from(JSON.stringify(payload));      // sign these exact bytes
const key = `${bytes.toString('base64url')}.${sign(null, bytes, priv).toString('base64url')}`;
console.log(key);