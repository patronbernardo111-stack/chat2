// Stub vacío de react-native-maps para web
// react-native-maps usa APIs nativas que no existen en el navegador

const React = require('react');
const { View } = require('react-native');

const MapView = (props) => React.createElement(View, props);
MapView.Animated = MapView;

const Marker = (props) => React.createElement(View, props);
const Polyline = (props) => React.createElement(View, props);
const Polygon = (props) => React.createElement(View, props);
const Circle = (props) => React.createElement(View, props);
const Callout = (props) => React.createElement(View, props);
const CalloutSubview = (props) => React.createElement(View, props);
const Overlay = (props) => React.createElement(View, props);
const Heatmap = (props) => React.createElement(View, props);
const Geojson = (props) => React.createElement(View, props);

const PROVIDER_DEFAULT = null;
const PROVIDER_GOOGLE = 'google';

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.Polyline = Polyline;
module.exports.Polygon = Polygon;
module.exports.Circle = Circle;
module.exports.Callout = Callout;
module.exports.CalloutSubview = CalloutSubview;
module.exports.Overlay = Overlay;
module.exports.Heatmap = Heatmap;
module.exports.Geojson = Geojson;
module.exports.PROVIDER_DEFAULT = PROVIDER_DEFAULT;
module.exports.PROVIDER_GOOGLE = PROVIDER_GOOGLE;
