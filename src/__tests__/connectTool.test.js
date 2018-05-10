jest.unmock('react-localize-redux');
jest.mock('../state/actions/locale');
import React from 'react';
import connectTool, {wrapFunc} from '../connectTool';
import {configure, mount} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import path from 'path';
import renderer from 'react-test-renderer';


class TestComponent extends React.Component {
  render() {
    return (
      <div>
        Hello World!
      </div>
    );
  }
}

class BrokenComponent extends React.Component {
  render() {
    throw Error('Something broke!');
  }
}

const localeDir = path.join(__dirname, './locale');

describe('wrap func', () => {
  it('wraps a function with another function', () => {
    const parent = arg => `${arg} world`;
    const child = message => message;
    const wrapped = wrapFunc(parent, child);
    expect(wrapped('hello')).toEqual('hello world');
  });
});

describe('props', () => {
  beforeAll(() => {
    configure({adapter: new Adapter()});
  });

  test('no params', () => {
    expect(connectTool.bind(null, 'my tool')).not.toThrow();
  });

  test('invalid localeDir param', () => {
    expect(connectTool.bind(null, 'tool', {localeDir: 1})).
      toThrow(
        'Invalid parameter. Expected localeDir to be a string but found number instead');
  });

  test('missing locale dir', () => {
    const ConnectedComponent = connectTool('tool', {})(TestComponent);
    const wrapper = mount(
      <ConnectedComponent.container currentToolViews={{}}
                                    resourcesReducer={{}}
                                    contextIdReducer={{}}
                                    appLanguage="en_US"/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().appLanguage).toEqual('en_US');
    expect(component.props().currentLanguage).not.toBeDefined();
    expect(component.props().translate).not.toBeDefined();
  });

  test('with locale', () => {
    const ConnectedComponent = connectTool('tool', {localeDir})(TestComponent);
    const wrapper = mount(
      <ConnectedComponent.container currentToolViews={{}}
                                    resourcesReducer={{}}
                                    contextIdReducer={{}}
                                    appLanguage="de_DE"/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().appLanguage).toEqual('de_DE');
    expect(component.props().currentLanguage).toEqual('de_DE');
    expect(component.props().translate).toBeDefined();
  });

  test('missing app language', () => {
    const ConnectedComponent = connectTool('tool', {localeDir})(TestComponent);
    const wrapper = mount(
      <ConnectedComponent.container currentToolViews={{}}
                                    resourcesReducer={{}}
                                    contextIdReducer={{}}/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().appLanguage).not.toBeDefined();
    expect(component.props().currentLanguage).toEqual('en_US');
    // a warning will be displayed in the console, otherwise the default locale will be selected
    expect(component.props().translate).toBeDefined();
  });
});

describe('snapshots', () => {

  it('renders the wrapped component', () => {
    const ConnectedComponent = connectTool('tool', {localeDir})(TestComponent);
    const wrapper = renderer.create(
      <ConnectedComponent.container currentToolViews={{}}
                                    resourcesReducer={{}}
                                    contextIdReducer={{}}
                                    appLanguage="de_DE"/>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('renders the error screen', () => {
    const ConnectedComponent = connectTool('tool', {localeDir})(
      BrokenComponent);
    const wrapper = renderer.create(
      <ConnectedComponent.container currentToolViews={{}}
                                    resourcesReducer={{}}
                                    contextIdReducer={{}}
                                    appLanguage="de_DE"/>
    );
    expect(wrapper).toMatchSnapshot();
  });

});
