import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  server: { host: true, port: 5173 },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
});
