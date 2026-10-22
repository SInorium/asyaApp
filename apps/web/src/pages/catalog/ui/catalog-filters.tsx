'use client';

import { ArtworkType, artworkTypeLabels } from '@asya/shared';
import { Input, Select } from '@asya/ui/components/input';
import { cn } from '@asya/ui/lib/cn';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const statuses = [
  { value: '', label: 'Все работы' },
  { value: 'PUBLISHED', label: 'В продаже' },
  { value: 'SOLD', label: 'Проданные' },
] as const;

/**
 * Фильтры живут в URL: ссылкой можно поделиться, а RSC-страница
 * перерисовывается на сервере при каждом изменении.
 */
export function CatalogFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  // nullable в типах из-за корневой pages/, в App Router всегда есть
  const params = new URLSearchParams(useSearchParams()?.toString());
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const status = params.get('status') ?? '';

  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-x-6 gap-y-4 border-b pb-6 transition-opacity',
        pending && 'opacity-60',
      )}
    >
      <div className="flex gap-1" role="group" aria-label="Наличие">
        {statuses.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => set('status', s.value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              status === s.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Вид
        <Select
          className="w-40"
          value={params.get('type') ?? ''}
          onChange={(e) => set('type', e.target.value)}
        >
          <option value="">Любой</option>
          {ArtworkType.options.map((t) => (
            <option key={t} value={t}>
              {artworkTypeLabels[t]}
            </option>
          ))}
        </Select>
      </label>

      <fieldset className="flex items-end gap-2">
        <legend className="mb-1 text-xs text-muted-foreground">Цена, ₽</legend>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="от"
          className="w-28"
          defaultValue={params.get('priceMin') ?? ''}
          // применяем по уходу с поля, а не на каждый символ
          onBlur={(e) => set('priceMin', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && set('priceMin', e.currentTarget.value)}
        />
        <span className="pb-2 text-muted-foreground">—</span>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="до"
          className="w-28"
          defaultValue={params.get('priceMax') ?? ''}
          onBlur={(e) => set('priceMax', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && set('priceMax', e.currentTarget.value)}
        />
      </fieldset>
    </div>
  );
}
