import type { Artwork } from '@asya/shared';

export function coverImage(artwork: Pick<Artwork, 'images'>) {
  return artwork.images.find((i) => i.isCover) ?? artwork.images[0] ?? null;
}
