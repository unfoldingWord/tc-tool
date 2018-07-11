import {makeLocaleProps} from './index';
import React from 'react';
import {createProvider} from 'react-redux';
import PropTypes from 'prop-types';
import BrokenScreen from '../BrokenScreen';
import {getLocaleLoaded, isToolLoading} from '../state/reducers';
import {loadLocalization, setActiveLocale} from '../state/actions/locale';
import path from 'path-extra';

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

  // checks if the api has finished loading
  const isApiReady = () => {
    return !isToolLoading(store.getState());
  };

  /**
   * Transforms a file path to be nested within the tool's namespace folder.
   * @param {string} filePath - the relative file path
   * @return {*}
   */
  const namespaceFilePath = (filePath) => {
    return path.join(namespace, filePath);
  };

  // TRICKY: this will overwrite the default store context key
  // thus removing direct access to tC core's store which also uses the default key.
  const Provider = createProvider();

  class Tool extends React.Component {
    constructor(props) {
      super(props);
      this.makeToolProps = this.makeToolProps.bind(this);
      this.onWriteToolData = this.onWriteToolData.bind(this);
      this.onReadToolData = this.onReadToolData.bind(this);
      this.onReadToolDataSync = this.onReadToolDataSync.bind(this);
      this.onDeleteToolFile = this.onDeleteToolFile.bind(this);
      this.onToolDataPathExistsSync = this.onToolDataPathExistsSync.bind(this);
      this.onToolDataPathExists = this.onToolDataPathExists.bind(this);
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

    /**
     * Handles writing data to the tool's data path
     * @param {string} filePath - the relative path to be written
     * @param {string} data - the data to write
     * @return {Promise}
     */
    onWriteToolData(filePath, data) {
      const {
        writeProjectData
      } = this.props;
      return writeProjectData(namespaceFilePath(filePath), data);
    }

    /**
     * Handles reading tool data
     * @param {string} filePath - the relative path to read
     * @return {Promise<string>}
     */
    onReadToolData(filePath) {
      const {
        readProjectData
      } = this.props;
      return readProjectData(namespaceFilePath(filePath));
    }

    /**
     * Handles reading tool data synchronously
     * @param {string} filePath - the relative path to read
     * @return {string}
     */
    onReadToolDataSync(filePath) {
      const {
        readProjectDataSync
      } = this.props;
      return readProjectDataSync(namespaceFilePath(filePath));
    }

    /**
     * Handles deleting tool data files
     * @param {string} filePath - the relative path to delete
     * @return {Promise}
     */
    onDeleteToolFile(filePath) {
      const {
        deleteProjectFile
      } = this.props;
      return deleteProjectFile(namespaceFilePath(filePath));
    }

    /**
     * Handles synchronously checking if the tool data path exists.
     * @param {string} filePath - the relative path who's existence will be checked
     * @return {boolean}
     */
    onToolDataPathExistsSync(filePath) {
      const {
        projectDataPathExistsSync
      } = this.props;
      return projectDataPathExistsSync(namespaceFilePath(filePath));
    }

    /**
     * Handles checking if the tool data path exists.
     * @param {string} filePath - the relative path who's existence will be checked.
     * @return {Promise<boolean>}
     */
    onToolDataPathExists(filePath) {
      const {
        projectDataPathExists
      } = this.props;
      return projectDataPathExists(namespaceFilePath(filePath));
    }

    /**
     * Builds the tool api props.
     * @return {{api: undefined, isReady: *}}
     */
    makeToolProps() {
      const localeProps = hasLocale ? makeLocaleProps(store.getState()) : {};
      return {
        ...localeProps,
        toolDataPathExists: this.onToolDataPathExists,
        toolDataPathExistsSync: this.onToolDataPathExistsSync,
        deleteToolFile: this.onDeleteToolFile,
        readToolData: this.onReadToolData,
        readToolDataSync: this.onReadToolDataSync,
        writeToolData: this.onWriteToolData,
        api,
        isReady: isApiReady()
      };
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
        const localeProps = hasLocale ? makeLocaleProps(store.getState()) : {};
        return (
          <Provider store={store}>
            <WrappedComponent
              {...this.props}
              {...localeProps}
              toolApi={api}
              toolIsReady={isApiReady()}
              // TODO: all of the above props are deprecated

              tool={this.makeToolProps()}
              tc={this.props}
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
