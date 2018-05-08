/**
 * Adds lifecycle methods to a target object.
 */
export default class Lifecycle {
  constructor(target) {
    this.target = target;
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
}
