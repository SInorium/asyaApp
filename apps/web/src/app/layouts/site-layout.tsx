import Link from 'next/link';
import type { ReactNode } from 'react';
import { siteConfig } from '@/shared/config';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-4 py-6 sm:px-6">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            {siteConfig.name}
          </Link>
          <p className="hidden text-sm text-muted-foreground sm:block">{siteConfig.description}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl justify-between px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>© {siteConfig.name}</span>
          <a href="/admin/" className="hover:text-foreground">
            Для авторов
          </a>
        </div>
      </footer>
    </div>
  );
}
