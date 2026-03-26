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

function Toast({ visible, message, backgroundColor, duration, onHide }) {
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
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
        bottom: 24,
        backgroundColor,
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

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailFormatInvalid, setEmailFormatInvalid] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastBg, setToastBg] = useState(Colors.mediumBrown);
  const [toastDuration, setToastDuration] = useState(3000);

  let logoSource;
  try {
    logoSource = require('../../assets/logo.png');
  } catch (_error) {
    logoSource = null;
  }

  let googleIconSource;
  try {
    googleIconSource = require('../../assets/google-icon.png');
  } catch (_error) {
    googleIconSource = null;
  }

  const showToast = (message, duration = 3000) => {
    setToastMessage(message);
    setToastBg(Colors.mediumBrown);
    setToastDuration(duration);
    setToastVisible(true);
  };

  const validateEmailOnBlur = () => {
    if (!email.trim()) {
      setEmailFormatInvalid(false);
      setEmailError('');
      return;
    }

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

    if (!normalizedEmail) {
      setEmailError(t('auth.login_error_email_required'));
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError(t('auth.login_error_password_required'));
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error) {
        router.replace('/(main)/dashboard');
        return;
      }

      if (
        error.message === 'Invalid login credentials' ||
        error.message === 'User not found'
      ) {
        showToast(
          t('auth.login_toast_invalid_credentials'),
          3000
        );
        return;
      }

      if (error.message === 'Email not confirmed') {
        Alert.alert(
          t('auth.login_alert_email_not_confirmed_title'),
          t('auth.login_alert_email_not_confirmed_message')
        );
        return;
      }

      showToast(t('auth.login_toast_generic_error'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.darkBrown, paddingHorizontal: 24 }}
    >
      <StatusBar barStyle="light-content" />

      <View style={{ width: '100%', maxWidth: 450, alignSelf: 'center' }}>
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          {logoSource ? (
            <Image source={logoSource} style={{ width: 80, height: 80 }} resizeMode="contain" />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Colors.orangeMain,
              }}
            />
          )}
        </View>

        <Text
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontFamily: Fonts.gochiHand,
            fontSize: 42,
            color: Colors.textOnDark,
          }}
        >
        {t('auth.login_app_name')}
        </Text>

        <Text
          style={{
            textAlign: 'center',
            marginBottom: 40,
            fontFamily: Fonts.lexend,
            fontSize: 15,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
        {t('auth.login_subtitle')}
        </Text>

        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setEmailError('');
            setEmailFormatInvalid(false);
          }}
          onBlur={validateEmailOnBlur}
          placeholder={t('auth.login_email_placeholder')}
          placeholderTextColor={Colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: Colors.inputBg,
            borderWidth: 1.5,
            borderColor: emailFormatInvalid ? Colors.error : Colors.inputBorder,
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
            color: Colors.textOnDark,
            fontFamily: Fonts.lexend,
            fontSize: 14,
          }}
        />
        {!!emailError && (
          <Text
            style={{
              fontFamily: Fonts.lexend,
              fontSize: 12,
              color: Colors.error,
              marginBottom: 8,
            }}
          >
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
            placeholder={t('auth.login_password_placeholder')}
            placeholderTextColor={Colors.placeholder}
            secureTextEntry={secureTextEntry}
            style={{
              flex: 1,
              padding: 14,
              color: Colors.textOnDark,
              fontFamily: Fonts.lexend,
              fontSize: 14,
            }}
          />
          <Pressable onPress={() => setSecureTextEntry((prev) => !prev)}>
            <Ionicons
              name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={Colors.textOnDark}
            />
          </Pressable>
        </View>
        {!!passwordError && (
          <Text
            style={{
              fontFamily: Fonts.lexend,
              fontSize: 12,
              color: Colors.error,
              marginBottom: 8,
            }}
          >
            {passwordError}
          </Text>
        )}

        <Pressable onPress={() => router.push('/forgotpassword')}>
          <Text
            style={{
              fontFamily: Fonts.lexend,
              fontSize: 13,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'right',
              marginTop: 8,
              marginBottom: 24,
            }}
          >
            {t('auth.login_forgot_password')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: Colors.orangeMain,
            borderRadius: 12,
            paddingVertical: 15,
            width: '100%',
            marginBottom: 16,
            opacity: loading ? 0.7 : 1,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={Colors.cream} size="small" />
          ) : (
            <Text
              style={{
                fontFamily: Fonts.fuzzyBubblesBold,
                fontSize: 16,
                color: Colors.cream,
                textAlign: 'center',
              }}
            >
              {t('auth.login_button')}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert(
              t('auth.login_google_alert_title'),
              t('auth.login_google_alert_message')
            )
          }
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingVertical: 13,
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {googleIconSource ? (
            <Image source={googleIconSource} style={{ width: 18, height: 18 }} />
          ) : (
            <Text style={{ color: '#000000', fontSize: 16 }}>
              {t('auth.login_google_fallback_letter')}
            </Text>
          )}
          <Text
            style={{
              fontFamily: Fonts.lexendSemiBold,
              fontSize: 15,
              color: '#38240D',
            }}
          >
            {t('auth.login_google_button')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert(
              t('auth.login_apple_alert_title'),
              t('auth.login_apple_alert_message')
            )
          }
          style={{
            backgroundColor: '#000000',
            borderRadius: 12,
            paddingVertical: 13,
            marginBottom: 24,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
          <Text
            style={{
              fontFamily: Fonts.lexendSemiBold,
              fontSize: 15,
              color: '#FFFFFF',
            }}
          >
            {t('auth.login_apple_button')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/register')}
          style={{
            borderWidth: 2,
            borderColor: Colors.orangeMain,
            borderRadius: 12,
            paddingVertical: 13,
            backgroundColor: 'transparent',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.fuzzyBubblesBold,
              fontSize: 16,
              color: Colors.orangeMain,
            }}
          >
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
