import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Находим корневой элемент
const container = document.getElementById('root');

// Создаем корень рендеринга
const root = createRoot(container!);

// Рендерим приложение
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);