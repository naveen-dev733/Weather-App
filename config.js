// ==================== API CONFIGURATION ====================
const API_CONFIG = {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: 'f00c38e0279b7bc85480c3fe775d518c',
    defaultCity: 'Tirupati',
    units: 'metric'
};

// ==================== WIND DIRECTIONS ====================
const WIND_DIRECTIONS = {
    0: '↑ N', 1: '↗ NNE', 2: '→ NE', 3: '↗ ENE',
    4: '→ E', 5: '↘ ESE', 6: '→ SE', 7: '↘ SSE',
    8: '↓ S', 9: '↙ SSW', 10: '← SW', 11: '↙ WSW',
    12: '← W', 13: '↖ WNW', 14: '← NW', 15: '↖ NNW'
};

// ==================== AIR QUALITY LEVELS ====================
const AQI_LEVELS = {
    1: { name: 'Good', color: '#4CAF50', emoji: '😊' },
    2: { name: 'Fair', color: '#8BC34A', emoji: '🙂' },
    3: { name: 'Moderate', color: '#FF9800', emoji: '😐' },
    4: { name: 'Poor', color: '#F44336', emoji: '😷' },
    5: { name: 'Very Poor', color: '#9C27B0', emoji: '😤' }
};

// ==================== UV INDEX LEVELS ====================
const UV_LEVELS = {
    0: { name: 'Safe', color: '#4CAF50', min: 0, max: 2 },
    1: { name: 'Safe', color: '#4CAF50', min: 2, max: 3 },
    2: { name: 'Moderate', color: '#FFC107', min: 3, max: 5 },
    3: { name: 'High', color: '#FF9800', min: 5, max: 7 },
    4: { name: 'Very High', color: '#F44336', min: 7, max: 10 },
    5: { name: 'Extreme', color: '#9C27B0', min: 10, max: Infinity }
};

// ==================== COMFORT LEVELS ====================
const COMFORT_LEVELS = {
    extreme_hot: { text: 'Extreme Heat', color: '#FF5252', min: 45 },
    very_hot: { text: 'Very Hot', color: '#FF9800', min: 40 },
    hot: { text: 'Hot', color: '#FFA726', min: 35 },
    warm: { text: 'Warm', color: '#FFB74D', min: 25 },
    comfortable: { text: 'Comfortable', color: '#4CAF50', min: 15 },
    cool: { text: 'Cool', color: '#2196F3', min: 5 },
    cold: { text: 'Cold', color: '#1565C0', min: -10 },
    extreme_cold: { text: 'Extreme Cold', color: '#0D47A1', min: -50 }
};

// ==================== SUGGESTION CITIES ====================
const SUGGESTION_CITIES = [
    'London', 'New York', 'Tokyo', 'Dubai', 'Singapore',
    'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
    'Paris', 'Sydney', 'Toronto', 'Berlin', 'Bangkok',
    'Istanbul', 'Madrid', 'Rome', 'Amsterdam', 'Barcelona',
    'Kolkata', 'Pune', 'Jaipur', 'Ahmedabad', 'Lucknow',
    'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Miami'
];

// ==================== DEFAULT SETTINGS ====================
const DEFAULT_SETTINGS = {
    tempUnit: 'metric',
    windUnit: 'ms',
    timeFormat: '24h',
    theme: 'auto',
    notificationsEnabled: true,
    favorites: [],
    recentSearches: []
};

// ==================== LOTTIE ANIMATIONS ====================
const LOTTIE_ANIMATIONS = {
    sunny: 'https://lottie.host/e8a5ba64-7cb8-4f0e-a30f-5e8d9fffd8f1/8dv3HWfnq1.json',
    cloudy: 'https://lottie.host/8a3dab35-ef50-44a3-b957-5d6e2de25a61/vF6Ks60VBc.json',
    rainy: 'https://lottie.host/13c9e29c-f64e-4b55-9c5b-2c76a47c0d2e/t9Z8nVZPFh.json',
    stormy: 'https://lottie.host/a74ff5c4-d2f2-4a5e-8dd6-f0dbc96bf88b/i0CKV2JIId.json',
    snowy: 'https://lottie.host/bfc77be9-8c52-4dd7-a1ac-1ab1b7e7d79c/R5YCj7i9xh.json',
    night: 'https://lottie.host/42419a08-c020-4bb1-954c-cbb27fa23e1c/yqC9wE1gFc.json'
};