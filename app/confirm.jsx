import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { supabase } from '../lib/supabase';

function getHashParams() {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash?.replace(/^#/, '');
  if (!hash) return {};
  return Object.fromEntries(new URLSearchParams(hash).entries());
}

export default function ConfirmScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    const run = async () => {
      const hashParams = getHashParams();
      const code = params.code || hashParams.code;
      const accessToken = params.access_token || hashParams.access_token;
      const refreshToken = params.refresh_token || hashParams.refresh_token;
      const tokenHash = params.token_hash || hashParams.token_hash;
      const type = params.type || hashParams.type;

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(String(code));
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: String(accessToken),
            refresh_token: String(refreshToken),
          });
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: String(tokenHash),
            type: String(type),
          });
          if (error) throw error;
        } else {
          throw new Error('Missing token');
        }

        if (!active) return;
        setMessage(t('auth.confirm_success'));
        setTimeout(() => {
          router.replace('/(main)/dashboard');
        }, 600);
      } catch (_error) {
        if (!active) return;
        setMessage(t('auth.confirm_error'));
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1200);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [params, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.darkBrown }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <ActivityIndicator size="small" color={Colors.cream} />
        <Text
          style={{
            marginTop: 12,
            color: Colors.textOnDark,
            fontFamily: Fonts.lexend,
            fontSize: 14,
            textAlign: 'center',
          }}
        >
          {message || t('auth.confirm_processing')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

