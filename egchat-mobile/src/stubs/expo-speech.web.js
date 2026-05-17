// Stub expo-speech para web — usa Web Speech API
const speak = (text, options = {}) => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = options.language || 'es-ES';
    u.rate = options.rate || 1;
    u.onend = options.onDone || null;
    window.speechSynthesis.speak(u);
  } else {
    options.onDone?.();
  }
};
const stop = () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); };
const isSpeakingAsync = async () => typeof window !== 'undefined' && window.speechSynthesis?.speaking;
module.exports = { speak, stop, isSpeakingAsync };
