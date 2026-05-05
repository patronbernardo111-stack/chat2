const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Fix expo-router app root for webpack
  config.plugins = config.plugins || [];
  
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify(
        path.resolve(__dirname, 'app')
      ),
    })
  );

  return config;
};
