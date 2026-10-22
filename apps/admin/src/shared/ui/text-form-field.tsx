import { Field } from '@asya/ui/components/field';
import { Input } from '@asya/ui/components/input';
import type { AnyFieldApi } from '@tanstack/react-form';
import { errorMessage } from '@/shared/lib';

interface Props {
  field: AnyFieldApi;
  label: string;
  type?: string;
  autoComplete?: string;
}

/** Текстовое поле TanStack Form + подпись + первая ошибка валидации. */
export function TextFormField({ field, label, type = 'text', autoComplete }: Props) {
  const error = field.state.meta.isTouched ? errorMessage(field.state.meta.errors[0]) : undefined;
  return (
    <Field label={label} htmlFor={field.name} error={error}>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        autoComplete={autoComplete}
        value={field.state.value ?? ''}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={!!error}
      />
    </Field>
  );
}
