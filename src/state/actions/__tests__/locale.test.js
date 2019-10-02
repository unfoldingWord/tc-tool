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
      expect(store.getActions()).toMatchSnapshot();
    });

    it('should not use the system locale', () => {
      global.console = {warn: jest.fn()};
      let defaultLanguage = 'en_US';
      let localeDir = path.join(__dirname, './locale/');
      const store = mockStore({});
      store.dispatch(actions.loadLocalization(localeDir, defaultLanguage));
      expect(store.getActions()).toMatchSnapshot();
      expect(console.warn).toBeCalled();
    });

    it('should use the system locale', () => {
      global.console = {warn: jest.fn()};
      let localeDir = path.join(__dirname, './locale/');
      const store = mockStore({});
      store.dispatch(actions.loadLocalization(localeDir));
      expect(store.getActions()).toMatchSnapshot();
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
      const store = mockStore({});
      store.dispatch(actions.loadLocalization(localeDir, defaultLanguage));
      expect(store.getActions()).toMatchSnapshot();
      expect(console.info).toBeCalled();
      expect(console.warn).toBeCalled();
    });
  });
});
