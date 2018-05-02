import React from 'react';
import connectTool from '../connectTool';
import {mount, configure} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import path from 'path';
import renderer from 'react-test-renderer';

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
        expect(connectTool).not.toThrow();
    });

    test('invalid localeDir param', () => {
        expect(connectTool.bind(null, 1)).toThrow('Invalid parameter. Expected localeDir to be a string but found number instead');
    });

    test('missing locale dir', () => {
        const ConnectedComponent = connectTool()(TestComponent);
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
        const ConnectedComponent = connectTool(localeDir)(TestComponent);
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
        const ConnectedComponent = connectTool(localeDir)(TestComponent);
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
});

describe('snapshots', () => {

    it('renders the wrapped component', () => {
        const ConnectedComponent = connectTool(localeDir)(TestComponent);
        const wrapper = renderer.create(
            <ConnectedComponent currentToolViews={{}}
                                resourcesReducer={{}}
                                contextIdReducer={{}}
                                appLanguage="de_DE"/>
        );
        expect(wrapper).toMatchSnapshot();
    });

    it('renders the error screen', () => {
        const ConnectedComponent = connectTool(localeDir)(BrokenComponent);
        const wrapper = renderer.create(
            <ConnectedComponent currentToolViews={{}}
                                resourcesReducer={{}}
                                contextIdReducer={{}}
                                appLanguage="de_DE"/>
        );
        expect(wrapper).toMatchSnapshot();
    });

});
