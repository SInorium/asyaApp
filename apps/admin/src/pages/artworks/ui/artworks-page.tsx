import { ArtworkStatus, artworkStatusLabels } from '@asya/shared';
import { Button } from '@asya/ui/components/button';
import { Select } from '@asya/ui/components/input';
import { getRouteApi, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { ArtworksTable } from './artworks-table';

const route = getRouteApi('/_authed/artworks/');

export function ArtworksPage() {
  const { status } = route.useSearch();
  const navigate = route.useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Работы</h1>
        <div className="flex items-center gap-3">
          <Select
            aria-label="Фильтр по статусу"
            className="w-44"
            value={status ?? ''}
            onChange={(e) =>
              navigate({
                search: { status: (e.target.value || undefined) as ArtworkStatus | undefined },
              })
            }
          >
            <option value="">Все статусы</option>
            {ArtworkStatus.options.map((s) => (
              <option key={s} value={s}>
                {artworkStatusLabels[s]}
              </option>
            ))}
          </Select>
          <Button asChild>
            <Link to="/artworks/new">
              <Plus className="h-4 w-4" /> Добавить
            </Link>
          </Button>
        </div>
      </header>
      <ArtworksTable status={status} />
    </div>
  );
}
