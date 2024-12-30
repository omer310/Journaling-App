import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../services/auth';
import { storage } from '../services/storage';

const PIN_LENGTH = 4;

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export function ChangePINScreen({ onComplete, onCancel }: Props) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const theme = await storage.getTheme();
    setIsDarkMode(theme === 'dark');
  };

  const handleNumberPress = async (number: string) => {
    switch (step) {
      case 'current':
        if (currentPin.length < PIN_LENGTH) {
          const newCurrentPin = currentPin + number;
          setCurrentPin(newCurrentPin);
          if (newCurrentPin.length === PIN_LENGTH) {
            const isValid = await auth.verifyPIN(newCurrentPin);
            if (isValid) {
              setStep('new');
            } else {
              Alert.alert('Error', 'Invalid current PIN');
              setCurrentPin('');
            }
          }
        }
        break;

      case 'new':
        if (newPin.length < PIN_LENGTH) {
          const newPinValue = newPin + number;
          setNewPin(newPinValue);
          if (newPinValue.length === PIN_LENGTH) {
            setStep('confirm');
          }
        }
        break;

      case 'confirm':
        if (confirmPin.length < PIN_LENGTH) {
          const newConfirmPin = confirmPin + number;
          setConfirmPin(newConfirmPin);
          if (newConfirmPin.length === PIN_LENGTH) {
            if (newConfirmPin === newPin) {
              await handleChangeComplete(newPin);
            } else {
              Alert.alert('Error', 'PINs do not match. Please try again.');
              setNewPin('');
              setConfirmPin('');
              setStep('new');
            }
          }
        }
        break;
    }
  };

  const handleDelete = () => {
    switch (step) {
      case 'current':
        setCurrentPin(prev => prev.slice(0, -1));
        break;
      case 'new':
        setNewPin(prev => prev.slice(0, -1));
        break;
      case 'confirm':
        setConfirmPin(prev => prev.slice(0, -1));
        break;
    }
  };

  const handleChangeComplete = async (finalPin: string) => {
    try {
      await auth.setPIN(finalPin);
      Alert.alert('Success', 'PIN changed successfully');
      onComplete();
    } catch (error) {
      console.error('Error changing PIN:', error);
      Alert.alert('Error', 'Failed to change PIN. Please try again.');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setStep('current');
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'current':
        return 'Enter Current PIN';
      case 'new':
        return 'Enter New PIN';
      case 'confirm':
        return 'Confirm New PIN';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'current':
        return 'Enter your current PIN';
      case 'new':
        return 'Enter a new 4-digit PIN';
      case 'confirm':
        return 'Re-enter your new PIN to confirm';
    }
  };

  const getCurrentValue = () => {
    switch (step) {
      case 'current':
        return currentPin;
      case 'new':
        return newPin;
      case 'confirm':
        return confirmPin;
    }
  };

  return (
    <View style={[
      styles.container,
      isDarkMode && styles.darkContainer,
      { paddingTop: insets.top }
    ]}>
      <View style={styles.header}>
        <Text
          style={[styles.cancelButton, isDarkMode && styles.darkGreenText]}
          onPress={onCancel}
        >
          Cancel
        </Text>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>{getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={[styles.subtitle, isDarkMode && styles.darkSecondaryText]}>
        {getSubtitle()}
      </Text>

      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  getCurrentValue().length > i
                    ? '#22c55e'
                    : isDarkMode ? '#333' : '#e2e8f0',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((num, index) => (
          <View key={num} style={styles.keypadButton}>
            {num === 'delete' ? (
              <Text
                style={[styles.deleteButton, isDarkMode && styles.darkSecondaryText]}
                onPress={handleDelete}
              >
                ⌫
              </Text>
            ) : num !== '' ? (
              <Text
                style={[styles.number, isDarkMode && styles.darkText]}
                onPress={() => handleNumberPress(num.toString())}
              >
                {num}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  darkText: {
    color: '#fff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#22c55e',
  },
  darkGreenText: {
    color: '#4ade80',
  },
  placeholder: {
    width: 50,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  darkSecondaryText: {
    color: '#999',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 48,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  keypadButton: {
    width: '33.33%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontSize: 28,
    color: '#1a1a1a',
  },
  deleteButton: {
    fontSize: 28,
    color: '#666',
  },
}); 