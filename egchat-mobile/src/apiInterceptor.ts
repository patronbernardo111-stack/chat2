// apiInterceptor.ts — Interceptor de peticiones HTTP para React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

type AuthLogoutCallback = (message: string) => void;

class ApiInterceptor {
  private static instance: ApiInterceptor;
  private refreshPromise: Promise<boolean> | null = null;
  private onLogoutCallbacks: AuthLogoutCallback[] = [];

  private constructor() {}

  public static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  public onLogout(callback: AuthLogoutCallback): void {
    this.onLogoutCallbacks.push(callback);
  }

  public async fetch(url: string, init?: RequestInit): Promise<Response> {
    const modifiedInit = { ...init };

    // Agregar token si existe
    const token = await this.getToken();
    if (token) {
      modifiedInit.headers = {
        ...modifiedInit.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }

    try {
      const response = await fetch(url, modifiedInit);

      if (response.status === 401) {
        if (!this.refreshPromise) {
          this.refreshPromise = this.attemptTokenRefresh();
        }
        const refreshSuccess = await this.refreshPromise;
        this.refreshPromise = null;

        if (!refreshSuccess) {
          await this.handleAuthError('Sesión expirada');
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  private async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync('egchat_token');
      if (token) return token;
      return await AsyncStorage.getItem('token');
    } catch {
      return await AsyncStorage.getItem('token');
    }
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      // Verificar si el token sigue siendo válido
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  private async handleAuthError(message: string): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    try { await SecureStore.deleteItemAsync('egchat_token'); } catch {}

    this.onLogoutCallbacks.forEach(cb => { try { cb(message); } catch {} });
  }
}

export const apiInterceptor = ApiInterceptor.getInstance();

export const initializeApiInterceptor = (onLogout?: AuthLogoutCallback) => {
  if (onLogout) apiInterceptor.onLogout(onLogout);
};

export default ApiInterceptor;
