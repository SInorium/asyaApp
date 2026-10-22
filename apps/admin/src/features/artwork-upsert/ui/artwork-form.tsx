import { useMyArtworksCreate, useMyArtworksUpdate } from '@asya/api-client/query';
import {
  ArtworkStatus,
  ArtworkType,
  artworkStatusLabels,
  artworkTypeLabels,
  type Artwork,
} from '@asya/shared';
import { Button } from '@asya/ui/components/button';
import { Field } from '@asya/ui/components/field';
import { Select, Textarea } from '@asya/ui/components/input';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { artworkKeys } from '@/entities/artwork';
import { errorMessage } from '@/shared/lib';
import { TextFormField } from '@/shared/ui';
import { toFormValues, toPayload, validateArtwork, type ArtworkFormValues } from '../model/form-values';

interface Props {
  /** Нет artwork — режим создания */
  artwork?: Artwork;
  onSaved?: (artwork: Artwork) => void;
}

export function ArtworkForm({ artwork, onSaved }: Props) {
  const queryClient = useQueryClient();
  const onSuccess = (saved: Artwork) => {
    queryClient.setQueryData(artworkKeys.detail(saved.id), saved);
    void queryClient.invalidateQueries({ queryKey: artworkKeys.all() });
    onSaved?.(saved);
  };
  const create = useMyArtworksCreate({ mutation: { onSuccess } });
  const update = useMyArtworksUpdate({ mutation: { onSuccess } });
  const mutation = artwork ? update : create;

  const form = useForm({
    defaultValues: toFormValues(artwork),
    validators: { onSubmit: ({ value }) => validateArtwork(value) },
    onSubmit: async ({ value }) => {
      const data = toPayload(value) as Parameters<typeof create.mutateAsync>[0]['data'];
      if (artwork) await update.mutateAsync({ id: artwork.id, data });
      else await create.mutateAsync({ data });
    },
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="md:col-span-2">
        <form.Field name="title">{(f) => <TextFormField field={f} label="Название" />}</form.Field>
      </div>

      <div className="md:col-span-2">
        <form.Field name="description">
          {(f) => (
            <Field label="Описание" htmlFor={f.name}>
              <Textarea
                id={f.name}
                rows={5}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="price">
        {(f) => <TextFormField field={f} label="Цена, ₽" type="number" />}
      </form.Field>

      <form.Field name="status">
        {(f) => (
          <Field label="Статус" htmlFor={f.name}>
            <Select
              id={f.name}
              value={f.state.value}
              onChange={(e) => f.handleChange(e.target.value as ArtworkFormValues['status'])}
            >
              {ArtworkStatus.options.map((s) => (
                <option key={s} value={s}>
                  {artworkStatusLabels[s]}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </form.Field>

      <form.Field name="type">
        {(f) => (
          <Field label="Вид работы" htmlFor={f.name}>
            <Select
              id={f.name}
              value={f.state.value}
              onChange={(e) => f.handleChange(e.target.value as ArtworkFormValues['type'])}
            >
              {ArtworkType.options.map((t) => (
                <option key={t} value={t}>
                  {artworkTypeLabels[t]}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </form.Field>

      <form.Field name="technique">
        {(f) => <TextFormField field={f} label="Техника (например, холст, масло)" />}
      </form.Field>

      <div className="grid grid-cols-3 gap-4 md:col-span-2">
        <form.Field name="widthCm">
          {(f) => <TextFormField field={f} label="Ширина, см" type="number" />}
        </form.Field>
        <form.Field name="heightCm">
          {(f) => <TextFormField field={f} label="Высота, см" type="number" />}
        </form.Field>
        <form.Field name="year">{(f) => <TextFormField field={f} label="Год" type="number" />}</form.Field>
      </div>

      {mutation.error ? (
        <p className="text-sm text-destructive md:col-span-2">{errorMessage(mutation.error)}</p>
      ) : null}

      <div className="flex items-center gap-3 md:col-span-2">
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохраняем…' : artwork ? 'Сохранить' : 'Создать и перейти к фото'}
            </Button>
          )}
        </form.Subscribe>
        {update.isSuccess && !update.isPending ? (
          <span className="text-sm text-success">Сохранено</span>
        ) : null}
      </div>
    </form>
  );
}
