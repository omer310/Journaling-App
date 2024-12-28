import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../services/auth';

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
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text
          style={styles.cancelButton}
          onPress={onCancel}
        >
          Cancel
        </Text>
        <Text style={styles.title}>{getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>{getSubtitle()}</Text>

      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  getCurrentValue().length > i ? '#22c55e' : '#e2e8f0',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((num, index) => (
          <View key={num} style={styles.keypadButton}>
            {num === 'delete' ? (
              <Text style={styles.deleteButton} onPress={handleDelete}>
                ⌫
              </Text>
            ) : num !== '' ? (
              <Text
                style={styles.number}
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
  cancelButton: {
    fontSize: 16,
    color: '#22c55e',
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