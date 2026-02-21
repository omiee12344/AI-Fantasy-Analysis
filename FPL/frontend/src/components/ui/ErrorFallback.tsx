import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-gray-600">
          We encountered an unexpected error. This might be due to a temporary issue with our services.
        </p>
        
        <Alert variant="destructive" className="text-left">
          <AlertDescription className="text-sm">
            <strong>Error:</strong> {error.message}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <Button onClick={resetError} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Refresh Page
          </Button>
        </div>
        
        <p className="text-xs text-gray-500">
          If the problem persists, please try signing out and signing back in.
        </p>
      </div>
    </div>
  );
};
