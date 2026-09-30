import { app } from './app';
import './views/styles/global.css';

const container = document.getElementById('app');
if (container) {
  app.init(container);
} else {
  console.error('Elemento raiz #app não foi localizado no documento.');
}
