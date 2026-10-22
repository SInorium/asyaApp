import { createFileRoute } from '@tanstack/react-router';
import { ArtworkEditPage, artworkEditQuery } from '@/pages/artwork-edit';
import { errorMessage } from '@/shared/lib';

export const Route = createFileRoute('/_authed/artworks/$id')({
  // данные грузятся параллельно с кодом страницы, без «водопада»
  loader: ({ context, params }) => context.queryClient.ensureQueryData(artworkEditQuery(params.id)),
  component: ArtworkEditPage,
  errorComponent: ({ error }) => <p className="text-destructive">{errorMessage(error)}</p>,
});
