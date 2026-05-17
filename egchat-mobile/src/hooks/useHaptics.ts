// useHaptics — wrapper de expo-haptics para toda la app
import * as Haptics from 'expo-haptics';

export const haptics = {
  // Toque ligero — botones normales, selección
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),

  // Toque medio — acciones importantes (enviar mensaje, confirmar pago)
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),

  // Toque fuerte — acciones críticas (eliminar, colgar llamada)
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),

  // Éxito — operación completada (pago realizado, mensaje enviado)
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),

  // Error — operación fallida
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),

  // Warning — advertencia
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),

  // Selección — cambio de tab, filtro, chip
  selection: () => Haptics.selectionAsync().catch(() => {}),
};
