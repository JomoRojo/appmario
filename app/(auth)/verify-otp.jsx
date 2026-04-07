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

function Toast({ visible, message, onHide }) {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0,   duration: 300, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1,   duration: 300, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,   duration: 300, useNativeDriver: true }),
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
        bottom: 32,
        backgroundColor: Colors.primary,
        borderRadius: 6,
        paddingVertical: 14,
        paddingHorizontal: 18,
        opacity,
        transform: [{ translateY }],
        shadowColor: Colors.onSurface,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 32,
        elevation: 4,
      }}
    >
      <Text style={{ color: Colors.onPrimary, fontFamily: Fonts.manrope, fontSize: 13, textAlign: 'center' }}>
        {message}
      </Text>
    </Animated.View>
  );
}

export default function VerifyOtpScreen() {
  const { email }   = useLocalSearchParams();
  const [otp,       setOtp]       = useState('');
  const [submitting,setSubmitting] = useState(false);
  const [toastMessage,setToastMessage] = useState('');
  const [toastVisible,setToastVisible] = useState(false);
  const [error,     setError]     = useState('');

  const displayEmail = typeof email === 'string' ? email : (email?.[0] || '');

  const showToast = (message) => { setToastMessage(message); setToastVisible(true); };

  const handleVerify = async () => {
    if (!otp || otp.length < 8) { setError('Por favor, introduce el código de 8 dígitos.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: displayEmail,
        token: otp,
        type: 'email',
      });

      if (error) { showToast('Código incorrecto o expirado. Inténtalo de nuevo.'); return; }
      router.replace('/onboarding');
    } catch {
      showToast('Error de red. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surfaceBright, paddingHorizontal: 28 }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surfaceBright} />

      <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', marginTop: 64, flex: 1 }}>

        {/* ── Headline ── */}
        <Text style={{
          fontFamily: Fonts.epilogueBold,
          fontSize: 32,
          color: Colors.onSurface,
          textAlign: 'center',
          marginBottom: 16,
          letterSpacing: 0.3,
        }}>
          Verificar Correo
        </Text>

        <Text style={{
          fontFamily: Fonts.manrope,
          fontSize: 14,
          color: Colors.onSurfaceVariant,
          textAlign: 'center',
          marginBottom: 48,
          lineHeight: 22,
        }}>
          Hemos enviado un código a{'\n'}
          <Text style={{ fontFamily: Fonts.manropeSemiBold, color: Colors.onSurface }}>{displayEmail}</Text>
        </Text>

        {/* ── OTP tray ── */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            fontFamily: Fonts.manropeSemiBold,
            fontSize: 10,
            color: Colors.onSurfaceVariant,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            textAlign: 'center',
            marginBottom: 4,
          }}>
            Código de verificación
          </Text>
          <View style={{
            borderBottomWidth: 1,
            borderBottomColor: error ? Colors.error : 'rgba(212,195,186,0.35)',
            alignItems: 'center',
          }}>
            <TextInput
              value={otp}
              onChangeText={(v) => {
                setOtp(v.replace(/[^0-9]/g, '').slice(0, 8));
                setError('');
              }}
              placeholder="00000000"
              placeholderTextColor={Colors.onSurfaceVariant + '60'}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={8}
              style={{
                paddingVertical: 12,
                color: Colors.onSurface,
                fontFamily: Fonts.epilogueBold,
                fontSize: 32,
                textAlign: 'center',
                letterSpacing: 10,
                backgroundColor: 'transparent',
                width: '100%',
              }}
            />
          </View>
          {!!error && (
            <Text style={{ fontFamily: Fonts.manrope, fontSize: 12, color: Colors.error, marginTop: 6, textAlign: 'center' }}>
              {error}
            </Text>
          )}
        </View>

        {/* ── CTA ── */}
        <Pressable
          onPress={handleVerify}
          disabled={submitting || otp.length < 8}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 6,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: submitting || otp.length < 8 ? 0.5 : 1,
            shadowColor: Colors.onSurface,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06,
            shadowRadius: 32,
            elevation: 3,
          }}
        >
          {submitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color={Colors.onPrimary} size="small" />
              <Text style={{ fontFamily: Fonts.manropeBold, fontSize: 15, color: Colors.onPrimary, marginLeft: 10 }}>
                Verificando...
              </Text>
            </View>
          ) : (
            <Text style={{ fontFamily: Fonts.manropeBold, fontSize: 15, color: Colors.onPrimary }}>
              Confirmar Cuenta
            </Text>
          )}
        </Pressable>

      </View>

      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}
