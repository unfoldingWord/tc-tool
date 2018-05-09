import * as types from './types';

/**
 * Changes the tool's status to loading
 * @type {{type: string}}
 */
export const setToolLoading = ({
  type: types.TOOL_LOADING
});

/**
 * Changes the tool's status to ready
 * @type {{type: string}}
 */
export const setToolReady = ({
  type: types.TOOL_READY
});
