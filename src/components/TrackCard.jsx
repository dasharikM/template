import React from 'react';

function TrackCard({ track }) {
  const imageUrl = track.image?.find(img => img.size === "large")?.["#text"] || 
                  track.image?.slice(-1)[0]?.["#text"] ||
                  'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

  const trackUrl = track.url || 
                 `https://www.last.fm/music/${encodeURIComponent(track.artist?.name || track.artist).replace(/%20/g, '+')}/_/${encodeURIComponent(track.name).replace(/%20/g, '+')}`;
  
  const artistUrl = `https://www.last.fm/music/${encodeURIComponent(track.artist?.name || track.artist).replace(/%20/g, '+')}`;
  
  // Генерация тегов с разделителями
  const renderTags = () => {
    if (!track.toptags?.length) return 'no tags';
    
    return track.toptags.slice(0, 3).map((tag, index, array) => (
      <React.Fragment key={tag.name}>
        <a
          href={`https://www.last.fm/tag/${encodeURIComponent(tag.name).replace(/%20/g, '+')}`}
          className="tag-link"
          target="_blank"
          rel="noopener noreferrer"
          title={`View more ${tag.name} tracks`}
          onClick={(e) => e.stopPropagation()}
        >
          {tag.name}
        </a>
        {index < array.length - 1 && (
          <span className="tag-separator"> · </span>
        )}
      </React.Fragment>
    ));
  };



  return (
    <div className="grid-track">
      <img className="track-img" src={imageUrl} alt={track.name} />
      <div className="track-info">
        <a href={trackUrl} className="track-link" target="_blank" rel="noopener noreferrer">
          <div className="track-name">{track.name}</div>
        </a>
        <a href={artistUrl} className="artist-link" target="_blank" rel="noopener noreferrer">
          <div className="track-author">{track.artist?.name || track.artist}</div>
        </a>
        <div className="track-tags">
          {renderTags()}
        </div>
      </div>
    </div>
  );
}

export default TrackCard;