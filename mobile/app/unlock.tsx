import { UnlockScreen } from '../src/screens/UnlockScreen';
import { router } from 'expo-router';

export default function UnlockRoute() {
  const handleUnlock = () => {
    router.replace('/entries');
  };

  return <UnlockScreen onUnlock={handleUnlock} />;
} 