import type { Artwork, CatalogQuery, Paginated } from '@asya/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { ApiError, artworksGet, artworksList } from '@/shared/api';

/** Тот же тег сбрасывает API (RevalidationService) после правок в админке. */
export const CATALOG_TAG = 'artworks';

export async function getCatalog(query: CatalogQuery): Promise<Paginated<Artwork>> {
  'use cache';
  cacheTag(CATALOG_TAG);
  // страховка на случай потерянного вебхука
  cacheLife('hours');
  return artworksList(query);
}

export async function getArtwork(slug: string): Promise<Artwork | null> {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('hours');
  try {
    return await artworksGet(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
