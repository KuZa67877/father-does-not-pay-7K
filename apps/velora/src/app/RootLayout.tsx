import { Outlet, ScrollRestoration } from 'react-router';

/** Каркас (шапка, подвал) появится на этапе 2. */
export function RootLayout() {
  return (
    <>
      <a className="skip-link" href="#main">
        К содержанию
      </a>
      <main id="main">
        <Outlet />
      </main>
      <ScrollRestoration />
    </>
  );
}
