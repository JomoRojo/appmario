import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const specialRegex   = /[^A-Za-z0-9]/;

const INPUT_BORDER_COLOR = 'rgba(212,195,186,0.35)';
const LABEL_STYLE = {
  fontFamily: Fonts.manropeSemiBold,
  fontSize: 10,
  color: Colors.onSurfaceVariant,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom: 4,
};

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

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [email,                  setEmail]                  = useState('');
  const [password,               setPassword]               = useState('');
  const [repeatPassword,         setRepeatPassword]         = useState('');
  const [submitting,             setSubmitting]             = useState(false);
  const [emailError,             setEmailError]             = useState('');
  const [passwordError,          setPasswordError]          = useState('');
  const [repeatPasswordError,    setRepeatPasswordError]    = useState('');
  const [toastMessage,           setToastMessage]           = useState('');
  const [toastVisible,           setToastVisible]           = useState(false);
  const [registrationCompleted,  setRegistrationCompleted]  = useState(false);
  const [securePassword,         setSecurePassword]         = useState(true);
  const [secureRepeatPassword,   setSecureRepeatPassword]   = useState(true);

  const normalizedEmail = email.trim();

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    uppercase: uppercaseRegex.test(password),
    lowercase: lowercaseRegex.test(password),
    special:   specialRegex.test(password),
  }), [password]);

  const isEmailValid     = emailRegex.test(normalizedEmail);
  const isPasswordStrong = passwordChecks.minLength && passwordChecks.uppercase && passwordChecks.lowercase && passwordChecks.special;
  const passwordsMatch   = password.length > 0 && password === repeatPassword;
  const isFormValid      = normalizedEmail.length > 0 && isEmailValid && isPasswordStrong && passwordsMatch && !registrationCompleted;

  const resetErrors = () => { setEmailError(''); setPasswordError(''); setRepeatPasswordError(''); };
  const showToast   = (message) => { setToastMessage(message); setToastVisible(true); };

  const handleRegister = async () => {
    if (submitting || registrationCompleted) return;
    resetErrors();

    let hasError = false;
    if (!normalizedEmail)       { setEmailError(t('auth.register_error_email_required')); hasError = true; }
    else if (!isEmailValid)     { setEmailError(t('auth.invalid_email_format')); hasError = true; }
    if (!password)              { setPasswordError(t('auth.register_error_password_required')); hasError = true; }
    else if (!isPasswordStrong) { setPasswordError(t('auth.register_error_password_weak')); hasError = true; }
    if (!repeatPassword)        { setRepeatPasswordError(t('auth.register_error_repeat_required')); hasError = true; }
    else if (!passwordsMatch)   { setRepeatPasswordError(t('auth.register_error_password_mismatch')); hasError = true; }
    if (hasError) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });

      const isDuplicateEmailError = (e) =>
        (e?.status === 400 || e?.status === 401) &&
        typeof e?.message === 'string' &&
        e.message.toLowerCase().includes('already registered');

      if (error) {
        if (error?.status === 429) { showToast(t('auth.too_many_attempts')); return; }
        if (isDuplicateEmailError(error)) { showToast(t('auth.email_already_exists')); return; }
        Alert.alert(t('auth.register_alert_error_title'), error.message);
        return;
      }

      if (Array.isArray(data?.user?.identities) && data.user.identities.length === 0) {
        showToast(t('auth.email_already_exists'));
        return;
      }

      router.push(`/(auth)/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      showToast(t('auth.register_alert_network_error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Check indicator color
  const checkColor = (ok) => ok ? Colors.secondary : Colors.outlineVariant;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surfaceBright, paddingHorizontal: 28 }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surfaceBright} />

      <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', marginTop: 48 }}>

        {/* ── Headline ── */}
        <Text style={{
          fontFamily: Fonts.epilogueBold,
          fontSize: 32,
          color: Colors.onSurface,
          textAlign: 'center',
          marginBottom: 36,
          letterSpacing: 0.3,
        }}>
          {t('auth.register_title')}
        </Text>

        {/* ── Email ── */}
        <View style={{ marginBottom: 24 }}>
          <Text style={LABEL_STYLE}>{t('auth.register_email_placeholder')}</Text>
          <View style={{
            borderBottomWidth: 1,
            borderBottomColor: emailError ? Colors.error : INPUT_BORDER_COLOR,
          }}>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                const n = v.trim();
                if (!n) setEmailError('');
                else if (!emailRegex.test(n)) setEmailError(t('auth.invalid_email_format'));
                else setEmailError('');
              }}
              editable={!registrationCompleted}
              placeholder={t('auth.register_email_placeholder')}
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
            <Text style={{ fontFamily: Fonts.manrope, fontSize: 12, color: Colors.error, marginTop: 4 }}>{emailError}</Text>
          )}
        </View>

        {/* ── Password ── */}
        <View style={{ marginBottom: 12 }}>
          <Text style={LABEL_STYLE}>{t('auth.register_password_placeholder')}</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: passwordError ? Colors.error : INPUT_BORDER_COLOR,
          }}>
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
              editable={!registrationCompleted}
              placeholder={t('auth.register_password_placeholder')}
              placeholderTextColor={Colors.onSurfaceVariant + '80'}
              secureTextEntry={securePassword}
              style={{
                flex: 1,
                paddingVertical: 10,
                color: Colors.onSurface,
                fontFamily: Fonts.manrope,
                fontSize: 15,
                backgroundColor: 'transparent',
              }}
            />
            <Pressable onPress={() => setSecurePassword((p) => !p)} hitSlop={8}>
              <Ionicons name={securePassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.onSurfaceVariant} />
            </Pressable>
          </View>
          {!!passwordError && (
            <Text style={{ fontFamily: Fonts.manrope, fontSize: 12, color: Colors.error, marginTop: 4 }}>{passwordError}</Text>
          )}
        </View>

        {/* ── Password checks ── */}
        <View style={{ marginBottom: 24, paddingLeft: 2 }}>
          {[
            { ok: passwordChecks.minLength, label: t('auth.register_check_min_length') },
            { ok: passwordChecks.uppercase, label: t('auth.register_check_uppercase') },
            { ok: passwordChecks.lowercase, label: t('auth.register_check_lowercase') },
            { ok: passwordChecks.special,   label: t('auth.register_check_special') },
          ].map(({ ok, label }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
              <Ionicons name="checkmark-circle" size={14} color={checkColor(ok)} />
              <Text style={{
                marginLeft: 7,
                fontFamily: Fonts.manrope,
                fontSize: 12,
                color: ok ? Colors.secondary : Colors.onSurfaceVariant,
              }}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Repeat password ── */}
        <View style={{ marginBottom: 32 }}>
          <Text style={LABEL_STYLE}>{t('auth.register_repeat_password_placeholder')}</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: repeatPasswordError ? Colors.error : INPUT_BORDER_COLOR,
          }}>
            <TextInput
              value={repeatPassword}
              onChangeText={(v) => { setRepeatPassword(v); setRepeatPasswordError(''); }}
              editable={!registrationCompleted}
              placeholder={t('auth.register_repeat_password_placeholder')}
              placeholderTextColor={Colors.onSurfaceVariant + '80'}
              secureTextEntry={secureRepeatPassword}
              style={{
                flex: 1,
                paddingVertical: 10,
                color: Colors.onSurface,
                fontFamily: Fonts.manrope,
                fontSize: 15,
                backgroundColor: 'transparent',
              }}
            />
            <Pressable onPress={() => setSecureRepeatPassword((p) => !p)} hitSlop={8}>
              <Ionicons name={secureRepeatPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.onSurfaceVariant} />
            </Pressable>
          </View>
          {!!repeatPasswordError && (
            <Text style={{ fontFamily: Fonts.manrope, fontSize: 12, color: Colors.error, marginTop: 4 }}>{repeatPasswordError}</Text>
          )}
        </View>

        {/* ── CTA ── */}
        <Pressable
          onPress={handleRegister}
          disabled={submitting || !isFormValid}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: 6,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: submitting || !isFormValid ? 0.5 : 1,
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
                {t('auth.register_loading')}
              </Text>
            </View>
          ) : (
            <Text style={{ fontFamily: Fonts.manropeBold, fontSize: 15, color: Colors.onPrimary }}>
              {t('auth.register_button')}
            </Text>
          )}
        </Pressable>

      </View>

      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}
