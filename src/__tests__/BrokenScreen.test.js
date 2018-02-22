import React from 'react';
import renderer from 'react-test-renderer';
import BrokenScreen from '../BrokenScreen';

test('snapshot', () => {
    const info = { componentStack: `in WordBankItem
    in DragSource(WordBankItem)
    in div
    in WordBankArea` };
    const error = "Error: Some error message";
    const wrapper = renderer.create(
        <BrokenScreen title="title" info={info} error={error}/>
    );
    expect(wrapper).toMatchSnapshot();
});