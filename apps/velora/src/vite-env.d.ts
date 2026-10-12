/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_STRAPI_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
