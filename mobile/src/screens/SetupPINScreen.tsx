import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../services/auth';

const PIN_LENGTH = 4;

interface Props {
  onComplete: () => void;
}

export function SetupPINScreen({ onComplete }: Props) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const insets = useSafeAreaInsets();

  const handleNumberPress = async (number: string) => {
    Vibration.vibrate(40); // Short vibration for feedback
    
    if (step === 'create') {
      if (pin.length < PIN_LENGTH) {
        const newPin = pin + number;
        setPin(newPin);
        if (newPin.length === PIN_LENGTH) {
          setStep('confirm');
        }
      }
    } else {
      if (confirmPin.length < PIN_LENGTH) {
        const newConfirmPin = confirmPin + number;
        setConfirmPin(newConfirmPin);
        if (newConfirmPin.length === PIN_LENGTH) {
          if (newConfirmPin === pin) {
            await handleSetupComplete(pin);
          } else {
            Vibration.vibrate([0, 50, 50, 50]); // Error vibration pattern
            Alert.alert('Error', 'PINs do not match. Please try again.');
            setPin('');
            setConfirmPin('');
            setStep('create');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    Vibration.vibrate(40);
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleSetupComplete = async (finalPin: string) => {
    try {
      await auth.setPIN(finalPin);
      Vibration.vibrate([0, 50, 100]); // Success vibration pattern
      onComplete();
    } catch (error) {
      console.error('Error setting up PIN:', error);
      Alert.alert('Error', 'Failed to set up PIN. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('create');
    }
  };

  const renderNumber = (num: number | string) => (
    <TouchableOpacity
      key={num}
      style={styles.keypadButton}
      onPress={() => handleNumberPress(num.toString())}
      activeOpacity={0.7}
    >
      <Text style={styles.number}>{num}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>
        {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
      </Text>
      <Text style={styles.subtitle}>
        {step === 'create'
          ? 'Enter a 4-digit PIN'
          : 'Re-enter your PIN to confirm'}
      </Text>

      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  (step === 'create' ? pin.length : confirmPin.length) > i
                    ? '#22c55e'
                    : '#e2e8f0',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => renderNumber(num))}
        <View style={styles.keypadButton} />
        {renderNumber(0)}
        <TouchableOpacity
          style={styles.keypadButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButton}>⌫</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
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
}); 