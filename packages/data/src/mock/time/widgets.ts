import type { CitySummary, CurrencyRate, WeatherCondition, WeatherForecast } from '@dle/core/time';
import { toIsoOffset } from '../shared/utils';

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Детерминированный «прогноз» от даты: одинаковый в течение дня. */
export function buildWeather(city = 'Москва', now = new Date()): WeatherForecast {
  const conditions: WeatherCondition[] = [
    'partly-cloudy',
    'cloudy',
    'rain',
    'clear',
    'cloudy',
    'rain',
    'partly-cloudy',
  ];
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getTime() + i * 86_400_000);
    const k = (dayIndex + i) % 7;
    const base = 9 - i + (k % 3);
    return {
      date: isoDate(d),
      condition: conditions[k] ?? 'cloudy',
      tempMin: base - 5,
      tempMax: base + 2,
    };
  });
  const first = days[0];
  return {
    city,
    updatedAt: toIsoOffset(new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000)),
    current: {
      temp: (first?.tempMax ?? 10) - 1,
      feelsLike: (first?.tempMax ?? 10) - 4,
      condition: first?.condition ?? 'cloudy',
      wind: 4.2,
      windDirection: 'СЗ',
      humidity: 78,
      pressure: 746,
      sunrise: '07:12',
      sunset: '17:58',
    },
    days,
  };
}

export function buildCurrency(): CurrencyRate[] {
  return [
    { code: 'USD', name: 'Доллар США', value: 83.69, change: -0.42 },
    { code: 'EUR', name: 'Евро', value: 94.91, change: 0.18 },
    { code: 'CNY', name: 'Юань', value: 12.46, change: 0.03 },
  ];
}

/** «Город сегодня»: ветер, влажность, давление, восход и закат — из текущей погоды. */
export function buildCitySummary(weather: WeatherForecast, now = new Date()): CitySummary {
  const c = weather.current;
  return {
    city: weather.city,
    date: isoDate(now),
    items: [
      {
        id: 'wind',
        icon: 'wind',
        label: 'Ветер',
        value: `${String(c.wind).replace('.', ',')} м/с, ${c.windDirection}`,
      },
      { id: 'humidity', icon: 'droplets', label: 'Влажность', value: `${c.humidity}%` },
      { id: 'pressure', icon: 'gauge', label: 'Давление', value: `${c.pressure} мм` },
      { id: 'sun', icon: 'sunrise', label: 'Восход · закат', value: `${c.sunrise} · ${c.sunset}` },
    ],
  };
}
