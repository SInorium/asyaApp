import {
  myArtworksAttachImage,
  myArtworksPresign,
  myArtworksRemoveImage,
  myArtworksReorderImages,
} from '@asya/api-client/query';
import type { Artwork } from '@asya/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { artworkKeys } from '@/entities/artwork';
import { uploadToStorage } from '@/shared/api';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'] as const;
type Accepted = (typeof ACCEPTED)[number];
const MAX_SIZE = 20 * 1024 * 1024;

export const acceptAttr = ACCEPTED.join(',');

export function useArtworkImages(artwork: Artwork) {
  const queryClient = useQueryClient();
  // каждый ответ API — актуальная карточка: кладём её в кэш без лишнего GET
  const apply = (next: Artwork) => {
    queryClient.setQueryData(artworkKeys.detail(next.id), next);
    void queryClient.invalidateQueries({ queryKey: artworkKeys.all() });
  };

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      let latest = artwork;
      // последовательно: порядок фото совпадает с порядком выбора файлов
      for (const file of files) {
        if (!ACCEPTED.includes(file.type as Accepted)) {
          throw new Error(`${file.name}: поддерживаются JPEG, PNG и WebP`);
        }
        if (file.size > MAX_SIZE) throw new Error(`${file.name}: файл больше 20 МБ`);

        const { uploadUrl, key } = await myArtworksPresign({
          contentType: file.type as Accepted,
        });
        await uploadToStorage(uploadUrl, file);
        latest = await myArtworksAttachImage(artwork.id, { key });
        apply(latest);
      }
      return latest;
    },
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => myArtworksRemoveImage(artwork.id, imageId),
    onSuccess: apply,
  });

  const reorder = useMutation({
    mutationFn: (args: { imageIds: string[]; coverId?: string }) =>
      myArtworksReorderImages(artwork.id, args),
    onSuccess: apply,
  });

  const ids = artwork.images.map((i) => i.id);

  return {
    upload,
    remove,
    reorder,
    move(imageId: string, delta: -1 | 1) {
      const from = ids.indexOf(imageId);
      const to = from + delta;
      if (to < 0 || to >= ids.length) return;
      const next = [...ids];
      [next[from], next[to]] = [next[to]!, next[from]!];
      reorder.mutate({ imageIds: next });
    },
    setCover(imageId: string) {
      reorder.mutate({ imageIds: ids, coverId: imageId });
    },
  };
}
