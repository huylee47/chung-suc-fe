import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import App from './App';

const runtimeWindow = window as Window & { __CHUNGSUCLIQI_API_URL__?: string };
runtimeWindow.__CHUNGSUCLIQI_API_URL__ = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);
