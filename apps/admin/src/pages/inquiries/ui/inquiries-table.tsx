import { useInquiriesList } from '@asya/api-client/query';
import type { InquiryStatus } from '@asya/shared';
import { Table, TBody, TD, TH, THead, TR } from '@asya/ui/components/table';
import { Link } from '@tanstack/react-router';
import { InquiryStatusBadge } from './inquiry-status-badge';
import { InquiryStatusSelect } from './inquiry-status-select';
import { errorMessage, formatDate } from '@/shared/lib';

export function InquiriesTable({ status }: { status?: InquiryStatus }) {
  const { data, isPending, error } = useInquiriesList(status ? { status } : undefined);

  if (isPending) return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  if (error) return <p className="text-sm text-destructive">{errorMessage(error)}</p>;

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Заявок нет
      </p>
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Дата</TH>
          <TH>Работа</TH>
          <TH>Покупатель</TH>
          <TH>Сообщение</TH>
          <TH>Статус</TH>
        </TR>
      </THead>
      <TBody>
        {items.map((i) => (
          <TR key={i.id}>
            <TD className="whitespace-nowrap text-muted-foreground">{formatDate(i.createdAt)}</TD>
            <TD>
              <Link to="/artworks/$id" params={{ id: i.artwork.id }} className="hover:underline">
                {i.artwork.title}
              </Link>
            </TD>
            <TD>
              <p className="font-medium">{i.name}</p>
              <a href={`mailto:${i.email}`} className="block text-xs text-accent hover:underline">
                {i.email}
              </a>
              {i.phone ? (
                <a href={`tel:${i.phone}`} className="block text-xs text-muted-foreground">
                  {i.phone}
                </a>
              ) : null}
            </TD>
            <TD className="max-w-xs whitespace-pre-line text-muted-foreground">
              {i.message || '—'}
            </TD>
            <TD>
              <div className="flex flex-col items-start gap-1">
                <InquiryStatusBadge status={i.status} />
                <InquiryStatusSelect id={i.id} status={i.status} />
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
