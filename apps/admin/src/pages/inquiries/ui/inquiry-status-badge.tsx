import { inquiryStatusLabels, type InquiryStatus } from '@asya/shared';
import { Badge, type BadgeProps } from '@asya/ui/components/badge';

const tone: Record<InquiryStatus, BadgeProps['tone']> = {
  NEW: 'accent',
  IN_PROGRESS: 'warning',
  CLOSED: 'neutral',
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return <Badge tone={tone[status]}>{inquiryStatusLabels[status]}</Badge>;
}
