import { configureApi } from '@asya/api-client/fetcher';

/**
 * На сервере (RSC) ходим в Nest напрямую по внутреннему адресу.
 * В браузере baseUrl остаётся пустым — запросы идут на тот же origin.
 */
if (typeof window === 'undefined') {
  configureApi({ baseUrl: process.env.API_INTERNAL_URL ?? 'http://localhost:4000' });
}

export { ApiError } from '@asya/api-client/fetcher';
export { artworksGet, artworksList } from '@asya/api-client/fetch';
