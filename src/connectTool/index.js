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

    // wrap api in controller
    let controlledApi = undefined;
    if (api) {
      api.toString = () => namespace;
      controlledApi = new ApiController(api, store,
        hasLocale ? localeDir : undefined);
    }

    return {
      name: namespace,
      api: controlledApi,
      container: makeTool(WrappedComponent, store,
        hasLocale ? localeDir : undefined, api)
    };
  };
};

export default connectTool;
