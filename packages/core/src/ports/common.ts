import type { AuthSession, LoginInput, Media, MediaType, RegisterInput, User } from '../common';

/** Общие опции вызова: отмена запроса. */
export interface CallOptions {
  signal?: AbortSignal;
}

export interface UploadOptions extends CallOptions {
  /** Прогресс 0..1. */
  onProgress?: (progress: number) => void;
  /** Подсказка, если тип не выводится из MIME. */
  type?: MediaType;
}

export interface MediaRepository {
  upload(file: File, opts?: UploadOptions): Promise<Media>;
  remove(id: string): Promise<void>;
}

export interface AuthRepository {
  /** Текущая сессия или null, если гость. */
  me(opts?: CallOptions): Promise<User | null>;
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(): Promise<void>;
  /** Письмо со ссылкой для восстановления пароля. */
  requestPasswordReset(email: string): Promise<void>;
}

/** Хранилище токена — инжектируется в HTTP-клиент. */
export interface TokenStore {
  get(): string | null;
  set(token: string | null): void;
}
