import './index.css';
import './polyfills';
import { App } from 'components/App';
import { BugNotification } from 'components/BugNotification';
import { reportWebVitals } from './reportWebVitals';
import React from 'react';
import ReactDOM from 'react-dom';
import type { Metric } from 'web-vitals';

ReactDOM.render(
  <React.StrictMode>
    <BugNotification />
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);

const sendToAnalytics = ({ id, name, value }: Metric) => {
  // TODO: send to analytics -> navigator.sendBeacon(url, ...)
  // eslint-disable-next-line no-console
  console.log(id, name, value);
};

reportWebVitals(sendToAnalytics);
