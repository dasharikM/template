import React from 'react';

function AlbumCard({ album }) {
  const imageUrl = album.image?.find(img => img.size === "large")?.["#text"] || 
                  'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

  const artistUrl = `https://www.last.fm/music/${encodeURIComponent(album.artist).replace(/%20/g, '+')}`;

  return (
    <div 
      className="search-item" 
      style={{ 
        background: `linear-gradient(to top, rgba(0,0,0,0.4), transparent), url('${imageUrl}')`,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
      }}
      onClick={() => window.open(album.url, '_blank')}
    >
      <div 
        className="search-item-name track-info track-name" 
        onClick={(e) => {
          e.stopPropagation();
          window.open(album.url, '_blank');
        }}
      >
        {album.name}
      </div>
      <div 
        className="search-item-artist track-info track-author"
        onClick={(e) => {
          e.stopPropagation();
          window.open(artistUrl, '_blank');
        }}
      >
        {album.artist}
      </div>
    </div>
  );
}

export default AlbumCard;