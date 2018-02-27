import { createStore, applyMiddleware } from 'redux';
import promise from 'redux-promise';
import thunk from 'redux-thunk';
import toolReducer from './reducers/index';
import { createLogger } from 'redux-logger';

/**
 * Returns a configured store object.
 *
 * @return {Store<any>}
 */
export const configureStore = () => {
  const middlewares = [thunk, promise];
  if (process.env.NODE_ENV !== 'production') {
    middlewares.push(createLogger());
  }

  return createStore(
    toolReducer,
    undefined,
    applyMiddleware(...middlewares)
  );
};