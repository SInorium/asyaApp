import type { ArtworkStatus } from '@asya/shared';
import { Badge } from '@asya/ui/components/badge';

/** На витрине «В продаже» не подписываем — это состояние по умолчанию. */
export function ArtworkStatusLabel({ status }: { status: ArtworkStatus }) {
  if (status === 'RESERVED') return <Badge tone="warning">Забронирована</Badge>;
  if (status === 'SOLD') return <Badge tone="danger">Продана</Badge>;
  return null;
}
