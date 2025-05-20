const API_KEY = '131cf96ca8f79b6487a427ec1f9e3174';
const ARTISTS_CONTAINER = document.querySelector('.grid-hot-artists');
const TRACKS_CONTAINER = document.getElementById('tracks-container');
const LASTFM_BASE_URL = 'https://www.last.fm';
const COVERS_CONTAINER = document.querySelector('.flex-covers')

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверка допустимых URL
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
        return; // Прекращаем выполнение, если URL невалидный
    }

    // Проверяем поисковый запрос
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');

    if (query) {
        // Если есть поисковый запрос, выполняем поиск
        document.querySelector('.search-input').value = query;
        performSearch(query);
    } else {
        // Если нет запроса, загружаем топ-артистов и треки
         Promise.all([
            loadTopArtists(), 
            loadTopTracks(), 
            loadArtistCovers()
        ]).catch(error => {
            console.error('Error loading data:', error);
        });
    }
});

async function loadArtistCovers() {
    try {
        // Получаем топ артистов
        const artistsResponse = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${API_KEY}&format=json&limit=2`
        );
        
        if (!artistsResponse.ok) throw new Error(`HTTP error! status: ${artistsResponse.status}`);
        
        const artistsData = await artistsResponse.json();
        
        if (!artistsData.artists?.artist) throw new Error('Invalid data format from API');
        
        
        
        // Отображаем сразу базовую информацию
        displayArtistCovers(artistsData.artists.artist.map(artist => ({
            name: artist.name,
            image: artist.image,
            bio: 'Loading biography...',
            tags: [],
            latestTrack: null,
            popularTrack: null
        })));
        
        // Затем подгружаем детали в фоне
        loadArtistDetails(artistsData.artists.artist);
    } catch (error) {
        console.error('Error loading artist covers:', error);
        COVERS_CONTAINER.innerHTML = '<div class="error">Failed to load artist covers. Please try again later.</div>';
    }
}

async function loadArtistDetails(artists){
    // Загружаем детали по каждому артисту
    const artistsWithDetails = await Promise.all(
        artists.map(async artist => {
            try {
                    const [infoResponse, tagsResponse, tracksResponse] = await Promise.all([
                        fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json`),
                        fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json`),
                        fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json&limit=50`) // Уменьшаем лимит
                    ]);
                    const [infoData, tagsData, tracksData] = await Promise.all([
                        infoResponse.json(),
                        tagsResponse.json(),
                        tracksResponse.json()
                    ]);
                    // 2. Получаем ДЕТАЛИ по каждому треку для даты релиза
                    const tracksWithDates = await Promise.all(
                        tracksData.toptracks?.track?.map(async track => {
                            const trackInfoResponse = await fetch(
                                `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(artist.name)}&track=${encodeURIComponent(track.name)}&format=json`
                            );
                            const trackInfo = await trackInfoResponse.json();
                            return {
                                ...track,
                                published: trackInfo.track?.wiki?.published || '1970-01-01' // Дефолтная дата
                            };
                        }) || []
                    );
                    
                    // 3. Сортируем треки по дате публикации (новые первыми)
                    const sortedTracks = tracksWithDates.sort((a, b) => 
                        new Date(b.published) - new Date(a.published)
                    );
                    
                    // 4. Берем самый свежий трек (первый в отсортированном массиве)
                    const latestTrack = sortedTracks[0];
                    
                    // 5. Берем самый популярный трек (первый в исходном массиве)
                    const popularTrack = tracksData.toptracks?.track?.[0];
                    
                    return {
                        name: artist.name,
                        image: infoData.artist?.image || artist.image,
                        bio: infoData.artist?.bio?.summary || 'No biography available',
                        tags: tagsData.toptags?.tag || [],
                        latestTrack: latestTrack,
                        popularTrack: popularTrack
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
    displayArtistCovers(artistsWithDetails);
}

function displayArtistCovers(artists) {
    COVERS_CONTAINER.innerHTML = artists.map(artist => {
        const imageUrl = artist.image?.find(img => img.size === "extralarge")?.["#text"] || 
                        'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';
        
        // Ссылка на страницу музыканта
        const artistUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(artist.name).replace(/%20/g, '+')}`;
        
        // Теги как ссылки
        const tagsHtml = artist.tags.slice(0, 3).map(tag => 
            `<li class="cover-tag">
                <a href="${LASTFM_BASE_URL}/tag/${encodeURIComponent(tag.name).replace(/%20/g, '+')}"
                    style = "text-decoration: none;  text-transform: uppercase; color: rgb(242, 245, 253);"
                    target="_blank" 
                    onclick="event.stopPropagation()">
                    ${tag.name}
                </a>
             </li>`
        ).join('');
        
        let tracksHtml = '';
        
        // Блок с последним релизом
        if (artist.latestTrack) {
            const trackImage = artist.latestTrack.image?.find(img => img.size === "large")?.["#text"] || imageUrl;
            const publishedDate = artist.latestTrack.published ? 
                new Date(artist.latestTrack.published).toLocaleDateString() : 
                'Date unknown';
            
            // Ссылка для latestTrack.name
            const latestTrackUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(artist.name).replace(/%20/g, '+')}/_/${encodeURIComponent(artist.latestTrack.name).replace(/%20/g, '+')}`;
            
            tracksHtml += `
                <div class="cover-music">
                    <img class="cover-music-image" src="${trackImage}">
                    <div class="cover-music-info">
                        <div class="cover-music-info-theme">Latest release</div>
                        <a href="${latestTrackUrl}" target="_blank" onclick="event.stopPropagation()" style="text-decoration:none;">
                            <div class="cover-music-info-name">${artist.latestTrack.name}</div>
                        </a>
                        <div class="cover-music-info-details">${publishedDate}</div>
                    </div>
                </div>
            `;
        }
        
        // Блок с популярным треком
        if (artist.popularTrack) {
            const trackImage = artist.popularTrack.image?.find(img => img.size === "large")?.["#text"] || imageUrl;
            
            // Ссылка для popularTrack.name
            const popularTrackUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(artist.name).replace(/%20/g, '+')}/_/${encodeURIComponent(artist.popularTrack.name).replace(/%20/g, '+')}`;
            
            tracksHtml += `
                <div class="cover-music">
                    <img class="cover-music-image" src="${trackImage}">
                    <div class="cover-music-info">
                        <div class="cover-music-info-theme">Popular this week</div>
                        <a href="${popularTrackUrl}" target="_blank" onclick="event.stopPropagation()" style="text-decoration:none;">
                            <div class="cover-music-info-name">${artist.popularTrack.name}</div>
                        </a>
                        <div class="cover-music-info-details">${artist.popularTrack.playcount || '0'} listeners</div>
                    </div>
                </div>
            `;
        }
        
        const bioNeedsTruncation = artist.bio.length > 200;
        const shortBio = bioNeedsTruncation ? 
                        artist.bio.substring(0, 200) : 
                        artist.bio;
        
        const artistBioUrl = `${artistUrl}/+wiki`;
        const readMoreLink = bioNeedsTruncation ? 
            `<a style="font-weight: bold; color: rgb(207, 211, 220);" href="${artistBioUrl}" target="_blank" onclick="event.stopPropagation()">read more</a>` : 
            '';
        
        return `
            <div class="container-cover" style="
                background: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.8)), url('${imageUrl}');
                background-position: center;
                background-size: cover;"
                onclick="window.open('${artistUrl}', '_blank')">
                
                <div class="cover-author">${artist.name}</div>
                <ul class="cover-tags">${tagsHtml}</ul>
                <div class="cover-text">
                    ${shortBio}
                    ${readMoreLink}
                </div>
                
                <div class="cover-music-container">${tracksHtml}</div>
            </div>
        `;
    }).join('');
}

async function loadTopArtists() {
    try {
        const response = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${API_KEY}&format=json&limit=12`
        );
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (!data.artists?.artist) throw new Error('Invalid data format from API');
        
        const artistsWithDetails = await Promise.all(
            data.artists.artist.map(async artist => {
                try {
                    // Используем метод artist.getTopAlbums для получения изображений
                    const albumsResponse = await fetch(
                        `https://ws.audioscrobbler.com/2.0/?method=artist.getTopAlbums&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json&limit=1`
                    );
                    const albumsData = await albumsResponse.json();
                    
                    const tagsResponse = await fetch(
                        `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json`
                    );
                    const tagsData = await tagsResponse.json();
                    
                    
                    // Берем изображение из первого альбома или используем дефолтное
                    const albumImage = albumsData?.topalbums?.album?.[0]?.image || [];
                    
                    return {
                        ...artist,
                        image: albumImage.length ? albumImage : artist.image,
                        tags: tagsData.toptags?.tag || []
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
        
        displayArtists(artistsWithDetails);
    } catch (error) {
        console.error('Error loading artists:', error);
        ARTISTS_CONTAINER.innerHTML = '<div class="error">Failed to load artists. Please try again later.</div>';
    }
}

function displayArtists(artists) {
    ARTISTS_CONTAINER.innerHTML = artists.map(artist => {
        // Получаем URL изображения
        const imageUrl = artist.image?.find(img => img.size === "extralarge")?.["#text"] || 
                        artist.image?.find(img => img.size === "large")?.["#text"] ||
                        artist.image?.slice(-1)[0]?.["#text"] ||
                        'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png';
        
        // Создаем URL для артиста
        const artistUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(artist.name).replace(/%20/g, '+')}`;
        
        // Формируем теги с ссылками
        let tagsHtml = 'no tags';
        if (artist.tags?.length > 0) {
            tagsHtml = artist.tags.slice(0, 3).map(tag => 
                `<a href="${LASTFM_BASE_URL}/tag/${encodeURIComponent(tag.name).replace(/%20/g, '+')}" 
                  class="tag-link" 
                  target="_blank"
                  onclick="event.stopPropagation()"
                  title="View more ${tag.name} tracks">${tag.name}</a>`
            ).join('<span class="tag-separator">·</span>');
        }

        return `
            <div class="container-artist" onclick="window.open('${artistUrl}', '_blank')">
                <img class="artist-image" src="${imageUrl}" 
                     onerror="this.src='https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'"
                     alt="${artist.name}">
                <div class="artist-name">${artist.name}</div>
                <div class="track-tags">${tagsHtml}</div>
            </div>
        `;
    }).join('');
}
// Функция загрузки популярных треков
async function loadTopTracks() {
    try {
        const response = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=${API_KEY}&format=json&limit=17`
        );
        const data = await response.json();
        
        // Получаем дополнительные данные для каждого трека
        const tracksWithDetails = await Promise.all(
            data.tracks.track.map(async track => {
                return await getTrackDetails(track);
            })
        );
        
        displayTracks(tracksWithDetails);
    } catch (error) {
        console.error('Ошибка загрузки треков:', error);
    }
}

// Функция для получения дополнительной информации о треке
async function getTrackDetails(track) {
    try {
        // Получаем информацию о треке
        const trackResponse = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(track.artist.name)}&track=${encodeURIComponent(track.name)}&format=json`
        );
        const trackData = await trackResponse.json();
        
        // Получаем теги артиста
        const artistResponse = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(track.artist.name)}&api_key=${API_KEY}&format=json`
        );
        const artistData = await artistResponse.json();

        
        return {
            ...track,
            image: trackData.track?.album?.image || track.image ,
            toptags: trackData.track?.toptags || artistData.toptags
        };
    } catch (error) {
        console.error('Ошибка получения деталей трека:', error);
        return track; // Возвращаем оригинальный трек, если что-то пошло не так
    }
}

// Отображение треков
function displayTracks(tracks) {
    TRACKS_CONTAINER.innerHTML = tracks.map(track => {
        // Обработка изображений
        const imageUrl = track.image?.find(img => img.size === "large")?.["#text"] 
            || track.image?.slice(-1)[0]?.["#text"];

        // Создаем URL для трека и артиста
        const trackUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(track.artist.name).replace(/%20/g, '+')}/_/${encodeURIComponent(track.name).replace(/%20/g, '+')}`;
        const artistUrl = `${LASTFM_BASE_URL}/music/${encodeURIComponent(track.artist.name).replace(/%20/g, '+')}`;

        // Обработка тегов с ссылками
        let tagsHtml = 'no tags';
        if (track.toptags?.tag) {
            tagsHtml = track.toptags.tag.slice(0, 3).map(tag => 
                `<a href="${LASTFM_BASE_URL}/tag/${encodeURIComponent(tag.name).replace(/%20/g, '+')}" 
                  class="tag-link" 
                  target="_blank"
                  title="View more ${tag.name} tracks">${tag.name}</a>`
            ).join(' · ');
        }

        return `
            <div class="grid-track">
                <img class="track-img" src="${imageUrl}" 
                     alt="${track.name}">
                <div class="track-info">
                    <a href="${trackUrl}" class="track-link" target="_blank">
                        <div class="track-name">${track.name}</div>
                    </a>
                    <a href="${artistUrl}" class="artist-link" target="_blank">
                        <div class="track-author">${track.artist?.name}</div>
                    </a>
                    <div class="track-tags">${tagsHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}