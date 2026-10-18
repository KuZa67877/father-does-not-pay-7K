import type { ArticleBlock } from '@dle/core/time';
import { Controller, useFieldArray } from 'react-hook-form';
import { useState } from 'react';
import { MediaPicker } from '@/shared/ui/MediaPicker';
import { blockLabels, newBlock, type EditorForm } from './model';
import s from './editor.module.css';

export function BlockEditor({
  form,
  onBusy,
}: {
  form: EditorForm;
  onBusy: (key: string, busy: boolean) => void;
}) {
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'body' });
  const [type, setType] = useState<ArticleBlock['type']>('paragraph');
  return (
    <section className={s.section} aria-labelledby="body-title">
      <h2 id="body-title">Текст материала</h2>
      {fields.map((field, index) => (
        <fieldset key={field.id} className={s.block}>
          <legend>
            {index + 1}. {blockLabels[field.type]}
          </legend>
          <div className={s.blockActions}>
            <button
              type="button"
              disabled={index === 0}
              aria-label={`Поднять блок ${index + 1}`}
              onClick={() => move(index, index - 1)}
            >
              Выше
            </button>
            <button
              type="button"
              disabled={index === fields.length - 1}
              aria-label={`Опустить блок ${index + 1}`}
              onClick={() => move(index, index + 1)}
            >
              Ниже
            </button>
            <button
              type="button"
              aria-label={`Удалить блок ${index + 1}`}
              onClick={() => remove(index)}
            >
              Удалить
            </button>
          </div>
          {(field.type === 'paragraph' || field.type === 'heading' || field.type === 'quote') && (
            <label className={s.field}>
              Текст блока {index + 1}
              <textarea
                rows={field.type === 'paragraph' ? 5 : 2}
                {...form.register(`body.${index}.text`)}
              />
            </label>
          )}
          {field.type === 'heading' && (
            <label className={s.field}>
              Уровень заголовка
              <select {...form.register(`body.${index}.level`, { valueAsNumber: true })}>
                <option value={2}>Раздел (H2)</option>
                <option value={3}>Подраздел (H3)</option>
              </select>
            </label>
          )}
          {field.type === 'quote' && (
            <label className={s.field}>
              Автор цитаты
              <input {...form.register(`body.${index}.cite`)} />
            </label>
          )}
          {field.type === 'image' && (
            <>
              <MediaPicker
                label={`Фото блока ${index + 1}`}
                initial={field.media.id ? [field.media] : []}
                onChange={(media) =>
                  form.setValue(
                    `body.${index}.media`,
                    media[0] ?? { id: '', type: 'image', url: '', alt: '' },
                    { shouldDirty: true },
                  )
                }
                onBusy={(busy) => onBusy(field.id, busy)}
              />
              <label className={s.field}>
                Описание фото
                <input {...form.register(`body.${index}.media.alt`)} />
              </label>
              <label className={s.field}>
                Подпись
                <input {...form.register(`body.${index}.caption`)} />
              </label>
            </>
          )}
          {(field.type === 'list' || field.type === 'summary') && (
            <>
              <Controller
                control={form.control}
                name={`body.${index}.items`}
                render={({ field: items }) => (
                  <label className={s.field}>
                    Пункты — по одному в строке
                    <textarea
                      rows={4}
                      value={
                        Array.isArray(items.value)
                          ? items.value.map((v) => (typeof v === 'string' ? v : '')).join('\n')
                          : ''
                      }
                      onChange={(e) => items.onChange(e.target.value.split('\n'))}
                      onBlur={items.onBlur}
                      ref={items.ref}
                    />
                  </label>
                )}
              />
              {field.type === 'list' && (
                <label className={s.check}>
                  <input type="checkbox" {...form.register(`body.${index}.ordered`)} />
                  Нумерованный список
                </label>
              )}
            </>
          )}
          {field.type === 'embed' && (
            <>
              <label className={s.field}>
                Сервис
                <select {...form.register(`body.${index}.provider`)}>
                  {['youtube', 'rutube', 'vk', 'telegram', 'other'].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className={s.field}>
                Ссылка
                <input type="url" {...form.register(`body.${index}.url`)} />
              </label>
              <label className={s.field}>
                Название вставки
                <input {...form.register(`body.${index}.title`)} />
              </label>
            </>
          )}
          {field.type === 'facts' && (
            <Facts key={`${field.id}:${index}`} form={form} index={index} />
          )}
        </fieldset>
      ))}
      <div className={s.row}>
        <label className={s.field}>
          Тип блока
          <select value={type} onChange={(e) => setType(e.target.value as ArticleBlock['type'])}>
            {Object.entries(blockLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={s.secondary} onClick={() => append(newBlock(type))}>
          Добавить блок
        </button>
      </div>
    </section>
  );
}

function Facts({ form, index }: { form: EditorForm; index: number }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `body.${index}.items`,
  });
  return (
    <div className={s.section}>
      {fields.map((field, i) => (
        <div key={field.id} className={s.row}>
          <label className={s.field}>
            Значение {i + 1}
            <input {...form.register(`body.${index}.items.${i}.value`)} />
          </label>
          <label className={s.field}>
            Пояснение {i + 1}
            <input {...form.register(`body.${index}.items.${i}.label`)} />
          </label>
          <button type="button" className={s.secondary} onClick={() => remove(i)}>
            Убрать факт
          </button>
        </div>
      ))}
      <button
        type="button"
        className={s.secondary}
        onClick={() => append({ value: '', label: '' })}
      >
        Добавить факт
      </button>
    </div>
  );
}
