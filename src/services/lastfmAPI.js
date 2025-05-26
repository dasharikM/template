const API_KEY = '131cf96ca8f79b6487a427ec1f9e3174';
const cache = new Map();

/**
 * Выполняет кэшированный fetch-запрос
 * @param {string} url - URL для запроса
 * @param {boolean} [skipCache=false] - Пропустить кэш, если true
 * @returns {Promise<object>} - Ответ сервера в формате JSON
 * @throws {Error} - Если произошла ошибка HTTP
 */
async function cachedFetch(url, skipCache = false) {
  if (!skipCache && cache.has(url)) {
    return cache.get(url);
  }
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  
  cache.set(url, data);
  return data;
}

/**
 * Получает топ артистов с дополнительной информацией (альбомы, теги)
 * @param {number} [limit=12] - Количество возвращаемых артистов
 * @returns {Promise<Array<object>>} - Массив объектов с информацией об артистах
 * @throws {Error} - Если данные от API имеют неверный формат
 */
export async function fetchTopArtists(limit = 12) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${API_KEY}&format=json&limit=${limit}`;
  const data = await cachedFetch(url);
  
  if (!data.artists?.artist) throw new Error('Invalid data format from API');
  
  const artistsWithDetails = await Promise.all(
    data.artists.artist.map(async artist => {
      try {
        const [albumsRes, tagsRes] = await Promise.all([
          cachedFetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getTopAlbums&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json&limit=2`),
          cachedFetch(`https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json`)
        ]);
        
        const albumImage = albumsRes?.topalbums?.album?.[0]?.image || [];
        
        return {
          ...artist,
          image: albumImage.length ? albumImage : artist.image,
          tags: tagsRes.toptags?.tag || []
        };
      } catch (e) {
        console.error(`Error loading details for ${artist.name}:`, e);
        return {
          ...artist,
          image: artist.image,
          tags: []
        };
      }
    })
  );
  
  return artistsWithDetails;
}

/**
 * Получает топ треков с дополнительной информацией (изображения, теги, длительность)
 * @param {number} [limit=17] - Количество возвращаемых треков
 * @returns {Promise<Array<object>>} - Массив объектов с информацией о треках
 * @throws {Error} - Если данные от API имеют неверный формат
 */
export async function fetchTopTracks(limit = 17) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${API_KEY}&format=json&limit=${limit}`;
  const data = await cachedFetch(url);
  
  if (!data.tracks?.track) throw new Error('Invalid data format from API');
  
  const tracksWithDetails = await Promise.all(
    data.tracks.track.map(async track => {
      try {
        const trackUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(track.artist.name)}&track=${encodeURIComponent(track.name)}&format=json`;
        const trackData = await cachedFetch(trackUrl, true);
        
        let toptags = trackData?.track?.toptags?.tag || [];
        if (!toptags.length) {
          const trackTags = await cachedFetch(
            `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(track.artist.name)}&track=${encodeURIComponent(track.name)}&api_key=${API_KEY}&format=json`
          );
          toptags = trackTags.track.toptags?.tag || [];
        }
        
        return {
          ...track,
          image: trackData.track?.album?.image || track.image,
          toptags,
          duration: trackData.track?.duration || 0
        };
      } catch (error) {
        console.error('Error getting track details:', error);
        return {
          ...track,
          duration: 0
        };
      }
    })
  );
  
  return tracksWithDetails;
}

/**
 * Получает информацию об артистах для обложек (биография, треки, теги)
 * @param {number} [limit=2] - Количество возвращаемых артистов
 * @returns {Promise<Array<object>>} - Массив объектов с расширенной информацией об артистах
 * @throws {Error} - Если данные от API имеют неверный формат
 */
export async function fetchArtistCovers(limit = 2) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${API_KEY}&format=json&limit=${limit}`;
  const data = await cachedFetch(url);
  
  if (!data.artists?.artist) throw new Error('Invalid data format from API');
  
  const artistsWithDetails = await Promise.all(
    data.artists.artist.map(async artist => {
      try {
        const [infoRes, tracksRes] = await Promise.all([
          cachedFetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json`),
          cachedFetch(`https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json&limit=10`)
        ]);
        
        let latestTrack = null;
        if (tracksRes.toptracks?.track?.length) {
          const lastTrack = tracksRes.toptracks.track[tracksRes.toptracks.track.length - 1];
          try {
            const trackInfo = await cachedFetch(
              `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(artist.name)}&track=${encodeURIComponent(lastTrack.name)}&format=json`,
              true
            );
            latestTrack = {
              ...lastTrack,
              published: trackInfo.track?.wiki?.published || '1970-01-01'
            };
          } catch (e) {
            latestTrack = {
              ...lastTrack,
              published: '1970-01-01'
            };
          }
        }
        
        return {
          name: artist.name,
          image: infoRes.artist?.image || artist.image,
          bio: infoRes.artist?.bio?.summary || 'No biography available',
          tags: infoRes.artist?.tags?.tag || [],
          latestTrack,
          popularTrack: tracksRes.toptracks?.track?.[0] || null
        };
      } catch (e) {
        console.error(`Error loading details for ${artist.name}:`, e);
        return {
          name: artist.name,
          image: artist.image,
          bio: 'No biography available',
          tags: [],
          latestTrack: null,
          popularTrack: null
        };
      }
    })
  );
  
  return artistsWithDetails;
}

/**
 * Ищет треки по запросу с дополнительной информацией
 * @param {string} query - Поисковый запрос
 * @param {number} [limit=10] - Максимальное количество результатов
 * @returns {Promise<Array<object>>} - Массив найденных треков
 */
export async function searchTracks(query, limit = 10) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=${limit}`;
  const data = await cachedFetch(url);
  const tracks = data.results?.trackmatches?.track || [];
  
  const tracksWithDetails = await Promise.all(
    tracks.map(async track => {
      try {
        const trackUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(track.artist)}&track=${encodeURIComponent(track.name)}&format=json`;
        const trackData = await cachedFetch(trackUrl);
        
        return {
          ...track,
          duration: trackData.track?.duration || 0,
          image: trackData.track?.album?.image || track.image || []
        };
      } catch (error) {
        console.error('Error getting track details:', error);
        return {
          ...track,
          duration: 0,
          image: track.image || []
        };
      }
    })
  );
  
  return tracksWithDetails;
}

/**
 * Ищет артистов по запросу
 * @param {string} query - Поисковый запрос
 * @param {number} [limit=5] - Максимальное количество результатов
 * @returns {Promise<Array<object>>} - Массив найденных артистов
 */
export async function searchArtists(query, limit = 5) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=${limit}`;
  const data = await cachedFetch(url);
  return data.results?.artistmatches?.artist || [];
}

/**
 * Ищет альбомы по запросу
 * @param {string} query - Поисковый запрос
 * @param {number} [limit=5] - Максимальное количество результатов
 * @returns {Promise<Array<object>>} - Массив найденных альбомов (исключая альбомы с именем "(null)")
 */
export async function searchAlbums(query, limit = 5) {
  const url = `https://ws.audioscrobbler.com/2.0/?method=album.search&album=${encodeURIComponent(query)}&api_key=${API_KEY}&format=json&limit=${limit}`;
  const data = await cachedFetch(url);
  return data.results?.albummatches?.album?.filter(album => album.name !== "(null)") || [];
}