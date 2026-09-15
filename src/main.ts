import { createApp } from './app';
const root = document.getElementById('app');
if (!root) throw new Error('#app missing');
createApp(root);
