import Lifecycle from '../Lifecycle';

describe('Lifecycle', () => {
  let wrappedObj;
  let resolver;

  beforeEach(() =>{
    wrappedObj = new Lifecycle({
      toString: () => 'wrappedObject',
      hello: () => 'world',
      withArgs: message => message,
      blockingScalar: spy => {
        spy();
        return 1;
      },
      blocking: (spy) => {
        spy();
        return new Promise(resolve => {
          resolver = resolve;
        });
      },
      blockingVoid: spy => {
        spy();
      }
    });
  });

  it('executes an existing method', () => {
    expect(wrappedObj.trigger('hello')).toEqual('world');
  });

  it('executes a missing method', () => {
    expect(wrappedObj.trigger('missing')).toEqual(undefined);
  });

  it('passes arguments to a method', () => {
    expect(wrappedObj.trigger('withArgs', 'Hello world!')).toEqual('Hello world!');
  });

  it('rejects calling the constructor', () => {
    expect(() => wrappedObj.trigger('constructor')).toThrowError('Cannot execute constructor');
  });

  it('rejects calling a private method', () => {
    expect(() => wrappedObj.trigger('_privateMethod')).toThrowError('Lifecycle Error: Cannot execute private method "_privateMethod".');
  });

  it('asserts a method exists', () => {
    expect(() => wrappedObj.assertExists('hello')).not.toThrow();
  });

  it('asserts a missing method exists', () => {
    expect(() => wrappedObj.assertExists('missingMethod')).toThrowError('Lifecycle Error: The method "missingMethod" is required but is not defined in "wrappedObject".');
  });

  it('blocks a method that returns a promise', () => {
    const spy = jest.fn();
    const callback = jest.fn();
    wrappedObj.triggerBlocking('blocking', callback, spy);
    expect(spy).toBeCalled();

    // trigger while blocked
    const spy2 = jest.fn();
    wrappedObj.triggerBlocking('blocking', jest.fn(), spy2);
    expect(spy2).not.toBeCalled();

    // resolve
    resolver();
    setTimeout(() => {
      // TRICKY: give the callback a moment to finish resolving.
      expect(callback).toBeCalled();
    }, 0);

    // trigger newly un-blocked method
    const spy3 = jest.fn();
    wrappedObj.triggerBlocking('blocking', jest.fn(), spy3);
    expect(spy3).not.toBeCalled();
  });

  it('blocks a method that returns a scalar', () => {
    const spy = jest.fn();
    const callback = jest.fn();
    wrappedObj.triggerBlocking('blockingScalar', callback, spy);
    expect(spy).toBeCalled();
    expect(callback).toBeCalled();

    // trigger another to ensure not blocked
    const spy2 = jest.fn();
    wrappedObj.triggerBlocking('blockingScalar', jest.fn(), spy2);
    expect(spy2).toBeCalled();
  });

  it('blocks a method that returns nothing', () => {
    const spy = jest.fn();
    const callback = jest.fn();
    wrappedObj.triggerBlocking('blockingVoid', callback, spy);
    expect(spy).toBeCalled();
    expect(callback).toBeCalled();

    // trigger another to ensure not blocked
    const spy2 = jest.fn();
    wrappedObj.triggerBlocking('blockingVoid', jest.fn(), spy2);
    expect(spy2).toBeCalled();
  });
});
