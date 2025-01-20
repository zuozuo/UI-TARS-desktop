import { useEffect } from 'react';
import { useDispatch } from 'zutron';

import { useStore } from '@renderer/hooks/useStore';

export const usePermissions = () => {
  const { ensurePermissions } = useStore();
  const dispatch = useDispatch(window.zutron);

  const getEnsurePermissions = () => {
    dispatch({ type: 'GET_ENSURE_PERMISSIONS', payload: null });
  };

  useEffect(() => {
    getEnsurePermissions();
  }, []);

  return {
    ensurePermissions,
    getEnsurePermissions,
  };
};
