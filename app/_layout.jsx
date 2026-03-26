import { useEffect } from 'react';
import { Slot, SplashScreen, router, usePathname } from 'expo-router';
import { useFonts } from 'expo-font';
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

    const publicUnauthedRoutes = ['/login', '/register', '/forgotpassword', '/confirm'];
    const isPublicUnauthedRoute = publicUnauthedRoutes.includes(pathname);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          router.replace('/(main)/dashboard');
        } else if (!isPublicUnauthedRoute) {
          router.replace('/(auth)/login');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(main)/dashboard');
      } else if (!isPublicUnauthedRoute) {
        router.replace('/(auth)/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fontsLoaded, pathname]);

  if (!fontsLoaded) return null;

  return (
    <LanguageProvider>
      <Slot />
    </LanguageProvider>
  );
}
