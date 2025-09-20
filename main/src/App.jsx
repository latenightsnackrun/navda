import React from 'react';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        <Home />
      </div>
    </ErrorBoundary>
  );
}

export default App;