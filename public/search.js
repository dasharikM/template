const LASTFM_BASE_URL = 'https://www.last.fm';
const API_KEY = '131cf96ca8f79b6487a427ec1f9e3174';

document.addEventListener('DOMContentLoaded', function() {
   // Проверяем допустимость URL
  const validUrls = [
    /^http:\/\/localhost:3000\/?$/,
    /^http:\/\/localhost:3000\/search\.html\?q=.+$/
  ];

  const currentUrl = window.location.href;
  const isValidUrl = validUrls.some(regex => regex.test(currentUrl));

  if (!isValidUrl) {
    // Показываем страницу ошибки
    document.body.innerHTML = `
      <div class="error-container">
        <h1>404 Not Found</h1>
        <p>Доступ разрешен только к:</p>
        <ul>
          <li>Главной странице (/)</li>
          <li>Странице поиска (/search.html?q=запрос)</li>
        </ul>
        <a href="/">Вернуться на главную</a>
      </div>
    `;
    return; // Прекращаем выполнение остального кода
  }
    // Получаем поисковый запрос из URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
      // Заполняем поле поиска
      document.querySelector('.search-input').value = query;
      
      // Выполняем поиск
      performSearch(query);
    } else {
      document.getElementById('search-results').innerHTML = 
        '<div class="no-results">Please enter a search query</div>';
    }
  });
  
  async function performSearch(query) {
    const container = document.getElementById('search-results');
    
    try {      
      // Параллельно запрашиваем артистов, треки и альбомы
      const [artistsRes, tracksRes, albumsRes] = await Promise.all([
        fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=12`),
        fetch(`https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=23`),
        fetch(`https://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=30`)
      ]);
      
      const [artistsData, tracksData, albumsData] = await Promise.all([
        artistsRes.json(),
        tracksRes.json(),
        albumsRes.json()
      ]);

      displayResults(query, artistsData, tracksData, albumsData);
    } catch (error) {
      console.error('Search error:', error);
      container.innerHTML = '<div class="error">Search failed. Please try again.</div>';
    }
  }
  
  function displayResults(query, artistsData, tracksData, albumsData) {
    const container = document.getElementById('search-results');
    let html = `<div class="search-result-label">Search results for <span style="color:rgb(223, 235, 142);">"${query}"</span></div>`;
    
    // Артисты
    if (artistsData.results?.artistmatches?.artist?.length > 0) {
    html += '<div class="section-name">Artists</div>';
    html += '<div class="grid-hot-artists">';
      
      artistsData.results.artistmatches.artist.forEach(artist => {
        const imageUrl = artist.image?.find(img => img.size === "large")?.["#text"] || 
                        'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';
        const artistUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(artist.name).replace(/%20/g, '+')}`;
        
        html += `
          <div class="container-artist" onclick="window.open('${artistUrl}', '_blank')">
            <img src="${imageUrl}" alt="${artist.name}" class="artist-image">
            <div class="artist-name">${artist.name}</div>
          </div>
        `;
      });

    }
    html += '</div>';
    
    // Треки
    if (tracksData.results?.trackmatches?.track?.length > 0) {
    html += '<div class="section-name">Tracks</div>';
    html += '<div class="grid-hot-tracks">'
      tracksData.results.trackmatches.track.forEach(track => {
        const imageUrl = track.image?.find(img => img.size === "large")?.["#text"] || 
                        'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';
        const artistUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(track.artist).replace(/%20/g, '+')}`;

        html += `
          <div class="grid-track">
            <img src="${imageUrl}" alt="${track.name}" class="track-img">
            <div class="track-info">
              <div class="track-name" onclick="window.open('${track.url}', '_blank')">${track.name}</div>
              <div class="track-author" onclick="window.open('${artistUrl}', '_blank')">${track.artist}</div>
            </div>
          </div>
        `;
      });
      html += '</div>'
    }
    
    // Альбомы
    if (albumsData.results?.albummatches?.album?.length > 0) {
      html += '<div class="section-name">Albums</div>';
      html += '<div class="search-albums-grid">';
      
      albumsData.results.albummatches.album.forEach(album => {
        if (album.name === "(null)") return;
        const imageUrl = album.image?.find(img => img.size === "large")?.["#text"] || 
                        'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';
        
        const artistUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(album.artist).replace(/%20/g, '+')}`;

        
        html += `
          <div class="search-item" style="background: linear-gradient(to top, rgba(0,0,0,0.4), transparent), url('${imageUrl}'); background-position: center; background-size: cover;" onclick="window.open('${album.url}', '_blank')"">
            <div class="search-item-name track-info track-name" onclick="window.open('${album.url}', '_blank')">${album.name} </div>
            <div class="search-item-artist track-info track-author" onclick="window.open('${artistUrl}', '_blank')">${album.artist}</div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    if (!html.includes('grid-hot-artists') && !html.includes('grid-hot-tracks') && !html.includes('search-albums-grid')) {
      html += '<div class="no-results">No results found</div>';
    }
    
    container.innerHTML = html;
  }