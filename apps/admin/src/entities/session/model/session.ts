import { authMe, getAuthMeQueryKey } from '@asya/api-client/query';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

/** Текущий пользователь. Используется и в beforeLoad роутов, и в компонентах. */
export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: getAuthMeQueryKey(),
    queryFn: ({ signal }) => authMe({ signal }),
    staleTime: 5 * 60_000,
    retry: false,
  });

export function useSession() {
  return useSuspenseQuery(sessionQueryOptions()).data;
}
