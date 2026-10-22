import { configureApi } from '@asya/api-client/fetcher';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { queryClient } from '@/shared/api';
import { router } from './router';
import './styles/index.css';

// сессия истекла и refresh не помог → на страницу входа
configureApi({
  onUnauthorized: () => {
    const path = router.state.location.pathname;
    if (path !== '/login' && path !== '/register') {
      queryClient.clear();
      void router.navigate({ to: '/login', search: { redirect: router.state.location.href } });
    }
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);
