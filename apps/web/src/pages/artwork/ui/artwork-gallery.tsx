'use client';

import type { ArtworkImage } from '@asya/shared';
import { cn } from '@asya/ui/lib/cn';
import Image from 'next/image';
import { useState } from 'react';

export function ArtworkGallery({ images, title }: { images: ArtworkImage[]; title: string }) {
  const initial = Math.max(0, images.findIndex((i) => i.isCover));
  const [active, setActive] = useState(initial);
  const current = images[active];

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-md bg-muted font-serif text-6xl text-muted-foreground/40">
        {title.slice(0, 1)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
        <Image
          src={current.url}
          alt={title}
          fill
          preload
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-contain"
        />
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Фото ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  'relative block h-20 w-20 overflow-hidden rounded-md bg-muted ring-offset-2 transition',
                  i === active ? 'ring-2 ring-accent' : 'opacity-70 hover:opacity-100',
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
