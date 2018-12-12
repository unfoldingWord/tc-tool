jest.unmock('react-localize-redux');
import * as actions from '../locale';
import * as types from '../types';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import path from 'path';
import _ from 'lodash';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('actions', () => {

  it('should create an action to set the locale loaded', () => {
    const expectedAction = {
      type: types.LOCALE_LOADED
    };
    expect(actions.setLocaleLoaded()).toEqual(expectedAction);
  });

  describe('create an action to initialize the locale', () => {

    it('should inject non-translatable strings', () => {
      global.console = {warn: jest.fn()};
      let localeDir = path.join(__dirname, './locale/');
      const store = mockStore({});
      store.dispatch(actions.loadLocalization(localeDir, 'en_US'));

      let addTranslationActions = store.getActions().map(action => {
        if (action.type ===
          '@@localize/ADD_TRANSLATION_FOR_LANGUGE') return action;
      });
      addTranslationActions = _.compact(addTranslationActions);
      expect(addTranslationActions).toHaveLength(4);
      const action = addTranslationActions[0];
      const translation = action.payload.translation;
      expect(translation).toHaveProperty('_');
      expect(translation._).toHaveProperty('locale');
      expect(translation._).toHaveProperty('language_name');
      expect(console.warn).toBeCalled();
    });

    it('should not use the system locale', () => {
      global.console = {warn: jest.fn()};
      let defaultLanguage = 'en_US';
      let localeDir = path.join(__dirname, './locale/');
      const expectedActionTypes = [
        '@@localize/INITIALIZE',
        '@@localize/ADD_TRANSLATION_FOR_LANGUGE', //en_US
        '@@localize/ADD_TRANSLATION_FOR_LANGUGE', // for short locale addition
        '@@localize/ADD_TRANSLATION_FOR_LANGUGE', //na_NA
        '@@localize/ADD_TRANSLATION_FOR_LANGUGE', // for short locale addition
        '@@tool/LOCALE_LOADED'
      ];
      const store = mockStore({});
      store.dispatch(actions.loadLocalization(localeDir, defaultLanguage));
      let receivedActionTypes = store.getActions().map(action => {
        return action.type;
      });
      expect(receivedActionTypes).toEqual(expectedActionTypes);
      expect(console.warn).toBeCalled();
    });

    it('should use the system locale', () => {
      global.console = {warn: jest.fn()};
      let localeDir = path.join(__dirname, './locale/');
      const expectedActionTypes = [
        '@@localize/INITIALIZE',
        '@@localize/ADD_TRANSLATION_FOR_LANGUGE', //en_US
        '@@localize/ADD_TRANSLATION_FOR_LANGUGE', // for short locale addition
        '@@localize/ADD_TRANSLATION_FOR_LANGUGE', //na_NA
        '@@localize/ADD_TRANSLATION_FOR_LANGUGE', // for short locale addition
        '@@localize/SET_ACTIVE_LANGUAGE',
        '@@tool/LOCALE_LOADED'
      ];
      const store = mockStore({});
      store.dispatch(actions.loadLocalization(localeDir));
      let receivedActionTypes = store.getActions().map(action => {
        return action.type;
      });
      expect(receivedActionTypes).toEqual(expectedActionTypes);
      expect(console.warn).toBeCalled();
    });

    it('should reject if locale dir is missing', () => {
      let localeDir = null;
      const store = mockStore({});
      expect(() => store.dispatch(actions.loadLocalization(localeDir))).toThrowError('Tool missing locale dir at null');
    });

    it('should use an equivalent locale', () => {
      global.console = {info: jest.fn(), warn: jest.fn()};
      let defaultLanguage = 'na_MISSING';
      let localeDir = path.join(__dirname, './locale/');
      const expectedActionTypes = [
        {type: '@@localize/INITIALIZE', languageCode: undefined},
        {
          type: '@@localize/ADD_TRANSLATION_FOR_LANGUGE',
          languageCode: undefined
        }, // en_US
        {
          type: '@@localize/ADD_TRANSLATION_FOR_LANGUGE',
          languageCode: undefined
        }, // for short locale addition
        {
          type: '@@localize/ADD_TRANSLATION_FOR_LANGUGE',
          languageCode: undefined
        }, // na_NA
        {
          type: '@@localize/ADD_TRANSLATION_FOR_LANGUGE',
          languageCode: undefined
        }, // for short locale addition
        {type: '@@localize/SET_ACTIVE_LANGUAGE', languageCode: 'na_NA'},
        {type: '@@tool/LOCALE_LOADED'}
      ];
      const store = mockStore({});
      store.dispatch(actions.loadLocalization(localeDir, defaultLanguage));
      let receivedActionTypes = store.getActions().map(action => {
        if (action.type.startsWith('@@localize')) {
          return {type: action.type, languageCode: action.payload.languageCode};
        } else {
          return {type: action.type};
        }
      });
      expect(receivedActionTypes).toEqual(expectedActionTypes);
      expect(console.info).toBeCalled();
      expect(console.warn).toBeCalled();
    });
  });
});
