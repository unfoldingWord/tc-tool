jest.unmock('react-localize-redux');
jest.mock('../../state/actions/locale');
import React from 'react';
import connectTool from '../../connectTool';
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
    global.console = { warn: jest.fn(), info: jest.fn() };
    const ConnectedComponent = connectTool('tool', {})(TestComponent);
    const wrapper = mount(
      <ConnectedComponent.container writeProjectData={jest.fn()}
                                    readProjectData={jest.fn()}
                                    readProjectDataSync={jest.fn()}
                                    deleteProjectFile={jest.fn()}
                                    projectDataPathExists={jest.fn()}
                                    projectDataPathExistsSync={jest.fn()}
                                    appLanguage="en_US"/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().tc.appLanguage).toEqual('en_US');
    expect(component.props().currentLanguage).not.toBeDefined();
    expect(component.props().translate).not.toBeDefined();
    expect(console.warn).toBeCalled();
  });

  test('with locale', () => {
    global.console = { info: jest.fn() };
    const ConnectedComponent = connectTool('tool', {localeDir})(TestComponent);
    const wrapper = mount(
      <ConnectedComponent.container writeProjectData={jest.fn()}
                                    readProjectData={jest.fn()}
                                    readProjectDataSync={jest.fn()}
                                    deleteProjectFile={jest.fn()}
                                    projectDataPathExists={jest.fn()}
                                    projectDataPathExistsSync={jest.fn()}
                                    appLanguage="de_DE"/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().tc.appLanguage).toEqual('de_DE');
    expect(component.props().currentLanguage).toEqual('de_DE');
    expect(component.props().translate).toBeDefined();
  });

  test('missing app language', () => {
    global.console = { error: jest.fn(), info: jest.fn() };
    const ConnectedComponent = connectTool('tool', {localeDir})(TestComponent);
    const wrapper = mount(
      <ConnectedComponent.container writeProjectData={jest.fn()}
                                    readProjectData={jest.fn()}
                                    readProjectDataSync={jest.fn()}
                                    deleteProjectFile={jest.fn()}
                                    projectDataPathExists={jest.fn()}
                                    projectDataPathExistsSync={jest.fn()}/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().appLanguage).not.toBeDefined();
    expect(component.props().currentLanguage).toEqual('en_US');
    expect(component.props().translate).toBeDefined();
    expect(console.error).toBeCalled();
  });
});

describe('snapshots', () => {

  function onError(e) {
    e.preventDefault();
  }

  beforeEach(() => {
    window.addEventListener('error', onError);
  });

  afterEach(() => {
    window.removeEventListener('error', onError);
  });

  it('renders the wrapped component', () => {
    const ConnectedComponent = connectTool('tool', {localeDir})(TestComponent);
    const wrapper = renderer.create(
      <ConnectedComponent.container writeProjectData={jest.fn()}
                                    readProjectData={jest.fn()}
                                    readProjectDataSync={jest.fn()}
                                    deleteProjectFile={jest.fn()}
                                    projectDataPathExists={jest.fn()}
                                    projectDataPathExistsSync={jest.fn()}
                                    appLanguage="de_DE"/>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
