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

test('without locale', () => {
    const ConnectedComponent = connectTool('testId')(TestComponent);
    const wrapper = mount(
        <ConnectedComponent currentToolViews={{}}
                            resourcesReducer={{}}
                            contextIdReducer={{}}
                            appLanguage="en_US"/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().appLanguage).toEqual('en_US');
    expect(component.props().translate).not.toBeDefined();
});

test('with locale', () => {
    const ConnectedComponent = connectTool('testId', localeDir)(TestComponent);
    const wrapper = mount(
        <ConnectedComponent currentToolViews={{}}
                            resourcesReducer={{}}
                            contextIdReducer={{}}
                            appLanguage="en_US"/>
    );
    const component = wrapper.find('TestComponent');
    expect(component.props().appLanguage).toEqual('en_US');
    expect(component.props().translate).toBeDefined();
});