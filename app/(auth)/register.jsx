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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const specialRegex = /[^A-Za-z0-9]/;

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

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [repeatPasswordError, setRepeatPasswordError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureRepeatPassword, setSecureRepeatPassword] = useState(true);

  const normalizedEmail = email.trim();

  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      uppercase: uppercaseRegex.test(password),
      lowercase: lowercaseRegex.test(password),
      special: specialRegex.test(password),
    }),
    [password]
  );

  const isEmailValid = emailRegex.test(normalizedEmail);
  const isPasswordStrong =
    passwordChecks.minLength &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.special;
  const passwordsMatch = password.length > 0 && password === repeatPassword;

  const isFormValid =
    normalizedEmail.length > 0 &&
    isEmailValid &&
    isPasswordStrong &&
    passwordsMatch &&
    !registrationCompleted;

  const checkStyle = (ok) => ({
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    opacity: ok ? 1 : 0.75,
  });

  const checkColor = (ok) => (ok ? '#2ECC71' : '#8E8E8E');

  const resetErrors = () => {
    setEmailError('');
    setPasswordError('');
    setRepeatPasswordError('');
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleRegister = async () => {
    if (submitting || registrationCompleted) return;
    resetErrors();

    let hasError = false;

    if (!normalizedEmail) {
      setEmailError(t('auth.register_error_email_required'));
      hasError = true;
    } else if (!isEmailValid) {
      setEmailError(t('auth.invalid_email_format'));
      hasError = true;
    }

    if (!password) {
      setPasswordError(t('auth.register_error_password_required'));
      hasError = true;
    } else if (!isPasswordStrong) {
      setPasswordError(t('auth.register_error_password_weak'));
      hasError = true;
    }

    if (!repeatPassword) {
      setRepeatPasswordError(t('auth.register_error_repeat_required'));
      hasError = true;
    } else if (!passwordsMatch) {
      setRepeatPasswordError(t('auth.register_error_password_mismatch'));
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      const isDuplicateEmailError = (supabaseError) =>
        (supabaseError?.status === 400 || supabaseError?.status === 401) &&
        typeof supabaseError?.message === 'string' &&
        supabaseError.message.toLowerCase().includes('already registered');

      if (error) {
        if (error?.status === 429) {
          showToast(t('auth.too_many_attempts'));
          return;
        }
        if (isDuplicateEmailError(error)) {
          showToast(t('auth.email_already_exists'));
          return;
        }
        Alert.alert(t('auth.register_alert_error_title'), error.message);
        return;
      }

      // Supabase can return "success" for duplicate users with identities = []
      // to avoid account enumeration. We map that to the same generic toast.
      if (Array.isArray(data?.user?.identities) && data.user.identities.length === 0) {
        showToast(t('auth.email_already_exists'));
        return;
      }

      showToast(t('auth.register_success_toast') || '¡Revisa tu correo para el código!');
      setRegistrationCompleted(true);
      setTimeout(() => {
        router.push(`/(auth)/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
      }, 1500);
    } catch (_error) {
      showToast(t('auth.register_alert_network_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.darkBrown, paddingHorizontal: 24 }}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ width: '100%', maxWidth: 450, alignSelf: 'center', marginTop: 40 }}>
        <Text
          style={{
            fontFamily: Fonts.gochiHand,
            fontSize: 40,
            color: Colors.textOnDark,
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          {t('auth.register_title')}
        </Text>

        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            const normalizedValue = value.trim();
            if (!normalizedValue) {
              setEmailError('');
            } else if (!emailRegex.test(normalizedValue)) {
              setEmailError(t('auth.invalid_email_format'));
            } else {
              setEmailError('');
            }
          }}
          editable={!registrationCompleted}
          placeholder={t('auth.register_email_placeholder')}
          placeholderTextColor={Colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: Colors.inputBg,
            borderWidth: 1.5,
            borderColor: emailError ? Colors.error : Colors.inputBorder,
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
            color: Colors.textOnDark,
            fontFamily: Fonts.lexend,
            fontSize: 14,
          }}
        />
        {!!emailError && (
          <Text style={{ fontFamily: Fonts.lexend, fontSize: 12, color: Colors.error, marginBottom: 8 }}>
            {emailError}
          </Text>
        )}

        <View
          style={{
            backgroundColor: Colors.inputBg,
            borderWidth: 1.5,
            borderColor: passwordError ? Colors.error : Colors.inputBorder,
            borderRadius: 12,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: 12,
          }}
        >
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setPasswordError('');
            }}
            editable={!registrationCompleted}
            placeholder={t('auth.register_password_placeholder')}
            placeholderTextColor={Colors.placeholder}
            secureTextEntry={securePassword}
            style={{
              flex: 1,
              padding: 14,
              color: Colors.textOnDark,
              fontFamily: Fonts.lexend,
              fontSize: 14,
            }}
          />
          <Pressable onPress={() => setSecurePassword((prev) => !prev)}>
            <Ionicons
              name={securePassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.textOnDark}
            />
          </Pressable>
        </View>
        {!!passwordError && (
          <Text style={{ fontFamily: Fonts.lexend, fontSize: 12, color: Colors.error, marginBottom: 8 }}>
            {passwordError}
          </Text>
        )}

        <View style={{ marginBottom: 12 }}>
          <View style={checkStyle(passwordChecks.minLength)}>
            <Ionicons name="checkmark-circle" size={16} color={checkColor(passwordChecks.minLength)} />
            <Text style={{ marginLeft: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 12 }}>
              {t('auth.register_check_min_length')}
            </Text>
          </View>
          <View style={checkStyle(passwordChecks.uppercase)}>
            <Ionicons name="checkmark-circle" size={16} color={checkColor(passwordChecks.uppercase)} />
            <Text style={{ marginLeft: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 12 }}>
              {t('auth.register_check_uppercase')}
            </Text>
          </View>
          <View style={checkStyle(passwordChecks.lowercase)}>
            <Ionicons name="checkmark-circle" size={16} color={checkColor(passwordChecks.lowercase)} />
            <Text style={{ marginLeft: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 12 }}>
              {t('auth.register_check_lowercase')}
            </Text>
          </View>
          <View style={checkStyle(passwordChecks.special)}>
            <Ionicons name="checkmark-circle" size={16} color={checkColor(passwordChecks.special)} />
            <Text style={{ marginLeft: 8, color: Colors.textOnDark, fontFamily: Fonts.lexend, fontSize: 12 }}>
              {t('auth.register_check_special')}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: Colors.inputBg,
            borderWidth: 1.5,
            borderColor: repeatPasswordError ? Colors.error : Colors.inputBorder,
            borderRadius: 12,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            paddingRight: 12,
          }}
        >
          <TextInput
            value={repeatPassword}
            onChangeText={(value) => {
              setRepeatPassword(value);
              setRepeatPasswordError('');
            }}
            editable={!registrationCompleted}
            placeholder={t('auth.register_repeat_password_placeholder')}
            placeholderTextColor={Colors.placeholder}
            secureTextEntry={secureRepeatPassword}
            style={{
              flex: 1,
              padding: 14,
              color: Colors.textOnDark,
              fontFamily: Fonts.lexend,
              fontSize: 14,
            }}
          />
          <Pressable onPress={() => setSecureRepeatPassword((prev) => !prev)}>
            <Ionicons
              name={secureRepeatPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.textOnDark}
            />
          </Pressable>
        </View>
        {!!repeatPasswordError && (
          <Text style={{ fontFamily: Fonts.lexend, fontSize: 12, color: Colors.error, marginBottom: 8 }}>
            {repeatPasswordError}
          </Text>
        )}

        <Pressable
          onPress={handleRegister}
          disabled={submitting || !isFormValid}
          style={{
            marginTop: 8,
            backgroundColor: Colors.orangeMain,
            borderRadius: 12,
            paddingVertical: 15,
            opacity: submitting || !isFormValid ? 0.7 : 1,
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
                {t('auth.register_loading')}
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
              {t('auth.register_button')}
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

