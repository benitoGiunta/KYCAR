import { render } from 'preact';

import { App } from './app';
import './styles/tokens.css';
import './styles/print.css';

const mountNode = document.getElementById('app');
if (!mountNode) {
  throw new Error('KYCAR: #app mount node not found in index.html');
}

render(<App />, mountNode);
