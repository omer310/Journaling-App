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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../services/auth';

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
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkSettings();
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={onChangePIN}
        >
          <View>
            <Text style={styles.settingTitle}>Change PIN</Text>
            <Text style={styles.settingDescription}>
              Update your security PIN
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Biometric Authentication</Text>
            <Text style={styles.settingDescription}>
              Use fingerprint or face recognition
            </Text>
          </View>
          <Switch
            value={hasBiometrics}
            onValueChange={handleBiometricsToggle}
            trackColor={{ false: '#e2e8f0', true: '#86efac' }}
            thumbColor={hasBiometrics ? '#22c55e' : '#fff'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Web Sync</Text>
        <View style={styles.credentialsContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isSaving}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isSaving}
          />
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
            <Text style={styles.syncStatus}>
              ✓ Web sync is enabled
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Version</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#666',
  },
  versionText: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
  credentialsContainer: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
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
  syncStatus: {
    color: '#22c55e',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
}); 