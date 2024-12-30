import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sync } from './sync';

const PIN_KEY = 'journal_pin';
const BIOMETRICS_KEY = 'journal_biometrics_enabled';
const WEB_CREDENTIALS_KEY = 'web_credentials';
const FIRST_LAUNCH_KEY = 'first_launch_completed';
const APP_INSTALL_KEY = 'app_install_id';

interface WebCredentials {
  email: string;
  password: string;
}

export const auth = {
  async checkFirstInstall() {
    try {
      const installId = await AsyncStorage.getItem(APP_INSTALL_KEY);
      if (!installId) {
        // This is a fresh install, clear everything
        console.log('Fresh install detected, clearing all data...');
        await this.clearAllData();
        // Generate and save a new install ID
        await AsyncStorage.setItem(APP_INSTALL_KEY, Date.now().toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking first install:', error);
      return true; // Assume it's a first install if there's an error
    }
  },

  async setPIN(pin: string) {
    try {
      // Ensure the PIN is exactly 4 digits
      if (!/^\d{4}$/.test(pin)) {
        throw new Error('PIN must be exactly 4 digits');
      }

      // Store the PIN securely
      await SecureStore.setItemAsync(PIN_KEY, pin, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED
      });
      
      // Mark first launch as complete
      await SecureStore.setItemAsync(FIRST_LAUNCH_KEY, 'true');
      
      console.log('PIN set successfully');
      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      throw error;
    }
  },

  async getPIN() {
    try {
      await this.checkFirstInstall(); // Add this check before getting PIN
      
      // Check if this is first launch
      const firstLaunch = await SecureStore.getItemAsync(FIRST_LAUNCH_KEY);
      
      if (!firstLaunch) {
        console.log('First launch detected, clearing all data...');
        await this.clearAllData();
        return null;
      }
      
      const pin = await SecureStore.getItemAsync(PIN_KEY);
      console.log('Retrieved PIN:', pin ? 'exists' : 'not found');
      return pin;
    } catch (error) {
      console.error('Error getting PIN:', error);
      return null;
    }
  },

  async clearAllData() {
    try {
      // Clear SecureStore items
      const secureKeys = [PIN_KEY, FIRST_LAUNCH_KEY, BIOMETRICS_KEY, WEB_CREDENTIALS_KEY];
      await Promise.all(secureKeys.map(key => SecureStore.deleteItemAsync(key)));
      
      // Clear AsyncStorage items except install ID
      const asyncKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = asyncKeys.filter(key => key !== APP_INSTALL_KEY);
      await AsyncStorage.multiRemove(keysToRemove);
      
      console.log('All secure data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  async verifyPIN(pin: string) {
    try {
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      const isValid = storedPin === pin;
      console.log('PIN verification:', isValid ? 'successful' : 'failed');
      return isValid;
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