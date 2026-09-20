import axios from 'axios';

const api = axios.create({
  baseURL: 'https://friendly-fiesta-9g6xj7gg45fxwqj-5108.app.github.dev',
  headers: { 'Content-Type': 'application/json' }
});

export default api;