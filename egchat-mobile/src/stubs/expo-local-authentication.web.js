// Stub de expo-local-authentication para web
const hasHardwareAsync = async () => false;
const isEnrolledAsync = async () => false;
const authenticateAsync = async () => ({ success: false, error: 'not_available' });
const supportedAuthenticationTypesAsync = async () => [];
const AuthenticationType = { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 };

module.exports = { hasHardwareAsync, isEnrolledAsync, authenticateAsync, supportedAuthenticationTypesAsync, AuthenticationType };
