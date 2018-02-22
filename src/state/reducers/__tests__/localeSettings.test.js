import reducer from '../localeSettings';
import * as types from '../../actions/types';

it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
        loaded: false
    });
});

it('should handle LOCALE_LOADED', () => {
    expect(
        reducer({}, {
            type: types.LOCALE_LOADED
        })
    ).toEqual({
        loaded: true
    });
});