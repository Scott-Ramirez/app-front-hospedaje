// src/presentation/context/ErrorContext.tsx
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react'; 

export interface GlobalErrorDetail {
  message: string;
  type: 'network' | 'server' | 'auth';
}

interface ErrorContextType {
  globalError: GlobalErrorDetail | null;
  setGlobalError: (error: GlobalErrorDetail | null) => void;
  clearGlobalError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [globalError, setGlobalError] = useState<GlobalErrorDetail | null>(null);

  const clearGlobalError = () => setGlobalError(null);

  return (
    <ErrorContext.Provider value={{ globalError, setGlobalError, clearGlobalError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useGlobalError = () => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error('useGlobalError debe usarse dentro de un ErrorProvider');
  return context;
};