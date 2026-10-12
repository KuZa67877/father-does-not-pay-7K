import { isApiError } from '@dle/core';
import { POST_LIMITS, PostInputSchema, type PostInput } from '@dle/core/velora';
import { Avatar, Button, Modal, NamedIcon, cx } from '@dle/ui';
import {
  BarChart3,
  Clapperboard,
  Earth,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  Minimize2,
  Paperclip,
} from 'lucide-react';
import { useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useCategories } from '@/entities/category';
import { RepostEmbed, useCreatePost } from '@/entities/post';
import { useMe } from '@/entities/session';
import { routes } from '@/shared/lib/routes';
import { useUploads } from '@/shared/lib/use-uploads';
import type { ComposeOptions } from '@/shared/model/ui-context';
import { useUi } from '@/shared/model/ui-context';
import { FilesSection, PhotosSection, PollSection } from './sections';
import { RichTextarea } from './RichTextarea';
import { parseVideoUrl } from './video';
import s from './compose.module.css';

type Section = 'photos' | 'poll' | 'files' | 'video' | 'location';

export interface ComposeValues {
  title: string;
  text: string;
  categoryIds: string[];
  pollQuestion: string;
  pollOptions: { value: string }[];
  pollMultiple: boolean;
  videoUrl: string;
  location: string;
}

const MAX_PHOTO = 10 * 1024 * 1024;
const MAX_FILE = 20 * 1024 * 1024;

/**
 * «Новый пост»: заголовок, текст с #тегами и @упоминаниями, до 4 фото с перестановкой,
 * опрос, место, категории, видео по ссылке, до 5 файлов. Работает через репозитории.
 */
export function ComposeModal({
  open,
  options,
  onClose,
}: {
  open: boolean;
  options: ComposeOptions;
  onClose: () => void;
}) {
  const { data: me } = useMe();
  const { data: categories } = useCategories();
  const create = useCreatePost();
  const { toast } = useUi();
  const navigate = useNavigate();
  const repostOf = options.repostOf ?? null;
  const [sections, setSections] = useState<Set<Section>>(
    () => new Set(options.section ? [options.section] : []),
  );
  const [full, setFull] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const photos = useUploads({
    max: POST_LIMITS.photos,
    accept: (f) =>
      !f.type.startsWith('image/')
        ? 'Сюда — только фотографии'
        : f.size > MAX_PHOTO
          ? 'Фото больше 10 МБ'
          : null,
  });
  const files = useUploads({
    max: POST_LIMITS.files,
    accept: (f) => (f.size > MAX_FILE ? `«${f.name}» больше 20 МБ` : null),
  });

  const form = useForm<ComposeValues>({
    defaultValues: {
      title: '',
      text: '',
      categoryIds: options.categoryId
        ? [options.categoryId]
        : (repostOf?.categories.map((c) => c.id) ?? []),
      pollQuestion: '',
      pollOptions: [{ value: '' }, { value: '' }],
      pollMultiple: false,
      videoUrl: '',
      location: '',
    },
  });
  const { register, control, handleSubmit, watch, setError, formState, clearErrors } = form;
  const pollOptions = useFieldArray({ control, name: 'pollOptions' });
  const text = watch('text');

  const toggle = (sec: Section) =>
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(sec)) next.delete(sec);
      else next.add(sec);
      return next;
    });

  const toInput = (v: ComposeValues): PostInput => ({
    title: v.title.trim() || null,
    text: v.text,
    photoIds: sections.has('photos') ? photos.ids : [],
    fileIds: sections.has('files') ? files.ids : [],
    video: sections.has('video') ? parseVideoUrl(v.videoUrl) : null,
    poll: sections.has('poll')
      ? {
          question: v.pollQuestion,
          options: v.pollOptions.map((o) => o.value),
          multiple: v.pollMultiple,
        }
      : null,
    location: sections.has('location') && v.location.trim() ? { name: v.location.trim() } : null,
    categoryIds: v.categoryIds,
    repostOfId: repostOf?.id ?? null,
  });

  const submit = handleSubmit((values) => {
    clearErrors();
    if (photos.pending || files.pending) {
      setError('root', { message: 'Дождитесь, пока загрузятся вложения' });
      return;
    }
    if (sections.has('video') && values.videoUrl.trim() && !parseVideoUrl(values.videoUrl)) {
      setError('videoUrl', { message: 'Нужна ссылка на YouTube, Rutube, VK Видео или файл .mp4' });
      return;
    }
    const parsed = PostInputSchema.safeParse(toInput(values));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const [head, second, third] = issue.path;
        let field: FieldPath<ComposeValues> = 'text';
        if (head === 'poll')
          field = second === 'options' ? `pollOptions.${Number(third ?? 0)}.value` : 'pollQuestion';
        else if (head === 'categoryIds') field = 'categoryIds';
        else if (head === 'title') field = 'title';
        setError(field, { message: issue.message });
      }
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: (post) => {
        onClose();
        toast(repostOf ? 'Репост опубликован' : 'Пост опубликован');
        if (repostOf) return;
        void navigate(routes.post(post.id));
      },
      onError: (e) =>
        setError('root', {
          message: isApiError(e) ? e.message : 'Не получилось опубликовать. Попробуйте ещё раз.',
        }),
    });
  });

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer.files.length) return;
    const images = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    const other = [...e.dataTransfer.files].filter((f) => !f.type.startsWith('image/'));
    if (images.length) {
      setSections((p) => new Set(p).add('photos'));
      setDropError(photos.add(images));
    }
    if (other.length) {
      setSections((p) => new Set(p).add('files'));
      setDropError(files.add(other));
    }
  };

  const used = text.length / POST_LIMITS.textMax;
  const errors = formState.errors;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={repostOf ? 'Репост' : 'Новый пост'}
      className={cx(s.modal, full && s.full)}
      dismissible={false}
      sheet
    >
      <form
        className={cx(s.form, dragOver && s.dragOver)}
        noValidate
        onSubmit={(e) => void submit(e)}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragOver(false);
        }}
        onDrop={onDrop}
      >
        {me && (
          <div className={s.author}>
            <Avatar name={me.name} src={me.avatar?.url} size={40} />
            <div>
              <b>{me.name}</b>
              <span className={s.audience}>
                <Earth size={13} aria-hidden /> Виден всем
              </span>
            </div>
          </div>
        )}

        {!repostOf && (
          <input
            className={cx(s.title, errors.title && s.invalid)}
            placeholder="Заголовок"
            aria-label="Заголовок (необязательно)"
            maxLength={POST_LIMITS.titleMax}
            {...register('title')}
          />
        )}

        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <RichTextarea
              value={field.value}
              onChange={field.onChange}
              placeholder={
                repostOf
                  ? 'Добавьте пару слов к репосту…'
                  : 'Поделитесь мыслью, моментом, вопросом… #тег @имя'
              }
              label="Текст поста"
              maxLength={POST_LIMITS.textMax}
              invalid={Boolean(errors.text)}
              describedBy={errors.text ? 'compose-text-error' : undefined}
            />
          )}
        />
        {errors.text && (
          <p id="compose-text-error" className={s.error} role="alert">
            {errors.text.message}
          </p>
        )}

        {repostOf && <RepostEmbed post={repostOf} />}

        {sections.has('photos') && (
          <PhotosSection uploads={photos} onError={setDropError} onClose={() => toggle('photos')} />
        )}
        {sections.has('poll') && (
          <PollSection
            register={register}
            fields={pollOptions}
            errors={errors}
            onClose={() => toggle('poll')}
          />
        )}
        {sections.has('files') && (
          <FilesSection uploads={files} onError={setDropError} onClose={() => toggle('files')} />
        )}
        {sections.has('video') && (
          <div className={s.section}>
            <label className={s.secLabel} htmlFor="compose-video">
              Видео по ссылке
            </label>
            <input
              id="compose-video"
              className={cx(s.input, errors.videoUrl && s.invalid)}
              placeholder="https://youtu.be/… или ссылка на .mp4"
              inputMode="url"
              aria-describedby={errors.videoUrl ? 'compose-video-error' : 'compose-video-hint'}
              {...register('videoUrl')}
            />
            {errors.videoUrl ? (
              <p id="compose-video-error" className={s.error} role="alert">
                {errors.videoUrl.message}
              </p>
            ) : (
              <p id="compose-video-hint" className={s.hint}>
                YouTube, Rutube, VK Видео или прямая ссылка на файл .mp4
              </p>
            )}
          </div>
        )}
        {sections.has('location') && (
          <div className={s.section}>
            <label className={s.secLabel} htmlFor="compose-place">
              Место
            </label>
            <input
              id="compose-place"
              className={s.input}
              placeholder="Город, улица или место"
              maxLength={80}
              {...register('location')}
            />
          </div>
        )}
        {dropError && (
          <p className={s.error} role="alert">
            {dropError}
          </p>
        )}

        <fieldset className={s.cats}>
          <legend className={s.catsHead}>
            <span>Категория</span>
            <span className={s.catsHint}>Обязательно — можно несколько</span>
          </legend>
          <Controller
            control={control}
            name="categoryIds"
            render={({ field }) => (
              <div className={s.catList}>
                {categories?.map((c) => {
                  const on = field.value.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={cx(s.cat, on && s.catOn)}
                      style={{ '--c': c.color } as CSSProperties}
                    >
                      <input
                        type="checkbox"
                        className="visually-hidden"
                        checked={on}
                        onChange={() =>
                          field.onChange(
                            on ? field.value.filter((id) => id !== c.id) : [...field.value, c.id],
                          )
                        }
                      />
                      <NamedIcon name={c.icon} size={15} />
                      {c.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.categoryIds && (
            <p className={s.error} role="alert">
              {errors.categoryIds.message}
            </p>
          )}
        </fieldset>

        {errors.root && (
          <p className={s.formError} role="alert">
            {errors.root.message}
          </p>
        )}

        <div className={s.foot}>
          {!repostOf && (
            <div className={s.tools} role="toolbar" aria-label="Вложения">
              <ToolButton label="Фото" on={sections.has('photos')} onClick={() => toggle('photos')}>
                <ImageIcon size={19} className={s.icPhoto} />
              </ToolButton>
              <ToolButton label="Опрос" on={sections.has('poll')} onClick={() => toggle('poll')}>
                <BarChart3 size={19} className={s.icPoll} />
              </ToolButton>
              <ToolButton label="Файлы" on={sections.has('files')} onClick={() => toggle('files')}>
                <Paperclip size={19} className={s.icFile} />
              </ToolButton>
              <ToolButton
                label="Видео по ссылке"
                on={sections.has('video')}
                onClick={() => toggle('video')}
              >
                <Clapperboard size={19} className={s.icVideo} />
              </ToolButton>
              <ToolButton
                label="Место"
                on={sections.has('location')}
                onClick={() => toggle('location')}
              >
                <MapPin size={19} />
              </ToolButton>
              <ToolButton
                label={full ? 'Обычный размер' : 'На весь экран'}
                on={full}
                onClick={() => setFull((v) => !v)}
                className={s.fullBtn}
              >
                {full ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </ToolButton>
            </div>
          )}
          <span
            className={cx(s.ring, used > 0.9 && s.ringWarn)}
            style={{ '--p': Math.min(1, used) } as CSSProperties}
            title={`${text.length} из ${POST_LIMITS.textMax} символов`}
            aria-hidden
          />
          <Button type="submit" className={s.publish} loading={create.isPending}>
            Опубликовать
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ToolButton({
  label,
  on,
  onClick,
  children,
  className,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cx(s.tool, on && s.toolOn, className)}
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
