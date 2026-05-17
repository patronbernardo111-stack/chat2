const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// En web, sustituir react-native-maps por un stub vacío
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: require.resolve('./src/stubs/react-native-maps.web.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
