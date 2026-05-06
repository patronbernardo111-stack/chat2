# Capacitor Plugins Integration Guide

Este directorio contiene la integración de todos los plugins Capacitor instalados en el proyecto EGCHAT.

## 📦 Plugins Instalados

- `@capacitor/camera` v8.2.0 - Captura de fotos/videos
- `@capacitor/push-notifications` v8.0.3 - Notificaciones push
- `@capacitor/filesystem` v8.1.2 - Lectura/escritura de archivos
- `@capacitor/share` v8.0.1 - Compartir contenido
- `@capacitor/haptics` v8.0.2 - Retroalimentación háptica
- `@capacitor/device` v8.0.2 - Información del dispositivo
- `cordova-plugin-inappbrowser` v6.0.0 - Navegador EmbInApp

## 📁 Estructura

```
src/
├── capacitor/
│   ├── index.ts                    # Exporta todas las funciones
│   ├── cameraPlugin.ts            # Funciones de cámara
│   ├── filesystemPlugin.ts        # Funciones de sistema de archivos
│   ├── sharePlugin.ts             # Funciones de compartir
│   ├── hapticsPlugin.ts           # Funciones de vibración/haptics
│   ├── devicePlugin.ts            # Funciones de información del dispositivo
│   └── pushNotificationsPlugin.ts # Funciones de notificaciones push
└── hooks/
    ├── useCamera.ts               # Hook para cámara
    ├── useShare.ts                # Hook para compartir
    ├── useDeviceInfo.ts           # Hook para info del dispositivo
    └── usePushNotifications.ts    # Hook para push notifications
```

## 🚀 Uso de Plugins

### 1. Cámara

```typescript
import { useCamera } from '@/hooks/useCamera';

function MyComponent() {
  const { photo, loading, error, takePhoto, pickPhoto } = useCamera();

  return (
    <>
      <button onClick={() => takePhoto()}>Tomar foto</button>
      <button onClick={() => pickPhoto()}>Seleccionar desde galería</button>
      {photo && <img src={photo.webPath || photo.path} />}
      {error && <p>{error}</p>}
    </>
  );
}
```

### 2. Compartir Contenido

```typescript
import { useShare } from '@/hooks/useShare';

function MyComponent() {
  const { shareText, shareUrl, shareFiles } = useShare();

  return (
    <>
      <button onClick={() => shareText('¡Mira esto!', 'Mi título')}>
        Compartir texto
      </button>
      <button onClick={() => shareUrl('https://example.com')}>
        Compartir URL
      </button>
    </>
  );
}
```

### 3. Información del Dispositivo

```typescript
import { useDeviceInfo } from '@/hooks/useDeviceInfo';

function MyComponent() {
  const { info, isNative, loading } = useDeviceInfo();

  return (
    <div>
      {loading ? 'Cargando...' : (
        <>
          <p>Plataforma: {info?.platform}</p>
          <p>Modelo: {info?.model}</p>
          <p>ES nativo: {isNative ? 'Sí' : 'No'}</p>
        </>
      )}
    </div>
  );
}
```

### 4. Push Notifications

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { token, isInitialized, lastNotification } = usePushNotifications(
    (notification) => console.log('Notificación recibida:', notification),
    (action) => console.log('Acción:', action)
  );

  return (
    <div>
      <p>Token: {token}</p>
      <p>Inicializado: {isInitialized ? 'Sí' : 'No'}</p>
    </div>
  );
}
```

### 5. Haptics (Vibración/Feedback Háptico)

```typescript
import { impact, notification, selection } from '@/capacitor/hapticsPlugin';

// Vibración de impacto
await impact('light'); // 'light' | 'medium' | 'heavy'

// Notificación háptica
await notification('success'); // 'success' | 'warning' | 'error'

// Feedback de selección
await selection();
```

### 6. Sistema de Archivos

```typescript
import { writeFile, readFile, deleteFile, listFiles } from '@/capacitor/filesystemPlugin';
import { Directory } from '@capacitor/filesystem';

// Escribir archivo
await writeFile('config.json', '{"setting": "value"}', {
  directory: Directory.Documents
});

// Leer archivo
const content = await readFile('config.json', {
  directory: Directory.Documents
});

// Listar archivos
const files = await listFiles('/', {
  directory: Directory.Documents
});

// Eliminar archivo
await deleteFile('config.json', {
  directory: Directory.Documents
});
```

## ⚙️ Configuración de Capacitor

El proyecto está configurado en `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.egchat.app',
  appName: 'EGCHAT',
  webDir: './dist',
};
```

## 📱 Sincronizar con Plataformas Nativas

Después de instalar plugins, sincroniza con las carpetas nativas:

```bash
# Sincronizar Android
npx cap sync android

# Sincronizar iOS
npx cap sync ios

# Abrir en Android Studio
npx cap open android

# Abrir en Xcode
npx cap open ios
```

## ✅ Mejores Prácticas

1. **Siempre verifica permisos** antes de usar cámara o localización
2. **Usa try-catch** para manejar errores
3. **Verifica si es nativo** antes de usar funciones específicas del dispositivo
4. **Limpia listeners** en componentes desacoplados
5. **Cachea información** del dispositivo cuando sea posible

## 🔧 Troubleshooting

Si un plugin no funciona:

1. Verifica que esté instalado: `npm list @capacitor/[nombre]`
2. Sincroniza: `npx cap sync`
3. Reconstruye: `npm run build`
4. Limpia cache: `rm -rf node_modules package-lock.json && npm install`

## 📚 Documentación

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Cordova InAppBrowser](https://github.com/apache/cordova-plugin-inappbrowser)
