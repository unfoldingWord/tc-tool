import ApiLifecycle from '../ApiLifecycle';
import configureMockStore from 'redux-mock-store';

const middlewares = [];
const mockStore = configureMockStore(middlewares);

describe('Lifecycle', () => {
  let store;
  let obj = {
    hello: () => 'world',
    toolWillConnect: () => 'connected',
    toolWillDisconnect: () => 'disconnected',
    stateChanged: jest.fn()
  };

  beforeEach(() => {
    store = mockStore({});
    obj.stateChanged.mockReset();
  });

  it('executes an existing method', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    expect(wrappedObj.trigger('hello')).toEqual('world');
  });

  it('executes the connect lifecycle', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    expect(wrappedObj.triggerWillConnect()).toEqual('connected');
  });

  it('executes the disconnect lifecycle', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    expect(wrappedObj.triggerWillDisconnect()).toEqual('disconnected');
  });

  it('subscribes to the store when connecting', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    wrappedObj.triggerWillConnect();
    expect(obj.stateChanged).not.toBeCalled();
    store.dispatch({ type: 'ANY_ACTION'});
    expect(obj.stateChanged.mock.calls.length).toBe(1);

    // un-subscribes
    wrappedObj.triggerWillDisconnect();
    store.dispatch({ type: 'ANY_ACTION'});
    expect(obj.stateChanged.mock.calls.length).toBe(1);
  });
});
