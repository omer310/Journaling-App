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

interface Props {
  onChangePIN: () => void;
}

export function SettingsScreen({ onChangePIN }: Props) {
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkSettings();
  }, []);

  useEffect(() => {
    loadTheme();
  }, []);

  const checkSettings = async () => {
    try {
      const [biometricsEnabled, webCredentials] = await Promise.all([
        auth.isBiometricsEnabled(),
        auth.getWebCredentials(),
      ]);
      setHasBiometrics(biometricsEnabled);
      setHasCredentials(!!webCredentials);
      if (webCredentials) {
        setEmail(webCredentials.email);
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
        Alert.alert('Success', 'Biometric authentication disabled');
      } else {
        const result = await auth.enableBiometrics();
        if (result.success) {
          setHasBiometrics(true);
          Alert.alert('Success', 'Biometric authentication enabled');
        } else {
          Alert.alert('Error', 'Failed to enable biometric authentication');
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
                name="finger-print-outline" 
                size={24} 
                color={isDarkMode ? '#fff' : '#1a1a1a'} 
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>Biometric Authentication</Text>
                <Text style={[styles.settingDescription, isDarkMode && styles.darkSecondaryText]}>
                  Use fingerprint or face recognition
                </Text>
              </View>
            </View>
            <Switch
              value={hasBiometrics}
              onValueChange={handleBiometricsToggle}
              trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
              thumbColor={hasBiometrics ? '#fff' : '#fff'}
              ios_backgroundColor="#e2e8f0"
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
          </View>
        </View>
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>About</Text>
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <View style={[styles.settingItem, styles.noBorder]}>
            <Text style={[styles.settingTitle, isDarkMode && styles.darkText]}>Version</Text>
            <Text style={[styles.versionText, isDarkMode && styles.darkSecondaryText]}>1.0.0</Text>
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
}); 