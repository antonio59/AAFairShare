
import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cleanupAuthState } from '@/integrations/pocketbase/client';

interface LoadingStateProps {
  onReset?: () => void;
}

const LoadingState: React.FC<LoadingStateProps> = ({ onReset }) => {
  const handleReset = () => {
    cleanupAuthState();
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-gray-700 font-medium text-lg">Checking authentication...</p>
        <p className="text-gray-500 text-sm max-w-xs text-center">
          This should only take a few seconds. If it's taking too long, you can try resetting.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={handleReset}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset Authentication
        </Button>
      </div>
    </div>
  );
};

export default LoadingState;
