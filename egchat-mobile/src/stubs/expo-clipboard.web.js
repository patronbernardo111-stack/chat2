// Stub expo-clipboard para web
const setStringAsync = async (text) => {
  try { await navigator.clipboard.writeText(text); } catch {}
};
const getStringAsync = async () => {
  try { return await navigator.clipboard.readText(); } catch { return ''; }
};
module.exports = { setStringAsync, getStringAsync };
