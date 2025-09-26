import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

export const supportedLanguages: LanguageInfo[] = [
  {
    code: 'zh-TW',
    name: '繁體中文',
    flag: '🇹🇼',
    direction: 'ltr'
  },
  {
    code: 'zh-CN',
    name: '简体中文',
    flag: '🇨🇳',
    direction: 'ltr'
  },
  {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  {
    code: 'ja-JP',
    name: '日本語',
    flag: '🇯🇵',
    direction: 'ltr'
  }
];

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = supportedLanguages.find(
    lang => lang.code === i18n.language
  ) || supportedLanguages[0];

  const changeLanguage = useCallback(async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);

      // Update document direction if needed
      const newLanguage = supportedLanguages.find(lang => lang.code === languageCode);
      if (newLanguage?.direction) {
        document.documentElement.dir = newLanguage.direction;
      }

      // Update document language attribute
      document.documentElement.lang = languageCode;

      // Store preference in localStorage
      localStorage.setItem('i18nextLng', languageCode);

      return true;
    } catch (error) {
      console.error('Failed to change language:', error);
      return false;
    }
  }, [i18n]);

  const isLanguageSupported = useCallback((languageCode: string) => {
    return supportedLanguages.some(lang => lang.code === languageCode);
  }, []);

  const getLanguageInfo = useCallback((languageCode?: string) => {
    const code = languageCode || i18n.language;
    return supportedLanguages.find(lang => lang.code === code) || supportedLanguages[0];
  }, [i18n.language]);

  const getBrowserLanguage = useCallback(() => {
    const browserLanguage = navigator.language || navigator.languages?.[0];

    // Try exact match first
    if (isLanguageSupported(browserLanguage)) {
      return browserLanguage;
    }

    // Try language code without region (e.g., 'zh' from 'zh-CN')
    const languageCode = browserLanguage.split('-')[0];
    const matchingLanguage = supportedLanguages.find(
      lang => lang.code.startsWith(languageCode)
    );

    return matchingLanguage?.code || supportedLanguages[0].code;
  }, [isLanguageSupported]);

  const formatTranslationKey = useCallback((key: string, namespace?: string) => {
    if (namespace) {
      return `${namespace}:${key}`;
    }
    return key;
  }, []);

  return {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    isLanguageSupported,
    getLanguageInfo,
    getBrowserLanguage,
    formatTranslationKey,
    t,
    language: i18n.language,
    isReady: i18n.isInitialized,
  };
};