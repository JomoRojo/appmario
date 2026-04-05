import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';

// Helper component for Toasts
function Toast({ visible, message, onHide }) {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 120, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(onHide);
    }, 3200);

    return () => clearTimeout(timeout);
  }, [visible, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 24,
        backgroundColor: Colors.mediumBrown,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Text
        style={{
          color: Colors.textOnDark,
          fontFamily: Fonts.lexend,
          fontSize: 13,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [error, setError] = useState('');

  const displayEmail = typeof email === 'string' ? email : (email?.[0] || '');

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      setError('Por favor, introduce el código de 6 dígitos.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: displayEmail,
        token: otp,
        type: 'signup',
      });

      if (error) {
        showToast('Código incorrecto o expirado. Inténtalo de nuevo.');
        return;
      }

      // Navegar explícitamente al onboarding tras la verificación.
      router.replace('/onboarding');

    } catch (_error) {
      showToast('Error de red. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.darkBrown, paddingHorizontal: 24 }}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ width: '100%', maxWidth: 450, alignSelf: 'center', marginTop: 40, flex: 1 }}>
        <Text
          style={{
            fontFamily: Fonts.gochiHand,
            fontSize: 40,
            color: Colors.textOnDark,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Verificar Correo
        </Text>
        
        <Text
          style={{
            fontFamily: Fonts.lexend,
            fontSize: 15,
            color: Colors.textOnDark,
            textAlign: 'center',
            marginBottom: 32,
            opacity: 0.9,
          }}
        >
          Hemos enviado un código a {'\n'}
          <Text style={{ fontFamily: Fonts.lexendBold }}>{displayEmail}</Text>
        </Text>

        <TextInput
          value={otp}
          onChangeText={(value) => {
            // Unicamente permitir numeros
            const numericValue = value.replace(/[^0-9]/g, '');
            setOtp(numericValue.slice(0, 6)); // max 6 digitos
            setError('');
          }}
          placeholder="000000"
          placeholderTextColor={Colors.placeholder}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={6}
          style={{
            backgroundColor: Colors.inputBg,
            borderWidth: 1.5,
            borderColor: error ? Colors.error : Colors.inputBorder,
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
            color: Colors.textOnDark,
            fontFamily: Fonts.lexend,
            fontSize: 24,
            textAlign: 'center',
            letterSpacing: 10,
          }}
        />
        {!!error && (
          <Text style={{ fontFamily: Fonts.lexend, fontSize: 13, color: Colors.error, marginBottom: 12, textAlign: 'center' }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleVerify}
          disabled={submitting || otp.length < 6}
          style={{
            marginTop: 16,
            backgroundColor: Colors.orangeMain,
            borderRadius: 12,
            paddingVertical: 15,
            opacity: submitting || otp.length < 6 ? 0.7 : 1,
            alignItems: 'center',
          }}
        >
          {submitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color={Colors.cream} size="small" />
              <Text
                style={{
                  fontFamily: Fonts.fuzzyBubblesBold,
                  fontSize: 16,
                  color: Colors.cream,
                  marginLeft: 10,
                }}
              >
                Verificando...
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontFamily: Fonts.fuzzyBubblesBold,
                fontSize: 16,
                color: Colors.cream,
              }}
            >
              Confirmar Cuenta
            </Text>
          )}
        </Pressable>
      </View>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}
