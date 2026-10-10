// Live Environmental Telemetry Service
// Automatically fetches real-time temperature, precipitation, and conditions via Open-Meteo
// and derives live temporal constraints (hour, day of week, lunch window).

const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function mapWmoCodeToCondition(code) {
  if (code === 0) return 'clear / sunny';
  if (code >= 1 && code <= 3) return 'partly cloudy';
  if (code >= 45 && code <= 48) return 'foggy';
  if (code >= 51 && code <= 55) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rainy';
  if (code >= 80 && code <= 82) return 'rain showers';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'sunny';
}

export const weatherService = {
  async getLiveWeather(lat = 12.9353, lng = 77.62377) {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const now = Date.now();

    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey);
      if (now - cached.timestamp < CACHE_TTL_MS) {
        return { ...cached.data, is_cached: true };
      }
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`Weather API returned status ${res.status}`);

      const data = await res.json();
      const current = data.current || {};

      const weather = {
        temp_c: Math.round(current.temperature_2m ?? 31.0),
        rain_mm: parseFloat(current.precipitation ?? 0.0),
        condition: mapWmoCodeToCondition(current.weather_code ?? 0),
        weather_code: current.weather_code ?? 0,
        source: 'live_open_meteo',
        fetched_at: new Date().toISOString(),
      };

      weatherCache.set(cacheKey, { timestamp: now, data: weather });
      return weather;
    } catch (err) {
      console.warn('[WeatherService] Live weather fetch failed, using smart fallback:', err.message);
      // Smart tropical Bangalore baseline
      const fallback = {
        temp_c: 31.5,
        rain_mm: 0.0,
        condition: 'sunny',
        weather_code: 0,
        source: 'fallback_climatology',
        fetched_at: new Date().toISOString(),
      };
      return fallback;
    }
  },

  getLiveTemporalContext() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const hourDecimal = hours + minutes / 60.0;
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    let windowLabel = 'Regular Operational Window';
    if (hourDecimal >= 12.0 && hourDecimal <= 14.5) {
      windowLabel = 'Lunch Dining Window (12:00 – 2:30 PM)';
    } else if (hourDecimal >= 14.5 && hourDecimal <= 17.0) {
      windowLabel = 'Afternoon Recharge / Coffee Window (2:30 – 5:00 PM)';
    } else if (hourDecimal >= 17.0 && hourDecimal <= 21.5) {
      windowLabel = 'Evening Leisure & Dinner Window (5:00 – 9:30 PM)';
    }

    return {
      timestamp: now.toISOString(),
      hour_of_day: Math.round(hourDecimal * 100) / 100,
      time_formatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      is_weekday: isWeekday,
      window_label: windowLabel,
    };
  },

  async getLiveContext(lat = 12.9353, lng = 77.62377) {
    const weather = await this.getLiveWeather(lat, lng);
    const temporal = this.getLiveTemporalContext();

    return {
      ...weather,
      ...temporal,
      lat,
      lng,
    };
  }
};
