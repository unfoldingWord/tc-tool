import { createStore, applyMiddleware, combineReducers } from 'redux';
import promise from 'redux-promise';
import thunk from 'redux-thunk';
import internalReducer from './reducers/index';
import { enableBatching } from 'redux-batched-actions';
import { configureReduxLogger } from './configureReduxLogger';

/**
 * Returns a configured store object.
 *
 * @param {*} [reducer] - The tool's reducer
 * @param {[]} [middlewares] - an array of middleware to include
 * @param {string} namespace
 * @param {object} reduxLoggerConfig - custom configuration for logger
 * @return {Store<any>}
 */
export const configureStore = (reducer=null, middlewares=[], namespace, reduxLoggerConfig = null) => {
  const mw = [...middlewares, thunk, promise];
  
  if (process.env.NODE_ENV === 'development') {
    mw.push(configureReduxLogger.createReduxLogger(reduxLoggerConfig, namespace));
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
