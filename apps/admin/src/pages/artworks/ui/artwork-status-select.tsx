import { useMyArtworksUpdateStatus } from '@asya/api-client/query';
import { ArtworkStatus, artworkStatusLabels } from '@asya/shared';
import { Select } from '@asya/ui/components/input';
import { useQueryClient } from '@tanstack/react-query';
import { artworkKeys } from '@/entities/artwork';

/** Быстрая смена статуса прямо в таблице. */
export function ArtworkStatusSelect({ id, status }: { id: string; status: ArtworkStatus }) {
  const queryClient = useQueryClient();
  const mutation = useMyArtworksUpdateStatus({
    mutation: {
      onSuccess: (a) => {
        queryClient.setQueryData(artworkKeys.detail(id), a);
        void queryClient.invalidateQueries({ queryKey: artworkKeys.all() });
      },
    },
  });

  return (
    <Select
      aria-label="Статус"
      className="h-8 w-40"
      value={mutation.variables?.data.status ?? status}
      disabled={mutation.isPending}
      onChange={(e) => mutation.mutate({ id, data: { status: e.target.value as ArtworkStatus } })}
    >
      {ArtworkStatus.options.map((s) => (
        <option key={s} value={s}>
          {artworkStatusLabels[s]}
        </option>
      ))}
    </Select>
  );
}
