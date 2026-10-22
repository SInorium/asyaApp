import { getMyArtworksGetQueryKey, getMyArtworksListQueryKey } from '@asya/api-client/query';

/**
 * Ключи кэша TanStack Query для работ автора.
 * `all` — префикс: инвалидирует и списки с любыми фильтрами, и карточки.
 */
export const artworkKeys = {
  all: () => [getMyArtworksListQueryKey()[0]] as const,
  detail: (id: string) => getMyArtworksGetQueryKey(id),
};
