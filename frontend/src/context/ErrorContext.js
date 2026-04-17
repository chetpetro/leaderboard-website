import { createContext, useContext, useMemo, useState } from 'react';

const ErrorContext = createContext(null);

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);

  const showError = (message) => {
    const id = `${Date.now()}-${Math.floor(Math.random()*1000)}`;
    setErrors((prev) => [...prev, { id, message }]);
    return id;
  };

  const clearError = (id) => {
      document.querySelector(`.error-message#error-id-${id}`)?.classList.add('fade-out');
      setTimeout(() => setErrors((prev) => prev.filter((error) => error.id !== id)), 1000);
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  const value = useMemo(
    () => ({ errors, showError, clearError, clearAllErrors }),
    [errors]
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

export const useError = () => {
  const context = useContext(ErrorContext);

  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }

  return context;
};

