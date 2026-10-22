import { InquiryStatus } from '@asya/shared';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { InquiriesPage } from '@/pages/inquiries';

export const Route = createFileRoute('/_authed/inquiries')({
  validateSearch: z.object({ status: InquiryStatus.optional().catch(undefined) }),
  component: InquiriesPage,
});
