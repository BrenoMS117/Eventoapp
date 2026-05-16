import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { createPermissionStrategy } from '../permissions/PermissionStrategy';

/**
 * usePermissions — hook React que expõe a estratégia de permissões
 * do usuário autenticado.
 *
 * Uso nas telas:
 *   const perms = usePermissions();
 *   if (!perms.canPostToFeed()) return null;
 *
 * A estratégia é memorizada e só recalculada quando o role muda
 * (ex: logout → login com outro papel), evitando re-renders desnecessários.
 */
export function usePermissions() {
  const { currentUser } = useApp();

  const strategy = useMemo(
    () => createPermissionStrategy(currentUser?.role),
    [currentUser?.role],
  );

  return strategy;
}
