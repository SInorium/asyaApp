import { useMyArtworksList } from '@asya/api-client/query';
import type { ArtworkStatus } from '@asya/shared';
import { Table, TBody, TD, TH, THead, TR } from '@asya/ui/components/table';
import { Link } from '@tanstack/react-router';
import { ArtworkThumb } from '@/entities/artwork';
import { ArtworkStatusSelect } from './artwork-status-select';
import { errorMessage, formatPrice } from '@/shared/lib';

export function ArtworksTable({ status }: { status?: ArtworkStatus }) {
  const { data, isPending, error } = useMyArtworksList(status ? { status } : undefined);

  if (isPending) return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  if (error) return <p className="text-sm text-destructive">{errorMessage(error)}</p>;

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Работ пока нет
      </p>
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Работа</TH>
          <TH>Цена</TH>
          <TH>Статус</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((a) => (
          <TR key={a.id}>
            <TD>
              <Link
                to="/artworks/$id"
                params={{ id: a.id }}
                className="flex items-center gap-3 hover:underline"
              >
                <ArtworkThumb images={a.images} title={a.title} />
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[a.technique, a.widthCm && a.heightCm ? `${a.widthCm}×${a.heightCm} см` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </Link>
            </TD>
            <TD className="whitespace-nowrap">{formatPrice(a.price, a.currency)}</TD>
            <TD>
              <ArtworkStatusSelect id={a.id} status={a.status} />
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
