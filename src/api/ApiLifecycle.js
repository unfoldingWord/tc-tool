import Lifecycle from './Lifecycle';
import throttle from 'lodash/throttle';

/**
 * Lifecycle methods for the tool api
 */
export default class ApiLifecycle extends Lifecycle {

  /**
   * Creates a new api lifecycle instance.
   * @param {ToolApi} api - An instance of the tool api
   * @param {*} store - the tool's redux store
   * @param {string} namespace - the name of the tool
   */
  constructor(api, store, namespace) {
    super(ApiLifecycle._bindToString(api, namespace));
    this._namespace = namespace;
    this._store = store;
    this._api = api;
    this._prevState = undefined;
    this._prevStateThrottled = undefined;

    this.handleStoreChangeThrottled = this.handleStoreChangeThrottled.bind(
      this);
    this.handleStoreChange = this.handleStoreChange.bind(this);
    this.triggerWillConnect = this.triggerWillConnect.bind(this);
    this.triggerWillDisconnect = this.triggerWillDisconnect.bind(this);
    this.triggerDidCatch = this.triggerDidCatch.bind(this);
    this.triggerBlocking = this.triggerBlocking.bind(this);
  }

  /**
   * Binds a value to an object's toString method.
   * @param {object} obj - the object receiving the toString method.
   * @param {*} name - value to return as toString()
   * @return {*}
   * @private
   */
  static _bindToString(obj, name) {
    obj.toString = () => name;
    return obj;
  }

  /**
   * Returns the name of the tool
   * @return {string}
   */
  name() {
    return this._namespace;
  }

  /**
   * Passes an error to the api so it can handle it.
   * @param e
   */
  triggerDidCatch(e) {
    const method = 'toolDidCatch';
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
   * Attaches props to the api.
   * After the lifecycle method is executed the previous api props
   * will be replaced with the new ones.
   * @param {*} props
   */
  triggerWillReceiveProps(props) {
    const result = this.trigger('toolWillReceiveProps', props);
    this._api.props = props;
    return result;
  }

  /**
   * A throttled form of {@link handleStoreChange}.
   * This is useful if you want to perform heavy operations such as writing
   * to the disk without thrashing your computer.
   */
  handleStoreChangeThrottled() {
    const nextState = this._store.getState();
    this.triggerBlocking('stateChangeThrottled', (e) => {
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
    this.triggerBlocking('stateChanged', (e) => {
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

    return this.trigger('toolWillConnect');
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
    return this.trigger('toolWillDisconnect');
  }
}
