import './index.css';
import './polyfills';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { Analytics } from '@vercel/analytics/react';
import { App } from 'components/App';
import { ConditionalWrapper } from 'components/util/ConditionalWrapper';
import { createRoot } from 'react-dom/client';
import { useAtomsDevtools } from 'jotai-devtools';
import React from 'react';

const isProduction = process.env.NODE_ENV === 'production';

const AtomsDevtools = ({ children }: { children: React.ReactElement }) => {
  useAtomsDevtools('demo');
  return children;
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <Analytics />
    <ConditionalWrapper
      condition={!isProduction}
      wrapper={(children) => <AtomsDevtools>{children}</AtomsDevtools>}
    >
      <App />
    </ConditionalWrapper>
  </React.StrictMode>,
);

serviceWorkerRegistration.register({
  onUpdate: (e) => {
    if (e.waiting) {
      e.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    void e.update().then(() => {
      window.location.reload();
    });
  },
});
