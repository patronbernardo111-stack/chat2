// Stub expo-location para web — usa Geolocation API
const requestForegroundPermissionsAsync = async () => ({ status: 'granted' });
const getCurrentPositionAsync = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy } }),
      (err) => reject(err)
    );
  });
};
const watchPositionAsync = async (options, callback) => {
  const id = navigator.geolocation?.watchPosition((pos) => callback({ coords: pos.coords }));
  return { remove: () => navigator.geolocation?.clearWatch(id) };
};
const Accuracy = { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5, BestForNavigation: 6 };
module.exports = { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, Accuracy };
