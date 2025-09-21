import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css'
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN || "dev-77p5vwixuhqug3yt.us.auth0.com"}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || "svD9Q0fFoM91ThLWjexLbYMN9fElUlhH"}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE
    }}
  >
    <App />
  </Auth0Provider>
);
