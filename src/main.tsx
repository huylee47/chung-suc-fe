import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import App from './App';

const runtimeWindow = window as Window & { __BINAOV_API_URL__?: string };
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
runtimeWindow.__BINAOV_API_URL__ = apiUrl;

createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);
