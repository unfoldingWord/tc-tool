import Lifecycle from './Lifecycle';
import throttle from 'lodash/throttle';
import * as names from './lifecycleNames';

/**
 * Lifecycle methods for the tool api
 */
export default class ApiLifecycle extends Lifecycle {

  /**
   * Creates a new api lifecycle instance.
   * @param {ToolApi} api - An instance of the tool api
   * @param {*} store - the tool's redux store
   * @param {func} [preprocessor] - optional callback to pre-process lifecycle method calls
   */
  constructor(api, store, preprocessor = undefined) {
    super(api);
    this._store = store;
    this._api = api;
    this._preprocessor = preprocessor;
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
  }

  /**
   * Returns the name of the tool
   * @return {string}
   */
  name() {
    return this._api.toString();
  }

  /**
   * Pre-process lifecycle method arguments
   * @param method
   * @param args
   * @return {[]} - an array of processed arguments
   * @private
   */
  _preprocess(method, ...args) {
    if (this._preprocessor) {
      return this._preprocessor(method, ...args);
    }
    return args;
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
   * @private
   * @return {*} - the mapped props
   */
  _triggerMapToProps() {
    let dispatchProps = this.trigger(names.MAP_DISPATCH_TO_PROPS,
      this._store.dispatch);
    let stateProps = this.trigger(names.MAP_STATE_TO_PROPS,
      this._store.getState());

    if (!dispatchProps) {
      dispatchProps = {};
    }
    if (!stateProps) {
      stateProps = {};
    }

    return {
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
    const args = this._preprocess(names.WILL_RECEIVE_PROPS, props);
    const processedProps = args.pop();
    const mappedProps = this._triggerMapToProps();
    const newProps = {
      ...processedProps,
      ...mappedProps
    };
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
    this._api.props = props;

    this.unsubscribe = this._store.subscribe(this.handleStoreChange);
    // TRICKY: wait one second before calling, but no more than 5 seconds.
    this.unsubscribeSync = this._store.subscribe(
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
    if (this.unsubscribeSync) {
      this.unsubscribeSync();
    }
    return this.trigger(names.WILL_DISCONNECT);
  }
}
