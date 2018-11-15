import { createSelector } from 'reselect';
import { conformsTo, isNil } from 'lodash';
import { createAction } from 'redux-actions';
import { delay } from 'redux-saga';
import { call, put } from 'redux-saga/effects';

import { NOT_REQUESTED, LOADING, SUCCESS, FAILURE } from '@constants/enums';

import api from './api';

//////////////
// REDUCERS //
//////////////

const mapperFactory = (entity, shape, mapper = (d) => d) => (data) => {
  if (!conformsTo(data, shape)) {
    if (__DEV__) {
      console.error(`Received ${entity} is not conform to expected shape`, {
        expected: JSON.stringify(shape, null, 2),
        received: JSON.stringify(data, null, 2),
      });
    }
    return null;
  }

  return mapper(data);
};

const makeFailedState = (state) => ({
  ...state,
  status: FAILURE,
  error: { messageKey: 'INTERNAL_ERROR' },
});

const normalize = (data) => data.reduce((acc, cur) => (cur ? { ...acc, [cur.id]: cur } : acc), {});

// OBJECT
export const objectInitialState = {
  status: NOT_REQUESTED,
  error: null,
  data: {},
};

export const objectReducersFactory = (entity, shape, mapper) => ({
  // GET DATA REQUEST
  [`${entity}/REQUEST`]: (state) => ({
    ...state,
    status: LOADING,
    error: null,
  }),

  // GET DATA SUCCESS
  [`${entity}/SUCCESS`]: (state, action) => {
    const data = mapperFactory(entity, shape, mapper)(action.payload);

    return data
      ? {
          ...state,
          status: SUCCESS,
          data,
        }
      : makeFailedState(state);
  },

  // FAILURE
  [`${entity}/FAILURE`]: (state, action) => ({
    ...state,
    status: FAILURE,
    user: {},
    error: action.payload.error,
  }),
});

// LISTS
export const listInitialState = {
  status: NOT_REQUESTED,
  error: null,
  entities: {},
  all: [],
  total: 0,
};

export const listReducersFactory = (entity, shape, mapper) => ({
  // REQUEST
  [`${entity}/REQUEST`]: (state) => ({
    ...state,
    status: LOADING,
    error: null,
  }),

  // FAILURE
  [`${entity}/FAILURE`]: (state, action) => {
    const { error = {} } = action.payload || {};
    const { messageKey = '', message = '' } = error;

    return {
      ...state,
      status: FAILURE,
      error: { messageKey, message },
    };
  },

  // INSERT
  [`${entity}/INSERT`]: (state, action) => {
    const { payload, paging } = action.payload || {};

    if (!Array.isArray(payload)) {
      if (__DEV__) console.error(`${entity} INSERTION failed: Received data is not an array`);
      return makeFailedState(state);
    }

    const data = payload
      .map((d) => mapperFactory(entity, shape, mapper)(d))
      .filter((d) => d !== null);

    const receivedEntities = normalize(data);
    const entities = { ...state.entities, ...receivedEntities };
    const all = [...state.all, ...payload.filter((d) => !!receivedEntities[d.id]).map((d) => d.id)];

    return {
      ...state,
      status: SUCCESS,
      entities,
      all,
      total: paging ? paging.total : all.length,
    };
  },

  // UPDATE
  [`${entity}/UPDATE`]: (state, action) => {
    const data = mapperFactory(entity, shape, mapper)(action.payload);

    return data
      ? {
          ...state,
          entities: {
            ...state.entities,
            [data.id]: { ...state.entities[data.id], ...data },
          },
          status: SUCCESS,
        }
      : makeFailedState(state);
  },

  // DELETE
  [`${entity}/DELETE`]: (state, action) => {
    const { id } = action.payload || {};

    if (isNil(id)) {
      if (__DEV__) console.error(`${entity} DELETION failed: entity id is ${id}`);
      return makeFailedState(state);
    }

    const entities = Object.keys(state.entities).reduce(
      (acc, key) => (key === id ? acc : { ...acc, [key]: state.entities[key] }),
      {}
    );
    const all = state.all.filter((a) => a !== id);

    return {
      ...state,
      entities,
      all,
      status: SUCCESS,
    };
  },
});

/////////////
// ACTIONS //
/////////////

const makeCreateAction = (entity, type) => createAction(`${entity}/${type}`);

export const makeActionCreators = (entity) => ({
  insertEntity: makeCreateAction(entity, 'INSERT'),
  updateEntity: makeCreateAction(entity, 'UPDATE'),
  deleteEntity: makeCreateAction(entity, 'DELETE'),
  request: makeCreateAction(entity, 'REQUEST'),
  success: makeCreateAction(entity, 'SUCCESS'),
  failure: makeCreateAction(entity, 'FAILURE'),
});

//////////////
// API CALL //
//////////////

export function* get(apiParams, entity, type = 'list') {
  const { request, insertEntity, success, failure } = makeActionCreators(entity);

  yield put(request());
  yield delay(1000); // @TODO TO REMOVE - FOR TEST ONLY
  const response = yield call(api, { ...apiParams });
  const { ok, payload, paging, messageKey, message } = response;

  if (ok) {
    const successAction = type === 'list' ? insertEntity : success;
    yield put(successAction({ payload, paging }));
  } else {
    yield put(failure({ error: { messageKey, message } }));
  }
}

///////////////
// SELECTORS //
///////////////

export const selectorsFactory = (entity, substate) => {
  const selectEntity = (state) => {
    const s = substate ? state[substate] || {} : state;
    return s[entity] || {};
  };

  const selectStatus = () => createSelector(selectEntity, (e) => e.status || NOT_REQUESTED);

  const selectError = () => createSelector(selectEntity, (e) => e.error || {});

  const selectData = () => createSelector(selectEntity, (e) => e.data || {});

  const selectById = (id) => createSelector(selectEntity, (e) => (e.entities || {})[id] || null);

  const selectAll = () =>
    createSelector(selectEntity, (e) => (e.all || []).map((id) => (e.entities || {})[id]));

  const selectTotal = () => createSelector(selectEntity, (e) => e.total);

  const globalListSelector = () =>
    createSelector(
      [selectStatus(), selectError(), selectAll(), selectTotal()],
      (status, error, entities, total) => ({
        status,
        error,
        entities,
        total,
      })
    );

  return { selectStatus, selectError, selectData, selectById, selectAll, globalListSelector };
};
