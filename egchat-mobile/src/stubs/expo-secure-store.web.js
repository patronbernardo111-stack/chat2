// Stub de expo-secure-store para web — usa localStorage como fallback
const getItemAsync = async (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const setItemAsync = async (key, value) => {
  try { localStorage.setItem(key, value); } catch {}
};
const deleteItemAsync = async (key) => {
  try { localStorage.removeItem(key); } catch {}
};

module.exports = { getItemAsync, setItemAsync, deleteItemAsync };
