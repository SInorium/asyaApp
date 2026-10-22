import { artworkTypeLabels } from '@asya/shared';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArtworkStatusLabel, getArtwork } from '@/entities/artwork';
import { formatPrice, formatSize } from '@/shared/lib';
import { ArtworkGallery } from './artwork-gallery';
import { InquiryDialog } from './inquiry-dialog';

export async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artwork = await getArtwork(slug);
  if (!artwork) notFound();

  const specs = [
    ['Вид', artworkTypeLabels[artwork.type]],
    ['Техника', artwork.technique],
    ['Размер', formatSize(artwork.widthCm, artwork.heightCm)],
    ['Год', artwork.year],
  ].filter(([, v]) => v) as [string, string | number][];

  return (
    <article className="grid gap-10 lg:grid-cols-[3fr_2fr]">
      <ArtworkGallery images={artwork.images} title={artwork.title} />

      <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Каталог
        </Link>
        <header className="flex flex-col gap-2">
          <ArtworkStatusLabel status={artwork.status} />
          <h1 className="font-serif text-4xl leading-tight">{artwork.title}</h1>
          <p className="text-sm text-muted-foreground">{artwork.author.displayName}</p>
        </header>

        <p className="text-2xl">{formatPrice(artwork.price, artwork.currency)}</p>

        {artwork.status === 'SOLD' ? (
          <p className="text-sm text-muted-foreground">
            Эта работа уже нашла владельца. Посмотрите другие работы в каталоге.
          </p>
        ) : (
          <InquiryDialog
            artworkId={artwork.id}
            artworkTitle={artwork.title}
            reserved={artwork.status === 'RESERVED'}
          />
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y py-4 text-sm">
          {specs.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        {artwork.description ? (
          <div className="whitespace-pre-line leading-relaxed">{artwork.description}</div>
        ) : null}
      </div>
    </article>
  );
}

export function ArtworkSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
      <div className="aspect-[4/5] animate-pulse rounded-md bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
