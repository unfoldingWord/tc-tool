import fs from 'fs-extra';
import path from 'path';
import {
  addTranslationForLanguage,
  initialize,
  setActiveLanguage
} from 'react-localize-redux';
import osLocale from 'os-locale';
import _ from 'lodash';
import * as types from './types';
import {getLanguages, getTranslations} from '../reducers';
import {batchActions} from 'redux-batched-actions';

const DEFAULT_LOCALE = 'en_US';

/**
 * The handler for missing translations.
 * @param key
 * @param languageCode
 */
const onMissingTranslation = (key, languageCode) => {
  console.error(`Tool missing locale key "${key}" for language ${languageCode}`,
    new Error().stack);
};

/**
 * Splits a locale filename into it's identifiable pieces
 * @param {string} fileName the locale file name (basename)
 * @return {{langName, langCode, shortLangCode}}
 */
const explodeLocaleName = (fileName) => {
  let title = fileName.replace(/\.json/, '');
  let langName = title.split('-')[0];
  let langCode = title.split('-')[1];
  let shortLangCode = langCode.split('_')[0];
  return {langName, langCode, shortLangCode};
};

/**
 * Injects additional information into the translation
 * that should not otherwise be translated. e.g. legal entities
 * @param {object} translation localized strings
 * @param {string} fileName the name of the locale file including the file extension.
 * @param {list} nonTranslatableStrings a list of non-translatable strings to inject
 * @return {object} the enhanced translation
 */
const enhanceTranslation = (
  translation, fileName, nonTranslatableStrings = []) => {
  const {langName, langCode, shortLangCode} = explodeLocaleName(fileName);
  return {
    ...translation,
    '_': {
      'language_name': langName,
      'short_locale': shortLangCode,
      'locale': langCode,
      ...nonTranslatableStrings
    }
  };
};

/**
 * Indicates the locale has been completely loaded
 * @return {{type: string}}
 */
export const setLocaleLoaded = () => ({
  type: types.LOCALE_LOADED
});

/**
 * This thunk loads the localization data
 * and initializes the localization library.
 *
 * The default language is english.
 * TODO: for now we are loading all translations up-front. However we could instead load one at a time as needed in `setLanguage` for better performance.
 *
 * @param {string} localeDir directory containing locale files
 * @param {string} appLanguage the language code that will be enabled by default
 * @return {function(*)}
 */
export const loadLocalization = (localeDir, appLanguage = null) => {
  return (dispatch) => {
    if (!fs.existsSync(localeDir)) {
      throw new Error(`Tool missing locale dir at ${localeDir}`);
    }
    const nonTranslatableFile = 'nonTranslatable.json';
    const items = fs.readdirSync(localeDir);
    // load locale
    let languages = [];
    let translations = {};
    if (!items) {
      throw new Error(`Tool found no localization files in ${localeDir}`);
    }
    for (let file of items) {
      if (!file.endsWith('.json')) {
        // don't warn if readme or NonTranslatable.js
        if (!file.endsWith('.md') && !file.endsWith('.js')) {
          console.warn(`Tool skipping invalid localization file ${file}`);
        }
        continue;
      }
      if (file === nonTranslatableFile) { // skip the non-translatable file
        continue;
      }
      const localeFile = path.join(localeDir, file);
      try {
        let translation = JSON.parse(fs.readFileSync(localeFile));

        const nonTranslatablePath = path.join(localeDir, nonTranslatableFile);
        let nonTranslatable = {};
        if (fs.existsSync(nonTranslatablePath)) {
          nonTranslatable = JSON.parse(fs.readFileSync(nonTranslatablePath));
        }

        translation = enhanceTranslation(translation, file, nonTranslatable);

        const {langCode, shortLangCode} = explodeLocaleName(file);
        languages.push(langCode);
        translations[langCode] = translation;

        // include short language names for wider locale compatibility
        if (_.indexOf(languages, shortLangCode) === -1) {
          languages.push(shortLangCode);
          translations[shortLangCode] = translation;
        }
      } catch (e) {
        console.warn(`Tool failed to load localization ${localeFile}: ${e}`);
      }
    }

    // init locale
    const namedLanguages = languages.map((code) => {
      return {
        code,
        name: translations[code]['_']['language_name']
      };
    });
    dispatch(initialize(namedLanguages, {
      defaultLanguage: DEFAULT_LOCALE,
      missingTranslationCallback: onMissingTranslation
    }));
    const addTranslationActions = [];
    for (const languageCode in translations) {
      if (translations.hasOwnProperty(languageCode)) {
        addTranslationActions.push(addTranslationForLanguage(translations[languageCode], languageCode));
      }
    }
    dispatch(batchActions(addTranslationActions));
    if (appLanguage !== DEFAULT_LOCALE) {
      setActiveLocale(dispatch, appLanguage, languages, translations);
    }
    dispatch(setLocaleLoaded());
  };
};

/**
 * Safely sets the active language by falling back to an equivalent locale if
 * needed.
 *
 * @param dispatch
 * @param {string} locale the locale to set
 * @param {list} languages a list of loaded languages
 * @param {object} translations a dictionary of loaded translations
 * @return {bool} returns true of the language was successfully set.
 */
const setActiveLanguageSafely = (dispatch, locale, languages, translations) => {
  const shortLocale = locale.split('_')[0];
  if (_.indexOf(languages, locale) >= 0) {
    // matched locale
    dispatch(setActiveLanguage(locale));
  } else if (_.indexOf(languages, shortLocale) >= 0) {
    // equivalent locale
    let equivalentLocale = translations[shortLocale]['_']['locale'];
    console.info(`Using equivalent locale: ${equivalentLocale}`);
    dispatch(setActiveLanguage(equivalentLocale));
  } else {
    console.error(`Tool found no translations for locale: ${locale}`);
    return false;
  }
  return true;
};

/**
 * Sets the active locale.
 * This will fallback to the system os, then english if the locale is not found.
 *
 * @param dispatch
 * @param {string} locale - the language code to set. This can be null
 * @param languages
 * @param translations
 * @return {function(*=, *)}
 */
const setActiveLocale = (dispatch, locale, languages, translations) => {
  const systemLocale = osLocale.sync();
  const locales = [locale, systemLocale, 'en_US'];
  let foundLocale = false;
  for (const langCode of locales) {
    // TRICKY: make sure the input locale was not null
    if (langCode &&
      setActiveLanguageSafely(dispatch, langCode, languages, translations)) {
      if (langCode !== locale) {
        console.warn(
          `Tool could not find locale ${locale}. Falling back to ${langCode}`);
      }
      foundLocale = true;
      break;
    }
  }
  if (!foundLocale) {
    console.error('Tool was unable to find suitable locale.');
  }
};

/**
 * Sets the active locale.
 * This will fallback to the system os, then english if the locale is not found.
 *
 * @param {string} locale - the language code to set
 * @return {function(*=, *)}
 */
exports.setActiveLocale = (locale) => {
  return (dispatch, getState) => {
    const state = getState();
    const translations = getTranslations(state);
    const languages = _.map(getLanguages(state), 'code');
    setActiveLocale(dispatch, locale, languages, translations);
  };
};
