import ApiController, {wrapFunc} from '../ApiController';
import configureMockStore from 'redux-mock-store';
import {translate as mockTranslate} from 'react-localize-redux';

const middlewares = [];
const mockStore = configureMockStore(middlewares);

describe('wrap func', () => {
  it('wraps a function with another function', () => {
    const parent = arg => `${arg} world`;
    const child = message => message;
    const wrapped = wrapFunc(parent, child);
    expect(wrapped('hello')).toEqual('hello world');
  });
});

describe('Lifecycle', () => {
  let store;
  let obj;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      internal: {
        locale: {}
      }
    });
    obj = {
      hello: () => 'world',
      toolWillConnect: () => 'connected',
      toolWillDisconnect: () => 'disconnected',
      mapStateToProps: jest.fn(),
      mapDispatchToProps: jest.fn(),
      stateChanged: jest.fn(),
      stateChangeThrottled: jest.fn(),
      toolWillReceiveProps: jest.fn()
    };
    obj.stateChanged.mockReset();
    obj.stateChangeThrottled.mockReset();
  });

  it('executes an existing method', () => {
    const wrappedObj = new ApiController(obj, store);
    expect(wrappedObj.trigger('hello')).toEqual('world');
  });

  it('executes receive props lifecycle with mapped state to props', () => {
    obj.mapStateToProps = () => {
      return {
        hello: 'world'
      };
    };
    const wrappedObj = new ApiController(obj, store);
    const props = {foo: 'bar'};
    wrappedObj.triggerWillReceiveProps(props);
    expect(Object.keys(obj.props.tool)).toEqual([
      'toolDataPathExists',
      'toolDataPathExistsSync',
      'deleteToolFile',
      'readToolData',
      'readToolDataSync',
      'writeToolData',
      'isReady',
      'setToolReady',
      'setToolLoading'
    ]);
    delete obj.props.tool; // TRICKY: these are dynamic so we delete before asserting structure
    expect(obj.props).toEqual({
      tc: {foo: 'bar'},
      hello: 'world',

      toolIsReady: true
    });
  });

  it('executes receive props lifecycle', () => {
    const wrappedObj = new ApiController(obj, store);
    const props = {foo: 'bar'};
    wrappedObj.triggerWillReceiveProps(props);
    expect(Object.keys(obj.props.tool)).toEqual([
      'toolDataPathExists',
      'toolDataPathExistsSync',
      'deleteToolFile',
      'readToolData',
      'readToolDataSync',
      'writeToolData',
      'isReady',
      'setToolReady',
      'setToolLoading'
    ]);
    delete obj.props.tool; // TRICKY: these are dynamic so we delete before asserting structure
    expect(obj.props).toEqual({
      tc: {foo: 'bar'},
      toolIsReady: true
    });
    expect(obj.mapStateToProps).toBeCalled();
    expect(obj.mapDispatchToProps).toBeCalled();
    expect(obj.toolWillReceiveProps).toBeCalled();
  });

  it('pre-processes props to receive props lifecycle', () => {
    const wrappedObj = new ApiController(obj, store, 'some/dir');
    const props = {foo: 'bar'};
    wrappedObj.triggerWillReceiveProps(props);
    expect(Object.keys(obj.props.tool)).toEqual([
      'translate',
      'currentLanguage',
      'toolDataPathExists',
      'toolDataPathExistsSync',
      'deleteToolFile',
      'readToolData',
      'readToolDataSync',
      'writeToolData',
      'isReady',
      'setToolReady',
      'setToolLoading'
    ]);
    delete obj.props.tool; // TRICKY: these are dynamic so we delete before asserting structure
    expect(obj.props).toEqual({
      currentLanguage: 'en_US',
      translate: mockTranslate, // TRICKY: pulled from the mock
      tc: {foo: 'bar'},
      // TRICKY: these are generated every time so we validate them above
      setToolLoading: obj.props.setToolLoading,
      setToolReady: obj.props.setToolReady,
      toolIsReady: true
    });
  });

  it('executes the connect lifecycle', () => {
    const wrappedObj = new ApiController(obj, store);
    const props = {
      appLanguage: 'en_US',
      hello: 'world'
    };
    expect(wrappedObj.triggerWillConnect(props)).toEqual('connected');
    expect(Object.keys(obj.props.tool)).toEqual([
      'toolDataPathExists',
      'toolDataPathExistsSync',
      'deleteToolFile',
      'readToolData',
      'readToolDataSync',
      'writeToolData',
      'isReady',
      'setToolReady',
      'setToolLoading'
    ]);
    delete obj.props.tool; // TRICKY: these are dynamic so we delete before asserting structure
    expect(obj.props).toEqual({
      tc: {
        appLanguage: 'en_US',
        hello: 'world'
      },
      toolIsReady: true
    });
  });

  it('executes the disconnect lifecycle', () => {
    const wrappedObj = new ApiController(obj, store);
    expect(wrappedObj.triggerWillDisconnect()).toEqual('disconnected');
  });

  it('subscribes to the store when connecting', () => {
    const wrappedObj = new ApiController(obj, store);
    const props = {
      appLanguage: 'en_US'
    };
    wrappedObj.triggerWillConnect(props);
    expect(obj.stateChanged).not.toBeCalled();
    store.dispatch({type: 'ANY_ACTION'});
    expect(obj.stateChanged.mock.calls.length).toBe(1);

    // un-subscribes
    wrappedObj.triggerWillDisconnect();
    store.dispatch({type: 'ANY_ACTION'});
    expect(obj.stateChanged.mock.calls.length).toBe(1);
  });

  it('triggers throttled state changed', () => {
    const wrappedObj = new ApiController(obj, store);
    const props = {
      appLanguage: 'en_US'
    };
    wrappedObj.triggerWillConnect(props);
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
