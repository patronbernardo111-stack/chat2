// Stub react-native-qrcode-svg para web
const { View, Text } = require('react-native');
const React = require('react');
const QRCode = ({ value, size = 100 }) =>
  React.createElement(View, {
    style: { width: size, height: size, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }
  }, React.createElement(Text, { style: { fontSize: 10, color: '#666' } }, 'QR'));
module.exports = QRCode;
module.exports.default = QRCode;
