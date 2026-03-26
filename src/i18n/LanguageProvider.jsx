import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { Platform } from 'react-native';

const supportedLanguages = ['es', 'en', 'fr', 'pt', 'it', 'de'];

function normalizeLanguageCode(code) {
  if (!code || typeof code !== 'string') return null;
  return code.split('-')[0].toLowerCase();
}

function detectLanguage() {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      const fromBrowser = normalizeLanguageCode(navigator.language);
      if (fromBrowser && supportedLanguages.includes(fromBrowser)) return fromBrowser;
    }
  } catch (_e) {
    // ignore
  }

  try {
    const fromIntl =
      typeof Intl !== 'undefined'
        ? normalizeLanguageCode(Intl.DateTimeFormat().resolvedOptions().locale)
        : null;
    if (fromIntl && supportedLanguages.includes(fromIntl)) return fromIntl;
  } catch (_e) {
    // ignore
  }

  return i18n.language || 'en';
}

export default function LanguageProvider({ children }) {
  useEffect(() => {
    const nextLng = detectLanguage();
    if (nextLng && nextLng !== i18n.language) {
      i18n.changeLanguage(nextLng);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

