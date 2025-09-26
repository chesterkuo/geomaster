import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Translation resources
import zhTW from './locales/zh-TW.json';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import jaJP from './locales/ja-JP.json';

const resources = {
  'zh-TW': {
    translation: zhTW
  },
  'zh-CN': {
    translation: zhCN
  },
  'en-US': {
    translation: enUS
  },
  'ja-JP': {
    translation: jaJP
  },
  // Add common browser locale mappings
  'zh': {
    translation: zhCN // Default Chinese to Simplified Chinese
  },
  'zh-tw': {
    translation: zhTW
  },
  'zh-cn': {
    translation: zhCN
  },
  'en': {
    translation: enUS
  },
  'ja': {
    translation: jaJP
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
          'ja-jp': 'ja-JP'
        };

        // Return mapped language or fallback to English
        return mapping[lowerLng] || 'en-US';
      }
    }
  });

export default i18n;