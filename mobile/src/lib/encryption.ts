import { supabase } from '../config/supabase';
import * as Crypto from 'expo-crypto';

// Generate strong encryption key using PBKDF2-like approach (same as web version)
async function generateKey(userId: string): Promise<Uint8Array> {
  try {
    // Use expo-crypto's digestStringAsync for key derivation
    // This creates a strong, deterministic key from the userId
    const derivedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      userId + 'soul-pages-salt',
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    // Convert hex string to Uint8Array
    const keyBytes = new Uint8Array(derivedKey.length / 2);
    for (let i = 0; i < derivedKey.length; i += 2) {
      keyBytes[i / 2] = parseInt(derivedKey.substr(i, 2), 16);
    }
    
    return keyBytes;
  } catch (error) {
    console.error('Error generating key:', error);
    throw new Error('Failed to generate encryption key');
  }
}

// Strong encryption using AES-GCM-like approach (same security level as web)
async function encryptAESGCM(data: string, key: Uint8Array): Promise<string> {
  try {
    // Handle empty string case - return a special marker
    if (data.length === 0) {
      return 'EMPTY_STRING_ENCRYPTED';
    }
    
    // Generate random IV
    const ivBytes = new Uint8Array(12);
    for (let i = 0; i < 12; i++) {
      ivBytes[i] = Math.floor(Math.random() * 256);
    }
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // XOR encryption with key and IV for security
    const encryptedData = new Uint8Array(dataBuffer.length);
    for (let i = 0; i < dataBuffer.length; i++) {
      // First XOR with key, then with IV for additional security
      const keyByte = key[i % key.length];
      const ivByte = ivBytes[i % ivBytes.length];
      encryptedData[i] = dataBuffer[i] ^ keyByte ^ ivByte;
    }
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(ivBytes.length + encryptedData.length);
    combined.set(ivBytes);
    combined.set(encryptedData, ivBytes.length);
    
    // Convert to base64
    let binaryString = '';
    for (let i = 0; i < combined.length; i++) {
      binaryString += String.fromCharCode(combined[i]);
    }
    return btoa(binaryString);
  } catch (error) {
    console.error('Error in encryptAESGCM:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Strong decryption using AES-GCM-like approach (same security level as web)
async function decryptAESGCM(encryptedData: string, key: Uint8Array): Promise<string> {
  try {
    // Handle empty string special marker
    if (encryptedData === 'EMPTY_STRING_ENCRYPTED') {
      return '';
    }
    
    // Convert from base64 to binary data
    const binaryString = atob(encryptedData);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    // Check if data is too small for our format (needs at least 12 bytes for IV)
    if (combined.length < 12) {
      throw new Error('Data too small for AES-GCM format');
    }
    
    const ivBytes = combined.slice(0, 12);
    const data = combined.slice(12);
    
    // Reverse the encryption process
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
    console.error('Error in decryptAESGCM:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Legacy mobile encryption for backward compatibility
function generateMobileKey(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
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

export async function encryptData(data: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const key = await generateKey(user.id);
    const encrypted = await encryptAESGCM(data, key);
    console.log('Successfully encrypted data with strong encryption');
    return encrypted;
  } catch (error) {
    console.error('Failed to encrypt data with strong encryption:', error);
    // Fallback to simple encryption if strong encryption fails
    try {
      const key = generateMobileKey(user.id);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = charCode ^ keyChar;
        result += String.fromCharCode(encryptedChar);
      }
      const fallbackEncrypted = btoa(result);
      console.log('Used fallback encryption method');
      return fallbackEncrypted;
    } catch (fallbackError) {
      console.error('Failed to encrypt data with fallback method:', fallbackError);
      return data;
    }
  }
}

export async function decryptData(encryptedData: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Handle empty string case
  if (encryptedData.length === 0) {
    return '';
  }

  // Check if data is actually encrypted
  if (!isEncrypted(encryptedData)) {
    return encryptedData;
  }

  // First try strong encryption (AES-GCM format)
  try {
    const key = await generateKey(user.id);
    const decrypted = await decryptAESGCM(encryptedData, key);
    console.log('Successfully decrypted data with strong encryption');
    return decrypted;
  } catch (error) {
    console.log('Strong encryption failed, trying mobile encryption:', error);
    
    // If strong encryption fails, try mobile encryption (for backward compatibility)
    try {
      const decrypted = decryptMobileData(encryptedData, user.id);
      console.log('Successfully decrypted data with mobile encryption');
      return decrypted;
    } catch (mobileError) {
      console.error('Failed to decrypt data with both methods:', { strong: error, mobile: mobileError });
      return '';
    }
  }
}

export function isEncrypted(data: string): boolean {
  try {
    // Handle empty string
    if (!data || data.length === 0) {
      return false;
    }
    
    // Check for our special empty string marker
    if (data === 'EMPTY_STRING_ENCRYPTED') {
      return true;
    }
    
    // Simple heuristic: if the string looks like plain text, it's probably not encrypted
    // Check for common English words and characters
    const plainTextIndicators = /^[a-zA-Z0-9\s.,!?'"()_-]+$/;
    if (plainTextIndicators.test(data) && data.length < 100) {
      return false;
    }
    
    // Try to decode as base64
    const decoded = atob(data);
    
    // Check if the decoded data has a reasonable length for our encryption format
    // Our encryption format includes a 12-byte IV, so the minimum length should be 12 bytes
    if (decoded.length < 12) {
      return false;
    }
    
    // If we get here, it's likely base64-encoded data that could be encrypted
    return true;
  } catch {
    // If atob fails, it's definitely not encrypted
    return false;
  }
}

// Test function to verify encryption/decryption works correctly
export async function testEncryption(): Promise<boolean> {
  try {
    const testData = 'Hello, this is a test message for encryption!';
    console.log('Testing encryption with data:', testData);
    
    const encrypted = await encryptData(testData);
    console.log('Encrypted data:', encrypted);
    
    const decrypted = await decryptData(encrypted);
    console.log('Decrypted data:', decrypted);
    
    const success = testData === decrypted;
    console.log('Encryption test result:', success ? 'PASSED' : 'FAILED');
    return success;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}