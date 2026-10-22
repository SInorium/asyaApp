import { cn } from '@asya/ui/lib/cn';
import Image from 'next/image';
import Link from 'next/link';
import { ArtworkStatusLabel, coverImage, type Artwork } from '@/entities/artwork';
import { formatPrice, formatSize } from '@/shared/lib';

export function ArtworkCard({ artwork, priority }: { artwork: Artwork; priority?: boolean }) {
  const cover = coverImage(artwork);
  const sold = artwork.status === 'SOLD';

  return (
    <Link href={`/artworks/${artwork.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
        {cover ? (
          <Image
            src={cover.url}
            alt={artwork.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            preload={priority}
            className={cn(
              'object-cover transition-transform duration-500 group-hover:scale-[1.03]',
              sold && 'opacity-70 grayscale-[30%]',
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-4xl text-muted-foreground/40">
            {artwork.title.slice(0, 1)}
          </div>
        )}
        <div className="absolute left-3 top-3">
          <ArtworkStatusLabel status={artwork.status} />
        </div>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl leading-tight group-hover:underline">{artwork.title}</h2>
          <p className="text-sm text-muted-foreground">
            {[artwork.technique, formatSize(artwork.widthCm, artwork.heightCm)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <p className={cn('whitespace-nowrap font-medium', sold && 'text-muted-foreground line-through')}>
          {formatPrice(artwork.price, artwork.currency)}
        </p>
      </div>
    </Link>
  );
}
