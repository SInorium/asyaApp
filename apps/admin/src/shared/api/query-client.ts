import { ApiError, configureApi } from '@asya/api-client/fetcher';
import { QueryClient } from '@tanstack/react-query';

// Тот же origin (Caddy или Vite proxy), поэтому baseUrl пустой; cookies уходят автоматически
configureApi({ baseUrl: '', refreshOnUnauthorized: true });

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx повторять бессмысленно
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
  },
});
