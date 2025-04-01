// Registrar el Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registrado con éxito:', registration.scope);
        })
        .catch(error => {
          console.log('Error al registrar ServiceWorker:', error);
        });
    });
  }

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".search-bar");
    const mainContent = document.querySelector(".main-content");
    let currentArtist = null;
    let currentAlbums = []; 
    let audioPlayer = null;
    let currentlyPlaying = null;

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            searchArtist(query);
        }
    };

    searchInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            performSearch();
        }
    });

    // Evento para el botón de búsqueda
    const searchButton = document.querySelector(".search-button");
    if (searchButton) {
        searchButton.addEventListener("click", performSearch);
    }

    async function searchArtist(query) {
        const url = `https://spotify23.p.rapidapi.com/search/?q=${encodeURIComponent(query)}&type=artist&offset=0&limit=1&numberOfTopResults=1`;

        const options = {
            method: "GET",
            headers: {
            		'x-rapidapi-key': 'b3a8c92d98msh0ed50a90cd81b24p15f957jsn7da371103418',
		'x-rapidapi-host': 'spotify23.p.rapidapi.com'
	}
};

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            if (data.artists && data.artists.items.length > 0) {
                currentArtist = data.artists.items[0].data;
                const artistId = currentArtist.uri.split(":")[2];
                displayArtistContent(currentArtist, artistId);
            } else {
                mainContent.innerHTML = "<p>No se encontró el artista</p>";
            }
        } catch (error) {
            console.error("Error en la búsqueda del artista:", error);
        }
    }

    function displayArtistContent(artist, artistId) {
        mainContent.innerHTML = `
            <div class="artist-container">
                <img src="${artist.visuals.avatarImage?.sources[0]?.url || ''}" alt="Avatar" class="artist-image">
                <div class="artist-info">
                    <h2>${artist.profile.name}</h2>
                </div>
            </div>
            <div class="content-container"></div>
            <div class="audio-player-container" style="display: none;">
                <audio id="audio-player" controls></audio>
                <div class="now-playing">
                    <span class="now-playing-text">Reproduciendo:</span>
                    <span class="now-playing-title"></span>
                </div>
            </div>
        `;
        
        audioPlayer = document.getElementById("audio-player");
        const contentContainer = document.querySelector(".content-container");
        fetchAlbums(artistId, contentContainer);
        fetchTopTracks(artistId, contentContainer);
    }

    async function fetchAlbums(artistId, container) {
        const url = `https://spotify23.p.rapidapi.com/artist_albums/?id=${artistId}&offset=0&limit=10`;

        const options = {
            method: "GET",
            headers: {
        		'x-rapidapi-key': 'b3a8c92d98msh0ed50a90cd81b24p15f957jsn7da371103418',
		'x-rapidapi-host': 'spotify23.p.rapidapi.com'
	}
};

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            currentAlbums = data.data.artist.discography.albums.items;
            displayAlbums(currentAlbums, artistId, container);
        } catch (error) {
            console.error("Error al obtener los álbumes:", error);
        }
    }

    async function fetchAlbumTracks(albumId, artistId, albumImageUrl) {
        const albumInfo = currentAlbums.find(a => a.releases.items[0].id === albumId);
        
        const tracksUrl = `https://spotify23.p.rapidapi.com/album_tracks/?id=${albumId}&offset=0&limit=20`;
        
        const options = {
            method: "GET",
            headers: {
                'x-rapidapi-key': 'b3a8c92d98msh0ed50a90cd81b24p15f957jsn7da371103418',
                'x-rapidapi-host': 'spotify23.p.rapidapi.com'
            }
        };
        
        try {
            const tracksResponse = await fetch(tracksUrl, options);
            const tracksData = await tracksResponse.json();
            
            if (tracksData.data && tracksData.data.album.tracks.items.length > 0) {
                // Usamos la información del álbum que ya teníamos
                const albumName = albumInfo?.releases.items[0].name || tracksData.data.album.name || "Álbum desconocido";
                const releaseYear = albumInfo?.releases.items[0].date?.year || "Año desconocido";
                
                // Obtener previews de las canciones
                const trackIds = tracksData.data.album.tracks.items.map(item => item.track.uri.split(':')[2]).join(',');
                const previewResponse = await fetch(`https://spotify23.p.rapidapi.com/tracks/?ids=${trackIds}`, options);
                const previewData = await previewResponse.json();
                
                const tracksWithPreviews = tracksData.data.album.tracks.items.map(item => {
                    const trackId = item.track.uri.split(':')[2];
                    const previewTrack = previewData.tracks.find(t => t.uri === item.track.uri);
                    return {
                        ...item,
                        previewUrl: previewTrack?.preview_url || null
                    };
                });
                
                displayAlbumTracks({
                    name: albumName,
                    date: { year: releaseYear },
                    tracks: {
                        items: tracksWithPreviews
                    }
                }, albumImageUrl, artistId);
            } else {
                console.error("No se encontraron canciones en el álbum.");
            }
        } catch (error) {
            console.error("Error al obtener las canciones del álbum:", error);
        }
    }
    
    function displayAlbums(albums, artistId, container) {
        container.innerHTML = "";
        
        const albumsContainer = document.createElement("div");
        albumsContainer.classList.add("container-name-concentracion");
        
        const albumsTitle = document.createElement("h1");
        albumsTitle.classList.add("title-playlist");
        albumsTitle.textContent = "Álbumes";
        albumsContainer.appendChild(albumsTitle);
    
        const cardsContainer = document.createElement("div");
        cardsContainer.classList.add("container-card-concentracion");
        
        albums.forEach(album => {
            const albumItem = document.createElement("div");
            albumItem.classList.add("card-concentracion");
            
            const albumCard = document.createElement("div");
            albumCard.classList.add("card");
            
            const imgContainer = document.createElement("div");
            imgContainer.classList.add("card-img");
            
            const albumImg = document.createElement("img");
            const albumImageUrl = album.releases.items[0].coverArt.sources[0]?.url || '';
            albumImg.src = albumImageUrl;
            albumImg.alt = album.releases.items[0].name;
            
            const albumName = document.createElement("h2");
            albumName.textContent = album.releases.items[0].name;
            
            const albumDesc = document.createElement("p");
            albumDesc.textContent = album.releases.items[0].date?.year || 'Álbum musical';
            
            imgContainer.appendChild(albumImg);
            albumCard.appendChild(imgContainer);
            albumCard.appendChild(albumName);
            albumCard.appendChild(albumDesc);
            albumItem.appendChild(albumCard);
            cardsContainer.appendChild(albumItem);
            
            albumItem.addEventListener("click", () => fetchAlbumTracks(
                album.releases.items[0].id, 
                artistId,
                albumImageUrl
            ));
        });
        
        albumsContainer.appendChild(cardsContainer);
        container.appendChild(albumsContainer);
    }

    function displayAlbumTracks(albumData, coverImage, artistId) {
        mainContent.innerHTML = `
            <div class="album-view">
                <div class="album-header">
                    <div class="album-cover-container">
                        <img src="${coverImage}" alt="Album Cover" class="album-cover">
                    </div>
                    <div class="album-info">
                        <h1 class="album-title">${albumData.name}</h1>
                        <p class="album-artist">${currentArtist?.profile?.name || ''}</p>
                        <p class="album-year">${albumData.date?.year || ''}</p>
                        <p class="album-track-count">${albumData.tracks.items.length} canciones</p>
                    </div>
                </div>
                
                <div class="album-tracks-container">
                    <button class="back-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                        </svg>
                        Volver a los Álbumes
                    </button>
                    
                    <div class="tracks-list"></div>
                </div>
            </div>
            <div class="audio-player-container" style="display: none;">
                <audio id="audio-player" controls></audio>
                <div class="now-playing">
                    <span class="now-playing-text">Reproduciendo:</span>
                    <span class="now-playing-title"></span>
                </div>
            </div>
        `;
    
        audioPlayer = document.getElementById("audio-player");
        const backButton = document.querySelector(".back-button");
        backButton.addEventListener("click", () => {
            if (currentArtist) {
                const artistId = currentArtist.uri.split(":")[2];
                displayArtistContent(currentArtist, artistId);
            }
        });
    
        const tracksList = document.querySelector(".tracks-list");
        
        if (!albumData.tracks || !albumData.tracks.items || albumData.tracks.items.length === 0) {
            tracksList.innerHTML = "<p class='no-tracks'>No hay canciones disponibles para este álbum.</p>";
        } else {
            albumData.tracks.items.forEach((item, index) => {
                const track = item.track;
                const trackElement = document.createElement("div");
                trackElement.classList.add("track-item");
                trackElement.dataset.trackId = track.uri;
                
                // Icono de reproducción/pausa
                const playIcon = document.createElement("div");
                playIcon.classList.add("play-icon");
                playIcon.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                    </svg>
                `;
                
                trackElement.innerHTML = `
                    <div class="track-number">${index + 1}</div>
                    <div class="track-info">
                        <div class="track-name">${track.name}</div>
                        <div class="track-artist">${track.artists.items.map(a => a.profile.name).join(', ')}</div>
                    </div>
                    <div class="track-duration">${formatDuration(track.duration.totalMilliseconds)}</div>
                `;
                
                // Insertar el icono de reproducción
                trackElement.insertBefore(playIcon, trackElement.querySelector(".track-info"));
                
                // Manejar clic en la canción
                trackElement.addEventListener("click", () => {
                    if (item.previewUrl) {
                        togglePlayPreview(item.previewUrl, track.name, track.uri, trackElement);
                    } else {
                        alert("No hay vista previa disponible para esta canción");
                    }
                });
                
                tracksList.appendChild(trackElement);
            });
        }
    }
    
    function togglePlayPreview(previewUrl, trackName, trackId, trackElement) {
        const audioContainer = document.querySelector(".audio-player-container");
        const nowPlayingTitle = document.querySelector(".now-playing-title");
        
        if (!audioPlayer) return;
        
        // Si ya está reproduciendo esta canción, pausar
        if (currentlyPlaying === trackId && !audioPlayer.paused) {
            audioPlayer.pause();
            updatePlayIcon(trackElement, false);
            return;
        }
        
        // Si es una canción diferente o está pausada, reproducir
        audioPlayer.src = previewUrl;
        audioPlayer.play()
            .then(() => {
                currentlyPlaying = trackId;
                audioContainer.style.display = "block";
                nowPlayingTitle.textContent = trackName;
                
                // Actualizar todos los íconos de reproducción
                document.querySelectorAll(".track-item").forEach(item => {
                    const icon = item.querySelector(".play-icon");
                    if (item.dataset.trackId === trackId) {
                        updatePlayIcon(item, true);
                    } else {
                        updatePlayIcon(item, false);
                    }
                });
            })
            .catch(error => {
                console.error("Error al reproducir:", error);
            });
        
        // Evento cuando termina la reproducción
        audioPlayer.onended = () => {
            updatePlayIcon(trackElement, false);
            currentlyPlaying = null;
        };
    }
    
    function updatePlayIcon(trackElement, isPlaying) {
        const playIcon = trackElement.querySelector(".play-icon");
        if (!playIcon) return;
        
        if (isPlaying) {
            playIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                </svg>
            `;
            playIcon.style.opacity = "1";
        } else {
            playIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                </svg>
            `;
            playIcon.style.opacity = trackElement.matches(":hover") ? "1" : "0";
        }
    }
    
    function formatDuration(ms) {
        if (!ms) return '0:00';
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    async function fetchTopTracks(artistId, container) {
        const url = `https://spotify23.p.rapidapi.com/artist_top_tracks/?id=${artistId}&offset=0&limit=10`;

        const options = {
            method: "GET",
            headers: {
          		'x-rapidapi-key': 'b3a8c92d98msh0ed50a90cd81b24p15f957jsn7da371103418',
		'x-rapidapi-host': 'spotify23.p.rapidapi.com'
	}
};
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            // Obtener previews de las canciones
            const trackIds = data.data.artist.discography.topTracks.items.map(item => item.track.uri.split(':')[2]).join(',');
            const previewResponse = await fetch(`https://spotify23.p.rapidapi.com/tracks/?ids=${trackIds}`, options);
            const previewData = await previewResponse.json();
            
            const tracksWithPreviews = data.data.artist.discography.topTracks.items.map(item => {
                const previewTrack = previewData.tracks.find(t => t.uri === item.track.uri);
                return {
                    ...item,
                    previewUrl: previewTrack?.preview_url || null
                };
            });
            
            displayTracks(tracksWithPreviews, container);
        } catch (error) {
            console.error("Error al obtener las canciones:", error);
        }
    }

    function displayTracks(tracks, container) {
        const tracksContainer = document.createElement("div");
        tracksContainer.classList.add("tracks-container");
        const tracksTitle = document.createElement("h2");
        tracksTitle.textContent = "Canciones Populares";
        tracksContainer.appendChild(tracksTitle);

        tracks.forEach(track => {
            const trackElement = document.createElement("div");
            trackElement.classList.add("track-item");
            trackElement.dataset.trackId = track.track.uri;
            
            // Icono de reproducción/pausa
            const playIcon = document.createElement("div");
            playIcon.classList.add("play-icon");
            playIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                </svg>
            `;
            
            trackElement.innerHTML = `
                <img src="${track.track.albumOfTrack.coverArt.sources[0]?.url}" alt="Cover">
                <div class="track-info">
                    <p class="track-name">${track.track.name}</p>
                    <p class="track-album">${track.track.albumOfTrack.name}</p>
                </div>
            `;
            
            trackElement.insertBefore(playIcon, trackElement.querySelector(".track-info"));
            
                trackElement.addEventListener("click", () => {
                if (track.previewUrl) {
                    togglePlayPreview(track.previewUrl, track.track.name, track.track.uri, trackElement);
                } else {
                    alert("No hay vista previa disponible para esta canción");
                }
            });
            
            tracksContainer.appendChild(trackElement);
        });
        
        const contentContainer = container || document.querySelector(".content-container");
        if (contentContainer) {
            contentContainer.appendChild(tracksContainer);
        }
    }
});