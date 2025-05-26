import React from 'react';

function TrackCard({ track }) {
console.log('Track data:', track);
  const imageUrl = track.image?.find(img => img.size === "large")?.["#text"] || 
                  track.image?.slice(-1)[0]?.["#text"] ||
                  'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

  const trackUrl = track.url || 
                 `https://www.last.fm/music/${encodeURIComponent(track.artist?.name || track.artist).replace(/%20/g, '+')}/_/${encodeURIComponent(track.name).replace(/%20/g, '+')}`;
  
  const artistUrl = `https://www.last.fm/music/${encodeURIComponent(track.artist?.name || track.artist).replace(/%20/g, '+')}`;
  

  const formatDuration = (ms) => {
    if (!ms) return '--:--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
        <div className="track-duration">
          {formatDuration(track.duration)}
        </div>
      </div>
    </div>
  );
}

export default TrackCard;