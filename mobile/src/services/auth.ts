import * as SecureStore from 'expo-secure-store';
import { sync } from './sync';

const PIN_KEY = 'journal_pin';
const BIOMETRICS_KEY = 'journal_biometrics_enabled';
const WEB_CREDENTIALS_KEY = 'web_credentials';

interface WebCredentials {
  email: string;
  password: string;
}

export const auth = {
  async setPIN(pin: string) {
    try {
      await SecureStore.setItemAsync(PIN_KEY, pin);
      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  },

  async verifyPIN(pin: string) {
    try {
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      return storedPin === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  },

  async setWebCredentials(email: string, password: string) {
    try {
      // Try to sign in first to verify credentials
      await sync.signIn(email, password);
      
      // If successful, save credentials
      const credentials: WebCredentials = { email, password };
      await SecureStore.setItemAsync(WEB_CREDENTIALS_KEY, JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error('Error setting web credentials:', error);
      throw error;
    }
  },

  async getWebCredentials(): Promise<WebCredentials | null> {
    try {
      const credentialsStr = await SecureStore.getItemAsync(WEB_CREDENTIALS_KEY);
      return credentialsStr ? JSON.parse(credentialsStr) : null;
    } catch (error) {
      console.error('Error getting web credentials:', error);
      return null;
    }
  },

  async signInWithStoredCredentials(): Promise<boolean> {
    try {
      const credentials = await this.getWebCredentials();
      if (!credentials) {
        return false;
      }

      await sync.signIn(credentials.email, credentials.password);
      return true;
    } catch (error) {
      console.error('Error signing in with stored credentials:', error);
      return false;
    }
  },

  async enableBiometrics() {
    try {
      const compatible = await SecureStore.isAvailableAsync();
      if (compatible) {
        await SecureStore.setItemAsync(BIOMETRICS_KEY, 'enabled');
        return { success: true, biometryType: 'Biometrics' };
      }
      return { success: false, error: 'Biometrics not available' };
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      return { success: false, error };
    }
  },

  async verifyBiometrics() {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRICS_KEY);
      return enabled === 'enabled';
    } catch (error) {
      console.error('Error verifying biometrics:', error);
      return false;
    }
  },

  async isBiometricsEnabled() {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRICS_KEY);
      return enabled === 'enabled';
    } catch (error) {
      return false;
    }
  },

  async disableBiometrics() {
    try {
      await SecureStore.deleteItemAsync(BIOMETRICS_KEY);
      return true;
    } catch (error) {
      console.error('Error disabling biometrics:', error);
      return false;
    }
  },
}; 