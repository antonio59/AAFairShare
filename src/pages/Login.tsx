import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/auth';
import ConnectionStatus from '@/components/auth/ConnectionStatus';
import LoginForm from '@/components/auth/LoginForm';
import LoadingState from '@/components/auth/LoadingState';

const Login = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    authChecked,
    connectionStatus,
    errorMessage,
    handleLogin
  } = useAuth();

  // Show loading state while checking auth
  if (!authChecked || connectionStatus === 'checking') {
    return <LoadingState />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">AAFairShare</h1>
          <p className="text-gray-600">Track and split expenses fairly</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your credentials to access the application</CardDescription>
            <div className="mt-2">
              <ConnectionStatus 
                connectionStatus={connectionStatus}
                errorMessage={errorMessage}
              />
            </div>
          </CardHeader>
          <CardContent>
            <LoginForm 
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isLoading={isLoading}
              connectionStatus={connectionStatus}
              handleSubmit={handleLogin}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
