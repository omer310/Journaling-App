import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../services/auth';
import { storage, Theme } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignIn } from '../../components/GoogleSignIn';

interface Props {
  onChangePIN: () => void;
}

export function SettingsScreen({ onChangePIN }: Props) {
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricCapabilities, setBiometricCapabilities] = useState({
    available: false,
    biometryType: 'Biometrics',
    hasHardware: false,
    isEnrolled: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkSettings();
  }, []);

  useEffect(() => {
    loadTheme();
  }, []);

  const checkSettings = async () => {
    try {
      const [biometricsEnabled, webCredentials, capabilities, authState] = await Promise.all([
        auth.isBiometricsEnabled(),
        auth.getWebCredentials(),
        auth.getBiometricCapabilities(),
        auth.forceRefreshAuthState(), // Use force refresh instead
      ]);
      setHasBiometrics(biometricsEnabled);
      setBiometricCapabilities(capabilities);
      setHasCredentials(!!webCredentials);
      setIsSignedIn(!!authState);
      if (webCredentials) {
        setEmail(webCredentials.email);
      }
      if (authState) {
        setUserEmail(authState.email || '');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking settings:', error);
      setIsLoading(false);
    }
  };

  const loadTheme = async () => {
    const theme = await storage.getTheme();
    setIsDarkMode(theme === 'dark');
  };

  const handleThemeChange = async (value: boolean) => {
    setIsDarkMode(value);
    await storage.setTheme(value ? 'dark' : 'light');
  };

  const handleBiometricsToggle = async () => {
    try {
      if (hasBiometrics) {
        await auth.disableBiometrics();
        setHasBiometrics(false);
        Alert.alert('Success', `${biometricCapabilities.biometryType} authentication disabled`);
      } else {
        // Check capabilities first
        if (!biometricCapabilities.available) {
          if (!biometricCapabilities.hasHardware) {
            Alert.alert('Not Available', 'This device does not support biometric authentication');
          } else if (!biometricCapabilities.isEnrolled) {
            Alert.alert('Setup Required', `Please set up ${biometricCapabilities.biometryType} in your device settings first`);
          }
          return;
        }

        const result = await auth.enableBiometrics();
        if (result.success) {
          setHasBiometrics(true);
          Alert.alert('Success', `${result.biometryType} authentication enabled`);
        } else {
          Alert.alert('Error', result.error || 'Failed to enable biometric authentication');
        }
      }
    } catch (error) {
      console.error('Error toggling biometrics:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleSaveCredentials = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsSaving(true);
    try {
      await auth.setWebCredentials(email.trim(), password.trim());
      setHasCredentials(true);
      setPassword('');
      Alert.alert('Success', 'Web credentials saved successfully');
    } catch (error) {
      console.error('Error saving credentials:', error);
      Alert.alert('Error', 'Failed to save credentials. Please check your email and password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to sign in again to sync your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await auth.signOut();
              if (success) {
                setIsSignedIn(false);
                setUserEmail('');
                setHasCredentials(false);
                setEmail('');
                setPassword('');
                Alert.alert('Success', 'Signed out successfully');
              } else {
                Alert.alert('Error', 'Failed to sign out');
              }
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, isDarkMode && styles.darkContainer]}
      contentContainerStyle={{ paddingTop: insets.top + 16 }}
    >
      <Text style={[styles.title, isDarkMode && styles.darkText]}>Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Security</Text>
        
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <TouchableOpacity
            style={[styles.settingItem, isDarkMode && styles.darkSettingItem]}
            onPress={onChangePIN}
          >
            <View style={styles.settingContent}>
              <Ionicons 
                name="lock-closed-outline" 
                size={24} 
                color={isDarkMode ? '#fff' : '#1a1a1a'} 
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>Change PIN</Text>
                <Text style={[styles.settingDescription, isDarkMode && styles.darkSecondaryText]}>
                  Update your security PIN
                </Text>
              </View>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={isDarkMode ? '#666' : '#999'} 
            />
          </TouchableOpacity>

          <View style={[styles.settingItem, styles.noBorder]}>
            <View style={styles.settingContent}>
              <Ionicons 
                name={
                  biometricCapabilities.biometryType === 'Face ID' ? 'scan-outline' :
                  biometricCapabilities.biometryType === 'Iris Scan' ? 'eye-outline' :
                  'finger-print-outline'
                } 
                size={24} 
                color={isDarkMode ? '#fff' : '#1a1a1a'} 
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>{biometricCapabilities.biometryType}</Text>
                <Text style={[styles.settingDescription, isDarkMode && styles.darkSecondaryText]}>
                  {biometricCapabilities.available 
                    ? `Use ${biometricCapabilities.biometryType.toLowerCase()} to unlock`
                    : !biometricCapabilities.hasHardware 
                      ? 'Not available on this device'
                      : 'Please set up in device settings'
                  }
                </Text>
              </View>
            </View>
            <Switch
              value={hasBiometrics}
              onValueChange={handleBiometricsToggle}
              trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
              thumbColor={hasBiometrics ? '#fff' : '#fff'}
              ios_backgroundColor="#e2e8f0"
              disabled={!biometricCapabilities.available}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Appearance</Text>
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <View style={[styles.settingItem, styles.noBorder]}>
            <View style={styles.settingContent}>
              <Ionicons 
                name={isDarkMode ? "moon-outline" : "sunny-outline"} 
                size={24} 
                color={isDarkMode ? '#fff' : '#1a1a1a'} 
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, isDarkMode && styles.darkSecondaryText]}>
                  Switch between light and dark themes
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeChange}
              trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
              thumbColor={isDarkMode ? '#fff' : '#fff'}
              ios_backgroundColor="#e2e8f0"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Web Sync</Text>
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <View style={styles.credentialsContainer}>
            <View style={styles.inputContainer}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={isDarkMode ? '#666' : '#999'} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  isDarkMode && styles.darkInput,
                  isDarkMode && styles.darkText
                ]}
                placeholder="Email"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isSaving}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons 
                name="key-outline" 
                size={20} 
                color={isDarkMode ? '#666' : '#999'}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  isDarkMode && styles.darkInput,
                  isDarkMode && styles.darkText
                ]}
                placeholder="Password"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isSaving}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSaveCredentials}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {hasCredentials ? 'Update Credentials' : 'Save Credentials'}
                </Text>
              )}
            </TouchableOpacity>
            {hasCredentials && (
              <View style={styles.syncStatusContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.syncStatus}>Web sync is enabled</Text>
              </View>
            )}
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={[styles.dividerText, isDarkMode && styles.darkSecondaryText]}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <GoogleSignIn
              onSuccess={async (userData) => {
                try {
                  // The user data should already be available from the sign-in
                  if (userData && userData.user) {
                    setIsSignedIn(true);
                    setUserEmail(userData.user.email || '');
                    setHasCredentials(true);
                    Alert.alert('Success', 'Successfully signed in with Google!');
                  } else {
                    // Fallback: try to get auth state
                    const authState = await auth.restoreAuthState();
                    if (authState) {
                      setIsSignedIn(true);
                      setUserEmail(authState.email || '');
                      setHasCredentials(true);
                      Alert.alert('Success', 'Successfully signed in with Google!');
                    } else {
                      Alert.alert('Error', 'Failed to get user information after sign-in');
                    }
                  }
                } catch (error) {
                  console.error('Error handling Google sign-in success:', error);
                  Alert.alert('Error', 'Failed to get user information after sign-in');
                }
              }}
              onError={(error) => {
                Alert.alert('Error', `Failed to sign in with Google: ${error}`);
              }}
            />
          </View>
        </View>
      </View>

      {isSignedIn && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Account</Text>
          <View style={[styles.card, isDarkMode && styles.darkCard]}>
            <View style={[styles.settingItem, styles.noBorder]}>
              <View style={styles.settingContent}>
                <Ionicons 
                  name="person-outline" 
                  size={24} 
                  color={isDarkMode ? '#fff' : '#1a1a1a'} 
                />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>Signed in as</Text>
                  <Text style={[styles.settingDescription, isDarkMode && styles.darkSecondaryText]}>
                    {userEmail}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.accountButtonsContainer}>
              <TouchableOpacity
                style={[styles.refreshButton, isDarkMode && styles.darkRefreshButton]}
                onPress={async () => {
                  try {
                    const authState = await auth.forceRefreshAuthState();
                    if (authState) {
                      setIsSignedIn(true);
                      setUserEmail(authState.email || '');
                      Alert.alert('Success', 'Authentication state refreshed');
                    } else {
                      setIsSignedIn(false);
                      setUserEmail('');
                      Alert.alert('Info', 'No active session found');
                    }
                  } catch (error) {
                    console.error('Error refreshing auth state:', error);
                    Alert.alert('Error', 'Failed to refresh authentication state');
                  }
                }}
              >
                <Ionicons name="refresh-outline" size={20} color="#3b82f6" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.signOutButton, isDarkMode && styles.darkSignOutButton]}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.section, styles.lastSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>About</Text>
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <View style={[styles.settingItem, styles.noBorder]}>
            <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>Version</Text>
            <Text style={[styles.versionText, isDarkMode && styles.darkSecondaryText]}>1.1.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  darkContainer: {
    backgroundColor: '#111',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  darkText: {
    color: '#fff',
  },
  darkSecondaryText: {
    color: '#a1a1aa',
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  darkSettingItem: {
    borderBottomColor: '#2d2d2d',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  versionText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  credentialsContainer: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  darkInput: {
    borderColor: '#2d2d2d',
    backgroundColor: '#1e1e1e',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  syncStatus: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 32,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 12,
    color: '#64748b',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  darkSignOutButton: {
    backgroundColor: '#450a0a',
    borderColor: '#7f1d1d',
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  accountButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
    marginTop: 0,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
  },
  darkRefreshButton: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  refreshButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 