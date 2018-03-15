import React from 'react';
import PropTypes from 'prop-types';
import {createProvider} from 'react-redux';
import {configureStore} from './state/store';
import {loadLocalization, setActiveLocale} from './state/actions/locale';
import BrokenScreen from './BrokenScreen';
import {
  getActiveLanguage,
  getLocaleLoaded,
  getTranslate,
} from './state/reducers';
import fs from 'fs-extra';

/**
 * This HOC initializes a store and locale for the tool.
 * It also specifies some required properties common to all tools.
 *
 * @param {string} [localeDir] - directory containing the interface locale files
 * @param {*} [reducer] - a custom reducer for the tool.
 * @return {function(*)}
 */
const connectTool = (localeDir, reducer) => {
  if (localeDir && typeof localeDir !== 'string') {
    throw Error(
      `Invalid parameter. Expected localeDir to be a string but found ${typeof localeDir} instead`);
  }

  return (WrappedComponent) => {
    const hasLocale = localeDir && fs.existsSync(localeDir);
    if(!localeDir) {
      console.warn('You should consider localizing this tool.');
    } else if (!hasLocale) {
      console.warn(`No locale found at ${localeDir}`);
    }

    const store = configureStore(reducer);
    // TRICKY: this will overwrite the default store context key
    // thus removing direct access to tC core's store which also uses the default key.
    const Provider = createProvider();

    /**
     * This container sets up the tool environment.
     *
     * @property {string} appLanguage - the app interface language code
     */
    class Tool extends React.Component {
      constructor(props) {
        super(props);
        this._isLoaded = this._isLoaded.bind(this);
        this.state = {
          broken: false,
          error: null,
          info: null,
        };
      }

      componentWillMount() {
        const {appLanguage} = this.props;
        if (hasLocale) {
          store.dispatch(loadLocalization(localeDir, appLanguage));
        }
        this.unsubscribe = store.subscribe(this.handleChange.bind(this));
      }

      componentWillUnmount() {
        this.unsubscribe();
      }

      handleChange() {
        this.forceUpdate();
      }

      componentDidCatch(error, info) {
        this.setState({
          broken: true,
          error,
          info,
        });
      }

      componentWillReceiveProps(nextProps) {
        // stay in sync with the application language
        if (hasLocale && nextProps.appLanguage !== this.props.appLanguage) {
          store.dispatch(setActiveLocale(nextProps.appLanguage));
        }
      }

      /**
       * Checks if the locale has finished loading
       * @return {bool}
       * @private
       */
      _isLoaded() {
        // TRICKY: if locale doesn't exist skip to finished loading
        return !hasLocale || getLocaleLoaded(store.getState());
      }

      /**
       * Returns the broken screen if one should be displayed
       * @return {*}
       * @private
       */
      _getBrokenScreen() {
        const {broken, error, info} = this.state;
        if (broken) {
          // TODO: log the error to the core app state so it will be included in feedback logs.
          // it would be best to pass a callback into this component for this purpose.
          // Perhaps we could also include the state of this tool.

          // TRICKY: we don't want to rely on tools localizing the title of the error page.
          // so we'll assume most people understand that "error" and some cryptic stack trace
          // means things broke.
          return <BrokenScreen title="ERROR"
                               error={error}
                               info={info}/>;
        } else {
          return null;
        }
      }

      render() {
        if (!this._isLoaded()) {
          // TODO: we could display a loading screen while the tool loads
          return null;
        }

        const brokenScreen = this._getBrokenScreen();
        if (brokenScreen) {
          return brokenScreen;
        } else {
          // TRICKY: load locale tools if enabled
          let translate = undefined;
          let currentLanguage = undefined;
          if (hasLocale) {
            translate = getTranslate(store.getState());
            const lang = getActiveLanguage(store.getState());
            currentLanguage = lang ? lang.code : undefined;
          }
          return (
            <Provider store={store}>
              <WrappedComponent
                translate={translate}
                currentLanguage={currentLanguage}
                {...this.props}
              />
            </Provider>
          );
        }
      }
    }

    /**
     * This defines the interface between tools and tC core.
     */
    Tool.propTypes = {
      currentToolViews: PropTypes.object.isRequired,
      resourcesReducer: PropTypes.object.isRequired,
      contextIdReducer: PropTypes.object.isRequired,
      appLanguage: PropTypes.string.isRequired,
    };
    return Tool;
  };
};

export default connectTool;
