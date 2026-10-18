import type { ArticleFormat, Author } from '@dle/core/time';
import { useFieldArray } from 'react-hook-form';
import { MediaPicker } from '@/shared/ui/MediaPicker';
import { formats, type EditorForm } from './model';
import s from './editor.module.css';

export function FormatFields({
  form,
  author,
  onBusy,
}: {
  form: EditorForm;
  author: Author;
  onBusy: (key: string, busy: boolean) => void;
}) {
  const format = form.watch('format');
  const change = (kind: ArticleFormat['kind']) => {
    let next: ArticleFormat;
    switch (kind) {
      case 'standard':
        next = { kind };
        break;
      case 'video':
        next = { kind, provider: 'youtube', url: '' };
        break;
      case 'photoReport':
        next = { kind, gallery: [] };
        break;
      case 'podcast':
        next = { kind, audio: { id: '', type: 'audio', url: '', alt: '' }, timecodes: [] };
        break;
      case 'opinion':
        next = { kind, quote: '', author };
        break;
    }
    form.setValue('format', next, { shouldDirty: true });
  };
  return (
    <section className={s.section} aria-labelledby="format-title">
      <h2 id="format-title">Формат материала</h2>
      <label className={s.field}>
        Формат
        <select
          value={format.kind}
          onChange={(e) => change(e.target.value as ArticleFormat['kind'])}
        >
          {formats.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      {format.kind === 'video' && (
        <div className={s.row}>
          <label className={s.field}>
            Видеосервис
            <select {...form.register('format.provider')}>
              {['youtube', 'rutube', 'vk', 'mp4'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            Ссылка на видео
            <input type="url" {...form.register('format.url')} />
          </label>
        </div>
      )}
      {format.kind === 'photoReport' && (
        <MediaPicker
          key="gallery"
          label="Фотографии репортажа"
          max={20}
          initial={format.gallery}
          onChange={(gallery) => form.setValue('format.gallery', gallery, { shouldDirty: true })}
          onBusy={(busy) => onBusy('gallery', busy)}
        />
      )}
      {format.kind === 'podcast' && (
        <>
          <MediaPicker
            key="audio"
            label="Аудиозапись"
            accept="audio/*"
            initial={format.audio.id ? [format.audio] : []}
            onChange={(media) =>
              form.setValue(
                'format.audio',
                media[0] ?? { id: '', type: 'audio', url: '', alt: '' },
                { shouldDirty: true },
              )
            }
            onBusy={(busy) => onBusy('audio', busy)}
          />
          <Timecodes form={form} />
        </>
      )}
      {format.kind === 'opinion' && (
        <>
          <label className={s.field}>
            Главная цитата
            <textarea rows={3} {...form.register('format.quote')} />
          </label>
          <label className={s.field}>
            Автор мнения
            <input {...form.register('format.author.name')} />
          </label>
          <label className={s.field}>
            Род занятий
            <input {...form.register('format.author.occupation')} />
          </label>
        </>
      )}
    </section>
  );
}

function Timecodes({ form }: { form: EditorForm }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'format.timecodes',
  });
  return (
    <fieldset className={s.section}>
      <legend>Таймкоды</legend>
      {fields.map((field, index) => (
        <div key={field.id} className={s.row}>
          <label className={s.field}>
            Секунды от начала
            <input
              type="number"
              min={0}
              {...form.register(`format.timecodes.${index}.time`, { valueAsNumber: true })}
            />
          </label>
          <label className={s.field}>
            Тема
            <input {...form.register(`format.timecodes.${index}.label`)} />
          </label>
          <button type="button" className={s.secondary} onClick={() => remove(index)}>
            Убрать таймкод
          </button>
        </div>
      ))}
      <button type="button" className={s.secondary} onClick={() => append({ time: 0, label: '' })}>
        Добавить таймкод
      </button>
    </fieldset>
  );
}
