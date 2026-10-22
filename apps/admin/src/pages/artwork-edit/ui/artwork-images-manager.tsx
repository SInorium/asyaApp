import type { Artwork } from '@asya/shared';
import { Button } from '@asya/ui/components/button';
import { cn } from '@asya/ui/lib/cn';
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { errorMessage } from '@/shared/lib';
import { acceptAttr, useArtworkImages } from '../model/use-artwork-images';

export function ArtworkImagesManager({ artwork }: { artwork: Artwork }) {
  const { upload, remove, reorder, move, setCover } = useArtworkImages(artwork);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const busy = upload.isPending || remove.isPending || reorder.isPending;
  const error = upload.error ?? remove.error ?? reorder.error;

  const handleFiles = (list: FileList | null) => {
    if (list?.length) upload.mutate(Array.from(list));
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-accent bg-accent/5' : 'border-border',
        )}
      >
        <ImagePlus className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Перетащите фото сюда или{' '}
          <button
            type="button"
            className="font-medium text-foreground underline"
            onClick={() => inputRef.current?.click()}
          >
            выберите файлы
          </button>
        </p>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · до 20 МБ</p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {upload.isPending ? <p className="text-sm">Загружаем…</p> : null}
      </div>

      {error ? <p className="text-sm text-destructive">{errorMessage(error)}</p> : null}

      {artwork.images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {artwork.images.map((img, index) => (
            <li
              key={img.id}
              className={cn(
                'group relative overflow-hidden rounded-lg border bg-muted',
                img.isCover && 'ring-2 ring-accent',
              )}
            >
              <img src={img.url} alt="" className="aspect-square w-full object-cover" />
              {img.isCover ? (
                <span className="absolute left-2 top-2 rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  Обложка
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <div className="flex">
                  <IconBtn label="Левее" disabled={busy || index === 0} onClick={() => move(img.id, -1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Правее"
                    disabled={busy || index === artwork.images.length - 1}
                    onClick={() => move(img.id, 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </IconBtn>
                </div>
                <div className="flex">
                  <IconBtn
                    label="Сделать обложкой"
                    disabled={busy || img.isCover}
                    onClick={() => setCover(img.id)}
                  >
                    <Star className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Удалить" disabled={busy} onClick={() => remove.mutate(img.id)}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function IconBtn(props: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-8 w-8 text-white hover:bg-white/20"
      title={props.label}
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
}
