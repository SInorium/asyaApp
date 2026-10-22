import { artworkStatusLabels, type ArtworkStatus } from '@asya/shared';
import { Badge, type BadgeProps } from '@asya/ui/components/badge';

const tone: Record<ArtworkStatus, BadgeProps['tone']> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  RESERVED: 'warning',
  SOLD: 'danger',
};

export function ArtworkStatusBadge({ status }: { status: ArtworkStatus }) {
  return <Badge tone={tone[status]}>{artworkStatusLabels[status]}</Badge>;
}
