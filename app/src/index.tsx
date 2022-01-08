import './index.css';
import './polyfills';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { App } from 'components/App';
import { reportWebVitals } from './reportWebVitals';
import React from 'react';
import ReactDOM from 'react-dom';
import type { Metric } from 'web-vitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);

const sendToAnalytics = ({ id, name, value }: Metric) => {
  // TODO: send to analytics -> navigator.sendBeacon(url, ...)
  // eslint-disable-next-line no-console
  console.log(id, name, value);
};

serviceWorkerRegistration.register();

reportWebVitals(sendToAnalytics);
