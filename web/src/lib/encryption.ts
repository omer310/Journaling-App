import { auth } from './firebase';

// Convert string to ArrayBuffer
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Convert ArrayBuffer to string
function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
}

// Generate an encryption key from the user's UID
async function generateKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('soul-pages-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data
export async function encryptData(data: string): Promise<string> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const key = await generateKey(userId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encoder.encode(data)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  // Convert to base64 for storage
  return btoa(ab2str(combined.buffer));
}

// Decrypt data
export async function decryptData(encryptedData: string): Promise<string> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const key = await generateKey(userId);
  const decoder = new TextDecoder();

  // Convert from base64 and separate IV and data
  const combined = new Uint8Array(str2ab(atob(encryptedData)));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  try {
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Helper function to check if a string is encrypted
export function isEncrypted(data: string): boolean {
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
} 