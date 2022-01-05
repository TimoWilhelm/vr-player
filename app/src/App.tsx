import './App.css';
import { add } from '@vr-viewer/player';
import logo from './logo.svg';

export function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit
          <code>src/App.tsx</code>
          and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          {add(1, 2)}
        </a>
      </header>
    </div>
  );
}
