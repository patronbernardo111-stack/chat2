// sessionManager.ts — Gestor de sesiones para EGCHAT React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface SessionData {
  user: any;
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

const STORAGE_KEY = 'egchat_session';
const TOKEN_KEY = 'egchat_token';

class SessionManager {
  private static instance: SessionManager;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.startRefreshTimer();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async saveSession(user: any, token: string, refreshToken?: string): Promise<void> {
    try {
      const payload = this.parseJWT(token);
      const expiresAt = payload.exp * 1000;

      const sessionData: SessionData = { user, token, expiresAt, refreshToken };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      // Guardar token en SecureStore para mayor seguridad
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      this.emit('session:saved', sessionData);
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  }

  public async getSession(): Promise<SessionData | null> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEY);
      if (!sessionData) return null;

      const session: SessionData = JSON.parse(sessionData);

      if (this.isSessionExpired(session)) {
        await this.clearSession();
        return null;
      }

      return session;
    } catch {
      await this.clearSession();
      return null;
    }
  }

  public async hasActiveSession(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  public async getToken(): Promise<string | null> {
    try {
      // Intentar SecureStore primero
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) return token;
      // Fallback a AsyncStorage
      const session = await this.getSession();
      return session?.token ?? null;
    } catch {
      return null;
    }
  }

  public async getUser(): Promise<any | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  public async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});

      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }

      this.emit('session:cleared');
    } catch (error) {
      console.error('Error limpiando sesión:', error);
    }
  }

  private startRefreshTimer(): void {
    this.refreshTimer = setInterval(async () => {
      const session = await this.getSession();
      if (!session) return;

      const now = Date.now();
      const timeUntilExpiry = session.expiresAt - now;

      if (timeUntilExpiry <= 0) {
        await this.clearSession();
        this.emit('session:expired');
      }
    }, 60000);
  }

  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return { exp: 0 };
    }
  }

  private isSessionExpired(session: SessionData): boolean {
    return Date.now() >= session.expiresAt;
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(cb => { try { cb(data); } catch {} });
    }
  }

  public async getSessionInfo() {
    const session = await this.getSession();
    if (!session) {
      return { isValid: false, expiresAt: null, timeUntilExpiry: null, isExpiringSoon: false };
    }
    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    return {
      isValid: timeUntilExpiry > 0,
      expiresAt: new Date(session.expiresAt),
      timeUntilExpiry,
      isExpiringSoon: timeUntilExpiry <= 5 * 60 * 1000,
    };
  }

  public destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.eventListeners.clear();
  }
}

export default SessionManager;
export type { SessionData };
