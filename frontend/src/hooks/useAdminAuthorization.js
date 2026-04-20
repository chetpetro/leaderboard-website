import { useEffect, useState } from 'react';
import useApi from './useApi';

const useAdminAuthorization = (user) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    let isMounted = true;

    const updateAuthorizationState = (authorized) => {
      if (!isMounted) return;
      setIsAuthorized(authorized);
      setIsLoading(false);
    };

    const checkAdminAccess = async () => {
      if (!user?.isAdmin || !user?.token) {
        updateAuthorizationState(false);
        return;
      }

      try {
        const response = await api.admin.fetchStatus(user.token);
        updateAuthorizationState(Boolean(response?.isAdmin));
      } catch (error) {
        // Errors are already shown by the API layer.
        updateAuthorizationState(false);
      }
    };

    checkAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [api, user?.isAdmin, user?.token]);

  return { isAuthorized, isLoading };
};

export default useAdminAuthorization;

