import { useState } from 'react';
import { View } from 'react-native';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { ChangePINScreen } from '../src/screens/ChangePINScreen';
import { router } from 'expo-router';

export default function SettingsRoute() {
  const [isChangingPIN, setIsChangingPIN] = useState(false);

  const handleChangePIN = () => {
    setIsChangingPIN(true);
  };

  const handlePINChangeComplete = () => {
    setIsChangingPIN(false);
  };

  const handlePINChangeCancel = () => {
    setIsChangingPIN(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {isChangingPIN ? (
        <ChangePINScreen
          onComplete={handlePINChangeComplete}
          onCancel={handlePINChangeCancel}
        />
      ) : (
        <SettingsScreen onChangePIN={handleChangePIN} />
      )}
    </View>
  );
} 