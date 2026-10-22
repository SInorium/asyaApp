import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  ArtworkSchema,
  ArtworkStatus,
  ArtworkStatusUpdateSchema,
  ArtworkUpsertSchema,
  AttachImageSchema,
  CatalogQuerySchema,
  PresignResponseSchema,
  PresignSchema,
  ReorderImagesSchema,
  paginated,
} from '@asya/shared';

export class ArtworkDto extends createZodDto(ArtworkSchema) {}
export class ArtworkPageDto extends createZodDto(paginated(ArtworkSchema)) {}
export class ArtworkUpsertDto extends createZodDto(ArtworkUpsertSchema) {}
export class ArtworkStatusUpdateDto extends createZodDto(ArtworkStatusUpdateSchema) {}
export class CatalogQueryDto extends createZodDto(CatalogQuerySchema) {}
export class MyArtworksQueryDto extends createZodDto(z.object({ status: ArtworkStatus.optional() })) {}
export class AttachImageDto extends createZodDto(AttachImageSchema) {}
export class ReorderImagesDto extends createZodDto(ReorderImagesSchema) {}
export class PresignDto extends createZodDto(PresignSchema) {}
export class PresignResponseDto extends createZodDto(PresignResponseSchema) {}
