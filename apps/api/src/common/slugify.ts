const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** «Утро в саду» → «utro-v-sadu» */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Добавляет короткий случайный суффикс, чтобы slug был уникальным без лишних запросов в БД. */
export function uniqueSlug(input: string): string {
  const base = slugify(input) || 'item';
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}
