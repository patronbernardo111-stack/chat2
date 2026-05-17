// Stub react-native-webrtc para web
const { View } = require('react-native');
const RTCView = View;
const RTCPeerConnection = class {};
const RTCIceCandidate = class {};
const RTCSessionDescription = class {};
const mediaDevices = { getUserMedia: async () => null, enumerateDevices: async () => [] };
module.exports = { RTCView, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices };
