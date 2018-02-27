import { createStore, applyMiddleware, combineReducers } from 'redux';
import promise from 'redux-promise';
import thunk from 'redux-thunk';
import internalReducer from './reducers/index';
import { createLogger } from 'redux-logger';

/**
 * Returns a configured store object.
 *
 * @param {*} [reducer] - The tool's reducer
 * @return {Store<any>}
 */
export const configureStore = (reducer=null) => {
  const middlewares = [thunk, promise];
  if (process.env.NODE_ENV !== 'production') {
    middlewares.push(createLogger());
  }

  // optionally inject tool reducer
  let reducers = null;
  if(typeof reducer === 'function') {
    reducers = combineReducers({
      internal:internalReducer,
      tool:reducer
    });
  } else {
    reducers = internalReducer;
  }

  return createStore(
    reducers,
    undefined,
    applyMiddleware(...middlewares)
  );
};