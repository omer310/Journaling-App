import { encryptData, decryptData, testEncryption } from '../encryption';

// Mock Supabase auth
jest.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id-12345'
          }
        }
      })
    }
  }
}));

describe('Encryption Tests', () => {
  beforeEach(() => {
    // Clear any previous test data
    jest.clearAllMocks();
  });

  test('should encrypt and decrypt data correctly', async () => {
    const testData = 'This is a test message for encryption!';
    
    const encrypted = await encryptData(testData);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(testData);
    expect(typeof encrypted).toBe('string');
    
    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(testData);
  });

  test('should handle empty string', async () => {
    const testData = '';
    
    const encrypted = await encryptData(testData);
    expect(encrypted).toBeDefined();
    
    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(testData);
  });

  test('should handle special characters', async () => {
    const testData = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const encrypted = await encryptData(testData);
    expect(encrypted).toBeDefined();
    
    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(testData);
  });

  test('should handle unicode characters', async () => {
    const testData = 'Unicode: 🚀🌟🎉 你好世界 مرحبا بالعالم';
    
    const encrypted = await encryptData(testData);
    expect(encrypted).toBeDefined();
    
    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(testData);
  });

  test('should handle long text', async () => {
    const testData = 'A'.repeat(1000); // 1000 character string
    
    const encrypted = await encryptData(testData);
    expect(encrypted).toBeDefined();
    
    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(testData);
  });

  test('should return unencrypted data when not encrypted', async () => {
    const testData = 'This is not encrypted';
    
    const result = await decryptData(testData);
    expect(result).toBe(testData);
  });

  test('should use strong encryption by default', async () => {
    const testData = 'Test for strong encryption';
    
    const encrypted = await encryptData(testData);
    const decrypted = await decryptData(encrypted);
    
    expect(decrypted).toBe(testData);
    
    // Verify that the encrypted data is different from the original
    expect(encrypted).not.toBe(testData);
    
    // Verify that the encrypted data is base64 encoded
    expect(() => atob(encrypted)).not.toThrow();
  });

  test('testEncryption function should work', async () => {
    const result = await testEncryption();
    expect(result).toBe(true);
  });
});
