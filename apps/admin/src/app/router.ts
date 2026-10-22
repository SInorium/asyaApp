import { createRouter } from '@tanstack/react-router';
import { queryClient } from '@/shared/api';
import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  basepath: '/admin',
  context: { queryClient },
  defaultPreload: 'intent',
  // свежесть данных контролирует TanStack Query, а не роутер
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
