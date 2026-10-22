import { defineConfig } from 'orval';

const input = '../../apps/api/openapi.json';
const mutator = { path: './src/fetcher.ts', name: 'apiFetch' };

export default defineConfig({
  // Простые async-функции: для RSC в apps/web
  fetch: {
    input,
    output: {
      target: './src/generated/fetch.ts',
      client: 'fetch',
      clean: false,
      override: { mutator, fetch: { includeHttpResponseReturnType: false } },
    },
  },
  // TanStack Query hooks: для apps/admin
  query: {
    input,
    output: {
      target: './src/generated/query.ts',
      client: 'react-query',
      httpClient: 'fetch',
      clean: false,
      override: { mutator, fetch: { includeHttpResponseReturnType: false } },
    },
  },
});
