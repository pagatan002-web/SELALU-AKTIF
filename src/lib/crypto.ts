// Web Crypto API (AES-GCM) for client-side Zero-Knowledge encryption

const ENC_ALGO = 'AES-GCM';
const PBKDF2_ITERATIONS = 100000;

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENC_ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: ENC_ALGO, iv },
    key,
    enc.encode(data)
  );

  const combined = {
    s: Array.from(salt),
    iv: Array.from(iv),
    d: Array.from(new Uint8Array(encryptedContent)),
  };

  return btoa(JSON.stringify(combined));
}

export async function decryptData(cipherText: string, passphrase: string): Promise<string> {
  try {
    const raw = atob(cipherText);
    const parsed = JSON.parse(raw);
    const salt = new Uint8Array(parsed.s);
    const iv = new Uint8Array(parsed.iv);
    const data = new Uint8Array(parsed.d);

    const key = await deriveKey(passphrase, salt);
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: ENC_ALGO, iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (err) {
    throw new Error('Gagal mendekripsi data. PIN / Passphrase salah atau data korup.');
  }
}
