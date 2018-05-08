import Lifecycle from '../Lifecycle';

describe('Lifecycle', () => {
  let obj = {
    hello: () => 'world',
    withArgs: message => message
  };

  it('executes an existing method', () => {
    const wrappedObj = new Lifecycle(obj);
    expect(wrappedObj.trigger('hello')).toEqual('world');
  });

  it('executes a missing method', () => {
    const wrappedObj = new Lifecycle(obj);
    expect(wrappedObj.trigger('missing')).toEqual(undefined);
  });

  it('passes arguments to a method', () => {
    const wrappedObj = new Lifecycle(obj);
    expect(wrappedObj.trigger('withArgs', 'Hello world!')).toEqual('Hello world!');
  });

  it('rejects calling the constructor', () => {
    const wrappedObj = new Lifecycle(obj);
    expect(() => wrappedObj.trigger('constructor')).toThrow();
  });

  it('rejects calling a private method', () => {
    const wrappedObj = new Lifecycle(obj);
    expect(() => wrappedObj.trigger('_privateMethod')).toThrow();
  });
});
