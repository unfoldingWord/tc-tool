import Lifecycle from './Lifecycle';
import debounce from 'lodash/debounce';

/**
 * Checks if an object is a promise
 * @param {*} obj
 * @return {boolean}
 */
const isPromise = (obj) => {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function';
};

/**
 * Lifecycle methods for the tool api
 */
export default class ApiLifecycle extends Lifecycle {

  /**
   * Creates a new api lifecycle instance.
   * @param {ToolApi} api - An instance of the tool api
   * @param {*} store - the tool's redux store
   */
  constructor(api, store) {
    super(api);
    this.store = store;
    this.blocks = {};
    this.prevState = undefined;
    this.prevStateThrottled = undefined;

    this.handleStoreChangeThrottled = this.handleStoreChangeThrottled.bind(this);
    this.handleStoreChange = this.handleStoreChange.bind(this);
    this.triggerWillConnect = this.triggerWillConnect.bind(this);
    this.triggerWillDisconnect = this.triggerWillDisconnect.bind(this);
    this.triggerDidCatch = this.triggerDidCatch.bind(this);
    this.triggerBlocking = this.triggerBlocking.bind(this);
  }

  /**
   * Blocks a lifecycle method from being executed until it is unblocked.
   * @param key
   */
  blockMethod(key) {
    this.blocks[key] = true;
  }

  /**
   * Unblocks a lifecycle method.
   * @param key
   */
  unblockMethod(key) {
    this.blocks[key] = false;
  }

  /**
   * Checks if a lifecycle method is currently blocked
   * @param key
   * @return {boolean|*}
   */
  isMethodBlocked(key) {
    return key in this.blocks && this.blocks[key];
  }

  /**
   * Passes an error to the api so it can handle it.
   * @param e
   */
  triggerDidCatch(e) {
    this.trigger('toolDidCatch', e);
  }

  /**
   * A throttled form of {@link handleStoreChange}.
   * This is useful if you want to perform heavy operations such as writing
   * to the disk without thrashing your computer.
   */
  handleStoreChangeThrottled() {
    const nextState = this.store.getState();
    this.triggerBlocking('stateChangeThrottled', () => {
      this.prevStateThrottled = nextState;
    }, nextState, this.prevStateThrottled);
  }

  /**
   * handles changes to the store and passing the previous and next state to
   * the lifecycle method.
   */
  handleStoreChange() {
    const nextState = this.store.getState();
    this.triggerBlocking('stateChanged', () => {
      this.prevState = nextState;
    }, nextState, this.prevState);
  }

  /**
   * Triggers a lifecycle method that blocks subsequent calls until it resolves.
   * This works with or without promises
   * @param {string} method - the name of the lifecycle method to trigger
   * @param {func} cleanup - callback to perform cleanup operations
   * @param {*} params - optional method arguments.
   */
  triggerBlocking(method, cleanup, ...params) {
    if (this.isMethodBlocked(method)) {
      return;
    }

    this.blockMethod(method);
    let response = null;
    try {
      response = this.trigger(method, ...params);
      if (isPromise(response)) {
        // wait for promise to resolve
        response.then(() => {
          cleanup();
          this.unblockMethod(method);
        }).catch(e => {
          cleanup();
          this.unblockMethod(method);
          this.triggerDidCatch(e);
        });
      } else {
        cleanup();
        this.unblockMethod(method);
      }
    } catch (e) {
      cleanup();
      this.unblockMethod(method);
      this.triggerDidCatch(e);
    }
  }

  /**
   * Convenience method for triggering the connect lifecycle.
   * This also subscribes to the store.
   */
  triggerWillConnect() {
    this.unsubscribe = this.store.subscribe(this.handleStoreChange);
    // TRICKY: wait one second before calling, but no more than 5 seconds.
    this.unsubscribeSync = this.store.subscribe(
      debounce(() => this.handleStoreChangeThrottled, 1000, {maxWait: 5000}));
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
