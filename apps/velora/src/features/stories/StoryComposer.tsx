import { isApiError } from '@dle/core';
import {
  STORY_FONTS,
  StoryInputSchema,
  type StoryAudience,
  type StoryFont,
} from '@dle/core/velora';
import { Button, Modal } from '@dle/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateStory } from '@/entities/story';
import { useUploads } from '@/shared/lib/use-uploads';
import { useUi } from '@/shared/model/ui-context';
import { Field } from '@/shared/ui/Field';
import s from './stories.module.css';

const backgrounds = [
  'var(--story-violet)',
  'var(--story-forest)',
  'var(--story-clay)',
  'var(--story-night)',
];
const fonts: Record<StoryFont, string> = { serif: 'Антиква', sans: 'Гротеск', mono: 'Моно' };
const imageOnly = (f: File) =>
  !f.type.startsWith('image/')
    ? 'Выберите фотографию'
    : f.size > 10 * 1024 * 1024
      ? 'Фото должно быть меньше 10 МБ'
      : null;

export function StoryComposer({ onClose }: { onClose: () => void }) {
  const create = useCreateStory();
  const { toast } = useUi();
  const [fileError, setFileError] = useState('');
  const upload = useUploads({ max: 1, accept: imageOnly });
  const photo = upload.items[0];
  const { register, watch, handleSubmit, setError, formState } = useForm<{
    text: string;
    font: StoryFont;
    background: string;
    audience: StoryAudience;
  }>({ defaultValues: { text: '', font: 'sans', background: backgrounds[0], audience: 'all' } });
  const values = watch();
  return (
    <Modal open onClose={onClose} title="Новая история" className={s.composer} sheet>
      <form
        className={s.composeGrid}
        onSubmit={handleSubmit((v) => {
          if (create.isPending || upload.pending || upload.failed) return;
          const parsed = StoryInputSchema.safeParse({
            audience: v.audience,
            content: photo?.media
              ? { kind: 'photo', mediaId: photo.media.id, caption: v.text }
              : { kind: 'text', text: v.text, font: v.font, background: v.background },
          });
          if (!parsed.success) {
            setError('root', { message: parsed.error.issues[0]?.message ?? 'Проверьте историю' });
            return;
          }
          create.mutate(parsed.data, {
            onSuccess: () => {
              toast('История опубликована');
              onClose();
            },
          });
        })}
      >
        <div
          className={s.preview}
          style={{ background: values.background }}
          aria-label="Предпросмотр истории"
        >
          {photo?.preview && <img src={photo.preview} alt="Выбранное фото" />}
          <p className={s[values.font]}>{values.text || (photo ? '' : 'Ваш текст')}</p>
        </div>
        <div className={s.fields}>
          <label className={s.upload}>
            Фото
            <input
              type="file"
              accept="image/*"
              aria-label="Фото истории"
              disabled={Boolean(photo)}
              onChange={(e) => {
                if (e.target.files) setFileError(upload.add(e.target.files) ?? '');
                e.target.value = '';
              }}
            />
          </label>
          {photo && (
            <div>
              {upload.pending && (
                <progress value={photo.progress} max={1} aria-label="Загрузка фото" />
              )}
              {photo.error && (
                <p role="alert">
                  {photo.error}{' '}
                  <button type="button" onClick={() => upload.retry(photo.key)}>
                    Повторить загрузку
                  </button>
                </p>
              )}
              <button type="button" onClick={() => upload.remove(photo.key)}>
                Убрать фото
              </button>
            </div>
          )}
          {fileError && <p role="alert">{fileError}</p>}
          <Field
            as="textarea"
            label={photo ? 'Подпись к фото' : 'Текст истории'}
            rows={3}
            maxLength={photo ? 200 : 280}
            {...register('text')}
          />
          {!photo && (
            <>
              <fieldset className={s.choices}>
                <legend>Шрифт</legend>
                {STORY_FONTS.map((font) => (
                  <label key={font}>
                    <input type="radio" value={font} {...register('font')} />
                    {fonts[font]}
                  </label>
                ))}
              </fieldset>
              <fieldset className={s.colors}>
                <legend>Фон</legend>
                {backgrounds.map((background, i) => (
                  <label key={background} style={{ background }}>
                    <input
                      type="radio"
                      value={background}
                      aria-label={`Цвет фона ${i + 1}`}
                      {...register('background')}
                    />
                  </label>
                ))}
              </fieldset>
            </>
          )}
          <fieldset className={s.choices}>
            <legend>Кто увидит</legend>
            <label>
              <input type="radio" value="all" {...register('audience')} />
              Все
            </label>
            <label>
              <input type="radio" value="close" {...register('audience')} />
              Близкие
            </label>
          </fieldset>
          <p className={s.hint}>История доступна 24 часа. «Близкие» — ваши взаимные подписчики.</p>
          {formState.errors.root && <p role="alert">{formState.errors.root.message}</p>}
          {create.isError && (
            <p role="alert">
              {isApiError(create.error)
                ? create.error.message
                : 'Не удалось опубликовать. Попробуйте ещё раз.'}
            </p>
          )}
          <Button
            type="submit"
            loading={create.isPending}
            disabled={upload.pending || upload.failed}
          >
            Опубликовать историю
          </Button>
        </div>
      </form>
    </Modal>
  );
}
