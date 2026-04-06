import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

// Este fichero ya no contiene lógica. El onboarding completo vive en /onboarding.
export default function CompleteProfile() {
  useEffect(() => {
    router.replace('/onboarding');
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.darkBrown, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.orangeMain} />
    </View>
  );
}
