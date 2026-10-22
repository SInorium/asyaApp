import {
  ArtworkUpsertSchema,
  type Artwork,
  type ArtworkStatus,
  type ArtworkType,
  type ArtworkUpsertInput,
} from '@asya/shared';

/** Значения формы: числа — строками, как их отдают <input>. */
export interface ArtworkFormValues {
  title: string;
  description: string;
  price: string;
  type: ArtworkType;
  status: ArtworkStatus;
  technique: string;
  widthCm: string;
  heightCm: string;
  year: string;
}

const str = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));
const orNull = (v: string) => (v.trim() === '' ? null : v.trim());

export function toFormValues(a?: Artwork): ArtworkFormValues {
  return {
    title: a?.title ?? '',
    description: a?.description ?? '',
    price: str(a?.price),
    type: a?.type ?? 'PAINTING',
    status: a?.status ?? 'DRAFT',
    technique: a?.technique ?? '',
    widthCm: str(a?.widthCm),
    heightCm: str(a?.heightCm),
    year: str(a?.year),
  };
}

/** Пустые строки → null; приведение чисел делает z.coerce в общей схеме. */
export function toPayload(v: ArtworkFormValues): ArtworkUpsertInput {
  return {
    title: v.title,
    description: v.description,
    price: v.price.trim() === '' ? undefined : v.price,
    type: v.type,
    status: v.status,
    technique: orNull(v.technique),
    widthCm: orNull(v.widthCm),
    heightCm: orNull(v.heightCm),
    year: orNull(v.year),
  } as ArtworkUpsertInput;
}

/**
 * Валидация той же схемой, что и на сервере.
 * Ошибки раскладываются по полям в формате, который понимает TanStack Form.
 */
export function validateArtwork(v: ArtworkFormValues) {
  const result = ArtworkUpsertSchema.safeParse(toPayload(v));
  if (result.success) return undefined;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    fields[key] ??= key === 'price' && v.price.trim() === '' ? 'Укажите цену' : issue.message;
  }
  return { fields };
}
