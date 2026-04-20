import { useMemo } from 'react';
import { useError } from '../context/ErrorContext';
import { createApi } from '../api';

const useApi = () => {
  const { showError } = useError();

  return useMemo(() => createApi(showError), [showError]);
};

export default useApi;

