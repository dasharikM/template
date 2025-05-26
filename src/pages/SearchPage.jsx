import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ArtistCard from '../components/ArtistCard';
import TrackCardSearch from '../components/TrackCardSearch';
import AlbumCard from '../components/AlbumCard';
import { searchArtists, searchTracks, searchAlbums } from '../services/lastfmAPI.js';

function SearchPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q');
  const [results, setResults] = useState({ artists: [], tracks: [], albums: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return;

    const performSearch = async () => {
      try {
        const [artists, tracks, albums] = await Promise.all([
          searchArtists(query, 5),
          searchTracks(query, 10),
          searchAlbums(query, 5)
        ]);
        setResults({ artists, tracks, albums });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  if (!query) return <div className="no-results">Please enter a search query</div>;
  if (error) return <div className="error">{error}</div>;
  if (loading) return <div className="loading">Searching...</div>;

  return (
    <div className="container-content">
      <SearchBar initialQuery={query} />
      
      <div id="search-results" className="container">
        <div className="search-result-label">
          Search results for <span style={{color: 'rgb(223, 235, 142)'}}>"{query}"</span>
        </div>
        
        {results.artists.length > 0 && (
          <>
            <div className="section-name">Artists</div>
            <div className="grid-hot-artists">
              {results.artists.map(artist => (
                <ArtistCard key={artist.name} artist={artist} />
              ))}
            </div>
          </>
        )}
        
        {results.tracks.length > 0 && (
          <>
            <div className="section-name">Tracks</div>
            <div className="grid-hot-tracks">
              {results.tracks.map(track => (
                <TrackCardSearch key={`${track.name}-${track.artist}`} track={track} />
              ))}
            </div>
          </>
        )}
        
        {results.albums.length > 0 && (
          <>
            <div className="section-name">Albums</div>
            <div className="search-albums-grid">
              {results.albums.map(album => (
                <AlbumCard key={`${album.name}-${album.artist}`} album={album} />
              ))}
            </div>
          </>
        )}
        
        {results.artists.length === 0 && results.tracks.length === 0 && results.albums.length === 0 && (
          <div className="no-results">No results found</div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;