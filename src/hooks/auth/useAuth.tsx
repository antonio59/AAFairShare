import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '@/components/ui/use-toast';
import { useAuthState } from './useAuthState';
import { useNetworkStatus } from './useNetworkStatus';
import { useAuthActions } from './useAuthActions';

export const useAuth = () => {
  const navigate = useNavigate();
  
  // Authentication state management
  const { 
    email, setEmail,
    password, setPassword,
    isLoading, setIsLoading,
    authChecked, setAuthChecked,
    errorMessage, setErrorMessage,
  } = useAuthState();
  
  // Network status monitoring
  const { 
    connectionStatus, 
    setupNetworkListeners,
  } = useNetworkStatus();
  
  // Authentication actions
  const {
    checkSession,
    handleLogin,
  } = useAuthActions({
    email,
    password,
    setIsLoading,
    setErrorMessage,
    setAuthChecked,
  });
  
  // Check session and set up network listeners on mount
  useEffect(() => {
    const cleanup = setupNetworkListeners();
    checkSession(navigate);
    return cleanup;
  }, [navigate, checkSession, setupNetworkListeners]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    authChecked,
    connectionStatus,
    errorMessage,
    handleLogin
  };
};

export default useAuth;
