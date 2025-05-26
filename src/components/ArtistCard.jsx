import React, { useState, useEffect } from 'react';

function ArtistCard({ artist }) {
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artist.name)}&api_key=131cf96ca8f79b6487a427ec1f9e3174&format=json`
        );
        const data = await response.json();
        setTags(data?.toptags?.tag || []);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, [artist.name]);

  const imageUrl = artist.image?.find(img => img.size === "extralarge")?.["#text"] || 
                  artist.image?.find(img => img.size === "large")?.["#text"] ||
                  artist.image?.slice(-1)[0]?.["#text"] ||
                  'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

  const artistUrl = `https://www.last.fm/music/${encodeURIComponent(artist.name).replace(/%20/g, '+')}`;

  const renderTags = () => {
    if (loadingTags) return <span>Loading tags...</span>;
    if (!tags.length) return 'no tags';
    
    return tags.slice(0, 3).map((tag, index, array) => (
      <React.Fragment key={tag.name}>
        <a
          href={`https://www.last.fm/tag/${encodeURIComponent(tag.name)}`}
          className="tag-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {tag.name}
        </a>
        {index < array.length - 1 && ' · '}
      </React.Fragment>
    ));
  };

  return (
    <div className="container-artist" onClick={() => window.open(artistUrl, '_blank')}>
      <img 
        className="artist-image" 
        src={imageUrl} 
        alt={artist.name}
        onError={(e) => {
          e.target.src = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';
        }}
      />
      <div className="artist-name">{artist.name}</div>
      <div className="track-tags">
        {renderTags()}
      </div>
    </div>
  );
}

export default ArtistCard;