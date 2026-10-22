import { useAuthLogout } from '@asya/api-client/query';
import { Button } from '@asya/ui/components/button';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';

export function LogoutButton({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const logout = useAuthLogout({
    mutation: {
      onSettled: () => {
        // данные прошлого пользователя не должны остаться в кэше
        queryClient.clear();
        onDone();
      },
    },
  });

  return (
    <Button variant="ghost" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
      <LogOut className="h-4 w-4" /> Выйти
    </Button>
  );
}
