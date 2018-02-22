import { createStore, applyMiddleware } from 'redux';
import promise from 'redux-promise';
import thunk from 'redux-thunk';
import toolReducer from './reducers/index';
import {connect} from 'react-redux';
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

/**
 * Creates a custom react-redux connection HOC that binds to a particular store key.
 * This allows us to connect to tool redux store instead of the default one.
 *
 * @param {string} key - the store key
 * @return {function(*=, *=, *=, *=)}
 */
export const createConnect = (key) => {
  return (
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    options = {}
  ) => {
    options.storeKey = key;
    return connect(
      mapStateToProps,
      mapDispatchToProps,
      mergeProps,
      options
    );
  };
};
