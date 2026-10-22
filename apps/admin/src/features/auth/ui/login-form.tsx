import { LoginSchema } from '@asya/shared';
import { useAuthLogin } from '@asya/api-client/query';
import { Button } from '@asya/ui/components/button';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { sessionQueryOptions } from '@/entities/session';
import { errorMessage } from '@/shared/lib';
import { TextFormField } from '@/shared/ui';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const login = useAuthLogin({
    mutation: {
      // ответ login — это текущий пользователь: сразу кладём его в кэш сессии
      onSuccess: (user) => queryClient.setQueryData(sessionQueryOptions().queryKey, user),
    },
  });

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: LoginSchema },
    onSubmit: async ({ value }) => {
      await login.mutateAsync({ data: value });
      onSuccess();
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => <TextFormField field={field} label="Email" type="email" autoComplete="email" />}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <TextFormField field={field} label="Пароль" type="password" autoComplete="current-password" />
        )}
      </form.Field>

      {login.error ? <p className="text-sm text-destructive">{errorMessage(login.error)}</p> : null}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Входим…' : 'Войти'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
