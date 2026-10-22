import { Card, CardContent, CardHeader, CardTitle } from '@asya/ui/components/card';
import { Link, useNavigate } from '@tanstack/react-router';
import { RegisterForm } from '@/features/auth';

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Регистрация автора</CardTitle>
          <p className="text-sm text-muted-foreground">
            Сейчас регистрация доступна по коду приглашения.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RegisterForm onSuccess={() => navigate({ to: '/artworks' })} />
          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-foreground underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
