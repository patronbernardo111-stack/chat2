/**
 * filesystemPlugin.ts — Integración con @capacitor/filesystem para lectura/escritura de archivos
 */
import {
  Filesystem,
  Directory,
  Encoding,
  WriteFileResult,
  ReadFileResult,
} from '@capacitor/filesystem';

export interface FileOptions {
  directory?: Directory;
  encoding?: Encoding;
}

/**
 * Escribe contenido en un archivo
 */
export async function writeFile(
  filename: string,
  data: string,
  options?: FileOptions
): Promise<WriteFileResult | null> {
  try {
    const result = await Filesystem.writeFile({
      path: filename,
      data,
      directory: options?.directory ?? Directory.Cache,
      encoding: options?.encoding ?? Encoding.UTF8,
    });
    return result;
  } catch (error) {
    console.error('Error writing file:', error);
    return null;
  }
}

/**
 * Lee el contenido de un archivo
 */
export async function readFile(
  filename: string,
  options?: FileOptions
): Promise<string | null> {
  try {
    const result = await Filesystem.readFile({
      path: filename,
      directory: options?.directory ?? Directory.Cache,
      encoding: options?.encoding ?? Encoding.UTF8,
    });
    return typeof result.data === 'string' ? result.data : String(result.data);
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
}

/**
 * Elimina un archivo
 */
export async function deleteFile(
  filename: string,
  options?: FileOptions
): Promise<boolean> {
  try {
    await Filesystem.deleteFile({
      path: filename,
      directory: options?.directory ?? Directory.Cache,
    });
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Lista archivos en un directorio
 */
export async function listFiles(
  dirPath: string = '',
  options?: FileOptions
): Promise<string[]> {
  try {
    const result = await Filesystem.readdir({
      path: dirPath,
      directory: options?.directory ?? Directory.Cache,
    });
    return result.files.map((f: any) => f.name);
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

/**
 * Crea un directorio
 */
export async function createDirectory(
  dirPath: string,
  options?: FileOptions
): Promise<boolean> {
  try {
    await Filesystem.mkdir({
      path: dirPath,
      directory: options?.directory ?? Directory.Cache,
      recursive: true,
    });
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
}

/**
 * Obtiene la URI de un archivo
 */
export async function getFileUri(
  filename: string,
  options?: FileOptions
): Promise<string | null> {
  try {
    const result = await Filesystem.getUri({
      path: filename,
      directory: options?.directory ?? Directory.Cache,
    });
    return result.uri;
  } catch (error) {
    console.error('Error getting file URI:', error);
    return null;
  }
}
