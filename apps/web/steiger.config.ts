import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // корневая app/ — роутинг Next, не FSD-слой (FSD app-слой — src/app)
    ignores: ['./app/**'],
  },
]);
