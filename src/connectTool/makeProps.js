import {makeLocaleProps} from './index';
import {isToolLoading} from '../state/reducers';
import path from 'path-extra';

/**
 * Builds the tool props
 * @param props
 * @param {string} namespace - the tool's namespace/id
 * @param state
 * @param {bool} hasLocale - indicates if the locale props should be generated
 * @return {*}
 */
export const makeToolProps = (props, namespace, state, hasLocale) => {
  const toolProps = new ToolProps(props, namespace, state, hasLocale);
  return toolProps.generate();
};

/**
 * This class defines enhancements to the props provided to the tool
 */
class ToolProps {

  /**
   *
   * @param {*} props - props receive from tC
   * @param namespace
   * @param {*} state - the redux state
   * @param {boolean} hasLocale -  indicates if locale props should be generated
   */
  constructor(props, namespace, state, hasLocale) {
    this.props = props;
    this.state = state;
    this.hasLocale = hasLocale;
    this.namespace = namespace;

    this._namespaceFilePath = this._namespaceFilePath.bind(this);

    this._onWriteToolData = this._onWriteToolData.bind(this);
    this._onReadToolData = this._onReadToolData.bind(this);
    this._onReadToolDataSync = this._onReadToolDataSync.bind(this);
    this._onDeleteToolFile = this._onDeleteToolFile.bind(this);
    this._onToolDataPathExistsSync = this._onToolDataPathExistsSync.bind(this);
    this._onToolDataPathExists = this._onToolDataPathExists.bind(this);
  }


  generate() {
    console.log('ToolProps constructor props', this.props);

    const localeProps = this.hasLocale ? makeLocaleProps(this.state) : {};
    const toolIsReady = !isToolLoading(this.state);
    return {
      ...localeProps, // TODO: deprecated
      tc: {...this.props},
      tool: {
        ...localeProps,
        toolDataPathExists: this._onToolDataPathExists,
        toolDataPathExistsSync: this._onToolDataPathExistsSync,
        deleteToolFile: this._onDeleteToolFile,
        readToolData: this._onReadToolData,
        readToolDataSync: this._onReadToolDataSync,
        writeToolData: this._onWriteToolData,
        name: this.namespace,
        isReady: toolIsReady
      }
    };
  }

  /**
   * Transforms a file path to be nested within the tool's namespace folder.
   * @param {string} filePath - the relative file path
   * @return {*}
   */
  _namespaceFilePath(filePath) {
    return path.join('tools', this.namespace, filePath);
  }

  _onWriteToolData(filePath, data) {
    const {
      writeProjectData
    } = this.props;
    return writeProjectData(this._namespaceFilePath(filePath), data);
  }

  /**
   * Handles reading tool data
   * @param {string} filePath - the relative path to read
   * @return {Promise<string>}
   */
  _onReadToolData(filePath) {
    const {
      readProjectData
    } = this.props;
    return readProjectData(this._namespaceFilePath(filePath));
  }

  /**
   * Handles reading tool data synchronously
   * @param {string} filePath - the relative path to read
   * @return {string}
   */
  _onReadToolDataSync(filePath) {
    const {
      readProjectDataSync
    } = this.props;
    return readProjectDataSync(this._namespaceFilePath(filePath));
  }

  /**
   * Handles deleting tool data files
   * @param {string} filePath - the relative path to delete
   * @return {Promise}
   */
  _onDeleteToolFile(filePath) {
    const {
      deleteProjectFile
    } = this.props;
    return deleteProjectFile(this._namespaceFilePath(filePath));
  }

  /**
   * Handles synchronously checking if the tool data path exists.
   * @param {string} filePath - the relative path who's existence will be checked
   * @return {boolean}
   */
  _onToolDataPathExistsSync(filePath) {
    const {
      projectDataPathExistsSync
    } = this.props;
    return projectDataPathExistsSync(this._namespaceFilePath(filePath));
  }

  /**
   * Handles checking if the tool data path exists.
   * @param {string} filePath - the relative path who's existence will be checked.
   * @return {Promise<boolean>}
   */
  _onToolDataPathExists(filePath) {
    const {
      projectDataPathExists
    } = this.props;
    return projectDataPathExists(this._namespaceFilePath(filePath));
  }
}
