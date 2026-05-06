/**
 * sharePlugin.ts — Integración con @capacitor/share para compartir contenido
 */
import { Share, ShareOptions } from '@capacitor/share';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: string[];
}

/**
 * Comparte contenido (texto, URL, archivos)
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  try {
    const options: ShareOptions = {
      title: data.title,
      text: data.text,
      url: data.url,
      files: data.files,
    };
    
    const result = await Share.share(options);
    return true;
  } catch (error) {
    console.error('Error sharing content:', error);
    return false;
  }
}

/**
 * Comparte solo texto
 */
export async function shareText(text: string, title?: string): Promise<boolean> {
  return shareContent({ text, title });
}

/**
 * Comparte una URL
 */
export async function shareUrl(url: string, title?: string): Promise<boolean> {
  return shareContent({ url, title });
}

/**
 * Comparte archivos
 */
export async function shareFiles(
  files: string[],
  title?: string
): Promise<boolean> {
  return shareContent({ files, title });
}

/**
 * Verifica si el dispositivo soporta share
 */
export async function canShare(): Promise<boolean> {
  try {
    const result = await Share.canShare();
    return result.value;
  } catch {
    return false;
  }
}
