import { useEffect, useState } from 'react';
import { useError } from '../context/ErrorContext';

const ADMIN_STATUS_URL = 'https://leaderboard-website-api.vercel.app/api/admin/status';

const useAdminAuthorization = (user) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useError();

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
        const response = await fetch(ADMIN_STATUS_URL, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        updateAuthorizationState(response.ok);
      } catch (error) {
        showError(error.message || 'Could not verify admin access.');
        updateAuthorizationState(false);
      }
    };

    checkAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [showError, user?.isAdmin, user?.token]);

  return { isAuthorized, isLoading };
};

export default useAdminAuthorization;

