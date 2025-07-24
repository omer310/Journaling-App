import { supabase } from './supabase';

function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
}

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

export async function encryptData(data: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const key = await generateKey(user.id);
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

  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(ab2str(combined.buffer));
}

export async function decryptData(encryptedData: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Check if data is actually encrypted
  if (!isEncrypted(encryptedData)) {
    return encryptedData;
  }

  // First try web encryption (AES-GCM)
  try {
    const key = await generateKey(user.id);
    const decoder = new TextDecoder();

    const combined = new Uint8Array(str2ab(atob(encryptedData)));
    
    // Check if data is too small for AES-GCM (needs at least 12 bytes for IV)
    if (combined.length < 12) {
      throw new Error('Data too small for AES-GCM');
    }
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

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
    // If web encryption fails, try mobile encryption (simple XOR)
    try {
      return decryptMobileData(encryptedData, user.id);
    } catch (mobileError) {
      console.error('Failed to decrypt data with both methods:', { web: error, mobile: mobileError });
      throw new Error('Failed to decrypt data');
    }
  }
}

// Mobile encryption compatibility
function generateMobileKey(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function decryptMobileData(encryptedText: string, userId: string): string {
  const key = generateMobileKey(userId);
  const decoded = atob(encryptedText);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    const decryptedChar = charCode ^ keyChar;
    result += String.fromCharCode(decryptedChar);
  }
  return result;
}

export function isEncrypted(data: string): boolean {
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
} 