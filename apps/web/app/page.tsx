import { Suspense } from 'react';
import { CatalogPage, CatalogSkeleton } from '@/pages/catalog';

// searchParams — runtime-данные: читаем их внутри Suspense, оболочка страницы остаётся статичной
export default function Page({ searchParams }: PageProps<'/'>) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogPage searchParams={searchParams} />
    </Suspense>
  );
}
