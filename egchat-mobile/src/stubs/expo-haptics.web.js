// Stub de expo-haptics para web — no-op
const impactAsync = async () => {};
const notificationAsync = async () => {};
const selectionAsync = async () => {};
const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' };
const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };

module.exports = { impactAsync, notificationAsync, selectionAsync, ImpactFeedbackStyle, NotificationFeedbackType };
