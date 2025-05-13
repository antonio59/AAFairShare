import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-8">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Go to Homepage</Link>
      </Button>
    </div>
  );
};

export default NotFound;
