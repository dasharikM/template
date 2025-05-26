import React from 'react';
import { Link } from 'react-router-dom';

function ErrorPage() {
  return (
    <div className="error-container">
      <h1>404 Not Found</h1>
      <p>Доступ разрешен только к:</p>
      <ul>
        <li>Главной странице (/)</li>
        <li>Странице поиска (/search?q=запрос)</li>
      </ul>
      <Link to="/"><h1>Вернуться на главную</h1></Link>
    </div>
  );
}

export default ErrorPage;