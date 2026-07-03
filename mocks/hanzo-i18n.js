// Mock for @hanzo_network/hanzo-i18n
export const useTranslation = () => ({
  t: (key) => key,
  i18n: {
    changeLanguage: () => Promise.resolve(),
    language: 'en'
  }
});

export default {
  useTranslation
};