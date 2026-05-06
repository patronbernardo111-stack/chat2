/**
 * hapticsPlugin.ts — Integración con @capacitor/haptics para retroalimentación háptica
 */
import {
  Haptics,
  ImpactStyle,
  NotificationType,
} from '@capacitor/haptics';

/**
 * Vibración de impacto (fuerte, medio, ligero)
 */
export async function impact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  try {
    const styleMap: Record<string, ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch (error) {
    console.error('Error triggering haptic impact:', error);
  }
}

/**
 * Notificación háptica (éxito, advertencia, error)
 */
export async function notification(
  type: 'success' | 'warning' | 'error' = 'success'
): Promise<void> {
  try {
    const typeMap: Record<string, NotificationType> = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: typeMap[type] });
  } catch (error) {
    console.error('Error triggering haptic notification:', error);
  }
}

/**
 * Selección háptica (feedback ligero para selecciones)
 */
export async function selection(): Promise<void> {
  try {
    await Haptics.selection();
  } catch (error) {
    console.error('Error triggering haptic selection:', error);
  }
}

/**
 * Vibración personalizada con patrones
 */
export async function vibrate(duration: number = 300): Promise<void> {
  try {
    await Haptics.vibrate({ duration });
  } catch (error) {
    console.error('Error vibrating device:', error);
  }
}
