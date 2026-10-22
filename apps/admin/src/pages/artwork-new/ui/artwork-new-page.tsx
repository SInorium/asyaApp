import { Card, CardContent } from '@asya/ui/components/card';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArtworkForm } from '@/features/artwork-upsert';

export function ArtworkNewPage() {
  const navigate = useNavigate();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <Link to="/artworks" className="text-sm text-muted-foreground hover:underline">
          ← Все работы
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Новая работа</h1>
        <p className="text-sm text-muted-foreground">
          Фотографии можно будет добавить на следующем шаге.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <ArtworkForm
            onSaved={(a) => navigate({ to: '/artworks/$id', params: { id: a.id }, replace: true })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
