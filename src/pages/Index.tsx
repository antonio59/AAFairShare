import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const hasCode = searchParams.has('code');

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      if (hasCode) setSearchParams({});
      navigate('/dashboard', { replace: true });
    } else if (!hasCode) {
      navigate('/login', { replace: true });
    }
    // If we have a code but not authenticated yet, wait for auth to complete
  }, [isAuthenticated, isLoading, navigate, hasCode, setSearchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{hasCode ? 'Completing sign in...' : 'Loading...'}</p>
      </div>
    </div>
  );
};

export default Index;
