import {configureStore} from '../state/store';
import {getActiveLanguage, getTranslate} from '../state/reducers';
import fs from 'fs-extra';
import ApiController from '../api/ApiController';
import {makeTool} from './makeTool';

/**
 * Builds the locale tools
 * @param state
 * @return {*}
 */
export const makeLocaleProps = (state) => {
  const translate = getTranslate(state);
  const lang = getActiveLanguage(state);
  const currentLanguage = lang ? lang.code : undefined;
  return {
    translate,
    currentLanguage
  };
};

/**
 * Wraps a function with another function.
 * This is used for wrapping dispatch around a function.
 * @param {func} dispatch
 * @param {func} func
 * @return {func}
 */
export const wrapFunc = (dispatch, func) => (...args) => dispatch(
  func(...args));

/**
 * This HOC initializes a store and locale for the tool.
 * It also specifies some required properties common to all tools.
 *
 * @param namespace
 * @param options
 * @return {function(*)}
 */
const connectTool = (namespace, options = {}) => {

  /**
   * @param {string} [localeDir] - directory containing the interface locale files
   * @param {*} [reducer] - a custom reducer for the tool.
   * @param {[]} [middlewares] - an array of middleware to inject into the store.
   * @param {*} [api] - The tool's api class
   */
  const {localeDir = undefined, reducer = undefined, middlewares = undefined, api = undefined} = options;

  if (localeDir && typeof localeDir !== 'string') {
    throw Error(
      `Invalid parameter. Expected localeDir to be a string but found ${typeof localeDir} instead`);
  }

  return (WrappedComponent) => {
    console.info('Booting tool...');
    const hasLocale = localeDir && fs.existsSync(localeDir);
    if (!localeDir) {
      console.warn('You should consider localizing this tool.');
    } else if (!hasLocale) {
      console.warn(`No locale found at ${localeDir}`);
    }

    const store = configureStore(reducer, middlewares);
    // TRICKY: this will overwrite the default store context key
    // thus removing direct access to tC core's store which also uses the default key.
    // const Provider = createProvider();

    // inject redux into the api and bind the lifecycle methods.
    let controlledApi = undefined;
    if (api) {
      api.toString = () => namespace;
      controlledApi = new ApiController(api, store,
        hasLocale ? localeDir : undefined);
      // , (state, dispatch, props) => {
      //   // pre-process props before sending them to the tool
      //   return {
      //     ...props,
      //     ...makeLocaleProps(state, hasLocale),
      //     setToolLoading: wrapFunc(dispatch, setToolLoading),
      //     setToolReady: wrapFunc(dispatch, setToolReady)
      //   };
      // });
    }

    /**
     * This container sets up the tool environment.
     *
     * @property {string} appLanguage - the app interface language code
     */
    // class Tool extends React.Component {
    //   constructor(props) {
    //     super(props);
    //     this._isLoaded = this._isLoaded.bind(this);
    //     this.handleChange = this.handleChange.bind(this);
    //     this.state = {
    //       broken: false,
    //       error: null,
    //       info: null
    //     };
    //   }
    //
    //   componentWillMount() {
    //     // TODO: load this right away
    //     const {appLanguage} = this.props;
    //     if (hasLocale && !api) {
    //       store.dispatch(loadLocalization(localeDir, appLanguage));
    //     }
    //     this.unsubscribe = store.subscribe(this.handleChange);
    //   }
    //
    //   componentWillUnmount() {
    //     this.unsubscribe();
    //   }
    //
    //   handleChange() {
    //     this.forceUpdate();
    //   }
    //
    //   componentDidCatch(error, info) {
    //     this.setState({
    //       broken: true,
    //       error,
    //       info
    //     });
    //   }
    //
    //   componentWillReceiveProps(nextProps) {
    //     // stay in sync with the application language
    //     if (hasLocale && nextProps.appLanguage !== this.props.appLanguage) {
    //       store.dispatch(setActiveLocale(nextProps.appLanguage));
    //     }
    //   }
    //
    //   /**
    //    * Checks if the locale has finished loading
    //    * @return {bool}
    //    * @private
    //    */
    //   _isLoaded() {
    //     const state = store.getState();
    //     const toolIsLoaded = !isToolLoading(state);
    //     const localeIsLoaded = !hasLocale || getLocaleLoaded(state);
    //     return toolIsLoaded || localeIsLoaded;
    //   }
    //
    //   render() {
    //     const {broken, error, info} = this.state;
    //     if(broken) {
    //       return (
    //         <BrokenScreen title="ERROR"
    //                       error={error}
    //                       info={info}/>
    //       );
    //     } else if (!this._isLoaded()) {
    //       // TODO: we could display a loading screen while the tool loads
    //       return null;
    //     } else {
    //       const localeProps = hasLocale ? makeLocaleProps(store.getState()) : {};
    //       // TODO: rather than building the api prop hierarchy in tC we should pass flat props
    //       // then here and in the api we can scope them to `tc`,
    //       return (
    //         <Provider store={store}>
    //           <WrappedComponent
    //             {...this.props}
    //             toolApi={toolApi}
    //             {...localeProps}
    //           />
    //         </Provider>
    //       );
    //     }
    //   }
    // }

    /**
     * This defines the interface between tools and tC core.
     */

    return {
      name: namespace,
      api: controlledApi,
      container: makeTool(WrappedComponent, store,
        hasLocale ? localeDir : undefined, api)
    };
  };
};

export default connectTool;
