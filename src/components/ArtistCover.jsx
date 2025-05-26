import React from 'react';

function ArtistCover({ artist }) {
  const imageUrl = artist.image?.find(img => img.size === "extralarge")?.["#text"] || 
                  'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';

  const artistUrl = `https://www.last.fm/music/${encodeURIComponent(artist.name).replace(/%20/g, '+')}`;
  
  const tags = artist.tags?.slice(0, 3).map(tag => (
    <li key={tag.name} className="cover-tag">
      <a
        href={`https://www.last.fm/tag/${encodeURIComponent(tag.name).replace(/%20/g, '+')}`}
        style={{ textDecoration: 'none', textTransform: 'uppercase', color: 'rgb(242, 245, 253)' }}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
      >
        {tag.name}
      </a>
    </li>
  ));

  const bioNeedsTruncation = artist.bio?.length > 200;
  const shortBio = bioNeedsTruncation ? artist.bio.substring(0, 200) : artist.bio;
  const artistBioUrl = `${artistUrl}/+wiki`;
  
  const latestTrack = artist.latestTrack ? (
    <div className="cover-music">
      <img className="cover-music-image" src={
        artist.latestTrack.image?.find(img => img.size === "large")?.["#text"] || imageUrl
      } alt={artist.latestTrack.name} />
      <div className="cover-music-info">
        <div className="cover-music-info-theme">Most popular release</div>
        <a 
          href={`${artistUrl}/_/${encodeURIComponent(artist.latestTrack.name).replace(/%20/g, '+')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{textDecoration: 'none'}}
        >
          <div className="cover-music-info-name">{artist.latestTrack.name}</div>
        </a>
        <div className="cover-music-info-details">
          {artist.latestTrack.published ? 
            new Date(artist.latestTrack.published).toLocaleDateString() : 
            'Date unknown'}
        </div>
      </div>
    </div>
  ) : null;

  const popularTrack = artist.popularTrack ? (
    <div className="cover-music">
      <img className="cover-music-image" src={
        artist.popularTrack.image?.find(img => img.size === "large")?.["#text"] || imageUrl
      } alt={artist.popularTrack.name} />
      <div className="cover-music-info">
        <div className="cover-music-info-theme">Popular this week</div>
        <a 
          href={`${artistUrl}/_/${encodeURIComponent(artist.popularTrack.name).replace(/%20/g, '+')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{textDecoration: 'none'}}
        >
          <div className="cover-music-info-name">{artist.popularTrack.name}</div>
        </a>
        <div className="cover-music-info-details">
          {artist.popularTrack.playcount || '0'} listeners
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div 
      className="container-cover" 
      style={{
        background: `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.8)), url('${imageUrl}')`,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
      }}
      onClick={() => window.open(artistUrl, '_blank')}
    >
      <div className="cover-author">{artist.name}</div>
      <ul className="cover-tags">{tags}</ul>
      <div className="cover-text">
        {shortBio}
        {bioNeedsTruncation && (
          <a 
            style={{fontWeight: 'bold', color: 'rgb(207, 211, 220)'}} 
            href={artistBioUrl} 
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            read more
          </a>
        )}
      </div>
      
      <div className="cover-music-container">
        {latestTrack}
        {popularTrack}
      </div>
    </div>
  );
}

export default ArtistCover;