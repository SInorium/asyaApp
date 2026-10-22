/** Текст для пользователя из любой ошибки: ApiError, валидации zod-формы или сети. */
export function errorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && 'message' in err) return String(err.message);
  return 'Что-то пошло не так';
}
