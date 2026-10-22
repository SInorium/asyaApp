import type { Metadata } from 'next';
import { Suspense } from 'react';
import { coverImage, getArtwork } from '@/entities/artwork';
import { ArtworkPage, ArtworkSkeleton } from '@/pages/artwork';

export async function generateMetadata({ params }: PageProps<'/artworks/[slug]'>): Promise<Metadata> {
  const artwork = await getArtwork((await params).slug);
  if (!artwork) return {};
  const cover = coverImage(artwork);
  return {
    title: artwork.title,
    description: artwork.description.slice(0, 160) || undefined,
    openGraph: { title: artwork.title, images: cover ? [cover.url] : undefined },
  };
}

export default function Page({ params }: PageProps<'/artworks/[slug]'>) {
  return (
    <Suspense fallback={<ArtworkSkeleton />}>
      <ArtworkPage params={params} />
    </Suspense>
  );
}
