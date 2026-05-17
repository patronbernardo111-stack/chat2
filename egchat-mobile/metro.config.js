const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Módulos nativos que no funcionan en web → sustituir por stubs
const WEB_STUBS = {
  'react-native-maps':        './src/stubs/react-native-maps.web.js',
  'expo-secure-store':        './src/stubs/expo-secure-store.web.js',
  'expo-notifications':       './src/stubs/expo-notifications.web.js',
  'expo-local-authentication':'./src/stubs/expo-local-authentication.web.js',
  'expo-haptics':             './src/stubs/expo-haptics.web.js',
  'expo-av':                  './src/stubs/expo-av.web.js',
  'expo-camera':              './src/stubs/expo-camera.web.js',
  'expo-task-manager':        './src/stubs/expo-task-manager.web.js',
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUBS[moduleName]) {
    return {
      filePath: path.resolve(__dirname, WEB_STUBS[moduleName]),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
