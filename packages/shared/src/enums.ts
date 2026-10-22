import { z } from 'zod';

export const UserRole = z.enum(['OWNER', 'AUTHOR', 'BUYER']);
export type UserRole = z.infer<typeof UserRole>;

export const ArtworkType = z.enum(['PAINTING', 'GRAPHIC', 'SCULPTURE', 'OTHER']);
export type ArtworkType = z.infer<typeof ArtworkType>;

export const ArtworkStatus = z.enum(['DRAFT', 'PUBLISHED', 'RESERVED', 'SOLD']);
export type ArtworkStatus = z.infer<typeof ArtworkStatus>;

export const InquiryStatus = z.enum(['NEW', 'IN_PROGRESS', 'CLOSED']);
export type InquiryStatus = z.infer<typeof InquiryStatus>;

export const artworkTypeLabels: Record<ArtworkType, string> = {
  PAINTING: 'Живопись',
  GRAPHIC: 'Графика',
  SCULPTURE: 'Скульптура',
  OTHER: 'Другое',
};

export const artworkStatusLabels: Record<ArtworkStatus, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'В продаже',
  RESERVED: 'Забронирована',
  SOLD: 'Продана',
};

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  CLOSED: 'Закрыта',
};
