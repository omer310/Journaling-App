import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { sync } from './sync';
import { supabase } from '../config/supabase';

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
        ('Fresh install detected, clearing all data...');
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
      
      ('PIN set successfully');
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
        ('First launch detected, clearing all data...');
        await this.clearAllData();
        return null;
      }
      
      const pin = await SecureStore.getItemAsync(PIN_KEY);
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
      
      ('All secure data cleared successfully');
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

  async signInWithGoogle(): Promise<{ user: any; session: any } | null> {
    try {
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        throw new Error('Supabase URL not configured. Please check your environment variables.');
      }
      
      const result = await sync.signInWithGoogle();
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  },

  async enableBiometrics() {
    try {
      // Check if device supports biometric authentication
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return { success: false, error: 'Biometric hardware not available' };
      }

      // Check if biometrics are enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return { success: false, error: 'No biometrics enrolled on device' };
      }

      // Test biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRICS_KEY, 'enabled');
        
        // Get supported biometry types for user feedback
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        let biometryType = 'Biometrics';
        
        // Prioritize fingerprint detection first (more common)
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometryType = 'Fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometryType = 'Face ID';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometryType = 'Iris Scan';
        }
          
        return { success: true, biometryType };
      } else {
        return { success: false, error: 'Biometric authentication failed' };
      }
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async verifyBiometrics() {
    try {
      // First check if biometrics are enabled in our app
      const enabled = await SecureStore.getItemAsync(BIOMETRICS_KEY);
      if (enabled !== 'enabled') {
        return false;
      }

      // Check if device still supports biometrics
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!compatible || !enrolled) {
        // Disable biometrics if hardware/enrollment is no longer available
        await this.disableBiometrics();
        return false;
      }

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your journal',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Error verifying biometrics:', error);
      return false;
    }
  },

  async isBiometricsEnabled() {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRICS_KEY);
      if (enabled !== 'enabled') {
        return false;
      }

      // Also verify that biometrics are still available on the device
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!compatible || !enrolled) {
        // Auto-disable if no longer available
        await this.disableBiometrics();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking biometrics status:', error);
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

  async getBiometricCapabilities() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      let biometryType = 'Biometrics';
      
      // Prioritize fingerprint detection first (more common)
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometryType = 'Fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'Face ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometryType = 'Iris Scan';
      }

      return {
        hasHardware,
        isEnrolled,
        biometryType,
        available: hasHardware && isEnrolled
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        biometryType: 'Biometrics',
        available: false
      };
    }
  },

  async restoreAuthState() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Update AsyncStorage with current session data
        await AsyncStorage.setItem('auth_user', JSON.stringify({
          uid: session.user.id,
          email: session.user.email,
        }));
        return {
          uid: session.user.id,
          email: session.user.email,
        };
      }

      // If no active session, clear any stale data and return null
      await AsyncStorage.removeItem('auth_user');
      return null;
    } catch (error) {
      console.error('Error restoring auth state:', error);
      // Clear stale data on error
      try {
        await AsyncStorage.removeItem('auth_user');
      } catch (clearError) {
        console.error('Error clearing auth data:', clearError);
      }
      return null;
    }
  },

  async signOut() {
    try {
      // Check if there's an active session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      }
      
      // Clear stored credentials regardless of session state
      await SecureStore.deleteItemAsync(WEB_CREDENTIALS_KEY);
      
      // Clear AsyncStorage auth data
      await AsyncStorage.removeItem('auth_user');
      
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear local data
      try {
        await SecureStore.deleteItemAsync(WEB_CREDENTIALS_KEY);
        await AsyncStorage.removeItem('auth_user');
      } catch (clearError) {
        console.error('Error clearing local data:', clearError);
      }
      return false;
    }
  },

  async forceRefreshAuthState() {
    try {
      // Force refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        // If refresh fails, clear all auth data
        await this.clearAllAuthData();
        return null;
      }
      
      if (data.session?.user) {
        // Update AsyncStorage with fresh session data
        await AsyncStorage.setItem('auth_user', JSON.stringify({
          uid: data.session.user.id,
          email: data.session.user.email,
        }));
        return {
          uid: data.session.user.id,
          email: data.session.user.email,
        };
      }
      
      // No valid session, clear data
      await this.clearAllAuthData();
      return null;
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      await this.clearAllAuthData();
      return null;
    }
  },

  async clearAllAuthData() {
    try {
      await SecureStore.deleteItemAsync(WEB_CREDENTIALS_KEY);
      await AsyncStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },
}; 