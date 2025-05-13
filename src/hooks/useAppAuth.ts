import { useContext } from 'react';
// Update import path for AuthContext and AuthContextType
import { AuthContext, AuthContextType } from '@/providers/AuthContext';

export const useAppAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AuthProvider');
  }
  return context;
};
