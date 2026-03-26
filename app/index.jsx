import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AppIndexRedirector() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (cancelled) return;

      if (session) {
        router.replace('/(main)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

