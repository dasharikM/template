import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';

function SearchBar({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
   const navigate = useNavigate();


  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="container-search">
      <a href="/" className="search-first-element">my.fm</a>
      <form className="search-second-element" onSubmit={handleSubmit}>
        <input 
          className="search-input" 
          type="text" 
          name="q" 
          placeholder="Search.."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-button" type="submit">SUBMIT</button>
      </form>
    </div>
  );
}

export default SearchBar;