import {initialize, addTranslationForLanguage} from 'react-localize-redux';
import * as types from '../types';

export const setLocaleLoaded = () => ({
    type: types.LOCALE_LOADED
});

export const loadLocalization = jest.fn(() => {
    return dispatch => {
        const languages = ['en_US'];
        dispatch(initialize(languages));
        dispatch(addTranslationForLanguage({ hello: 'hello'}, 'en_US'));
        dispatch(setLocaleLoaded());
    };
});