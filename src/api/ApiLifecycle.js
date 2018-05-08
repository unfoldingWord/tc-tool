import Lifecycle from './Lifecycle';
import debounce from 'lodash/debounce';

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
    this.prevState = undefined;
    this.prevStateThrottled = undefined;

    this.handleStoreChangeThrottled = this.handleStoreChangeThrottled.bind(
      this);
    this.handleStoreChange = this.handleStoreChange.bind(this);
    this.triggerWillConnect = this.triggerWillConnect.bind(this);
    this.triggerWillDisconnect = this.triggerWillDisconnect.bind(this);
    this.triggerDidCatch = this.triggerDidCatch.bind(this);
    this.triggerBlocking = this.triggerBlocking.bind(this);
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
    this.triggerBlocking('stateChangeThrottled', (e) => {
      this.prevStateThrottled = nextState;
      if (e) {
        this.triggerDidCatch(e);
      }
    }, nextState, this.prevStateThrottled);
  }

  /**
   * handles changes to the store and passing the previous and next state to
   * the lifecycle method.
   */
  handleStoreChange() {
    const nextState = this.store.getState();
    this.triggerBlocking('stateChanged', (e) => {
      this.prevState = nextState;
      if (e) {
        this.triggerDidCatch(e);
      }
    }, nextState, this.prevState);
  }

  /**
   * Convenience method for triggering the connect lifecycle.
   * This also subscribes to the store.
   */
  triggerWillConnect() {
    this.unsubscribe = this.store.subscribe(this.handleStoreChange);
    // TRICKY: wait one second before calling, but no more than 5 seconds.
    this.unsubscribeSync = this.store.subscribe(
      debounce(() => {
        return this.handleStoreChangeThrottled();
      }, 1000, 5000));
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
