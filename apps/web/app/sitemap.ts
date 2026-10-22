import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { getCatalog } from '@/entities/artwork';
import { siteConfig } from '@/shared/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // рендерим по запросу, а не при сборке: на этапе build API может быть недоступен
  await connection();
  const { items } = await getCatalog({ page: 1, pageSize: 60 });
  return [
    { url: siteConfig.url, changeFrequency: 'weekly' },
    ...items.map((a) => ({ url: `${siteConfig.url}/artworks/${a.slug}`, lastModified: a.updatedAt })),
  ];
}
