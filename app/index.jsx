import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/colors';

export default function AppIndexRedirector() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors?.darkBrown || '#38240D', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="small" color={Colors?.orangeMain || '#C05800'} />
    </View>
  );
}

