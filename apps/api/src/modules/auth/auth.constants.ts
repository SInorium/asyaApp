export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;
/** refresh-cookie уходит только на auth-эндпоинты, а не с каждым запросом */
export const REFRESH_COOKIE_PATH = '/api/auth';
