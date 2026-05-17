# EGCHAT Mobile — Guía de Build

## Requisitos previos
```bash
npm install -g eas-cli
eas login   # cuenta: reddington120
```

## 1. APK de desarrollo (Expo Dev Client)
Para probar con react-native-webrtc (llamadas reales):
```bash
cd egchat-mobile
eas build --profile development --platform android
```
Instala el APK en el teléfono y luego usa `expo start --dev-client`.

## 2. APK de preview (Release, distribución interna)
APK firmado listo para instalar directamente:
```bash
eas build --profile preview --platform android
```
Descarga el APK desde expo.dev y compártelo por WhatsApp/Drive.

## 3. AAB de producción (Google Play)
Bundle para subir a Play Store:
```bash
eas build --profile production --platform android
```

## 4. Subir a Play Store (internal track)
```bash
eas submit --profile production --platform android
```
Requiere `google-play-key.json` (Service Account de Google Play Console).

## Comandos útiles
```bash
# Ver estado de builds
eas build:list

# Actualización OTA (sin rebuild)
eas update --channel preview --message "Fix cartera"

# Limpiar caché
expo start --clear
```

## Notas
- `react-native-webrtc` solo funciona en builds nativos (no Expo Go)
- Las llamadas de audio/video requieren perfil `development` o `preview`
- Push notifications FCM funcionan en todos los perfiles
