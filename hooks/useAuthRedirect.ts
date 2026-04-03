import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

type AuthRedirectStatus = 'loading' | 'success' | 'error';

export function useAuthRedirect() {
  const [status, setStatus] = useState<AuthRedirectStatus>('loading');

  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        const parsed = Linking.parse(url);
        const params = parsed.queryParams as Record<string, string>;
        const { token_hash, type, access_token, refresh_token } = params;

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) { setStatus('error'); return; }
          setStatus('success');
          return;
        }

        const code = params.code || new URL(url).searchParams?.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) { setStatus('error'); return; }
          setStatus('success');
          return;
        }

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) { setStatus('error'); return; }
          setStatus('success');
          return;
        }

        if (typeof window !== 'undefined') {
          const savedHash = sessionStorage.getItem('supabase_auth_hash');
          if (savedHash) {
            sessionStorage.removeItem('supabase_auth_hash');
            window.location.hash = savedHash;
          }
          
          if (window.location.hash) {
            const hash = window.location.hash.substring(1);
            const hashParams = Object.fromEntries(new URLSearchParams(hash));
            if (hashParams.access_token && hashParams.refresh_token) {
              const { error } = await supabase.auth.setSession({
                access_token: hashParams.access_token,
                refresh_token: hashParams.refresh_token,
              });
              if (error) { setStatus('error'); return; }
              setStatus('success');
              return;
            }
          }
        }

        setStatus('error');
      } catch (err) {
        setStatus('error');
      }
    };

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', event => handleUrl(event.url));
    return () => sub.remove();
  }, []);

  return { status };
}
