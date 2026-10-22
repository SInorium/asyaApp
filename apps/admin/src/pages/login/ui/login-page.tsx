import { Card, CardContent, CardHeader, CardTitle } from '@asya/ui/components/card';
import { getRouteApi, Link, useRouter } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth';

const route = getRouteApi('/login');

export function LoginPage() {
  const { redirect } = route.useSearch();
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Вход в мастерскую</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LoginForm
            onSuccess={() =>
              redirect ? router.history.push(redirect) : router.navigate({ to: '/artworks' })
            }
          />
          <p className="text-center text-sm text-muted-foreground">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-foreground underline">
              Регистрация автора
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
