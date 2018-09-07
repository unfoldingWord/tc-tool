import React from 'react';
import {createProvider} from 'react-redux';
import PropTypes from 'prop-types';
import BrokenScreen from '../BrokenScreen';
import {getLocaleLoaded} from '../state/reducers';
import {loadLocalization, setActiveLocale} from '../state/actions/locale';
import {makeToolProps} from './makeProps';

/**
 * Generates the tool component
 * @param WrappedComponent
 * @param {string} namespace - the tool namespace/id
 * @param store - the redux store
 * @param {string} localeDir - the directory where locale files will be loaded
 * @param {ApiController} controlledApi - the tool's controlled api
 * @return {Tool}
 */
export const makeTool = (
  WrappedComponent, namespace, store, localeDir = undefined,
  controlledApi = undefined) => {
  const hasLocale = Boolean(localeDir);
  const hasApi = Boolean(controlledApi);

  // checks if the locale has finished loading
  const isLocaleLoaded = () => {
    return !hasLocale || getLocaleLoaded(store.getState());
  };

  // TRICKY: this will overwrite the default store context key
  // thus removing direct access to tC core's store which also uses the default key.
  const Provider = createProvider();

  class Tool extends React.Component {
    constructor(props) {
      super(props);
      this.handleChange = this.handleChange.bind(this);
      this.toolDidUpdate = this.toolDidUpdate.bind(this);

      this.state = {
        broken: false,
        error: null,
        info: null
      };
    }

    componentWillMount() {
      // TODO: load this right away
      const {appLanguage} = this.props;
      // TRICKY: if an api exists the locale will be loaded there.
      if (hasLocale && !hasApi) {
        store.dispatch(loadLocalization(localeDir, appLanguage));
      }
      this.unsubscribe = store.subscribe(this.handleChange);
      if (hasApi) {
        // Subscribe to the bare API's update trigger
        this.unsubscribeApi = controlledApi._api.subscribe(this.toolDidUpdate);
      }
    }

    componentWillUnmount() {
      this.unsubscribe();
      if (this.unsubscribeApi) {
        this.unsubscribeApi();
      }
    }

    /**
     * This is executed by the Tool Api in order to trigger re-rendering.
     * You could also override this to provide your own logic.
     */
    toolDidUpdate() {
      this.forceUpdate();
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
      // TODO: this is an anti-pattern. see https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html
      // stay in sync with the application language
      if (hasLocale && nextProps.appLanguage !== this.props.appLanguage) {
        store.dispatch(setActiveLocale(nextProps.appLanguage));
      }
    }

    render() {
      const {broken, error, info} = this.state;
      if (broken) {
        return (
          <BrokenScreen title="ERROR"
                        error={error}
                        info={info}/>
        );
      } else if (!isLocaleLoaded()) {
        // TODO: we could display a loading screen while the tool loads
        return null;
      } else {
        const toolProps = makeToolProps(this.props, namespace, store.getState(),
          hasLocale);
        const componentProps = {
          ...this.props, // TODO: this is deprecated
          toolApi: controlledApi, // TODO: this is deprecated
          ...toolProps,
          tool: {
            ...toolProps.tool,
            api: controlledApi
          }
        };

        return (
          <Provider store={store}>
            <WrappedComponent
              {...componentProps}
            />
          </Provider>
        );
      }
    }
  }

  Tool.propTypes = {
    appLanguage: PropTypes.string.isRequired,
    writeProjectData: PropTypes.func.isRequired,
    readProjectData: PropTypes.func.isRequired,
    readProjectDataSync: PropTypes.func.isRequired,
    deleteProjectFile: PropTypes.func.isRequired,
    projectDataPathExists: PropTypes.func.isRequired,
    projectDataPathExistsSync: PropTypes.func.isRequired
  };

  return Tool;
};
