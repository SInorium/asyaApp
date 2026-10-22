import { useMyArtworksRemove } from '@asya/api-client/query';
import { Button } from '@asya/ui/components/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@asya/ui/components/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { artworkKeys } from '@/entities/artwork';
import { errorMessage } from '@/shared/lib';

export function DeleteArtworkButton({ id, title, onDeleted }: { id: string; title: string; onDeleted: () => void }) {
  const queryClient = useQueryClient();
  const remove = useMyArtworksRemove({
    mutation: {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: artworkKeys.detail(id) });
        void queryClient.invalidateQueries({ queryKey: artworkKeys.all() });
        onDeleted();
      },
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          <Trash2 className="h-4 w-4" /> Удалить работу
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Удалить работу?"
        description={`«${title}» и все её фотографии будут удалены без возможности восстановления.`}
      >
        {remove.error ? (
          <p className="mb-3 text-sm text-destructive">{errorMessage(remove.error)}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ id })}
          >
            Удалить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
