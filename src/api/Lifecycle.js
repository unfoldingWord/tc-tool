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
 * Adds lifecycle methods to a target object.
 */
export default class Lifecycle {
  constructor(target) {
    this._target = target;
    this._blocks = {};
  }

  /**
   * Throws an exception
   * @param {string} message - the error message
   * @private
   */
  static _throw(message) {
    throw new Error(`Lifecycle Error: ${message}`);
  }

  /**
   * Blocks a lifecycle method from being executed until it is unblocked.
   * @param key
   */
  blockMethod(key) {
    this._blocks[key] = true;
  }

  /**
   * Unblocks a lifecycle method so it can be executed again.
   * @param key
   */
  unblockMethod(key) {
    this._blocks[key] = false;
  }

  /**
   * Checks if a lifecycle method is currently blocked from executing.
   * @param key
   * @return {boolean|*}
   */
  isMethodBlocked(key) {
    return key in this._blocks && this._blocks[key];
  }

  /**
   * Triggers a lifecycle method
   * @param {string} method - the name of the lifecycle method to trigger
   * @param {*} [args] - optional method arguments.
   */
  trigger(method, ...args) {
    if (method === 'constructor') {
      Lifecycle._throw('Cannot execute constructors.');
    }

    if (method.startsWith('_')) {
      Lifecycle._throw(`Cannot execute private method "${method}".`);
    }

    if (this.methodExists(method)) {
      const callable = this._target[method].bind(this._target);
      return callable(...args);
    }
    return undefined;
  }

  /**
   * Asserts the existence of a lifecycle method.
   * @param {string} method - the name of the lifecycle method.
   * @throws an error if the lifecycle method does not exist.
   */
  assertExists(method) {
    if(!this.methodExists(method)) {
      Lifecycle._throw(`The method "${method}" is required but is not defined in "${this._target}".`);
    }
  }

  /**
   * Checks if the lifecycle method exists
   * @param method
   * @return {boolean}
   */
  methodExists(method) {
    return typeof this._target[method] === 'function';
  }

  /**
   * Triggers a lifecycle method that blocks subsequent calls until it resolves.
   * This works with or without promises
   * @param {string} method - the name of the lifecycle method to trigger
   * @param {func} [callback] - callback to perform cleanup operations. Errors will be passed as arguments.
   * @param {*} [args] - optional method arguments.
   */
  triggerBlocking(method, callback=undefined, ...args) {
    if (this.isMethodBlocked(method)) {
      return;
    }

    this.blockMethod(method);
    let response = null;
    try {
      response = this.trigger(method, ...args);
      if (isPromise(response)) {
        // wait for promise to resolve
        response.then(() => {
          if (callback) {
            callback();
          }
          this.unblockMethod(method);
        }).catch(e => {
          if (callback) {
            callback(e);
          }
          this.unblockMethod(method);
        });
      } else {
        if (callback) {
          callback();
        }
        this.unblockMethod(method);
      }
    } catch (e) {
      if (callback) {
        callback(e);
      }
      this.unblockMethod(method);
    }
  }
}
