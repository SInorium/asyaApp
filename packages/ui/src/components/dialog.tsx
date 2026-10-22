'use client';

import { X } from 'lucide-react';
import { Dialog as D } from 'radix-ui';
import * as React from 'react';
import { cn } from '../lib/cn';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

interface DialogContentProps extends React.ComponentProps<typeof D.Content> {
  title: string;
  description?: string;
}

export function DialogContent({
  className,
  title,
  description,
  children,
  ...props
}: DialogContentProps) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
      <D.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-6 shadow-xl focus:outline-none',
          className,
        )}
        {...props}
      >
        <D.Title className="font-serif text-xl">{title}</D.Title>
        {description ? (
          <D.Description className="mt-1 text-sm text-muted-foreground">{description}</D.Description>
        ) : (
          <D.Description className="sr-only">{title}</D.Description>
        )}
        <div className="mt-4">{children}</div>
        <D.Close
          className="absolute right-4 top-4 rounded-sm opacity-60 hover:opacity-100"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
