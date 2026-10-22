import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // file-based роуты TanStack Router и сгенерированное дерево — не часть FSD
    ignores: ['./src/routes/**', './src/app/routeTree.gen.ts'],
  },
]);
