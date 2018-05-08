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
    this.target = target;
    this.blocks = {};
  }

  /**
   * Blocks a lifecycle method from being executed until it is unblocked.
   * @param key
   */
  blockMethod(key) {
    this.blocks[key] = true;
  }

  /**
   * Unblocks a lifecycle method so it can be executed again.
   * @param key
   */
  unblockMethod(key) {
    this.blocks[key] = false;
  }

  /**
   * Checks if a lifecycle method is currently blocked from executing.
   * @param key
   * @return {boolean|*}
   */
  isMethodBlocked(key) {
    return key in this.blocks && this.blocks[key];
  }

  /**
   * Triggers a lifecycle method
   * @param method
   * @param props
   */
  trigger(method, ...props) {
    if (method.startsWith('_') || method === 'constructor') {
      // TRICKY: restrict private methods and constructors
      throw new Error('Invalid lifecycle method. Must be a public method.');
    }

    if (typeof this.target[method] === 'function') {
      const callable = this.target[method].bind(this.target);
      return callable(...props);
    }
    return undefined;
  }

  /**
   * Triggers a lifecycle method that blocks subsequent calls until it resolves.
   * This works with or without promises
   * @param {string} method - the name of the lifecycle method to trigger
   * @param {func} [callback] - callback to perform cleanup operations. Errors will be passed as arguments.
   * @param {*} [params] - optional method arguments.
   */
  triggerBlocking(method, callback=undefined, ...params) {
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
