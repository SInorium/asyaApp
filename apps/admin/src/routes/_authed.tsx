import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { sessionQueryOptions } from '@/entities/session';
import { AdminLayout } from '@/app/layouts/admin-layout';

/** Pathless-layout: всё внутри требует входа. */
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    try {
      await context.queryClient.ensureQueryData(sessionQueryOptions());
    } catch {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
