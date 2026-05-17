// Stub de expo-notifications para web
const getPermissionsAsync = async () => ({ status: 'undetermined' });
const requestPermissionsAsync = async () => ({ status: 'denied' });
const getExpoPushTokenAsync = async () => ({ data: null });
const scheduleNotificationAsync = async () => null;
const cancelAllScheduledNotificationsAsync = async () => {};
const dismissAllNotificationsAsync = async () => {};
const getBadgeCountAsync = async () => 0;
const setBadgeCountAsync = async () => {};
const addNotificationReceivedListener = () => ({ remove: () => {} });
const addNotificationResponseReceivedListener = () => ({ remove: () => {} });
const removeNotificationSubscription = () => {};
const getLastNotificationResponseAsync = async () => null;
const setNotificationHandler = () => {};
const setNotificationChannelAsync = async () => {};

module.exports = {
  getPermissionsAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
  scheduleNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  dismissAllNotificationsAsync,
  getBadgeCountAsync,
  setBadgeCountAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
  getLastNotificationResponseAsync,
  setNotificationHandler,
  setNotificationChannelAsync,
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 },
};
