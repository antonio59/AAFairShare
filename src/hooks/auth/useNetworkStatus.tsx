
import { useState, useEffect } from 'react';
import { isOnline } from '@/integrations/pocketbase/client';

export const useNetworkStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const setupNetworkListeners = () => {
    // Set initial status
    setConnectionStatus(isOnline() ? 'online' : 'offline');
    
    // Add network status listeners
    const handleOnline = () => {
      setConnectionStatus('online');
    };
    
    const handleOffline = () => {
      setConnectionStatus('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };
  
  return {
    connectionStatus,
    setupNetworkListeners
  };
};
