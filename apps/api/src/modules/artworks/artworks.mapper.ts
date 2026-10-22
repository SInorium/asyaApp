import type { Artwork } from '@asya/shared';
import { Prisma } from '../../generated/prisma/client';
import type { StorageService } from '../storage/storage.service';

export const artworkInclude = {
  images: { orderBy: { position: 'asc' } },
  author: { select: { slug: true, displayName: true } },
} satisfies Prisma.ArtworkInclude;

export type ArtworkWithRelations = Prisma.ArtworkGetPayload<{ include: typeof artworkInclude }>;

const num = (d: Prisma.Decimal | null) => (d === null ? null : d.toNumber());

export function toArtwork(a: ArtworkWithRelations, storage: StorageService): Artwork {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    price: a.price.toNumber(),
    currency: a.currency,
    type: a.type,
    status: a.status,
    technique: a.technique,
    widthCm: num(a.widthCm),
    heightCm: num(a.heightCm),
    year: a.year,
    images: a.images.map((img) => ({
      id: img.id,
      key: img.s3Key,
      url: storage.url(img.s3Key),
      position: img.position,
      isCover: img.isCover,
    })),
    author: a.author,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
