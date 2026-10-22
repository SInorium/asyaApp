import type { CatalogQuery } from '@asya/shared';
import { cn } from '@asya/ui/lib/cn';
import Link from 'next/link';

interface Props {
  query: CatalogQuery;
  total: number;
}

export function Pagination({ query, total }: Props) {
  const pages = Math.ceil(total / query.pageSize);
  if (pages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const key of ['type', 'status', 'priceMin', 'priceMax'] as const) {
      const v = query[key];
      if (v !== undefined) params.set(key, String(v));
    }
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  };

  return (
    <nav aria-label="Страницы" className="flex justify-center gap-1">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === query.page ? 'page' : undefined}
          className={cn(
            'flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm',
            p === query.page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
