import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

import es from './locales/es.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import it from './locales/it.json';
import de from './locales/de.json';

const supportedLanguages = ['es', 'en', 'fr', 'pt', 'it', 'de'];

function normalizeLanguageCode(code) {
  if (!code || typeof code !== 'string') return null;
  return code.split('-')[0].toLowerCase();
}

function detectInitialLanguage() {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      const fromBrowser = normalizeLanguageCode(navigator.language);
      if (fromBrowser && supportedLanguages.includes(fromBrowser)) return fromBrowser;
    }
  } catch (_e) {
    // ignore
  }

  try {
    // Fallback para native/JS sin dependencias extra
    const fromIntl =
      typeof Intl !== 'undefined'
        ? normalizeLanguageCode(Intl.DateTimeFormat().resolvedOptions().locale)
        : null;
    if (fromIntl && supportedLanguages.includes(fromIntl)) return fromIntl;
  } catch (_e) {
    // ignore
  }

  return 'en';
}

const initialLng = detectInitialLanguage();

const resources = {
  es: { translation: { auth: es } },
  en: { translation: { auth: en } },
  fr: { translation: { auth: fr } },
  pt: { translation: { auth: pt } },
  it: { translation: { auth: it } },
  de: { translation: { auth: de } },
};

i18next.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  defaultNS: 'translation',
  react: {
    useSuspense: false,
  },
});

export default i18next;

