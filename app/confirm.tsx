import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

export default function ConfirmScreen() {
  const { t } = useTranslation();
  const { status } = useAuthRedirect();
  const scale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'success') return;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => router.replace('/onboarding'), 2000);
    return () => clearTimeout(timeout);
  }, [status, scale, checkOpacity]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.darkBrown }}>
      <StatusBar barStyle="light-content" />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        {status === 'loading' && (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.orangeMain} />
            <Text
              style={{
                marginTop: 16,
                color: Colors.textOnDark,
                fontFamily: Fonts.lexend,
                fontSize: 15,
                textAlign: 'center',
              }}
            >
              {t('auth.confirm_verifying')}
            </Text>
          </View>
        )}

        {status === 'success' && (
          <Animated.View
            style={{
              alignItems: 'center',
              transform: [{ scale }],
              opacity: checkOpacity,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#2ECC71',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            <Text
              style={{
                marginTop: 20,
                color: Colors.textOnDark,
                fontFamily: Fonts.lexendSemiBold,
                fontSize: 18,
                textAlign: 'center',
              }}
            >
              {t('auth.confirm_success')}
            </Text>
          </Animated.View>
        )}

        {status === 'error' && (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="close-circle" size={64} color={Colors.error} />
            <Text
              style={{
                marginTop: 16,
                color: Colors.textOnDark,
                fontFamily: Fonts.lexend,
                fontSize: 15,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              {t('auth.confirm_error')}
            </Text>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={{
                backgroundColor: Colors.orangeMain,
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 32,
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.fuzzyBubblesBold,
                  fontSize: 16,
                  color: Colors.cream,
                }}
              >
                {t('auth.confirm_back_to_login')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
