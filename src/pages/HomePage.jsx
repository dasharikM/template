import { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import ArtistCover from '../components/ArtistCover';
import ArtistCard from '../components/ArtistCard';
import TrackCard from '../components/TrackCard';
import { fetchTopArtists, fetchTopTracks, fetchArtistCovers } from '../services/lastfmAPI.js';

function HomePage() {
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [artistCovers, setArtistCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [artists, tracks, covers] = await Promise.all([
          fetchTopArtists(),
          fetchTopTracks(),
          fetchArtistCovers()
        ]);
        setTopArtists(artists);
        setTopTracks(tracks);
        setArtistCovers(covers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container-content">
      <SearchBar />
      
      <div className="container">
        <div className="section-name">Hot right now</div>
        
        <div className="flex-covers">
          {artistCovers.map(artist => (
            <ArtistCover key={artist.name} artist={artist} />
          ))}
        </div>
        
        <div className="section-name">Top Artists</div>
        <div className="grid-hot-artists">
          {topArtists.map(artist => (
            <ArtistCard key={artist.name} artist={artist} />
          ))}
        </div>
        
        <div className="section-name">Popular tracks</div>
        <div className="grid-hot-tracks">
          {topTracks.map(track => (
            <TrackCard key={`${track.name}-${track.artist.name}`} track={track} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;