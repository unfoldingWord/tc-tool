import Lifecycle from './Lifecycle';
import throttle from 'lodash/throttle';
import * as names from './lifecycleNames';
import {loadLocalization} from '../state/actions/locale';
import {setToolLoading, setToolReady} from '../state/actions/loading';
import {makeToolProps} from '../connectTool/makeProps';

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
 * Binds lifecycle methods to a {@link ToolApi}
 */
export default class ApiController extends Lifecycle {

  /**
   * Creates a new api lifecycle instance.
   * @param {ToolApi} api - An instance of the tool api
   * @param {*} store - the tool's redux store
   * @param {string} [localeDir] - the directory where locale will be loaded
   */
  constructor(api, store, localeDir = undefined) {
    super(api);
    this._store = store;
    this._api = api;
    this._localeDir = localeDir;
    this._hasLocale = Boolean(localeDir);
    this._api.context = {
      store
    };
    this._prevState = undefined;
    this._prevStateThrottled = undefined;

    this.handleStoreChangeThrottled = this.handleStoreChangeThrottled.bind(
      this);
    this.handleStoreChange = this.handleStoreChange.bind(this);
    this.triggerWillConnect = this.triggerWillConnect.bind(this);
    this.triggerWillDisconnect = this.triggerWillDisconnect.bind(this);
    this.triggerDidCatch = this.triggerDidCatch.bind(this);
    this.triggerBlocking = this.triggerBlocking.bind(this);
    this.triggerWillReceiveProps = this.triggerWillReceiveProps.bind(this);
    this.name = this.name.bind(this);
    this._preprocessProps = this._preprocessProps.bind(this);
    this._preprocessConnect = this._preprocessConnect.bind(this);
    this._triggerMapToProps = this._triggerMapToProps.bind(this);
  }

  /**
   * Returns the name of the tool
   * @return {string}
   */
  name() {
    return this._api.toString();
  }

  /**
   * Subscribes to the API's store
   * @param {object} observer - Any object that can be used as an observer. The observer object should have a next method
   * @return {*}
   */
  subscribe(observer) {
    return this._store.subscribe(observer);
  }

  /**
   * Structures the props and injects new ones
   * @param props - props received from tc that will be processed
   * @return {[]} - an array of processed arguments
   * @private
   */
  _preprocessProps(props) {
    const state = this._store.getState();
    const toolProps = makeToolProps(props, this._api.toString(), state, this._hasLocale);
    return {
      ...toolProps,
      setToolReady: wrapFunc(this._store.dispatch, setToolReady), // TODO: deprecated
      setToolLoading: wrapFunc(this._store.dispatch, setToolLoading), // TODO: deprecated
      tool: {
        ...toolProps.tool,
        setToolReady: wrapFunc(this._store.dispatch, setToolReady),
        setToolLoading: wrapFunc(this._store.dispatch, setToolLoading)
      }
    };
  }

  /**
   * Initialize locale
   * @param props - props received from tc
   * @private
   */
  _preprocessConnect(props) {
    const {appLanguage} = props;
    if (this._hasLocale) {
      this._store.dispatch(loadLocalization(this._localeDir, appLanguage));
    }
  }

  /**
   * Passes an error to the api so it can handle it.
   * @param e
   */
  triggerDidCatch(e) {
    const method = names.DID_CATCH;
    if (!this.methodExists(method)) {
      console.error('Caught tool API lifecycle error.\n',
        `You should consider adding the lifecycle method "${method}" to "${this.name()}" so you can handle these errors yourself.\n`,
        e);
    } else {
      // pass error handling to api
      try {
        this.trigger(method, e);
      } catch (innerError) {
        console.error('Caught tool API lifecycle error.\n',
          `You shouldn't throw errors in "${method}"!\n`, innerError);
      }
    }
  }

  /**
   * Requests extra props from the api
   * @param {*} props - the new props from tc that will be mapped against
   * @private
   * @return {*} - the mapped props
   */
  _triggerMapToProps(props) {
    const processedProps = this._preprocessProps(props);

    let dispatchProps = this.trigger(names.MAP_DISPATCH_TO_PROPS,
      this._store.dispatch, processedProps);
    let stateProps = this.trigger(names.MAP_STATE_TO_PROPS,
      this._store.getState(), processedProps);

    if (!dispatchProps) {
      dispatchProps = {};
    }
    if (!stateProps) {
      stateProps = {};
    }

    return {
      ...processedProps,
      ...dispatchProps,
      ...stateProps
    };
  }

  /**
   * Attaches props to the api.
   * After the lifecycle method is executed the previous api props
   * will be replaced with the new ones.
   * @param {*} props
   */
  triggerWillReceiveProps(props) {
    const newProps = this._triggerMapToProps(props);
    const result = this.trigger(names.WILL_RECEIVE_PROPS, newProps);
    this._api.props = newProps;
    return result;
  }

  /**
   * A throttled form of {@link handleStoreChange}.
   * This is useful if you want to perform heavy operations such as writing
   * to the disk without thrashing your computer.
   */
  handleStoreChangeThrottled() {
    const nextState = this._store.getState();
    this.triggerBlocking(names.STATE_CHANGE_THROTTLED, (e) => {
      this._prevStateThrottled = nextState;
      if (e) {
        this.triggerDidCatch(e);
      }
    }, nextState, this._prevStateThrottled);
  }

  /**
   * handles changes to the store and passing the previous and next state to
   * the lifecycle method.
   */
  handleStoreChange() {
    const nextState = this._store.getState();
    this.triggerBlocking(names.STATE_CHANGED, (e) => {
      this._prevState = nextState;
      if (e) {
        this.triggerDidCatch(e);
      }
    }, nextState, this._prevState);
  }

  /**
   * Convenience method for triggering the connect lifecycle.
   * This also subscribes to the store.
   * @param {*} props - props that will be attached to the tool before it connects
   */
  triggerWillConnect(props) {
    this._preprocessConnect(props);
    this._api.props = this._triggerMapToProps(props);

    this.unsubscribe = this._store.subscribe(this.handleStoreChange);
    this.unsubscribeThrottled = this._store.subscribe(
      throttle(() => {
        return this.handleStoreChangeThrottled();
      }, 1000, {leading: false, trailing: true}));

    return this.trigger(names.WILL_CONNECT);
  }

  /**
   * Convenience method for triggering the disconnect lifecycle.
   * This also un-subscribes the store.
   */
  triggerWillDisconnect() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.unsubscribeThrottled) {
      this.unsubscribeThrottled();
    }
    return this.trigger(names.WILL_DISCONNECT);
  }
}
