class PremiumWeatherApp {
    constructor() {
        this.currentWeather = null;
        this.forecastData = null;
        this.airQuality = null;
        this.uvIndex = null;
        this.settings = this.loadSettings();
        this.lottieAnimations = {};
        this.suggestionTimeout = null; // ✅ Added for debouncing
        
        // ✅ COMFORT LEVELS DATA
        this.comfortLevels = {
            extreme_cold: { min: -50, max: 0, text: "Freezing", color: "#4fc3f7" },
            cold: { min: 0, max: 15, text: "Cold", color: "#81d4fa" },
            mild: { min: 15, max: 25, text: "Pleasant", color: "#4caf50" },
            warm: { min: 25, max: 35, text: "Warm", color: "#ffb74d" },
            hot: { min: 35, max: 45, text: "Hot", color: "#ff7043" },
            extreme_hot: { min: 45, max: Infinity, text: "Extreme Heat", color: "#c62828" }
        };
        
        this.loadingMessages = [
            '☀️ Fetching weather...',
            '🌤️ Almost there...',
            '⛅ Getting your location...',
            '📍 Finding data...',
            '🌍 Loading weather data...'
        ];
        this.initializeApp();
    }

    initializeApp() {
        console.log('🚀 WeatherHub App Initializing...');
        this.setupEventListeners();
        this.applyTheme();
        this.applySettings();
        this.loadRecentSearches();
        this.loadFavorites();
        this.getWeatherByCity(API_CONFIG.defaultCity);
        this.setupKeyboardShortcuts();
        this.checkResponsive();
        window.addEventListener('resize', () => this.checkResponsive());
    }

    setupEventListeners() {
        // SEARCH
        $('#search-btn').on('click', () => this.handleSearch());
        $('#city-input').on('keypress', (e) => {
            if (e.which === 13) this.handleSearch();
        });
        $('#city-input').on('input', (e) => this.handleSearchInput(e));
        $('#city-input').on('focus', () => this.showRecentSearches());

        // RECENT SEARCHES
        $(document).on('click', '#clear-recent', () => this.clearRecentSearches());

        // LOCATION
        $('#location-btn').on('click', () => this.getCurrentLocation());

        // NAVIGATION
        $('.nav-item, .bottom-nav-item').on('click', (e) => this.handleNavigation(e));

        // THEME
        $('#theme-toggle').on('click', () => this.toggleTheme());
        $('#theme-select').on('change', (e) => this.updateSetting('theme', e.target.value));

        // SETTINGS
        $('#temp-unit').on('change', (e) => this.updateSetting('tempUnit', e.target.value));
        $('#wind-unit').on('change', (e) => this.updateSetting('windUnit', e.target.value));
        $('#notifications-toggle').on('change', (e) => this.updateSetting('notificationsEnabled', e.target.checked));

        // ERROR CARD
        $('.error-close').on('click', () => this.hideError());

        // CHANGE LOCATION
        $('.btn-change-location').on('click', () => {
            $('#city-input').focus();
            $('#city-input').select();
        });

        // SHORTCUTS
        $(document).on('click', '.close-shortcuts', () => this.hideShortcuts());

        // CLOSE DROPDOWNS
        $(document).on('click', (e) => {
            if (!$(e.target).closest('.search-wrapper').length) {
                $('#search-suggestions, #recent-searches').addClass('hidden');
            }
        });

        // FAVORITES
        $(document).on('click', '.favorite-star', (e) => this.toggleFavorite(e));
        $(document).on('click', '.add-favorite-btn', () => this.addCurrentCityToFavorites());
    }

    setupKeyboardShortcuts() {
        $(document).on('keydown', (e) => {
            // Ctrl + K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                $('#city-input').focus();
                this.showRecentSearches();
            }
            
            // Esc to close
            if (e.key === 'Escape') {
                $('#search-suggestions, #recent-searches, #shortcuts-info').addClass('hidden');
            }
        });
    }

    handleSearch() {
        const city = $('#city-input').val().trim();
        if (city) {
            this.addToRecentSearches(city);
            this.getWeatherByCity(city);
            $('#city-input').val('');
            $('#search-suggestions, #recent-searches').addClass('hidden');
        }
    }

    // ✅ REPLACED: Search Input with Debouncing
    handleSearchInput(e) {
        const input = $(e.target).val().trim();

        clearTimeout(this.suggestionTimeout);

        if (input.length < 2) {
            $('#search-suggestions').addClass('hidden');
            return;
        }

        // debounce (prevents too many API calls while typing)
        this.suggestionTimeout = setTimeout(() => {
            this.showSuggestions(input);
        }, 300);
    }

    // ✅ NEW: Fetch City Suggestions from API
    async fetchCitySuggestions(query) {
        if (!query || query.length < 2) return [];

        try {
            // Using absolute URL to prevent baseUrl issue
            const res = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_CONFIG.apiKey}`
            );

            const data = await res.json();

            return data.map(place => {
                const stateText = place.state ? `${place.state}, ` : "";
                return {
                    name: place.name,
                    state: place.state || "",
                    country: place.country,
                    // Formats as: "Tirupati, Andhra Pradesh, IN"
                    fullName: `${place.name}, ${stateText}${place.country}`
                };
            });

        } catch (err) {
            console.error("Autocomplete error:", err);
            return [];
        }
    }

    // ✅ REPLACED: Show Suggestions dynamically
    async showSuggestions(input) {
        const suggestions = await this.fetchCitySuggestions(input);

        if (!suggestions.length) {
            $('#search-suggestions').addClass('hidden');
            return;
        }

        const html = suggestions.map(city => `
            <div class="suggestion-item" data-city="${city.fullName}">
                <i class="fas fa-map-pin"></i>
                <span class="suggestion-text">${city.fullName}</span>
            </div>
        `).join('');

        $('#search-suggestions')
            .html(html)
            .removeClass('hidden');

        // Click handler for suggestions
        $('#search-suggestions .suggestion-item').on('click', (e) => {
            const city = $(e.currentTarget).data('city');

            this.addToRecentSearches(city);
            this.getWeatherByCity(city);

            $('#city-input').val('');
            $('#search-suggestions').addClass('hidden');
        });
    }

    showRecentSearches() {
        const recent = this.settings.recentSearches || [];
        if (recent.length === 0) {
            $('#recent-searches').addClass('hidden');
            return;
        }

        const html = `
            <div class="recent-header">
                <span><i class="fas fa-history"></i> Recent Searches</span>
                <button id="clear-recent" class="clear-btn">Clear</button>
            </div>
            <div class="recent-list">
                ${recent.slice(0, 8).map(city => `
                    <div class="recent-item" data-city="${city}">
                        <i class="fas fa-history"></i>
                        <span>${city}</span>
                    </div>
                `).join('')}
            </div>
        `;

        $('#recent-searches').html(html).removeClass('hidden');

        $('#recent-searches .recent-item').on('click', (e) => {
            const city = $(e.currentTarget).data('city');
            this.getWeatherByCity(city);
            $('#city-input').val('');
            $('#recent-searches').addClass('hidden');
        });
    }

    addToRecentSearches(city) {
        let recent = this.settings.recentSearches || [];
        recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
        recent.unshift(city);
        recent = recent.slice(0, 10);
        this.settings.recentSearches = recent;
        this.saveSettings();
    }

    clearRecentSearches() {
        this.settings.recentSearches = [];
        this.saveSettings();
        $('#recent-searches').addClass('hidden');
    }

    loadRecentSearches() {
        const recent = this.settings.recentSearches || [];
        console.log('📚 Recent Searches Loaded:', recent);
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('❌ Geolocation Unavailable', 'Your browser does not support geolocation');
            return;
        }

        this.showLoading(true, '📍 Getting your location...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log('✅ Location Found:', latitude, longitude);
                this.getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                let message = 'Could not get location';
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Location permission denied. Please enable in settings.';
                }
                this.showError('📍 Location Error', message);
                this.showLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    async getWeatherByCoordinates(lat, lon) {
        try {
            const response = await fetch(
                `${API_CONFIG.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${API_CONFIG.apiKey}&units=${API_CONFIG.units}`
            );
            const data = await response.json();
            this.currentWeather = data;
            
            await Promise.all([
                this.getForecastData(lat, lon),
                this.getAirQualityData(lat, lon),
                this.getUVIndexData(lat, lon)
            ]);
            
            this.updateWeatherDisplay();
            this.updateForecastDisplay();
            this.updateNotifications();
            this.setWeatherBackground();
            this.showLoading(false);
        } catch (error) {
            console.error('Error:', error);
            this.showError('❌ Error', 'Could not fetch weather data');
            this.showLoading(false);
        }
    }

    // ✅ REPLACED: Updated to use Geo API first (Fixes small towns like Kedarnath)
    async getWeatherByCity(city) {
        this.showLoading(true, this.getRandomLoadingMessage());

        try {
            // GEO API FIRST 
            const geoRes = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_CONFIG.apiKey}`
            );

            const geoData = await geoRes.json();

            if (!geoData || !geoData.length) {
                throw new Error("Location not found");
            }

            const { lat, lon, name, country } = geoData[0];

            const weatherRes = await fetch(
                `${API_CONFIG.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${API_CONFIG.apiKey}&units=${API_CONFIG.units}`
            );

            if (!weatherRes.ok) {
                throw new Error("Weather data not found");
            }

            const data = await weatherRes.json();
            
            // Override name to ensure beautiful capitalization from GEO Api
            data.name = name; 
            data.sys.country = country;
            
            this.currentWeather = data;

            await Promise.all([
                this.getForecastData(lat, lon),
                this.getAirQualityData(lat, lon),
                this.getUVIndexData(lat, lon)
            ]);

            this.updateWeatherDisplay();
            this.updateForecastDisplay();
            this.updateNotifications();
            this.setWeatherBackground();

            this.hideError();
            this.showLoading(false);

        } catch (error) {
            console.error(error);
            this.showError("City Not Found", `"${city}" not found`);
            this.showLoading(false);
        }
    }

    async getForecastData(lat, lon) {
        try {
            const response = await fetch(
                `${API_CONFIG.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${API_CONFIG.apiKey}&units=${API_CONFIG.units}`
            );
            this.forecastData = await response.json();
            return this.forecastData;
        } catch (error) {
            console.error('Error fetching forecast:', error);
        }
    }

    async getAirQualityData(lat, lon) {
        try {
            const response = await fetch(
                `${API_CONFIG.baseUrl}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_CONFIG.apiKey}`
            );
            this.airQuality = await response.json();
            return this.airQuality;
        } catch (error) {
            console.error('Error fetching air quality:', error);
        }
    }

    async getUVIndexData(lat, lon) {
        try {
            const response = await fetch(
                `${API_CONFIG.baseUrl}/uvi?lat=${lat}&lon=${lon}&appid=${API_CONFIG.apiKey}`
            );
            this.uvIndex = await response.json();
            return this.uvIndex;
        } catch (error) {
            console.error('Error fetching UV index:', error);
        }
    }

    updateWeatherDisplay() {
        const weather = this.currentWeather;
        const main = weather.main;
        const sys = weather.sys;
        const wind = weather.wind;

        // Location & Time
        $('#city-name').text(`${weather.name}, ${weather.sys.country}`);
        $('#date-time').text(moment().format('dddd, MMMM Do YYYY • h:mm A'));
        $('#update-time').text('just now');

        // Main Weather
        const temp = this.convertTemp(main.temp);
        const feelsLike = this.convertTemp(main.feels_like);
        const tempHigh = this.convertTemp(main.temp_max);
        const tempLow = this.convertTemp(main.temp_min);
        const tempUnit = this.getTempUnit();
        
        $('#temperature').text(`${Math.round(temp)}°${tempUnit}`);
        $('#temp-high').text(`${Math.round(tempHigh)}°`);
        $('#temp-low').text(`${Math.round(tempLow)}°`);
        $('#description').text(weather.weather[0].main);
        
        // COMFORT LEVEL
        const comfort = this.getComfortLevel(temp);
        $('#feels-like').html(`
            Feels like <strong>${Math.round(feelsLike)}°${tempUnit}</strong> 
            <span style="color: ${comfort.color};">• ${comfort.text}</span>
        `);

        // Lottie Animation
        this.renderLottieAnimation(weather.weather[0].main, sys.sunset, sys.sunrise);

        // Weather Details
        $('#humidity').text(`${main.humidity}%`);
        $('#pressure').text(`${main.pressure} hPa`);
        $('#visibility').text(`${(weather.visibility / 1000).toFixed(1)} km`);
        
        const windSpeed = this.convertWindSpeed(wind.speed);
        const windDir = this.getWindDirection(wind.deg);
        $('#wind-speed').text(`${windSpeed} ${this.getWindUnit()}`);
        $('#wind-direction').text(windDir);

        // Sunrise & Sunset
        $('#sunrise-time').text(moment(sys.sunrise * 1000).format('h:mm A'));
        $('#sunset-time').text(moment(sys.sunset * 1000).format('h:mm A'));

        // Update Sidebar
        this.updateSidebarLocation(weather.name, weather.sys.country);

        // Air Quality
        this.updateAirQualityDisplay();

        // UV Index
        this.updateUVIndexDisplay();

        // Precipitation
        this.updatePrecipitation();
    }

    renderLottieAnimation(description, sunset, sunrise) {
        const sunsetHour = moment(sunset * 1000).hour();
        const sunriseHour = moment(sunrise * 1000).hour();
        const currentHour = moment().hour();
        const isNight = currentHour < sunriseHour || currentHour > sunsetHour;

        let animationType = 'sunny';
        
        if (isNight) {
            animationType = 'night';
        } else if (description.toLowerCase().includes('rain')) {
            animationType = 'rainy';
        } else if (description.toLowerCase().includes('cloud')) {
            animationType = 'cloudy';
        } else if (description.toLowerCase().includes('thunderstorm')) {
            animationType = 'stormy';
        } else if (description.toLowerCase().includes('snow')) {
            animationType = 'snowy';
        }

        const container = document.getElementById('weather-icon-container');
        container.innerHTML = '';

        if (lottie && LOTTIE_ANIMATIONS[animationType]) {
            try {
                lottie.loadAnimation({
                    container: container,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    path: LOTTIE_ANIMATIONS[animationType]
                });
            } catch (e) {
                // Fallback to emoji if Lottie fails
                const emojis = {
                    'sunny': '☀️',
                    'cloudy': '☁️',
                    'rainy': '🌧️',
                    'stormy': '⛈️',
                    'snowy': '❄️',
                    'night': '🌙'
                };
                container.innerHTML = `<span style="font-size: 100px;">${emojis[animationType]}</span>`;
            }
        }
    }

    setWeatherBackground() {
        const description = this.currentWeather.weather[0].main.toLowerCase();
        const sunset = this.currentWeather.sys.sunset;
        const sunrise = this.currentWeather.sys.sunrise;
        const sunsetHour = moment(sunset * 1000).hour();
        const sunriseHour = moment(sunrise * 1000).hour();
        const currentHour = moment().hour();
        const isNight = currentHour < sunriseHour || currentHour > sunsetHour;

        // Remove all weather classes
        $('body').removeClass('weather-sunny weather-cloudy weather-rainy weather-stormy weather-night');

        if (isNight) {
            $('body').addClass('weather-night');
        } else if (description.includes('rain')) {
            $('body').addClass('weather-rainy');
        } else if (description.includes('cloud')) {
            $('body').addClass('weather-cloudy');
        } else if (description.includes('thunderstorm')) {
            $('body').addClass('weather-rainy');
        } else if (description.includes('clear') || description.includes('sunny')) {
            $('body').addClass('weather-sunny');
        }
    }

    getComfortLevel(temp) {
        for (const [key, level] of Object.entries(this.comfortLevels)) {
            if (temp >= level.min && temp < level.max) {
                return level;
            }
        }
        return this.comfortLevels.extreme_hot;
    }

    getWindDirection(degrees) {
        const directions = ['↑ N', '↗ NNE', '→ NE', '↗ ENE', '→ E', '↘ ESE', '→ SE', '↘ SSE',
                          '↓ S', '↙ SSW', '← SW', '↙ WSW', '← W', '↖ WNW', '← NW', '↖ NNW'];
        const index = Math.round((degrees % 360) / 22.5);
        return directions[index % 16];
    }

    updateAirQualityDisplay() {
        if (!this.airQuality) return;

        const aqi = this.airQuality.list[0].main.aqi;
        const pm25 = this.airQuality.list[0].components.pm2_5;
        const pm10 = this.airQuality.list[0].components.pm10;
        const aqiLevel = AQI_LEVELS[aqi] || AQI_LEVELS[3];

        const html = `
            <p class="air-quality-emoji">${aqiLevel.emoji}</p>
            <p style="color: ${aqiLevel.color}; margin: 0; font-weight: 700;">${aqiLevel.name}</p>
            <p style="font-size: 12px; color: var(--text-light); margin: 5px 0 0 0;">AQI ${aqi}</p>
            <div class="air-quality-details">
                <div class="aq-detail">
                    <span class="aq-label">PM2.5</span>
                    <span class="aq-value">${pm25.toFixed(1)} µg/m³</span>
                </div>
                <div class="aq-detail">
                    <span class="aq-label">PM10</span>
                    <span class="aq-value">${pm10.toFixed(1)} µg/m³</span>
                </div>
            </div>
        `;

        $('#air-quality').html(html);
    }

    updateUVIndexDisplay() {
        if (!this.uvIndex) return;

        const uv = this.uvIndex.value;
        let level = UV_LEVELS[0];

        for (let key in UV_LEVELS) {
            if (uv >= UV_LEVELS[key].min && uv <= UV_LEVELS[key].max) {
                level = UV_LEVELS[key];
                break;
            }
        }

        const percentage = Math.min((uv / 11) * 100, 100);
        
        $('#uv-index').html(`
            <div class="uv-scale">
                <div class="uv-bar">
                    <div class="uv-indicator" style="left: ${percentage}%;"></div>
                </div>
            </div>
            <p class="uv-value" style="color: ${level.color}; font-weight: 700;">${uv.toFixed(1)} - ${level.name}</p>
        `);
    }

    updatePrecipitation() {
        if (!this.forecastData) return;

        const nextForecast = this.forecastData.list[0];
        const rainChance = nextForecast.pop ? (nextForecast.pop * 100).toFixed(0) : 0;
        const rainTime = moment(nextForecast.dt * 1000).format('h:mm A');

        $('#precipitation').html(`
            <p class="precip-percent">${rainChance}%</p>
            <p class="precip-time">🌧️ Expected at ${rainTime}</p>
        `);
    }

    updateForecastDisplay() {
        if (!this.forecastData) return;

        const forecasts = this.forecastData.list;
        
        // HOURLY FORECAST
        const hourlyHTML = forecasts.slice(0, 8).map(forecast => {
            const time = moment(forecast.dt * 1000);
            const temp = this.convertTemp(forecast.main.temp);
            const iconCode = forecast.weather[0].icon;
            const humidity = forecast.main.humidity;
            const windSpeed = this.convertWindSpeed(forecast.wind.speed);

            return `
                <div class="hourly-item">
                    <p class="time">${time.format('h A')}</p>
                    <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Weather">
                    <p class="temp">${Math.round(temp)}°</p>
                    <p class="humidity"><i class="fas fa-droplet"></i> ${humidity}%</p>
                    <p class="wind"><i class="fas fa-wind"></i> ${windSpeed}</p>
                </div>
            `;
        }).join('');

        $('#hourly-forecast').html(hourlyHTML);

        // 7-DAY FORECAST
        const dailyForecasts = {};
        forecasts.forEach(forecast => {
            const day = moment(forecast.dt * 1000).format('YYYY-MM-DD');
            if (!dailyForecasts[day]) {
                dailyForecasts[day] = [];
            }
            dailyForecasts[day].push(forecast);
        });

        const weeklyHTML = Object.keys(dailyForecasts).slice(0, 7).map(day => {
            const dayForecasts = dailyForecasts[day];
            const maxTemp = Math.max(...dayForecasts.map(f => f.main.temp));
            const minTemp = Math.min(...dayForecasts.map(f => f.main.temp));
            const iconCode = dayForecasts[4]?.weather[0].icon || dayForecasts[0].weather[0].icon;
            const condition = dayForecasts[4]?.weather[0].main || dayForecasts[0].weather[0].main;
            const rainChance = Math.max(...dayForecasts.map(f => (f.pop || 0) * 100));

            return `
                <div class="weekly-item">
                    <div class="day">${moment(day).format('ddd')}</div>
                    <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Weather">
                    <div class="condition">${condition}</div>
                    <div class="temp-range">
                        <span class="high">${Math.round(this.convertTemp(maxTemp))}°</span>
                        <span class="low">${Math.round(this.convertTemp(minTemp))}°</span>
                    </div>
                    ${rainChance > 0 ? `<div class="rain-chance">🌧️ ${rainChance.toFixed(0)}%</div>` : ''}
                </div>
            `;
        }).join('');

        $('#weekly-forecast').html(weeklyHTML);
    }

    updateNotifications() {
        const temp = this.currentWeather.main.temp;
        let html = '';

        const comfort = this.getComfortLevel(temp);
        
        if (comfort.text === 'Extreme Heat' || comfort.text === 'Hot') {
            html += `
                <div class="notification-card heat animate__animated animate__slideInDown">
                    <i class="fas fa-fire"></i>
                    <div>
                        <strong>🔥 ${comfort.text}</strong>
                        <p style="color: ${comfort.color};">Temperature is ${comfort.text.toLowerCase()}. Stay safe!</p>
                    </div>
                </div>
            `;
        }

        const rainChance = this.forecastData?.list[0].pop || 0;
        if (rainChance > 0.5) {
            html += `
                <div class="notification-card rain animate__animated animate__slideInDown">
                    <i class="fas fa-umbrella"></i>
                    <div>
                        <strong>☔ Rain Expected</strong>
                        <p>Carry an umbrella before going out</p>
                    </div>
                </div>
            `;
        }

        if (comfort.text === 'Freezing' || comfort.text === 'Cold') {
            html += `
                <div class="notification-card cold animate__animated animate__slideInDown">
                    <i class="fas fa-snowflake"></i>
                    <div>
                        <strong>❄️ ${comfort.text}</strong>
                        <p style="color: ${comfort.color};">Bundle up! It's ${comfort.text.toLowerCase()}.</p>
                    </div>
                </div>
            `;
        }

        $('#notifications-row').html(html);

        const count = html.match(/notification-card/g)?.length || 0;
        $('.notification-badge').text(count);
    }

    updateSidebarLocation(city, country) {
        $('#sidebar-location-display').html(`
            <p><strong>${city}</strong></p>
            <p style="font-size: 12px; color: var(--text-light);">${country}</p>
        `);
    }

    handleNavigation(e) {
        e.preventDefault();
        
        $('.nav-item, .bottom-nav-item').removeClass('active');
        $(e.currentTarget).addClass('active');

        $('.section').removeClass('active');
        
        const sectionId = $(e.currentTarget).attr('href');
        $(sectionId).addClass('active');
    }

    // FAVORITES FUNCTIONS
    addCurrentCityToFavorites() {
        if (!this.currentWeather) {
            this.showError('No City Selected', 'Please search for a city first');
            return;
        }

        const cityName = this.currentWeather.name;
        if (this.settings.favorites.includes(cityName)) {
            this.showError('Already Favorited', `${cityName} is already in your favorites`);
            return;
        }

        this.settings.favorites.push(cityName);
        this.saveSettings();
        this.loadFavorites();
        console.log('⭐ Added to favorites:', cityName);
    }

    toggleFavorite(e) {
        e.stopPropagation();
        const city = $(e.currentTarget).closest('.favorite-item').data('city');
        const index = this.settings.favorites.indexOf(city);
        
        if (index > -1) {
            this.settings.favorites.splice(index, 1);
        } else {
            this.settings.favorites.push(city);
        }
        
        this.saveSettings();
        this.loadFavorites();
    }

    loadFavorites() {
        const favorites = this.settings.favorites || [];
        
        if (favorites.length === 0) {
            $('#favorites-list').html(`
                <div class="empty-favorites">
                    <i class="fas fa-star"></i>
                    <p>No favorite cities yet. Add one to get started!</p>
                </div>
            `);
            return;
        }

        const html = favorites.map(city => `
            <div class="favorite-item" data-city="${city}">
                <div class="favorite-star">
                    <i class="fas fa-star"></i>
                </div>
                <div class="favorite-city">${city}</div>
                <div class="favorite-temp">--°</div>
                <div class="favorite-desc">Click to view</div>
            </div>
        `).join('');

        $('#favorites-list').html(html);

        $(document).on('click', '.favorite-item', (e) => {
            if (!$(e.target).closest('.favorite-star').length) {
                const city = $(e.currentTarget).data('city');
                this.getWeatherByCity(city);
                this.handleNavigation({
                    preventDefault: () => {},
                    currentTarget: $('[data-section="overview"]')[0]
                });
            }
        });
    }

    // CONVERSION FUNCTIONS
    convertTemp(temp) {
        if (this.settings.tempUnit === 'imperial') {
            return (temp * 9/5) + 32;
        }
        return temp;
    }

    convertWindSpeed(speed) {
        switch (this.settings.windUnit) {
            case 'kmh':
                return (speed * 3.6).toFixed(1);
            case 'mph':
                return (speed * 2.237).toFixed(1);
            default:
                return speed.toFixed(1);
        }
    }

    getTempUnit() {
        return this.settings.tempUnit === 'metric' ? 'C' : 'F';
    }

    getWindUnit() {
        switch (this.settings.windUnit) {
            case 'kmh': return 'km/h';
            case 'mph': return 'mph';
            default: return 'm/s';
        }
    }

    // THEME FUNCTIONS
    toggleTheme() {
        $('body').toggleClass('dark-mode');
        const isDarkMode = $('body').hasClass('dark-mode');
        this.settings.theme = isDarkMode ? 'dark' : 'light';
        this.saveSettings();
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const isDarkMode = $('body').hasClass('dark-mode');
        $('#theme-toggle i').removeClass('fa-moon fa-sun').addClass(isDarkMode ? 'fa-sun' : 'fa-moon');
    }

    applyTheme() {
        const theme = this.settings.theme;
        if (theme === 'dark' || (theme === 'auto' && this.prefersDarkMode())) {
            $('body').addClass('dark-mode');
        }
        this.updateThemeIcon();
    }

    prefersDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // SETTINGS FUNCTIONS
    applySettings() {
        $('#temp-unit').val(this.settings.tempUnit);
        $('#wind-unit').val(this.settings.windUnit);
        $('#theme-select').val(this.settings.theme);
        $('#notifications-toggle').prop('checked', this.settings.notificationsEnabled);
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        
        if (key === 'tempUnit' || key === 'windUnit') {
            if (this.currentWeather) {
                this.updateWeatherDisplay();
                this.updateForecastDisplay();
            }
        }
        
        if (key === 'theme') {
            this.applyTheme();
        }
    }

    // STORAGE FUNCTIONS
    saveSettings() {
        localStorage.setItem('weatherAppSettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('weatherAppSettings');
        return saved ? JSON.parse(saved) : { ...DEFAULT_SETTINGS };
    }

    // UI FUNCTIONS
    showError(title, message) {
        $('#error-title').text(title);
        $('#error-message').text(message);
        $('#error-card').removeClass('hidden');
        
        setTimeout(() => this.hideError(), 6000);
    }

    hideError() {
        $('#error-card').addClass('hidden');
    }

    showLoading(show, message = 'Fetching weather data...') {
        if (show) {
            $('#loading-message').text(message);
            $('#loading-skeleton').removeClass('hidden');
        } else {
            $('#loading-skeleton').addClass('hidden');
        }
    }

    hideShortcuts() {
        $('#shortcuts-info').addClass('hidden');
    }

    getRandomLoadingMessage() {
        return this.loadingMessages[Math.floor(Math.random() * this.loadingMessages.length)];
    }

    checkResponsive() {
        const width = $(window).width();
        if (width <= 1024) {
            $('.bottom-nav').removeClass('hidden');
            $('.sidebar').hide();
        } else {
            $('.bottom-nav').addClass('hidden');
            $('.sidebar').show();
        }
    }
}

// ==================== INITIALIZE APP ====================
$(document).ready(() => {
    console.log('🎉 DOM Ready - Starting WeatherHub');
    window.weatherApp = new PremiumWeatherApp();
});