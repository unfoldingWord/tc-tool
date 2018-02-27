import { combineReducers } from 'redux';
import * as fromReactLocalizeRedux from 'react-localize-redux';
import localeSettings, * as fromLocaleSettings from './localeSettings';

const reducers = combineReducers({
  locale: fromReactLocalizeRedux.localeReducer,
  localeSettings
});

export default reducers;

/**
 * Returns the localization function
 * @param {*} state - the root redux state object
 * @return {Translate}
 */
export const getTranslate = (state) =>
  fromReactLocalizeRedux.getTranslate(state.internal.locale);

/**
 * Checks if the locale has been loaded
 * @param state
 * @return {bool}
 */
export const getLocaleLoaded = (state) =>
  fromLocaleSettings.getLocaleLoaded(state.internal.localeSettings);

/**
 * Returns the locale language that is currently active
 * @param state
 * @return {Language}
 */
export const getActiveLanguage = (state) =>
    fromReactLocalizeRedux.getActiveLanguage(state.internal.locale);

/**
 * Returns the locale languages
 * @param state
 * @return {Language[]}
 */
export const getLanguages = (state) =>
  fromReactLocalizeRedux.getLanguages(state.internal.locale);

/**
 * Returns the locale translations
 * @param state
 * @return {Translations}
 */
export const getTranslations = (state) =>
  fromReactLocalizeRedux.getTranslations(state.internal.locale);