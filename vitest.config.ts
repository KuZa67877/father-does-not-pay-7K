import { defineConfig } from 'vitest/config';

// Корневой конфиг: прогоняет тесты всех пакетов и приложений.
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
  },
});
