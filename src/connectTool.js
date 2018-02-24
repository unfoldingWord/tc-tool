import React from 'react';
import PropTypes from 'prop-types';
import {createProvider} from 'react-redux';
import {configureStore} from './state/store';
import {loadLocalization, setActiveLocale} from './state/actions/locale';
import BrokenScreen from './BrokenScreen';
import {getTranslate, getLocaleLoaded, getActiveLanguage} from './state/reducers';
import fs from 'fs-extra';

/**
 * This HOC initializes a store and locale for the tool.
 * It also specifies some required properties common to all tools.
 *
 * @param {string} toolId - the tool's unique id. Used for storing the redux store in the react context.
 * @param {string} [localeDir] - directory containing the interface locale files
 * @return {function(*)}
 */
const connectTool = (toolId, localeDir) => {
  if(!toolId || typeof toolId !== 'string') {
    throw Error(`Invalid parameter. Expected toolId to be a string but found ${typeof toolId} instead`);
  }
    if(localeDir && typeof localeDir !== 'string') {
        throw Error(`Invalid parameter. Expected localeDir to be a string but found ${typeof localeDir} instead`);
    }

  return (WrappedComponent) => {
    const hasLocale = localeDir && fs.existsSync(localeDir);
    if(!hasLocale) {
      console.warn('No locale found. You should consider localizing this tool.');
    }

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
          info: null
        };
      }

      componentWillMount() {
        const {appLanguage} = this.props;
        this.store = configureStore();
        if(hasLocale) {
            this.store.dispatch(loadLocalization(localeDir, appLanguage));
        }
        this.Provider = createProvider(toolId);
        this.unsubscribe = this.store.subscribe(this.handleChange.bind(this));
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
          info
        });
      }

      componentWillReceiveProps(nextProps) {
        // stay in sync with the application language
        if(hasLocale && nextProps.appLanguage !== this.props.appLanguage) {
          this.store.dispatch(setActiveLocale(nextProps.appLanguage));
        }
      }

      /**
       * Checks if the locale has finished loading
       * @return {bool}
       * @private
       */
      _isLoaded() {
        // TRICKY: if locale doesn't exist skip to finished loading
        return !hasLocale || getLocaleLoaded(this.store.getState());
      }

      /**
       * Returns the broken screen if one should be displayed
       * @return {*}
       * @private
       */
      _getBrokenScreen() {
        const {broken, error, info} = this.state;
        if(broken) {
          // TODO: log the error to the core app state so it will be included in feedback logs.
          // it would be best to pass a callback into this component for this purpose.

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

      /**
       * Wraps the component with the provider
       * @param {*} component - the child of this component
       * @return {*}
       * @private
       */
      _connectProvider(component) {
        const Provider = this.Provider;
        return (
          <Provider store={this.store}>
            {component}
          </Provider>
        );
      }

      render() {
        if(!this._isLoaded()) {
          // TODO: we could display a loading screen while the locale loads
          return null;
        }

        const brokenScreen = this._getBrokenScreen();
        if(brokenScreen) {
          return brokenScreen;
        } else {
          let translate = undefined;
          let currentLanguage = undefined;
          if(hasLocale) {
            translate = getTranslate(this.store.getState());
            const lang = getActiveLanguage(this.store.getState());
            currentLanguage = lang ? lang.code : undefined;
          }
          return this._connectProvider(
            <WrappedComponent
              translate={translate}
              currentLanguage={currentLanguage}
              {...this.props}
            />
          );
        }
      }
    }

    /**
     * This effectively defines the interface between tools and tC core.
     */
    Tool.propTypes = {
      currentToolViews: PropTypes.object.isRequired,
      resourcesReducer: PropTypes.object.isRequired,
      contextIdReducer: PropTypes.object.isRequired,
      appLanguage: PropTypes.string.isRequired
    };
    return Tool;
  };
};

export default connectTool;