import React from 'react';
import connectTool from '../connectTool';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import path from 'path';

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
    expect(wrapper.props().appLanguage).toEqual('en_US'); 
    expect(wrapper.props().translate).not.toBeDefined();
});

test('with locale', () => {
    const ConnectedComponent = connectTool('testId', localeDir)(TestComponent);
    const wrapper = mount(
        <ConnectedComponent currentToolViews={{}}
                            resourcesReducer={{}}
                            contextIdReducer={{}}
                            appLanguage="en_US"/>
    );
    expect(wrapper.props().appLanguage).toEqual('en_US');
    // TODO: this test will not work because our HOC os asynchronous.
    // https://github.com/facebook/create-react-app/issues/3482
    // expect(wrapper.props().translate).toBeDefined();
});