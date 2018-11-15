/**
 * Create the store with dynamic reducers
 */

import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';

import authSaga from '../services/auth/saga';
import userReducer from '../services/user/reducer';

/**
 * Creates the main reducer with the dynamically injected ones
 */
export const createReducer = (injectedReducers = {}) =>
  combineReducers({
    // Add global reducers here:
    // global: globalReducer,
    // language: languageReducer,
    user: userReducer,
    ...injectedReducers,
  });

const composeEnhancers = (enhancers) => {
  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  if (__DEV__) {
    /* eslint-disable import/no-extraneous-dependencies */
    const { composeWithDevTools } = require('remote-redux-devtools');
    /* eslint-enable */
    return composeWithDevTools({ realtime: true })(enhancers);
  }
  return compose(enhancers);
};

const sagaMiddleware = createSagaMiddleware();

export default function configureStore(initialState = {}) {
  // Create the store with middlewares
  // 1. sagaMiddleware: Makes redux-sagas work
  const middlewares = [sagaMiddleware];

  const enhancers = [applyMiddleware(...middlewares)];

  const store = createStore(createReducer(), initialState, composeEnhancers(...enhancers));

  // Run global sagas:
  // sagaMiddleware.run(mySaga)
  sagaMiddleware.run(authSaga);

  // Extensions
  store.runSaga = sagaMiddleware.run;
  store.injectedReducers = {}; // Reducer registry
  store.injectedSagas = {}; // Saga registry

  return store;
}
