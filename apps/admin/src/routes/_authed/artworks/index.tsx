import { ArtworkStatus } from '@asya/shared';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ArtworksPage } from '@/pages/artworks';

export const Route = createFileRoute('/_authed/artworks/')({
  validateSearch: z.object({ status: ArtworkStatus.optional().catch(undefined) }),
  component: ArtworksPage,
});
