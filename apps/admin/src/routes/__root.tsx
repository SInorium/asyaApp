import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="font-serif text-2xl">Страница не найдена</p>
      <Link to="/artworks" className="text-sm underline">
        К списку работ
      </Link>
    </div>
  ),
});
