import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { CATALOG_TAG } from '@/entities/artwork';

const ALLOWED_TAGS = new Set([CATALOG_TAG]);

/** Вебхук из API: после изменений в админке каталог должен обновиться сразу. */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => ALLOWED_TAGS.has(t)) : [];
  // { expire: 0 }: без stale-while-revalidate, следующий посетитель увидит свежие данные
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ ok: true, revalidated: tags });
}
