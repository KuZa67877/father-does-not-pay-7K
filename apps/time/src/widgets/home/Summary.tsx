import type { WeatherCondition } from '@dle/core/time';
import { ErrorState, Skeleton, cx, useNow } from '@dle/ui';
import {
  Building2,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Gauge,
  Sun,
  Sunrise,
  TrendingUp,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { useCity, useCurrency, useWeather } from '@/entities/summary';
import { SectionHead, SectionNote } from '@/shared/ui';
import s from './home.module.css';

const WEATHER: Record<WeatherCondition, { icon: LucideIcon; label: string }> = {
  clear: { icon: Sun, label: 'Ясно' },
  'partly-cloudy': { icon: CloudSun, label: 'Переменная облачность' },
  cloudy: { icon: Cloud, label: 'Облачно' },
  rain: { icon: CloudRain, label: 'Дождь' },
  snow: { icon: CloudSnow, label: 'Снег' },
  storm: { icon: CloudLightning, label: 'Гроза' },
  fog: { icon: CloudFog, label: 'Туман' },
};
const CITY_ICONS: Record<string, LucideIcon> = {
  wind: Wind,
  droplets: Droplets,
  gauge: Gauge,
  sunrise: Sunrise,
};

const deg = (t: number) => `${t > 0 ? '+' : ''}${Math.round(t)}°`;
const weekday = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'short' });

function WeatherBox() {
  const { data, isPending, isError, refetch } = useWeather();
  return (
    <div className={cx(s.box, s.sumBox)}>
      <div className={s.sumTitle}>
        <span>
          <CloudSun size={16} aria-hidden /> Погода — {data?.city ?? 'город'}
        </span>
        <span className={s.mono}>5 дней</span>
      </div>
      {isError && <ErrorState compact onRetry={() => void refetch()} />}
      {isPending && <Skeleton height={150} />}
      {data && (
        <>
          <div className={s.now}>
            {(() => {
              const W = WEATHER[data.current.condition];
              return <W.icon size={44} className={s.nowIcon} aria-hidden />;
            })()}
            <span>
              <b className={s.temp}>{deg(data.current.temp)}</b>
              <small className={s.cond}>
                {WEATHER[data.current.condition].label}, ощущается как {deg(data.current.feelsLike)}
              </small>
            </span>
          </div>
          <ul className={s.days} aria-label="Прогноз на 5 дней">
            {data.days.map((d) => {
              const W = WEATHER[d.condition];
              return (
                <li key={d.date} className={s.day}>
                  <span>{weekday(d.date)}</span>
                  <W.icon size={16} aria-label={W.label} />
                  <span>{deg(d.tempMax)}</span>
                </li>
              );
            })}
          </ul>
          <span className={s.source}>Данные: демо-сервис погоды</span>
        </>
      )}
    </div>
  );
}

function RatesBox() {
  const { data, isPending, isError, refetch } = useCurrency();
  return (
    <div className={cx(s.box, s.sumBox)}>
      <div className={s.sumTitle}>
        <span>
          <TrendingUp size={16} aria-hidden /> Курсы валют
        </span>
        <span className={s.mono}>RUB</span>
      </div>
      {isError && <ErrorState compact onRetry={() => void refetch()} />}
      {isPending && <Skeleton height={150} />}
      {data?.map((r) => (
        <div key={r.code} className={cx(s.sumRow, s.sumRowMono)}>
          <abbr title={r.name}>{r.code}</abbr>
          <span>
            {r.value.toFixed(2)}
            <span className={r.change >= 0 ? s.up : s.down}>
              {r.change >= 0 ? '+' : '−'}
              {Math.abs(r.change).toFixed(2)}
            </span>
          </span>
        </div>
      ))}
      <span className={s.source}>Курс ЦБ на сегодня, демо-данные</span>
    </div>
  );
}

function CityBox() {
  const { data, isPending, isError, refetch } = useCity();
  const now = useNow(1000);
  return (
    <div className={cx(s.box, s.sumBox)}>
      <div className={s.sumTitle}>
        <span>
          <Building2 size={16} aria-hidden /> {data?.city ?? 'Город'} сегодня
        </span>
        <span className={s.mono}>{now.toLocaleTimeString('ru-RU')}</span>
      </div>
      {isError && <ErrorState compact onRetry={() => void refetch()} />}
      {isPending && <Skeleton height={150} />}
      {data?.items.map((it) => {
        const Icon = CITY_ICONS[it.icon] ?? Cloud;
        return (
          <div key={it.id} className={s.sumRow}>
            <span className={s.sumLabel}>
              <Icon size={15} aria-hidden /> {it.label}
            </span>
            <b className={s.sumVal}>{it.value}</b>
          </div>
        );
      })}
    </div>
  );
}

export function SummaryBlock() {
  return (
    <section className={cx('container', s.section)} aria-labelledby="h-sum">
      <SectionHead
        num="07"
        id="h-sum"
        title="Сводка"
        aside={<SectionNote>Погода, курсы и город — обновляются каждый час</SectionNote>}
      />
      <div className={s.sum}>
        <WeatherBox />
        <RatesBox />
        <CityBox />
      </div>
    </section>
  );
}
