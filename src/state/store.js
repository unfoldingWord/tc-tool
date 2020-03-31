import { createStore, applyMiddleware, combineReducers } from 'redux';
import promise from 'redux-promise';
import thunk from 'redux-thunk';
import internalReducer from './reducers/index';
import { createLogger } from 'redux-logger';
import { enableBatching } from 'redux-batched-actions';
import configureReduxLogger from './configureReduxLogger';

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
    mw.push(createLogger(configureReduxLogger.reduxLoggerConfig));
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
