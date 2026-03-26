import { useEffect, useState } from 'react';
import { Slot, SplashScreen, router, usePathname, useSegments } from 'expo-router';
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
  const segments = useSegments();
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
    if (!fontsLoaded) return;

    SplashScreen.hideAsync();
    let cancelled = false;

    const handleSession = async (session) => {
      if (cancelled) return;
      setSessionState(session ?? null);
      setAuthChecked(true);

      const inConfirmRoute = segments.includes('confirm');
      if (inConfirmRoute) {
        // confirm.jsx is the only owner of token-exchange flow
        return;
      }

      if (!session) {
        setIsProfileComplete(null);
        setIsProfileChecked(false);
        const publicUnauthedRoutes = ['/login', '/register', '/forgotpassword', '/confirm'];
        const isPublicUnauthedRoute = publicUnauthedRoutes.includes(pathname);
        if (!isPublicUnauthedRoute) {
          router.replace('/(auth)/login');
        }
        return;
      }

      setIsProfileChecked(false);
      const { data, error } = await supabase
        .from('closets')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      if (cancelled) return;
      if (error) {
        setIsProfileComplete(false);
        setIsProfileChecked(true);
        router.replace('/(auth)/complete-profile');
        return;
      }
      setIsProfileComplete(!!data?.id);
      setIsProfileChecked(true);
      router.replace('/dashboard');
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await handleSession(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [fontsLoaded, pathname, segments]);

  if (!fontsLoaded || !authChecked || (sessionState && !isProfileChecked && !segments.includes('confirm'))) {
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
