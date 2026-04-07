import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { supabase } from '../../lib/supabase';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Shared style constants ─────────────────────────────────────────────────────
const INPUT_BORDER_COLOR = 'rgba(212,195,186,0.35)';
const INPUT_BORDER_ERROR  = Colors.error;
const LABEL_STYLE = {
  fontFamily: Fonts.manropeSemiBold,
  fontSize: 10,
  color: Colors.onSurfaceVariant,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom: 4,
};

function Toast({ visible, message, backgroundColor, duration, onHide }) {
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
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, visible, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 32,
        backgroundColor,
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

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email,              setEmail]              = useState('');
  const [password,           setPassword]           = useState('');
  const [emailError,         setEmailError]         = useState('');
  const [passwordError,      setPasswordError]      = useState('');
  const [emailFormatInvalid, setEmailFormatInvalid] = useState(false);
  const [secureTextEntry,    setSecureTextEntry]    = useState(true);
  const [loading,            setLoading]            = useState(false);
  const [toastVisible,       setToastVisible]       = useState(false);
  const [toastMessage,       setToastMessage]       = useState('');
  const [toastBg,            setToastBg]            = useState(Colors.primary);
  const [toastDuration,      setToastDuration]      = useState(3000);

  let logoSource;
  try { logoSource = require('../../assets/logo.png'); } catch { logoSource = null; }

  let googleIconSource;
  try { googleIconSource = require('../../assets/google-icon.png'); } catch { googleIconSource = null; }

  const showToast = (message, duration = 3000) => {
    setToastMessage(message);
    setToastBg(Colors.primary);
    setToastDuration(duration);
    setToastVisible(true);
  };

  const validateEmailOnBlur = () => {
    if (!email.trim()) { setEmailFormatInvalid(false); setEmailError(''); return; }
    if (!emailRegex.test(email.trim())) {
      setEmailFormatInvalid(true);
      setEmailError(t('auth.login_error_email_invalid'));
      return;
    }
    setEmailFormatInvalid(false);
    setEmailError('');
  };

  const handleLogin = async () => {
    if (loading) return;

    const normalizedEmail = email.trim();
    let hasError = false;

    if (!normalizedEmail) { setEmailError(t('auth.login_error_email_required')); hasError = true; }
    else setEmailError('');

    if (!password) { setPasswordError(t('auth.login_error_password_required')); hasError = true; }
    else setPasswordError('');

    if (hasError) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

      if (error) {
        if (error.message === 'Invalid login credentials' || error.message === 'User not found') {
          showToast(t('auth.login_toast_invalid_credentials'), 3000);
          return;
        }
        showToast(t('auth.login_toast_generic_error'), 3000);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email_confirmed_at) {
        await supabase.auth.resend({ type: 'signup', email: normalizedEmail });
        showToast('Tu cuenta no está verificada, te hemos reenviado el código', 4000);
        setTimeout(() => router.replace(`/(auth)/verify-otp?email=${encodeURIComponent(normalizedEmail)}`), 500);
        return;
      }

      router.replace('/(main)/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surfaceBright, paddingHorizontal: 28 }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surfaceBright} />

      <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>

        {/* ── Logo + headline ── */}
        <View style={{ alignItems: 'center', marginTop: 64, marginBottom: 48 }}>
          {logoSource ? (
            <Image source={logoSource} style={{ width: 72, height: 72, marginBottom: 20 }} resizeMode="contain" />
          ) : (
            <View style={{ width: 56, height: 56, borderRadius: 6, backgroundColor: Colors.primaryContainer, marginBottom: 20 }} />
          )}
          <Text style={{
            fontFamily: Fonts.epilogueBold,
            fontSize: 36,
            color: Colors.onSurface,
            letterSpacing: 0.5,
            textAlign: 'center',
          }}>
            {t('auth.login_app_name')}
          </Text>
          <Text style={{
            marginTop: 8,
            fontFamily: Fonts.manrope,
            fontSize: 14,
            color: Colors.onSurfaceVariant,
            textAlign: 'center',
            lineHeight: 20,
          }}>
            {t('auth.login_subtitle')}
          </Text>
        </View>

        {/* ── Email field ── */}
        <View style={{ marginBottom: 24 }}>
          <Text style={LABEL_STYLE}>{t('auth.login_email_placeholder')}</Text>
          <View style={{
            borderBottomWidth: 1,
            borderBottomColor: emailFormatInvalid ? INPUT_BORDER_ERROR : INPUT_BORDER_COLOR,
          }}>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailError(''); setEmailFormatInvalid(false); }}
              onBlur={validateEmailOnBlur}
              placeholder={t('auth.login_email_placeholder')}
              placeholderTextColor={Colors.onSurfaceVariant + '80'}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                paddingVertical: 10,
                color: Colors.onSurface,
                fontFamily: Fonts.manrope,
                fontSize: 15,
                backgroundColor: 'transparent',
              }}
            />
          </View>
          {!!emailError && (
            <Text style={{ fontFamily: Fonts.manrope, fontSize: 12, color: Colors.error, marginTop: 4 }}>
              {emailError}
            </Text>
          )}
        </View>

        {/* ── Password field ── */}
        <View style={{ marginBottom: 8 }}>
          <Text style={LABEL_STYLE}>{t('auth.login_password_placeholder')}</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: passwordError ? INPUT_BORDER_ERROR : INPUT_BORDER_COLOR,
          }}>
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
              placeholder={t('auth.login_password_placeholder')}
              placeholderTextColor={Colors.onSurfaceVariant + '80'}
              secureTextEntry={secureTextEntry}
              style={{
                flex: 1,
                paddingVertical: 10,
                color: Colors.onSurface,
                fontFamily: Fonts.manrope,
                fontSize: 15,
                backgroundColor: 'transparent',
              }}
            />
            <Pressable onPress={() => setSecureTextEntry((p) => !p)} hitSlop={8}>
              <Ionicons
                name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={Colors.onSurfaceVariant}
              />
            </Pressable>
          </View>
          {!!passwordError && (
            <Text style={{ fontFamily: Fonts.manrope, fontSize: 12, color: Colors.error, marginTop: 4 }}>
              {passwordError}
            </Text>
          )}
        </View>

        {/* ── Forgot password ── */}
        <Pressable onPress={() => router.push('/forgotpassword')} style={{ alignSelf: 'flex-end', marginBottom: 36 }}>
          <Text style={{
            fontFamily: Fonts.manrope,
            fontSize: 13,
            color: Colors.primary,
          }}>
            {t('auth.login_forgot_password')}
          </Text>
        </Pressable>

        {/* ── Primary CTA ── */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 6,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 12,
            opacity: loading ? 0.6 : 1,
            shadowColor: Colors.onSurface,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06,
            shadowRadius: 32,
            elevation: 3,
          }}
        >
          {loading ? (
            <ActivityIndicator color={Colors.onPrimary} size="small" />
          ) : (
            <Text style={{ fontFamily: Fonts.manropeBold, fontSize: 15, color: Colors.onPrimary }}>
              {t('auth.login_button')}
            </Text>
          )}
        </Pressable>

        {/* ── Google ── */}
        <Pressable
          onPress={() => Alert.alert(t('auth.login_google_alert_title'), t('auth.login_google_alert_message'))}
          style={{
            backgroundColor: Colors.surfaceContainerLowest,
            borderRadius: 6,
            paddingVertical: 14,
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            shadowColor: Colors.onSurface,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 16,
            elevation: 2,
          }}
        >
          {googleIconSource ? (
            <Image source={googleIconSource} style={{ width: 16, height: 16 }} />
          ) : (
            <Text style={{ color: Colors.onSurface, fontSize: 15 }}>{t('auth.login_google_fallback_letter')}</Text>
          )}
          <Text style={{ fontFamily: Fonts.manropeSemiBold, fontSize: 14, color: Colors.onSurface }}>
            {t('auth.login_google_button')}
          </Text>
        </Pressable>

        {/* ── Apple ── */}
        <Pressable
          onPress={() => Alert.alert(t('auth.login_apple_alert_title'), t('auth.login_apple_alert_message'))}
          style={{
            backgroundColor: Colors.onSurface,
            borderRadius: 6,
            paddingVertical: 14,
            marginBottom: 32,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="logo-apple" size={16} color={Colors.surfaceBright} />
          <Text style={{ fontFamily: Fonts.manropeSemiBold, fontSize: 14, color: Colors.surfaceBright }}>
            {t('auth.login_apple_button')}
          </Text>
        </Pressable>

        {/* ── Tertiary: register ── */}
        <Pressable onPress={() => router.push('/register')} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontFamily: Fonts.manrope, fontSize: 14, color: Colors.primary }}>
            {t('auth.login_register_button')}
          </Text>
        </Pressable>

      </View>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        backgroundColor={toastBg}
        duration={toastDuration}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}
