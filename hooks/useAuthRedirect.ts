import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

type Status = 'loading' | 'success' | 'error';

function extractWebParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash?.replace(/^#/, '') || '';
  const search = window.location.search?.replace(/^\?/, '') || '';
  return Object.fromEntries(new URLSearchParams(`${search}&${hash}`).entries());
}

export function useAuthRedirect() {
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        let params: Record<string, string> = {};

        if (Platform.OS === 'web') {
          params = extractWebParams();
        } else {
          const url = await Linking.getInitialURL();
          if (url) {
            const { queryParams } = Linking.parse(url);
            params = (queryParams ?? {}) as Record<string, string>;
          }
        }

        const { access_token, refresh_token, token_hash, type, code } = params;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
        } else if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) throw error;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error('No authentication tokens found');
        }

        if (active) setStatus('success');
      } catch (err: any) {
        if (active) {
          setErrorMessage(err?.message || 'Verification failed');
          setStatus('error');
        }
      }
    };

    verify();
    return () => {
      active = false;
    };
  }, []);

  return { status, errorMessage };
}
