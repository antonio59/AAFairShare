import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/providers/AuthContext'; // Adjusted path

export const useAppAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AuthProvider');
  }
  return context;
};
