import React from 'react';
import connectTool from '../connectTool';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import path from 'path';

jest.mock('../state/actions/locale');

class TestComponent extends React.Component {
    render() {
        return (
            <div>
                Hello World!
            </div>
        );
    }
}

const localeDir = path.join(__dirname, './locale');

beforeAll(() => {
    configure({adapter: new Adapter()});
});

test('missing locale dir', () => {
    const ConnectedComponent = connectTool('testId')(TestComponent);
    const wrapper = mount(
        <ConnectedComponent currentToolViews={{}}
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
    const ConnectedComponent = connectTool('testId', localeDir)(TestComponent);
    const wrapper = mount(
        <ConnectedComponent currentToolViews={{}}
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
    const ConnectedComponent = connectTool('testId', localeDir)(TestComponent);
    const wrapper = mount(
        <ConnectedComponent currentToolViews={{}}
                            resourcesReducer={{}}
                            contextIdReducer={{}}/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().appLanguage).not.toBeDefined();
    expect(component.props().currentLanguage).toEqual('en_US');
    // a warning will be displayed in the console, otherwise the default locale will be selected
    expect(component.props().translate).toBeDefined();
});