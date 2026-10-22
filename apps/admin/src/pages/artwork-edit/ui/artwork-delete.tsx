import { DeleteArtworkButton } from './delete-artwork-button';

interface Props {
  id: string;
  title: string;
  onDeleted: () => void;
}

export function ArtworkDelete(props: Props) {
  return (
    <section className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
      <p className="text-sm text-muted-foreground">Удаление необратимо.</p>
      <DeleteArtworkButton {...props} />
    </section>
  );
}
