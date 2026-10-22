import { ImageOff } from 'lucide-react';

interface Props {
  images: { url: string; isCover: boolean }[];
  title: string;
}

export function ArtworkThumb({ images, title }: Props) {
  const cover = images.find((i) => i.isCover) ?? images[0];
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
      {cover ? (
        <img src={cover.url} alt={title} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ImageOff className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}
