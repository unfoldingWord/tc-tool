import * as types from '../actions/types';

const loading = (state=false, action) => {
  switch(action.type) {
    case types.TOOL_LOADING:
      return true;
    case types.TOOL_READY:
      return false;
    default:
      return state;
  }
};

export default loading;

export const getIsLoading = state => state;
