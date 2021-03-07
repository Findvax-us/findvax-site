import locale_en from './locales/en.json';
// import locale_es from './locales/es.json';
// import locale_fr from './locales/fr.json';

const availableLocales = {
  'en': locale_en,
  // 'es': locale_es,
  // 'fr': locale_fr
}

const defaultLang = 'en';
let lang = defaultLang;

if(window.navigator && window.navigator.language){
  lang = navigator.language.split('-')[0];
}

const loadedLocale = availableLocales[lang] || availableLocales[defaultLang];

export { loadedLocale as localei18n, lang as shortLang }
