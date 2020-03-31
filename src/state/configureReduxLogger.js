// TRICKY: Configuration of redux-logger to eliminate crashes react devTools console and minimize memory consumption.
//  Tweak to find a balance - if object depth goes over 5, the react devTools console will crash (and the app with it).
//  - by stringify-ing the deeper parts of the object we prevent crashing, but increase memory usage and slow down redux-logger.
//  - by replacing with depthLimitString the deeper parts of the object we prevent crashing, but reduce memory usage and do
//      not slow down redux-logger. But lose debugging detail.

const LIMIT_STRINGIFY = { depth: 4, stringify: true }; // configuration to limit nesting to this depth, anything deeper is stringified
const LIMIT_NO_STRINGIFY = { depth: 4, stringify: false }; // configuration to limit nesting to this depth, anything deeper is replaced with depthLimitString
const LIMIT_NONE = { noLimit: true }; // configuration to not limit nesting for reducer
const SKIP_LOGGING = { skip: true }; // configuration to not log a reducer

let config = { // set up default configuration

  // Add limits for specific reducers - the reducers here are both large and deeply nested
  // and will crash the react devTools console if not limited.
  limitReducers: { },
  
  // default setting for reducers not specified in limitReducers, set this to SKIP_LOGGING to skip logging of any reducer not in limitReducers
  defaultLimit: LIMIT_NONE,

  // string to log when depth limit is reached and we don't want to stringify
  depthLimitString: '…',

  // settings for action transformer
  actionDepth: 3,
  actionStringify: false,
};

// default parameter values for stateTransformer methods
const maxStateDepth = 5; // default maximum depth for state logging
const showFullDepth = true; // set this to true to display deep objects as JSON strings rather than depthLimitString (warning this will run more slowly and consume more memory)

/**
 * recursive method to limit depth of state nesting.  Returns new state.
 * @param {object} state - state object to limit depth on
 * @param {number} depth - remaining depth to limit object nesting
 * @param {boolean} stringify - if true, then stringify when we hit maximum depth, otherwise replace with depthLimitString
 * @return {string|{}} - new limited state
 */
const stateTransformerRecursive = (state, depth = maxStateDepth, stringify = showFullDepth) => {
  if (depth <= 0) { // we have reached maximum depth - no more recursion
    try {
      return stringify ? JSON.stringify(state) : config.depthLimitString; // either stringify at this depth, otherwise replace with limit string
    } catch (e) {
      return `stateTransformerRecursive() - Crash converting to JSON: ${e.toString()}`;
    }
  }

  let newState = {};
  let keys = (typeof state === 'object' && state !== null && Object.keys(state)) || [];

  if (keys.length) {
    for (let i = 0, l = keys.length; i < l; i++) { // modify each element of of state
      const key = keys[i];
      newState[key] = stateTransformerRecursive(state[key], depth - 1, stringify);
    }
  } else {
    newState = state; // not an object, so don't modify
  }

  return newState;
};

/**
 * base method to limit depth of state nesting.  Supports special handling for each reducer
 * @param {object} state - state object to limit depth on
 * @return {string|{}} - new limited state
 */
const stateTransformer = (state) => {
  let newState = {};
  if (typeof state !== 'object' || !state || !state.tool) { // if no tool state leave unmodified
    return state;
  }
  
  const toolState = state.tool;
  const keys = (typeof toolState === 'object' && toolState !== null && Object.keys(toolState)) || [];

  if (keys.length) { // if reducers found
    for (let i = 0, l = keys.length; i < l; i++) {
      const key = keys[i];
      const hasConfiguration = (config.limitReducers && config.limitReducers.hasOwnProperty(key)); // if there is a specific configuration for this reducer
      const reduxLimit = hasConfiguration ? config.limitReducers[key] : config.defaultLimit; // if no specific configuration us default

      if (reduxLimit.skip) {
        newState[key] = '<Logging Skipped>';
      } else {
        if (reduxLimit.noLimit) {
          newState[key] = toolState[key]; // copy unlimited object
        } else {
          const reduxDepth = reduxLimit.depth;

          if (reduxDepth) {
            newState[key] = stateTransformerRecursive(toolState[key], reduxDepth, reduxLimit.stringify);
          } else {
            newState[key] = config.depthLimitString; // if no depth setting, then stop here
          }
        }
      }
    }
  } else {
    newState = toolState;
  }

  return {
    ...state,
    tool: newState,
  };
};

const reduxLoggerConfig = {
  diff: false,
  logErrors: false, // disable catch and rethrow of errors in redux-logger
  stateTransformer,
  actionTransformer: (state) => (stateTransformerRecursive(state, config.actionDepth, config.actionStringify)),
};

/**
 * apply new configuration for redux-logger
 * @param newConfig
 */
export function setConfiguration(newConfig) {
  config = {
    ...config, // apply defaults
    ...newConfig, // append new settings
  };
  console.log(`setConfiguration - new config ${JSON.stringify(config)}`);
}

const configureReduxLogger = {
  reduxLoggerConfig,
  
  // constants
  LIMIT_STRINGIFY,
  LIMIT_NO_STRINGIFY,
  LIMIT_NONE,
  SKIP_LOGGING
};

exports.default = configureReduxLogger;
