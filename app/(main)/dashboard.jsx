import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

export default function DashboardScreen() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        router.replace('/(auth)/login');
      }
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>/(main)/dashboard</Text>
      <Pressable
        onPress={handleLogout}
        disabled={loggingOut}
        style={{
          marginTop: 16,
          backgroundColor: Colors.orangeMain,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          opacity: loggingOut ? 0.7 : 1,
          alignItems: 'center',
        }}
      >
        {loggingOut ? (
          <ActivityIndicator size="small" color={Colors.cream} />
        ) : (
          <Text style={{ color: Colors.cream, fontSize: 14 }}>Cerrar Sesión</Text>
        )}
      </Pressable>
    </View>
  );
}
