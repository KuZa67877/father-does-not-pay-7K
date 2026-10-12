import { isApiError } from '@dle/core';
import { ProfileInputSchema, type Profile, type ProfileInput } from '@dle/core/velora';
import { Avatar, Button, Modal, Spinner } from '@dle/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, ImagePlus } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMe } from '@/entities/session';
import { useProfile, useUpdateProfile } from '@/entities/user';
import { useUploads } from '@/shared/lib/use-uploads';
import { useUi } from '@/shared/model/ui-context';
import { Field } from '@/shared/ui/Field';
import s from './EditProfileModal.module.css';

/** Редактирование профиля в одном окне: обложка, аватар, имя, о себе, город, ссылка. */
export function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: me } = useMe();
  const { data: profile } = useProfile(me?.login);
  return (
    <Modal open={open} onClose={onClose} title="Редактировать профиль" className={s.modal} sheet>
      {profile ? <EditForm profile={profile} onDone={onClose} /> : <Spinner />}
    </Modal>
  );
}

const imageOnly = (f: File) =>
  !f.type.startsWith('image/')
    ? 'Нужна картинка'
    : f.size > 10 * 1024 * 1024
      ? 'Больше 10 МБ'
      : null;

function EditForm({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const update = useUpdateProfile();
  const { toast } = useUi();
  const avatar = useUploads({ max: 1, accept: imageOnly });
  const cover = useUploads({ max: 1, accept: imageOnly });
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, formState, setError } = useForm<ProfileInput>({
    resolver: zodResolver(ProfileInputSchema),
    defaultValues: {
      name: profile.name,
      occupation: profile.occupation ?? '',
      city: profile.city ?? '',
      link: profile.link ?? '',
      bio: profile.bio ?? '',
      avatarId: profile.avatar?.id ?? null,
      coverId: profile.cover?.id ?? null,
    },
  });
  const newAvatar = avatar.items.at(-1);
  const newCover = cover.items.at(-1);
  const pick = (u: typeof avatar, files: FileList | null) => {
    if (!files?.length) return;
    u.items.forEach((it) => u.remove(it.key));
    const err = u.add([...files].slice(0, 1));
    if (err) toast(err);
  };
  const errors = formState.errors;

  return (
    <form
      className={s.form}
      noValidate
      onSubmit={(e) =>
        void handleSubmit((v) => {
          if (avatar.pending || cover.pending) {
            setError('root', { message: 'Дождитесь загрузки фото' });
            return;
          }
          update.mutate(
            {
              ...v,
              avatarId: newAvatar?.media?.id ?? v.avatarId,
              coverId: newCover?.media?.id ?? v.coverId,
            },
            {
              onSuccess: () => {
                toast('Профиль сохранён');
                onDone();
              },
              onError: (err) =>
                setError('root', {
                  message: isApiError(err) ? err.message : 'Не удалось сохранить',
                }),
            },
          );
        })(e)
      }
    >
      <div className={s.media}>
        <button type="button" className={s.cover} onClick={() => coverInput.current?.click()}>
          {(newCover?.preview ?? profile.cover?.url) && (
            <img src={newCover?.preview ?? profile.cover?.url} alt="" />
          )}
          <span className={s.coverHint}>
            <ImagePlus size={16} aria-hidden /> Сменить обложку
          </span>
          {newCover && !newCover.media && (
            <span className={s.bar} style={{ width: `${newCover.progress * 100}%` }} />
          )}
        </button>
        <button
          type="button"
          className={s.avatar}
          onClick={() => avatarInput.current?.click()}
          aria-label="Сменить аватар"
        >
          {newAvatar?.preview ? (
            <img src={newAvatar.preview} alt="" />
          ) : (
            <Avatar name={profile.name} src={profile.avatar?.url} size={88} />
          )}
          <span className={s.avatarHint} aria-hidden>
            <Camera size={18} />
          </span>
        </button>
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(cover, e.target.files)}
        />
        <input
          ref={avatarInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pick(avatar, e.target.files)}
        />
      </div>

      <Field label="Имя" autoComplete="name" error={errors.name} {...register('name')} />
      <div className={s.row}>
        <Field
          label="Род занятий"
          placeholder="Фотограф"
          error={errors.occupation}
          {...register('occupation')}
        />
        <Field
          label="Город"
          autoComplete="address-level2"
          error={errors.city}
          {...register('city')}
        />
      </div>
      <Field
        label="Ссылка"
        type="url"
        placeholder="https://"
        error={errors.link}
        {...register('link')}
      />
      <Field as="textarea" label="О себе" maxLength={300} error={errors.bio} {...register('bio')} />
      {errors.root && (
        <p className={s.formError} role="alert">
          {errors.root.message}
        </p>
      )}
      <div className={s.actions}>
        <Button type="button" variant="outline" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" loading={update.isPending}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
