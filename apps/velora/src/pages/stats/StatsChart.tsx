import type { ProfileStats, StatsMetric } from '@dle/core/velora';
import { useId, useState } from 'react';
import { number, shortDate } from './model';
import s from './stats.module.css';

/** SVG-график, выбор дня указателем/клавиатурой и полная таблица данных. */
export function StatsChart({
  series,
  metric,
  title,
}: {
  series: ProfileStats['series'];
  metric: StatsMetric;
  title: string;
}) {
  const id = useId();
  const [selected, setSelected] = useState(series.length - 1);
  const max = Math.max(1, ...series.map((day) => day.values[metric]));
  const point = (index: number) => ({
    x: 56 + (index / Math.max(1, series.length - 1)) * 824,
    y: 240 - ((series[index]?.values[metric] ?? 0) / max) * 210,
  });
  const coordinates = series
    .map((_, index) => {
      const p = point(index);
      return `${p.x},${p.y}`;
    })
    .join(' ');
  const day = series[selected];
  const marker = point(selected);
  if (!series.length) return <p>За этот период данных пока нет.</p>;
  return (
    <>
      <svg
        className={s.chart}
        viewBox="0 0 900 290"
        role="img"
        aria-labelledby={id}
        onPointerMove={(e) => {
          const bounds = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - bounds.left) / bounds.width) * 900;
          setSelected(
            Math.max(
              0,
              Math.min(series.length - 1, Math.round(((x - 56) / 824) * (series.length - 1))),
            ),
          );
        }}
      >
        <title id={id}>
          {title}: динамика за {series.length} дней. Значения доступны ниже в таблице.
        </title>
        {[0, 1, 2, 3].map((tick) => (
          <g key={tick} className={s.axis}>
            <line x1={56} x2={880} y1={30 + tick * 70} y2={30 + tick * 70} />
            <text x={46} y={34 + tick * 70} textAnchor="end">
              {number.format(Math.round(max * (1 - tick / 3)))}
            </text>
          </g>
        ))}
        <polygon points={`56,240 ${coordinates} 880,240`} className={s.area} />
        <polyline points={coordinates} className={s.line} />
        <line x1={marker.x} x2={marker.x} y1={24} y2={240} className={s.guide} />
        <circle cx={marker.x} cy={marker.y} r={4} className={s.point} />
        {[0, Math.floor((series.length - 1) / 2), series.length - 1].map((index) => (
          <text
            key={index}
            className={s.axisLabel}
            x={point(index).x}
            y={275}
            textAnchor={index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}
          >
            {shortDate(series[index]?.date ?? '')}
          </text>
        ))}
      </svg>
      <div className={s.chartControl}>
        <label htmlFor={`${id}-day`}>День на графике</label>
        <input
          id={`${id}-day`}
          type="range"
          min={0}
          max={series.length - 1}
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          aria-valuetext={day ? `${shortDate(day.date)}: ${number.format(day.values[metric])}` : ''}
        />
        <output htmlFor={`${id}-day`} aria-live="off">
          {day && `${shortDate(day.date)}: ${number.format(day.values[metric])}`}
        </output>
      </div>
      <details className={s.data}>
        <summary>Таблица данных</summary>
        <table>
          <caption>{title} по дням</caption>
          <thead>
            <tr>
              <th scope="col">Дата</th>
              <th scope="col">Значение</th>
            </tr>
          </thead>
          <tbody>
            {series.map((entry) => (
              <tr key={entry.date}>
                <th scope="row">{shortDate(entry.date)}</th>
                <td>{number.format(entry.values[metric])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
