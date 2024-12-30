import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function Root() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Slot />
    </View>
  );
} 