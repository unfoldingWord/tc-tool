import {initialize, addTranslationForLanguage, setActiveLanguage} from 'react-localize-redux';
import * as types from '../types';

export const setLocaleLoaded = () => ({
    type: types.LOCALE_LOADED
});

export const loadLocalization = jest.fn((localeDir, appLanguage=null) => {
    return dispatch => {
        const languages = ['en_US', 'de_DE'];
        dispatch(initialize(languages));
        dispatch(addTranslationForLanguage({ hello: 'hello'}, 'en_US'));
        dispatch(addTranslationForLanguage({ hello: 'hallo'}, 'de_DE'));
        if(appLanguage) {
            dispatch(setActiveLanguage(appLanguage));
        }
        dispatch(setLocaleLoaded());
    };
});