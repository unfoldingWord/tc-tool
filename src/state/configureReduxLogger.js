import { createLogger } from 'redux-logger';

// TRICKY: Configuration of redux-logger to eliminate crashes react devTools console and minimize memory consumption.
//  Tweak to find a balance - if object depth goes over 5, the react devTools console will crash (and the app with it).
//  - by stringify-ing the deeper parts of the object we prevent crashing, but increase memory usage and slow down redux-logger.
//  - by replacing with depthLimitString the deeper parts of the object we prevent crashing, but reduce memory usage and do
//      not slow down redux-logger. But lose debugging detail.

const LIMIT_STRINGIFY = { depth: 4, stringify: true }; // configuration to limit nesting to this depth, anything deeper is stringified
const LIMIT_NO_STRINGIFY = { depth: 4, stringify: false }; // configuration to limit nesting to this depth, anything deeper is replaced with depthLimitString
const LIMIT_NONE = { noLimit: true }; // configuration to not limit nesting for reducer - it is logged unmodified
const SKIP_LOGGING = { skip: true }; // configuration to not log a reducer

const DEFAULT_CONFIG = { // set up default configuration

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

  internalState: SKIP_LOGGING,
};

class ConfigureReduxLogger {
  constructor(namespace, config) {
    this.stateTransformerRecursive = this.stateTransformerRecursive.bind(this);
    this.stateTransformer = this.stateTransformer.bind(this);
    this.setConfiguration(config);
    this.namespace = namespace;
  }

  /**
   * recursive method to limit depth of state nesting.  Returns new state.
   * @param {object} state - state object to limit depth on
   * @param {number} depth - remaining depth to limit object nesting
   * @param {boolean} stringify - if true, then stringify when we hit maximum depth, otherwise replace with depthLimitString
   * @return {string|{}} - new limited state
   */
  stateTransformerRecursive(state, depth, stringify) {
    if (depth <= 0) { // we have reached maximum depth - no more recursion
      try {
        return stringify ? JSON.stringify(state) : this.config.depthLimitString; // either stringify at this depth, otherwise replace with limit string
      } catch (e) {
        return `stateTransformerRecursive() - Crash converting to JSON: ${e.toString()}`;
      }
    }
  
    let newState = {};
    let keys = (typeof state === 'object' && state !== null && Object.keys(state)) || [];
  
    if (keys.length) {
      for (let i = 0, l = keys.length; i < l; i++) { // modify each element of of state
        const key = keys[i];
        newState[key] = this.stateTransformerRecursive(state[key], depth - 1, stringify);
      }
    } else {
      newState = state; // not an object, so don't modify
    }
  
    return newState;
  }

  /**
   * process object depth for specific key
   * @param {object} limitConfig - configuration for how to limit object depth
   * @param {object} newState - new state to populate (returned data)
   * @param {string} key
   * @param {object} state - initial state
   */
  processKey(limitConfig, newState, key, state) {
    if (limitConfig.skip) {
      newState[key] = '<Logging Skipped>';
    } else {
      if (limitConfig.noLimit) {
        newState[key] = state[key]; // copy unlimited object
      } else {
        const reduxDepth = limitConfig.depth;
  
        if (reduxDepth) {
          newState[key] = this.stateTransformerRecursive(state[key], reduxDepth, limitConfig.stringify);
        } else {
          newState[key] = this.config.depthLimitString; // if no depth setting, then stop here
        }
      }
    }
  }

  /**
   * base method to limit depth of state nesting.  Supports special handling for each reducer
   * @param {object} state - state object to limit depth on
   * @return {string|{}} - new limited state
   */
  stateTransformer(state) {
    const newState = {};
    let newToolState = {};
    if (typeof state !== 'object' || !state || !state.tool) { // if no tool state leave unmodified
      return state;
    }
    
    // process tool reducers
    const toolState = state.tool;
    const keys = (typeof toolState === 'object' && toolState !== null && Object.keys(toolState)) || [];
  
    if (keys.length) { // if reducers found
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        const hasConfiguration = (this.config.limitReducers && this.config.limitReducers.hasOwnProperty(key)); // if there is a specific configuration for this reducer
        const limitConfig = hasConfiguration ? this.config.limitReducers[key] : this.config.defaultLimit; // if no specific configuration us default
        this.processKey(limitConfig, newToolState, key, toolState);
      }
    } else {
      newToolState = toolState;
    }
    
    newState.tool = newToolState;
    
    if (state.internal) {
      const limitConfig = this.config.internalState || ConfigureReduxLogger.SKIP_LOGGING;
      this.processKey(limitConfig, newState, 'internal', state);
    }
    
    return newState;
  }

  /**
   * apply new configuration for redux-logger
   * @param {object} newConfig
   */
  setConfiguration(newConfig) {
    if (newConfig) {
      this.config = {
        ...DEFAULT_CONFIG, // apply defaults
        ...newConfig, // append new settings
      };
    } else { // no custom config, use defaults
      this.config = {
        ...DEFAULT_CONFIG, // apply defaults
      };
    }
    console.log(`setConfiguration - new config ${JSON.stringify(this.config)}`);
  }

  /**
   * creates a tool specific redux-logger configuration
   * @return {object}
   */
  getReduxLoggerConfig() {
    return {
      diff: false,
      logErrors: false, // disable catch and rethrow of errors in redux-logger
      stateTransformer: this.stateTransformer,
      actionTransformer: (state) => (this.stateTransformerRecursive(state,
        this.config.actionDepth, this.config.actionStringify)),
      namespace: this.namespace,
    };
  }
}

/**
 * creates a new redux logger and wraps it with custom configuration
 * @param {object} config
 * @param {string} namespace
 * @return {function} new redux logger
 */
const createReduxLogger = (config, namespace) => {
  const configureReduxLogger = new ConfigureReduxLogger(namespace, config);

  const reduxLoggerConfig = configureReduxLogger.getReduxLoggerConfig();
  return createLogger(reduxLoggerConfig);
};

export const configureReduxLogger = {
  createReduxLogger,

  // constants
  LIMIT_STRINGIFY,
  LIMIT_NO_STRINGIFY,
  LIMIT_NONE,
  SKIP_LOGGING
};

exports.default = configureReduxLogger;