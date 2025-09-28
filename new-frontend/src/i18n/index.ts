import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Translation resources
import zhTW from './locales/zh-TW.json';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import jaJP from './locales/ja-JP.json';
import koKR from './locales/ko-KR.json';
import frFR from './locales/fr-FR.json';
import ptBR from './locales/pt-BR.json';

const resources = {
  'en-US': {
    translation: enUS
  },
  'zh-CN': {
    translation: zhCN
  },
  'ja-JP': {
    translation: jaJP
  },
  'ko-KR': {
    translation: koKR
  },
  'zh-TW': {
    translation: zhTW
  },
  'fr-FR': {
    translation: frFR
  },
  'pt-BR': {
    translation: ptBR
  },
  // Add common browser locale mappings
  'en': {
    translation: enUS
  },
  'zh': {
    translation: zhCN // Default Chinese to Simplified Chinese
  },
  'zh-cn': {
    translation: zhCN
  },
  'zh-tw': {
    translation: zhTW
  },
  'ja': {
    translation: jaJP
  },
  'ko': {
    translation: koKR
  },
  'fr': {
    translation: frFR
  },
  'pt': {
    translation: ptBR
  }
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Remove explicit lng to enable automatic detection
    fallbackLng: 'en-US', // Change fallback to English for better compatibility
    debug: import.meta.env.VITE_DEBUG_API === 'true', // Enable debug in development

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    detection: {
      // Browser language detection order
      order: ['navigator', 'localStorage', 'htmlTag', 'path', 'subdomain'],

      // Cache the detected language
      caches: ['localStorage'],

      // LocalStorage key
      lookupLocalStorage: 'i18nextLng',

      // Check for language in various HTML attributes
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,

      // Convert browser locale codes to our supported languages
      convertDetectedLanguage: (lng: string) => {
        // Handle browser locale codes and map them to our supported languages
        const lowerLng = lng.toLowerCase();

        // Map common browser locales to our supported locales
        const mapping: { [key: string]: string } = {
          'zh-tw': 'zh-TW',
          'zh-hk': 'zh-TW', // Hong Kong uses Traditional Chinese
          'zh-mo': 'zh-TW', // Macau uses Traditional Chinese
          'zh-cn': 'zh-CN',
          'zh-sg': 'zh-CN', // Singapore uses Simplified Chinese
          'zh': 'zh-CN',    // Default Chinese to Simplified
          'en': 'en-US',
          'en-us': 'en-US',
          'en-gb': 'en-US',
          'en-au': 'en-US',
          'en-ca': 'en-US',
          'ja': 'ja-JP',
          'ja-jp': 'ja-JP',
          'ko': 'ko-KR',
          'ko-kr': 'ko-KR',
          'fr': 'fr-FR',
          'fr-fr': 'fr-FR',
          'fr-ca': 'fr-FR', // Canadian French uses same translations
          'fr-be': 'fr-FR', // Belgian French uses same translations
          'fr-ch': 'fr-FR', // Swiss French uses same translations
          'pt': 'pt-BR',
          'pt-br': 'pt-BR',
          'pt-pt': 'pt-BR' // Portuguese from Portugal uses Brazilian Portuguese for now
        };

        // Return mapped language or fallback to English
        return mapping[lowerLng] || 'en-US';
      }
    }
  });

export default i18n;
