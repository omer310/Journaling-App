import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { auth } from '../src/services/auth';

export default function App() {
  useEffect(() => {
    checkPINSetup();
  }, []);

  const checkPINSetup = async () => {
    try {
      const credentials = await auth.verifyPIN('');
      if (credentials) {
        return <Redirect href="/unlock" />;
      } else {
        return <Redirect href="/setup" />;
      }
    } catch (error) {
      console.error('Error checking PIN setup:', error);
      return <Redirect href="/setup" />;
    }
  };

  // Default redirect to setup
  return <Redirect href="/setup" />;
} 