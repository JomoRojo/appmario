import { useEffect, useState } from 'react';
import { Slot, SplashScreen, router, usePathname } from 'expo-router';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
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
  const [hasCloset, setHasCloset] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [fontsLoaded] = useFonts({
    GochiHand_400Regular,
    FuzzyBubbles_400Regular,
    FuzzyBubbles_700Bold,
    LexendDeca_400Regular,
    LexendDeca_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    SplashScreen.hideAsync();
    let cancelled = false;

    const verifyCloset = async (userId) => {
      setHasCloset(null);
      const { data, error } = await supabase
        .from('closets')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      if (cancelled) return;
      if (error) {
        setHasCloset(false);
        return;
      }
      setHasCloset((data?.length ?? 0) > 0);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        setSessionState(session ?? null);
        if (session) {
          verifyCloset(session.user.id);
        } else {
          setHasCloset(null);
        }
        setAuthChecked(true);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSessionState(session ?? null);
      if (session) {
        verifyCloset(session.user.id);
      } else {
        setHasCloset(null);
      }
      setAuthChecked(true);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded || !authChecked) return;

    const publicUnauthedRoutes = ['/login', '/register', '/forgotpassword', '/confirm'];
    const isPublicUnauthedRoute = publicUnauthedRoutes.includes(pathname);

    if (!sessionState) {
      if (!isPublicUnauthedRoute) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (hasCloset === null) return;

    if (!hasCloset) {
      if (pathname !== '/confirm') {
        router.replace('/confirm');
      }
      return;
    }

    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
      router.replace('/dashboard');
    }
  }, [fontsLoaded, authChecked, pathname, sessionState, hasCloset]);

  if (!fontsLoaded || !authChecked || (sessionState && hasCloset === null)) {
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
