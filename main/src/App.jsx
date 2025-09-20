import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { isLoading, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        <Home />
      </div>
    </ErrorBoundary>
  );
}

export default App;