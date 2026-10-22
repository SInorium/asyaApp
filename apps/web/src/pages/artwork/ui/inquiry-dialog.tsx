'use client';

import { InquiryCreateSchema } from '@asya/shared';
import { Button } from '@asya/ui/components/button';
import { Dialog, DialogContent, DialogTrigger } from '@asya/ui/components/dialog';
import { Field } from '@asya/ui/components/field';
import { Input, Textarea } from '@asya/ui/components/input';
import { useState, type FormEvent } from 'react';
import { inquiriesCreate } from '@/shared/api';

interface Props {
  artworkId: string;
  artworkTitle: string;
  reserved: boolean;
}

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'message' | 'form', string>>;

export function InquiryDialog({ artworkId, artworkTitle, reserved }: Props) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    // та же схема, что проверяет API
    const parsed = InquiryCreateSchema.safeParse({ ...raw, phone: raw.phone || undefined });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Errors] ??= issue.message;
      setErrors(next);
      return;
    }

    setErrors({});
    setState('sending');
    try {
      await inquiriesCreate(artworkId, parsed.data);
      setState('done');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Не удалось отправить заявку' });
      setState('idle');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="accent" className="w-full sm:w-auto">
          {reserved ? 'Встать в очередь' : 'Хочу эту картину'}
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Заявка на покупку"
        description={`«${artworkTitle}». Автор свяжется с вами, чтобы обсудить оплату и доставку.`}
      >
        {state === 'done' ? (
          <div className="flex flex-col gap-4">
            <p>Спасибо! Заявка отправлена, мы скоро свяжемся с вами.</p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Закрыть
            </Button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <Field label="Имя" htmlFor="inq-name" error={errors.name}>
              <Input id="inq-name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
            </Field>
            <Field label="Email" htmlFor="inq-email" error={errors.email}>
              <Input
                id="inq-email"
                name="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
            </Field>
            <Field label="Телефон" htmlFor="inq-phone" hint="Необязательно" error={errors.phone}>
              <Input id="inq-phone" name="phone" type="tel" autoComplete="tel" />
            </Field>
            <Field label="Комментарий" htmlFor="inq-message" error={errors.message}>
              <Textarea id="inq-message" name="message" rows={3} />
            </Field>
            {/* honeypot: скрыт от людей, боты его заполняют */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

            {errors.form ? <p className="text-sm text-destructive">{errors.form}</p> : null}
            <Button type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
