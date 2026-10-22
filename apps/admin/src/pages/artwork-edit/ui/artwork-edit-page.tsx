import { myArtworksGet } from '@asya/api-client/query';
import { Card, CardContent, CardHeader, CardTitle } from '@asya/ui/components/card';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';
import { ArtworkStatusBadge, artworkKeys } from '@/entities/artwork';
import { ArtworkImagesManager } from './artwork-images-manager';
import { ArtworkForm } from '@/features/artwork-upsert';
import { ArtworkDelete } from './artwork-delete';

const route = getRouteApi('/_authed/artworks/$id');

/** Используется и loader-ом роута (предзагрузка), и компонентом. */
export const artworkEditQuery = (id: string) =>
  queryOptions({
    queryKey: artworkKeys.detail(id),
    queryFn: ({ signal }) => myArtworksGet(id, { signal }),
  });

export function ArtworkEditPage() {
  const { id } = route.useParams();
  const artwork = useSuspenseQuery(artworkEditQuery(id)).data;
  const navigate = useNavigate();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/artworks" className="text-sm text-muted-foreground hover:underline">
            ← Все работы
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-serif text-3xl">{artwork.title}</h1>
            <ArtworkStatusBadge status={artwork.status} />
          </div>
        </div>
        {artwork.status !== 'DRAFT' ? (
          <a
            href={`/artworks/${artwork.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Посмотреть на сайте ↗
          </a>
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Фотографии</CardTitle>
        </CardHeader>
        <CardContent>
          <ArtworkImagesManager artwork={artwork} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Описание и цена</CardTitle>
        </CardHeader>
        <CardContent>
          {/* key: после сохранения форма пересоздаётся со свежими значениями */}
          <ArtworkForm key={artwork.updatedAt} artwork={artwork} />
        </CardContent>
      </Card>

      <ArtworkDelete
        id={artwork.id}
        title={artwork.title}
        onDeleted={() => navigate({ to: '/artworks', replace: true })}
      />
    </div>
  );
}
