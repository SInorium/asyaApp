import { RegisterSchema, type RegisterInput } from '@asya/shared';
import { useAuthRegister } from '@asya/api-client/query';
import { Button } from '@asya/ui/components/button';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { sessionQueryOptions } from '@/entities/session';
import { errorMessage } from '@/shared/lib';
import { TextFormField } from '@/shared/ui';

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const register = useAuthRegister({
    mutation: {
      onSuccess: (user) => queryClient.setQueryData(sessionQueryOptions().queryKey, user),
    },
  });

  const form = useForm({
    defaultValues: { name: '', email: '', password: '', inviteCode: '' } as RegisterInput,
    validators: { onSubmit: RegisterSchema },
    onSubmit: async ({ value }) => {
      await register.mutateAsync({ data: value });
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
      <form.Field name="name">
        {(field) => <TextFormField field={field} label="Имя автора" autoComplete="name" />}
      </form.Field>
      <form.Field name="email">
        {(field) => <TextFormField field={field} label="Email" type="email" autoComplete="email" />}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <TextFormField field={field} label="Пароль" type="password" autoComplete="new-password" />
        )}
      </form.Field>
      <form.Field name="inviteCode">
        {(field) => <TextFormField field={field} label="Код приглашения" />}
      </form.Field>

      {register.error ? (
        <p className="text-sm text-destructive">{errorMessage(register.error)}</p>
      ) : null}

      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Создаём…' : 'Зарегистрироваться'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
