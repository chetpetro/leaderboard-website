/* eslint-disable import/no-unused-modules */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';

      return () => {
        window.history.scrollRestoration = previous;
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search, location.hash]);

  return null;
}

export default ScrollToTop;

