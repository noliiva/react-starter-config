import { useState, useEffect } from 'react';

import callApi, { GET, NOT_REQUESTED, LOADING, SUCCESS, FAILURE } from '../api';

const useApi = (endpoint, config) => {
  const { method = GET, noAuth, headers, responseIsNotAnArray, params: initialParams } =
    config || {};

  const [state, setState] = useState({
    status: NOT_REQUESTED,
    data: responseIsNotAnArray ? {} : [],
    paging: {},
    error: null,
  });
  const [params, setParams] = useState(initialParams || {});

  useEffect(() => {
    let didCancel = false;

    (async () => {
      setState({ ...state, status: LOADING });

      await callApi({
        endpoint,
        headers,
        method,
        params,
        noAuth,
      }).then((response) => {
        if (!didCancel) {
          const { ok, data, message } = response;

          if (ok) {
            setState({
              ...state,
              status: SUCCESS,
              data: responseIsNotAnArray ? data : data.results,
              paging: responseIsNotAnArray ? null : { total: data.count },
            });
          } else {
            setState({
              ...state,
              status: FAILURE,
              error: message || 'Error',
            });
          }
        }
      });
    })();

    return () => {
      didCancel = true;
    };
  }, [params]);

  return [state, setParams];
};

export default useApi;
