import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../services/auth';
import { storage } from '../services/storage';
import { router } from 'expo-router';

const PIN_LENGTH = 4;
const SECRET_RESET_COUNT = 6;

interface Props {
  onUnlock: () => void;
}

export function UnlockScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [deleteCount, setDeleteCount] = useState(0);
  const [lastDeletePress, setLastDeletePress] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkBiometrics();
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const theme = await storage.getTheme();
    setIsDarkMode(theme === 'dark');
  };

  const handleDelete = () => {
    if (isLoading) return;
    
    const now = Date.now();
    if (now - lastDeletePress > 2000) { // Reset count if more than 2 seconds between presses
      setDeleteCount(1);
    } else {
      setDeleteCount(prev => {
        if (prev + 1 === SECRET_RESET_COUNT) {
          handleSecretReset();
          return 0;
        }
        return prev + 1;
      });
    }
    setLastDeletePress(now);

    Vibration.vibrate(40);
    setPin(prev => prev.slice(0, -1));
  };

  const handleSecretReset = async () => {
    try {
      await auth.clearAllData();
      Vibration.vibrate([0, 100, 100, 100]); // Special vibration pattern for secret reset
      router.replace('/setup');
    } catch (error) {
      console.error('Error in secret reset:', error);
    }
  };

  const checkBiometrics = async () => {
    try {
      const isEnabled = await auth.isBiometricsEnabled();
      if (isEnabled) {
        const success = await auth.verifyBiometrics();
        if (success) {
          Vibration.vibrate([0, 50, 100]); // Success vibration
          onUnlock();
        }
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
    }
  };

  const handleNumberPress = async (number: string) => {
    if (isLoading) return;
    
    Vibration.vibrate(40); // Short vibration for feedback
    
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + number;
      setPin(newPin);
      
      if (newPin.length === PIN_LENGTH) {
        setIsLoading(true);
        try {
          const isValid = await auth.verifyPIN(newPin);
          if (isValid) {
            Vibration.vibrate([0, 50, 100]); // Success vibration
            onUnlock();
          } else {
            Vibration.vibrate([0, 50, 50, 50]); // Error vibration
            Alert.alert('Error', 'Invalid PIN');
            setPin('');
          }
        } catch (error) {
          console.error('Error verifying PIN:', error);
          Alert.alert('Error', 'Failed to verify PIN');
          setPin('');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleForgotPIN = () => {
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Get the stored auth state
      const authUserStr = await AsyncStorage.getItem('auth_user');
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      
      if (!authUser || authUser.email !== email) {
        Alert.alert('Error', 'Email address does not match your account');
        return;
      }

      Alert.alert(
        'Confirm Reset',
        'This will erase all app data and reset your PIN. Are you sure?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: async () => {
              try {
                await auth.clearAllData();
                router.replace('/setup');
              } catch (error) {
                console.error('Error resetting PIN:', error);
                Alert.alert('Error', 'Failed to reset PIN. Please try again.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error verifying email:', error);
      Alert.alert('Error', 'Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
      setShowEmailModal(false);
      setEmail('');
    }
  };

  const renderNumber = (num: number | string) => (
    <TouchableOpacity
      key={num}
      style={styles.keypadButton}
      onPress={() => handleNumberPress(num.toString())}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <Text style={[
        styles.number,
        isLoading && styles.disabledText,
        isDarkMode && styles.darkText
      ]}>
        {num}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={[
        styles.container,
        isDarkMode && styles.darkContainer,
        { paddingTop: insets.top }
      ]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Enter PIN</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.darkSecondaryText]}>
          Enter your PIN to unlock
        </Text>

        <View style={styles.dotsContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: pin.length > i
                    ? '#22c55e'
                    : isDarkMode ? '#333' : '#e2e8f0',
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => renderNumber(num))}
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={handleForgotPIN}
            activeOpacity={0.7}
          >
            <Text style={[styles.forgotPIN, isDarkMode && styles.darkSecondaryText]}>
              Forgot?
            </Text>
          </TouchableOpacity>
          {renderNumber(0)}
          <TouchableOpacity
            style={styles.keypadButton}
            onPress={handleDelete}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={[
              styles.deleteButton,
              isLoading && styles.disabledText,
              isDarkMode && styles.darkSecondaryText
            ]}>
              ⌫
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showEmailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            isDarkMode && styles.darkModalContent
          ]}>
            <Text style={[
              styles.modalTitle,
              isDarkMode && styles.darkText
            ]}>
              Verify Your Identity
            </Text>
            <Text style={[
              styles.modalSubtitle,
              isDarkMode && styles.darkSecondaryText
            ]}>
              Enter your registered email address to reset your PIN
            </Text>
            <TextInput
              style={[
                styles.emailInput,
                isDarkMode && styles.darkEmailInput,
                isDarkMode && styles.darkText
              ]}
              placeholder="Enter your email"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEmailModal(false);
                  setEmail('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleEmailSubmit}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Verifying...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 24,
  },
  darkText: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  darkSecondaryText: {
    color: '#999',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 36,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginHorizontal: 8,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
    flex: 1,
    maxHeight: 400,
  },
  keypadButton: {
    width: '33.33%',
    height: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  number: {
    fontSize: 32,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  deleteButton: {
    fontSize: 32,
    color: '#666',
  },
  forgotPIN: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'underline',
  },
  disabledText: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  darkModalContent: {
    backgroundColor: '#1a1a1a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  darkEmailInput: {
    borderColor: '#333',
    backgroundColor: '#2d2d2d',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  submitButton: {
    backgroundColor: '#22c55e',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 