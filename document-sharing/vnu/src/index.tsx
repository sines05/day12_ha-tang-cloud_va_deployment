// FIX: Manually defining types for `import.meta.env` as a workaround for a configuration issue
// where Vite's client types could not be resolved.
// FIX: Wrap in `declare global` to augment the global type from within a module.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly BASE_URL: string;
    };
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createHead, UnheadProvider } from '@unhead/react/client';
import App from './App';

const head = createHead();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UnheadProvider head={head}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </UnheadProvider>
  </React.StrictMode>
);
