import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth';
import './styles.css';

if (localStorage.getItem('a11y-large') === '1') document.documentElement.classList.add('large');
if (localStorage.getItem('a11y-contrast') === '1') document.documentElement.classList.add('contrast');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></React.StrictMode>,
);
