import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  InquiryCreateSchema,
  InquirySchema,
  InquiryStatus,
  InquiryStatusUpdateSchema,
} from '@asya/shared';

export class InquiryCreateDto extends createZodDto(InquiryCreateSchema) {}
export class InquiryDto extends createZodDto(InquirySchema) {}
export class InquiryStatusUpdateDto extends createZodDto(InquiryStatusUpdateSchema) {}
export class MyInquiriesQueryDto extends createZodDto(z.object({ status: InquiryStatus.optional() })) {}
