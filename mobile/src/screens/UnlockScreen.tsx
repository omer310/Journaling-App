import React, { useState, useEffect } from 'react';
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
  onUnlock: () => void;
}

export function UnlockScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkBiometrics();
  }, []);

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

  const handleDelete = () => {
    if (isLoading) return;
    Vibration.vibrate(40);
    setPin(prev => prev.slice(0, -1));
  };

  const renderNumber = (num: number | string) => (
    <TouchableOpacity
      key={num}
      style={styles.keypadButton}
      onPress={() => handleNumberPress(num.toString())}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <Text style={[styles.number, isLoading && styles.disabledText]}>
        {num}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Enter PIN</Text>
      <Text style={styles.subtitle}>Enter your PIN to unlock</Text>

      <View style={styles.dotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: pin.length > i ? '#22c55e' : '#e2e8f0',
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
          disabled={isLoading}
        >
          <Text style={[styles.deleteButton, isLoading && styles.disabledText]}>
            ⌫
          </Text>
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
  disabledText: {
    opacity: 0.5,
  },
}); 