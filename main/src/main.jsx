import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css'
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain="dev-77p5vwixuhqug3yt.us.auth0.com"
    clientId="svD9Q0fFoM91ThLWjexLbYMN9fElUlhH"
    authorizationParams={{
      redirect_uri: window.location.origin
    }}
  >
    <App />
  </Auth0Provider>
);
