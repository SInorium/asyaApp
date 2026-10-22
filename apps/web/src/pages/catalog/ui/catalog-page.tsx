import { CatalogQuerySchema } from '@asya/shared';
import { getCatalog } from '@/entities/artwork';
import { ArtworkCard } from './artwork-card';
import { CatalogFilters } from './catalog-filters';
import { Pagination } from './pagination';

type SearchParams = Record<string, string | string[] | undefined>;

/** Некорректные параметры из URL не ломают страницу — просто игнорируются. */
function parseQuery(sp: SearchParams) {
  const flat = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = CatalogQuerySchema.safeParse(flat);
  return parsed.success ? parsed.data : CatalogQuerySchema.parse({});
}

export async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = parseQuery(await searchParams);
  const { items, total } = await getCatalog(query);

  return (
    <div className="flex flex-col gap-8">
      <CatalogFilters />
      {items.length === 0 ? (
        <p className="py-24 text-center text-muted-foreground">
          По выбранным условиям работ не нашлось.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a, i) => (
            <li key={a.id}>
              {/* первые карточки видны сразу — грузим их без lazy */}
              <ArtworkCard artwork={a} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
      <Pagination query={query} total={total} />
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
      ))}
    </ul>
  );
}
