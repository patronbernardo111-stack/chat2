// useAuth — equivalente al ViewModel/ObservableObject del spec
// Maneja estado de sesión, login, registro y logout
// Usado por todas las pantallas de auth

import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { authAPI, clearToken } from '../api';

interface User {
  id: string;
  phone: string;
  full_name: string;
  avatar_url?: string;
  app_version?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
}

// ── Hook principal ────────────────────────────────────────────────
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: '',
  });

  const setError = (error: string) =>
    setState(s => ({ ...s, error, isLoading: false }));

  const setLoading = (isLoading: boolean) =>
    setState(s => ({ ...s, isLoading, error: '' }));

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (phone: string, password: string) => {
    if (!phone || !password) {
      setError('Rellena todos los campos');
      return false;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(phone, password);
      setState({ user: res.user, isAuthenticated: true, isLoading: false, error: '' });
      router.replace('/(tabs)');
      return true;
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('credenciales') || msg.includes('401') || msg.includes('Credenciales')) {
        setError('Usuario o contraseña incorrectos.');
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Network')) {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      } else if (msg.includes('500')) {
        setError('Error del servidor. Intenta de nuevo en unos minutos.');
      } else {
        setError(msg || 'Error al iniciar sesión.');
      }
      return false;
    }
  }, []);

  // ── Registro ──────────────────────────────────────────────────
  const register = useCallback(async (data: {
    full_name: string;
    phone: string;
    password: string;
    avatar_url?: string;
  }) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      setState({ user: res.user, isAuthenticated: true, isLoading: false, error: '' });
      router.replace('/(tabs)');
      return true;
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('ya está registrado') || msg.includes('409')) {
        setError('Este número ya está registrado. Usa "Ya tengo cuenta".');
      } else if (msg.includes('fetch') || msg.includes('network')) {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        setError(msg || 'Error al registrarse. Intenta de nuevo.');
      }
      return false;
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    await authAPI.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false, error: '' });
    router.replace('/(auth)/login');
  }, []);

  // ── Recuperar contraseña ──────────────────────────────────────
  const sendVerification = useCallback(async (phone: string) => {
    setLoading(true);
    try {
      await authAPI.sendVerification(phone);
      setState(s => ({ ...s, isLoading: false, error: '' }));
      return true;
    } catch (e: any) {
      setError(e.message || 'Error al enviar el código');
      return false;
    }
  }, []);

  const verifyCode = useCallback(async (phone: string, code: string) => {
    setLoading(true);
    try {
      const { verified } = await authAPI.verifyCode(phone, code);
      setState(s => ({ ...s, isLoading: false, error: '' }));
      if (!verified) setError('Código incorrecto. Inténtalo de nuevo.');
      return verified;
    } catch (e: any) {
      setError(e.message || 'Código inválido');
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (phone: string, code: string, newPassword: string) => {
    setLoading(true);
    try {
      await authAPI.resetPassword(phone, code, newPassword);
      setState(s => ({ ...s, isLoading: false, error: '' }));
      return true;
    } catch (e: any) {
      setError(e.message || 'Error al cambiar la contraseña');
      return false;
    }
  }, []);

  // ── Limpiar error ─────────────────────────────────────────────
  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: '' }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    sendVerification,
    verifyCode,
    resetPassword,
    clearError,
  };
};

// ── Hook para verificar sesión al arrancar ────────────────────────
export const useSessionCheck = () => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (isAuth) {
          await authAPI.me(); // Valida el token en el servidor
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      } catch {
        await clearToken();
        router.replace('/(auth)/login');
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  return { checking };
};
