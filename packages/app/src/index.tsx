import './index.css';
import './polyfills';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { App } from 'components/App';
import { ConditionalWrapper } from 'components/util/ConditionalWrapper';
import { createRoot } from 'react-dom/client';
import { reportWebVitals } from './reportWebVitals';
import { useAtomsDevtools } from 'jotai/devtools';
import React from 'react';
import type { Metric } from 'web-vitals';

const isProduction = process.env.NODE_ENV === 'production';

const AtomsDevtools = ({ children }: { children: React.ReactElement }) => {
  useAtomsDevtools('demo');
  return children;
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ConditionalWrapper
      condition={!isProduction}
      wrapper={(children) => <AtomsDevtools>{children}</AtomsDevtools>}
    >
      <App />
    </ConditionalWrapper>
  </React.StrictMode>,
);

const sendToAnalytics = ({ id, name, value }: Metric) => {
  // eslint-disable-next-line no-console
  console.log(id, name, value);
};

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

reportWebVitals(sendToAnalytics);
