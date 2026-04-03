import { useEffect, useState } from 'react';
import { Slot, SplashScreen, router, usePathname } from 'expo-router';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as Linking from 'expo-linking';
import { GochiHand_400Regular } from '@expo-google-fonts/gochi-hand';
import {
  FuzzyBubbles_400Regular,
  FuzzyBubbles_700Bold,
} from '@expo-google-fonts/fuzzy-bubbles';
import {
  LexendDeca_400Regular,
  LexendDeca_600SemiBold,
} from '@expo-google-fonts/lexend-deca';
import { supabase } from '../lib/supabase';
import LanguageProvider from '../src/i18n/LanguageProvider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const [sessionState, setSessionState] = useState(undefined);
  const [isProfileComplete, setIsProfileComplete] = useState(null);
  const [isProfileChecked, setIsProfileChecked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [fontsLoaded] = useFonts({
    GochiHand_400Regular,
    FuzzyBubbles_400Regular,
    FuzzyBubbles_700Bold,
    LexendDeca_400Regular,
    LexendDeca_600SemiBold,
  });

  useEffect(() => {
    const handleUrl = (url) => {
      if (url && url.includes('auth/callback')) {
        router.replace('/confirm');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const href = window.location.href;
      const hash = window.location.hash;

      if (href.includes('confirm') && hash.includes('access_token')) {
        return;
      }

      if (href.includes('auth/callback') && hash.includes('access_token')) {
        sessionStorage.setItem('supabase_auth_hash', hash);
        router.replace('/confirm');
      }
    } else {
      Linking.getInitialURL().then(handleUrl);
    }

    const sub = Linking.addEventListener('url', (event) =>
      handleUrl(event.url),
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    SplashScreen.hideAsync();
    let cancelled = false;

    const handleSession = async (session) => {
      if (cancelled) return;
      setSessionState(session ?? null);
      setAuthChecked(true);

      if (pathname === '/confirm') {
        setIsProfileChecked(true);
        return;
      }

      if (!session) {
        setIsProfileComplete(null);
        setIsProfileChecked(false);
        const publicRoutes = ['/login', '/register', '/forgotpassword', '/confirm', '/(auth)/verify-otp'];
        if (!publicRoutes.includes(pathname)) {
          setTimeout(() => router.replace('/(auth)/login'), 0);
        }
        return;
      }

      const isOnboarding =
        pathname === '/onboarding' || pathname.startsWith('/onboarding/');

      setIsProfileChecked(false);
      const { data, error } = await supabase
        .from('closets')
        .select('id, size_top')
        .eq('user_id', session.user.id)
        .single();
      if (cancelled) return;

      const hasCloset = !error && !!data?.id;
      const hasSizes = !!data?.size_top;
      setIsProfileComplete(hasCloset && hasSizes);
      setIsProfileChecked(true);

      if (!hasCloset) {
        if (!isOnboarding) {
          setTimeout(() => router.replace('/onboarding'), 0);
        }
      } else if (!hasSizes) {
        if (pathname !== '/(auth)/complete-profile') {
          setTimeout(() => router.replace('/(auth)/complete-profile'), 0);
        }
      } else {
        const publicRoutes = ['/login', '/register', '/forgotpassword', '/confirm', '/onboarding', '/(auth)/complete-profile', '/(auth)/verify-otp'];
        if (publicRoutes.some(r => pathname === r || pathname.startsWith(r)) && pathname !== '/(main)/dashboard') {
          setTimeout(() => router.replace('/(main)/dashboard'), 0);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleSession(session);
      },
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [fontsLoaded, pathname]);

  const isConfirm = pathname === '/confirm';
  const isOnboarding =
    pathname === '/onboarding' || pathname.startsWith('/onboarding/');

  if (!fontsLoaded) return null;

  if (!authChecked && !isConfirm) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#38240D',
        }}
      >
        <ActivityIndicator size="small" color="#C05800" />
      </View>
    );
  }

  if (sessionState && !isProfileChecked && !isConfirm && !isOnboarding) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#38240D',
        }}
      >
        <ActivityIndicator size="small" color="#C05800" />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <Slot />
    </LanguageProvider>
  );
}
