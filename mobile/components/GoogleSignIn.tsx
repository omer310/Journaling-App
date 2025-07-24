import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../src/services/auth';

interface GoogleSignInProps {
  onSuccess?: (userData?: { user: any; session: any }) => void;
  onError?: (error: string) => void;
}

export function GoogleSignIn({ onSuccess, onError }: GoogleSignInProps) {
  const handleGoogleSignIn = async () => {
    try {
      const result = await auth.signInWithGoogle();
      if (result && result.user) {
        onSuccess?.(result);
      } else {
        onError?.('Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return (
    <TouchableOpacity
      style={styles.googleButton}
      onPress={handleGoogleSignIn}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#4285f4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 