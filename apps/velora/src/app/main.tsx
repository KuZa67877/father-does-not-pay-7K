import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import '@fontsource-variable/onest/wght.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { createVeloraRepositoriesForEnv } from './data-source';
import { AppProviders } from './providers';
import { router } from './router';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Нет #root в index.html');
const root = createRoot(rootEl);

createVeloraRepositoriesForEnv()
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
