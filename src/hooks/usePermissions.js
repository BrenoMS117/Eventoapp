import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { createPermissionStrategy } from '../permissions/PermissionStrategy';

export function usePermissions() {
  const { currentUser } = useApp();

  const strategy = useMemo(
    () => createPermissionStrategy(currentUser?.role),
    [currentUser?.role],
  );

  return strategy;
}
