// Stub de expo-av para web
const Audio = {
  Sound: class {
    static createAsync() { return Promise.resolve({ sound: new this(), status: {} }); }
    playAsync() { return Promise.resolve(); }
    stopAsync() { return Promise.resolve(); }
    unloadAsync() { return Promise.resolve(); }
    setVolumeAsync() { return Promise.resolve(); }
    setIsLoopingAsync() { return Promise.resolve(); }
  },
  setAudioModeAsync: async () => {},
  requestPermissionsAsync: async () => ({ status: 'denied' }),
};
const Video = () => null;

module.exports = { Audio, Video };
