import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginPage } from '@/pages/login';

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: LoginPage,
});
