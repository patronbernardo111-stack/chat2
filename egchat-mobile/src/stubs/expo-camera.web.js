// Stub de expo-camera para web
const React = require('react');
const { View } = require('react-native');

const CameraView = (props) => React.createElement(View, props);
const useCameraPermissions = () => [{ status: 'denied' }, async () => ({ status: 'denied' })];
const CameraType = { front: 'front', back: 'back' };
const FlashMode = { on: 'on', off: 'off', auto: 'auto' };

module.exports = { CameraView, useCameraPermissions, CameraType, FlashMode };
