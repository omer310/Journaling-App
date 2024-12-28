import { SetupPINScreen } from '../src/screens/SetupPINScreen';
import { router } from 'expo-router';

export default function SetupScreen() {
  const handleComplete = () => {
    router.replace('/entries');
  };

  return <SetupPINScreen onComplete={handleComplete} />;
} 