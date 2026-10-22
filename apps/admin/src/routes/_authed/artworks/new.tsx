import { createFileRoute } from '@tanstack/react-router';
import { ArtworkNewPage } from '@/pages/artwork-new';

export const Route = createFileRoute('/_authed/artworks/new')({
  component: ArtworkNewPage,
});
