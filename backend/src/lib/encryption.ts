import type { Env } from './env';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/* ---------- Key derivation helper ---------- */
function getCryptoKey(env: Env): CryptoKey {
  const rawKey = encoder.encode(env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  return new Uint8Array(rawKey) as any; // 32-byte key
}

/* ---------- Encrypt ---------- */
export async function encrypt(
  env: Env,
  plaintext: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    getCryptoKey(env),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipherBuf), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/* ---------- Decrypt ---------- */
export async function decrypt(
  env: Env,
  base64: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    getCryptoKey(env),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const data = new Uint8Array(
    atob(base64)
      .split('')
      .map(c => c.charCodeAt(0))
  );
  const iv = data.slice(0, 12);
  const cipher = data.slice(12);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipher
  );
  return decoder.decode(plainBuf);
}
