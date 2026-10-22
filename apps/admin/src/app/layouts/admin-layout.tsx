import { cn } from '@asya/ui/lib/cn';
import { Link, useNavigate } from '@tanstack/react-router';
import { ExternalLink, Images, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSession } from '@/entities/session';
import { LogoutButton } from '@/features/auth';

const nav = [
  { to: '/artworks', label: 'Работы', icon: Images },
  { to: '/inquiries', label: 'Заявки', icon: Inbox },
] as const;

export function AdminLayout({ children }: { children: ReactNode }) {
  const user = useSession();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b bg-card p-4 md:w-60 md:border-b-0 md:border-r">
        <div>
          <p className="font-serif text-xl">Мастерская</p>
          <p className="text-xs text-muted-foreground">{user.name}</p>
        </div>
        <nav className="flex gap-1 md:flex-col">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              activeProps={{ className: cn('bg-muted font-medium') }}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" /> Открыть сайт
          </a>
          <LogoutButton onDone={() => navigate({ to: '/login' })} />
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
