import '@fontsource-variable/source-serif-4/wght.css';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import '@fontsource-variable/onest/wght.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { createTimeRepositoriesForEnv } from './data-source';
import { AppProviders } from './providers';
import { router } from './router';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Нет #root в index.html');
const root = createRoot(rootEl);

createTimeRepositoriesForEnv()
  .then((repositories) => {
    root.render(
      <StrictMode>
        <AppProviders repositories={repositories}>
          <RouterProvider router={router} />
        </AppProviders>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    console.error(error);
    rootEl.textContent = `Не удалось запустить приложение: ${error instanceof Error ? error.message : String(error)}`;
  });
