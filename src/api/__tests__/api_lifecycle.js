import ApiLifecycle from '../ApiLifecycle';
import configureMockStore from 'redux-mock-store';

const middlewares = [];
const mockStore = configureMockStore(middlewares);

describe('Lifecycle', () => {
  let store;
  let obj;

  beforeEach(() => {
    store = mockStore({});
    obj = {
      hello: () => 'world',
      toolWillConnect: () => 'connected',
      toolWillDisconnect: () => 'disconnected',
      stateChanged: jest.fn(),
      stateChangeThrottled: jest.fn()
    };
    obj.stateChanged.mockReset();
    obj.stateChangeThrottled.mockReset();
  });

  it('executes an existing method', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    expect(wrappedObj.trigger('hello')).toEqual('world');
  });

  it('executes receive props lifecycle', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    const props = {foo: 'bar'};
    wrappedObj.triggerWillReceiveProps(props);
    expect(obj.props).toEqual(props);
  });

  it('executes the connect lifecycle', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    const props = {hello: 'world'};
    expect(wrappedObj.triggerWillConnect(props)).toEqual('connected');
    expect(obj.props).toEqual(props);
  });

  it('executes the disconnect lifecycle', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    expect(wrappedObj.triggerWillDisconnect()).toEqual('disconnected');
  });

  it('subscribes to the store when connecting', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    wrappedObj.triggerWillConnect();
    expect(obj.stateChanged).not.toBeCalled();
    store.dispatch({type: 'ANY_ACTION'});
    expect(obj.stateChanged.mock.calls.length).toBe(1);

    // un-subscribes
    wrappedObj.triggerWillDisconnect();
    store.dispatch({type: 'ANY_ACTION'});
    expect(obj.stateChanged.mock.calls.length).toBe(1);
  });

  it('triggers throttled state changed', () => {
    const wrappedObj = new ApiLifecycle(obj, store);
    wrappedObj.triggerWillConnect();
    expect(obj.stateChangeThrottled).not.toBeCalled();
    store.dispatch({type: 'ANY_ACTION'});
    store.dispatch({type: 'ANY_ACTION'});
    store.dispatch({type: 'ANY_ACTION'});
    store.dispatch({type: 'ANY_ACTION'});

    return new Promise(resolve => {
      setTimeout(() => {
        // TRICKY: give it some time to resolve.
        expect(obj.stateChangeThrottled.mock.calls.length).toBe(1);
        resolve();
      }, 1000);
    }).then(() => {
      store.dispatch({type: 'ANY_ACTION'});
      store.dispatch({type: 'ANY_ACTION'});
      store.dispatch({type: 'ANY_ACTION'});
      return new Promise(resolve => {
        setTimeout(() => {
          // TRICKY: give it some time to resolve.
          expect(obj.stateChangeThrottled.mock.calls.length).toBe(2);
          resolve();
        }, 1000);
      });
    });
  });
});
