import {makeLocaleProps} from './index';
import React from 'react';
import {createProvider} from 'react-redux';
import PropTypes from 'prop-types';
import BrokenScreen from '../BrokenScreen';
import {getLocaleLoaded, isToolLoading} from '../state/reducers';
import {loadLocalization, setActiveLocale} from '../state/actions/locale';

export const makeTool = (
  WrappedComponent, store, localeDir = undefined, api = undefined) => {
  const hasLocale = Boolean(localeDir);
  const hasApi = Boolean(api);

  // TRICKY: this will overwrite the default store context key
  // thus removing direct access to tC core's store which also uses the default key.
  const Provider = createProvider();

  class Tool extends React.Component {
    constructor(props) {
      super(props);
      this.isToolLoaded = this.isToolLoaded.bind(this);
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

    /**
     * Checks if the locale has finished loading
     * @return {bool}
     * @private
     */
    isToolLoaded() {
      const state = store.getState();
      const toolIsLoaded = !isToolLoading(state);
      const localeIsLoaded = !hasLocale || getLocaleLoaded(state);
      return toolIsLoaded || localeIsLoaded;
    }

    render() {
      const {broken, error, info} = this.state;
      if (broken) {
        return (
          <BrokenScreen title="ERROR"
                        error={error}
                        info={info}/>
        );
      } else if (!this.isToolLoaded()) {
        // TODO: we could display a loading screen while the tool loads
        return null;
      } else {
        const localeProps = hasLocale ? makeLocaleProps(store.getState()) : {};
        // TODO: rather than building the api prop hierarchy in tC we should pass flat props
        // then here and in the api we can scope them to `tc`,
        return (
          <Provider store={store}>
            <WrappedComponent
              tc={this.props}
              {...this.props} // TRICKY: this is for backwards compatibility until all tools are updated.
              {...localeProps}
              toolApi={api}
            />
          </Provider>
        );
      }
    }
  }

  Tool.propTypes = {
    currentToolViews: PropTypes.object.isRequired,
    resourcesReducer: PropTypes.object.isRequired,
    contextIdReducer: PropTypes.object.isRequired,
    appLanguage: PropTypes.string.isRequired
  };

  return Tool;
};
