/**
 * index.ts — Exporta todas las funciones de plugins Capacitor
 */

// Camera
export {
  capturePhoto,
  takePhoto,
  pickPhoto,
  checkCameraPermission,
  requestCameraPermission,
  type CameraOptions,
} from './cameraPlugin';

// Filesystem
export {
  writeFile,
  readFile,
  deleteFile,
  listFiles,
  createDirectory,
  getFileUri,
  type FileOptions,
} from './filesystemPlugin';

// Share
export {
  shareContent,
  shareText,
  shareUrl,
  shareFiles,
  canShare,
  type ShareData,
} from './sharePlugin';

// Haptics
export {
  impact,
  notification as hapticsNotification,
  selection,
  vibrate,
} from './hapticsPlugin';

// Device
export {
  getDeviceInfo,
  getDeviceId,
  getPlatform,
  getOSVersion,
  getModel,
  isNativeApp,
  isIOS,
  isAndroid,
  type NativeDeviceInfo,
} from './devicePlugin';

// Push Notifications
export {
  initializePushNotifications,
  getPushToken,
  onPushNotificationReceived,
  onPushNotificationAction,
  onPushTokenReceived,
  onPushNotificationError,
  getDeliveredNotifications,
  removeAllDeliveredNotifications,
  removeBadge,
  type PushNotificationListener,
  type PushNotificationActionListener,
} from './pushNotificationsPlugin';
