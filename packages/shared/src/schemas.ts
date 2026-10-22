import { z } from 'zod';
import { ArtworkStatus, ArtworkType, InquiryStatus, UserRole } from './enums';

// ---------- auth ----------
export const LoginSchema = z.object({
  email: z.email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = LoginSchema.extend({
  name: z.string().trim().min(2, 'Минимум 2 символа').max(100),
  inviteCode: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: UserRole,
});
export type User = z.infer<typeof UserSchema>;

// ---------- artworks ----------
export const ArtworkImageSchema = z.object({
  id: z.string(),
  key: z.string(),
  url: z.string(),
  position: z.number().int(),
  isCover: z.boolean(),
});
export type ArtworkImage = z.infer<typeof ArtworkImageSchema>;

export const AuthorSummarySchema = z.object({
  slug: z.string(),
  displayName: z.string(),
});

export const ArtworkSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  currency: z.string(),
  type: ArtworkType,
  status: ArtworkStatus,
  technique: z.string().nullable(),
  widthCm: z.number().nullable(),
  heightCm: z.number().nullable(),
  year: z.number().int().nullable(),
  images: z.array(ArtworkImageSchema),
  author: AuthorSummarySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Artwork = z.infer<typeof ArtworkSchema>;

export const ArtworkUpsertSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название').max(200),
  description: z.string().trim().max(5000).default(''),
  price: z.coerce.number().nonnegative('Цена не может быть отрицательной'),
  currency: z.string().length(3).default('RUB'),
  type: ArtworkType.default('PAINTING'),
  status: ArtworkStatus.default('DRAFT'),
  technique: z.string().trim().max(200).nullable().optional(),
  widthCm: z.coerce.number().positive().nullable().optional(),
  heightCm: z.coerce.number().positive().nullable().optional(),
  year: z.coerce.number().int().min(1000).max(3000).nullable().optional(),
});
export type ArtworkUpsertInput = z.input<typeof ArtworkUpsertSchema>;

export const ArtworkStatusUpdateSchema = z.object({ status: ArtworkStatus });

export const CatalogQuerySchema = z.object({
  type: ArtworkType.optional(),
  status: z.enum(['PUBLISHED', 'RESERVED', 'SOLD']).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });
export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };

// ---------- uploads ----------
export const PresignSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
export const PresignResponseSchema = z.object({ uploadUrl: z.string(), key: z.string() });
export type PresignResponse = z.infer<typeof PresignResponseSchema>;

export const AttachImageSchema = z.object({ key: z.string().min(1) });
export const ReorderImagesSchema = z.object({
  imageIds: z.array(z.string()).min(1),
  coverId: z.string().optional(),
});

// ---------- inquiries ----------
export const InquiryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(100),
  email: z.email('Некорректный email'),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(2000).default(''),
  // honeypot: настоящие пользователи это поле не видят и не заполняют
  website: z.string().max(0).optional(),
});
export type InquiryCreateInput = z.input<typeof InquiryCreateSchema>;

export const InquirySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  message: z.string(),
  status: InquiryStatus,
  createdAt: z.string(),
  artwork: z.object({ id: z.string(), slug: z.string(), title: z.string() }),
});
export type Inquiry = z.infer<typeof InquirySchema>;

export const InquiryStatusUpdateSchema = z.object({ status: InquiryStatus });
