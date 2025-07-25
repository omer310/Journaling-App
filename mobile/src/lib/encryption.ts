import { supabase } from '../config/supabase';

// Simple encryption for React Native (not as secure as web crypto but functional)
function generateKey(userId: string): string {
  // Create a simple key from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function simpleEncrypt(text: string, key: string): string {
  try {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      const encryptedChar = charCode ^ keyChar;
      result += String.fromCharCode(encryptedChar);
    }
    return btoa(result);
  } catch (error) {
    console.error('Error in simpleEncrypt:', error);
    throw new Error('Failed to encrypt data');
  }
}

function simpleDecrypt(encryptedText: string, key: string): string {
  try {
    // Check if the data is actually base64 encoded
    if (!encryptedText || encryptedText.trim() === '') {
      throw new Error('Empty or invalid encrypted data');
    }
    
    const decoded = atob(encryptedText);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      const decryptedChar = charCode ^ keyChar;
      result += String.fromCharCode(decryptedChar);
    }
    return result;
  } catch (error) {
    console.error('Error in simpleDecrypt:', error);
    throw new Error('Failed to decrypt data');
  }
}

export async function encryptData(data: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const key = generateKey(user.id);
    return simpleEncrypt(data, key);
  } catch (error) {
    console.error('Failed to encrypt data:', error);
    // Return the original data if encryption fails
    return data;
  }
}

export async function decryptData(encryptedData: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const key = generateKey(user.id);
    return simpleDecrypt(encryptedData, key);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    // Return empty string instead of throwing to prevent app crashes
    return '';
  }
}

export function isEncrypted(data: string): boolean {
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
} 