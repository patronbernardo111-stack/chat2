// UpdateManager.tsx — Gestión silenciosa de actualizaciones para React Native
import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { AppState, AppStateStatus } from 'react-native';

const UpdateManager: React.FC = () => {
  useEffect(() => {
    if (__DEV__) return;

    const checkOnForeground = async (state: AppStateStatus) => {
      if (state === 'active') {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            // Recargar solo cuando vuelva a background
          }
        } catch {
          // Silencioso
        }
      }
    };

    const subscription = AppState.addEventListener('change', checkOnForeground);
    return () => subscription.remove();
  }, []);

  return null;
};

// Necesario para que TypeScript no se queje del tipo de retorno
import React from 'react';
export default UpdateManager;
