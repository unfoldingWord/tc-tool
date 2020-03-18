import { createStore, applyMiddleware, combineReducers } from 'redux';
import promise from 'redux-promise';
import thunk from 'redux-thunk';
import internalReducer from './reducers/index';
import { createLogger } from 'redux-logger';
import { enableBatching } from 'redux-batched-actions';

// TRICKY: this is to limit nesting in logging to prevent crashing console.log()
const maxStateLevel = 6; // maximum depth for state logging
const showFullDepth = false; // set this to true to display deep objects as JSON strings rather than ellipsis (warning this will run more slowly)
const stateTransformer = (state, level = maxStateLevel) => {
  if (level <= 0) {
    return showFullDepth ? JSON.stringify(state) : "…"; // at this point replace with string to protect console.log() from objects too deep
  }

  let newState = {};

  if (typeof state === "object" && state !== null && Object.keys(state).length) {
    for (const i of Object.keys(state)) {
      newState[i] = stateTransformer(state[i], level - 1);
    }
  } else {
    newState = state;
  }

  return newState;
};

/**
 * Returns a configured store object.
 *
 * @param {*} [reducer] - The tool's reducer
 * @param {[]} [middlewares] - an array of middleware to include
 * @return {Store<any>}
 */
export const configureStore = (reducer=null, middlewares=[]) => {
  const mw = [...middlewares, thunk, promise];
  
  if (process.env.NODE_ENV === 'development') {
    mw.push(createLogger(
      {
        diff: false,
        logErrors: false, // disable catch and rethrow of errors in redux-logger
        stateTransformer,
        actionTransformer: stateTransformer,
      }
    ));
  }

  const reducers = combineReducers({
    internal:internalReducer,
    tool:reducer
  });

  return createStore(
    enableBatching(reducers),
    undefined,
    applyMiddleware(...mw)
  );
};
