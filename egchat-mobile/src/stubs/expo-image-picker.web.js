// Stub expo-image-picker para web
const MediaTypeOptions = { Images: 'Images', Videos: 'Videos', All: 'All' };
const requestMediaLibraryPermissionsAsync = async () => ({ status: 'granted' });
const requestCameraPermissionsAsync = async () => ({ status: 'granted' });
const launchImageLibraryAsync = async (options) => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) { resolve({ canceled: true, assets: [] }); return; }
      const uri = URL.createObjectURL(file);
      resolve({ canceled: false, assets: [{ uri, width: 0, height: 0, type: 'image' }] });
    };
    input.oncancel = () => resolve({ canceled: true, assets: [] });
    input.click();
  });
};
const launchCameraAsync = async () => ({ canceled: true, assets: [] });
module.exports = { MediaTypeOptions, requestMediaLibraryPermissionsAsync, requestCameraPermissionsAsync, launchImageLibraryAsync, launchCameraAsync };
