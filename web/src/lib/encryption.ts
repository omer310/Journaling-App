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
    // If web encryption fails, try mobile encryption
    try {
      return await decryptMobileData(encryptedData, user.id);
    } catch (mobileError) {
      console.error('Failed to decrypt data with both methods:', { web: error, mobile: mobileError });
      throw new Error('Failed to decrypt data');
    }
  }
}

// Mobile encryption compatibility - Updated to handle new mobile encryption
async function generateMobileKey(userId: string): Promise<Uint8Array> {
  try {
    // Use Web Crypto API to match mobile's SHA-256 key derivation
    const encoder = new TextEncoder();
    const data = encoder.encode(userId + 'soul-pages-salt');
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  } catch (error) {
    console.error('Error generating mobile key:', error);
    throw new Error('Failed to generate mobile encryption key');
  }
}

async function decryptMobileData(encryptedText: string, userId: string): Promise<string> {
  try {
    // Handle the new mobile encryption format
    
    // Check for empty string marker
    if (encryptedText === 'EMPTY_STRING_ENCRYPTED') {
      return '';
    }
    
    // Get the mobile key (same as mobile generateKey function)
    const key = await generateMobileKey(userId);
    
    // Convert from base64 to binary data
    const binaryString = atob(encryptedText);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    // Check if data is too small for new mobile format (needs at least 12 bytes for IV)
    if (combined.length < 12) {
      // Try legacy mobile decryption
      return decryptLegacyMobileData(encryptedText, userId);
    }
    
    const ivBytes = combined.slice(0, 12);
    const data = combined.slice(12);
    
    // Reverse the mobile encryption process (double XOR)
    const decryptedData = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      // Reverse: XOR with IV first, then with key
      const keyByte = key[i % key.length];
      const ivByte = ivBytes[i % ivBytes.length];
      decryptedData[i] = data[i] ^ keyByte ^ ivByte;
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Error in decryptMobileData:', error);
    // Fallback to legacy mobile decryption
    return decryptLegacyMobileData(encryptedText, userId);
  }
}

// Legacy mobile encryption for backward compatibility
function generateLegacyMobileKey(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function decryptLegacyMobileData(encryptedText: string, userId: string): string {
  const key = generateLegacyMobileKey(userId);
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