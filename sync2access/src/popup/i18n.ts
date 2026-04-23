import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import vi from './locales/vi';
import zh from './locales/zh';
import ko from './locales/ko';
import ru from './locales/ru';

const LANGUAGE_STORAGE_KEY = 'access-url-language';

let storedLang = 'en';
try {
  storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
} catch { /* ignore */ }

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
    zh: { translation: zh },
    ko: { translation: ko },
    ru: { translation: ru },
  },
  lng: storedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch { /* ignore */ }
});

export default i18n;
