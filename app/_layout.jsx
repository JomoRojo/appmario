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
    let cancelled = false;

    const hasCloset = async (userId) => {
      const { count, error } = await supabase
        .from('closets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) return false;
      return (count ?? 0) > 0;
    };

    const routeForSession = async (session) => {
      if (cancelled) return;

      if (!session) {
        if (!isPublicUnauthedRoute) {
          router.replace('/(auth)/login');
        }
        return;
      }

      const userHasCloset = await hasCloset(session.user.id);
      if (cancelled) return;

      if (!userHasCloset) {
        if (pathname !== '/confirm') {
          router.replace('/confirm');
        }
        return;
      }

      if (pathname === '/confirm' || pathname.startsWith('/login') || pathname.startsWith('/register')) {
        router.replace('/(main)/dashboard');
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        routeForSession(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      routeForSession(session);
    });

    return () => {
      cancelled = true;
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
