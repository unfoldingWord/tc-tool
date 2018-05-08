import Lifecycle from './Lifecycle';

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
    this.handleStoreChange = this.handleStoreChange.bind(this);
    this.triggerWillConnect = this.triggerWillConnect.bind(this);
    this.triggerWillDisconnect = this.triggerWillDisconnect.bind(this);
  }

  handleStoreChange() {
    const nextState = this.store.getState();
    this.trigger('stateChanged', nextState, this.prevState);
    this.prevState = nextState;
  }

  /**
   * Convenience method for triggering the connect lifecycle.
   * This also subscribes to the store.
   */
  triggerWillConnect() {
    this.unsubscribe = this.store.subscribe(this.handleStoreChange);
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
    return this.trigger('toolWillDisconnect');
  }
}
