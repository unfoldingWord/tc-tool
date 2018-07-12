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
 * @param api - the tool's api
 * @return {Tool}
 */
export const makeTool = (
  WrappedComponent, namespace, store, localeDir = undefined,
  api = undefined) => {
  const hasLocale = Boolean(localeDir);
  const hasApi = Boolean(api);

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
          toolApi: api, // TODO: this is deprecated
          ...toolProps,
          tool: {
            ...toolProps.tool,
            api
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
    deleteProjectFile: PropTypes.func.isRequired,
    readProjectDataSync: PropTypes.func.isRequired,
    projectDataPathExistsSync: PropTypes.func.isRequired,
    projectDataPathExists: PropTypes.func.isRequired
  };

  return Tool;
};
