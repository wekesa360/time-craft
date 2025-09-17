// Biometric authentication service for React Native
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  deviceType: string;
  hasHardware: boolean;
}

class BiometricAuthService {
  private static instance: BiometricAuthService;

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Check device biometric capabilities
   */
  async getCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return {
        isAvailable: hasHardware && isEnrolled,
        isEnrolled,
        supportedTypes,
        deviceType: Device.deviceType?.toString() || 'unknown',
        hasHardware,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        deviceType: 'unknown',
        hasHardware: false,
      };
    }
  }

  /**
   * Get human-readable biometric type names
   */
  getBiometricTypeNames(types: LocalAuthentication.AuthenticationType[]): string[] {
    return types.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
  }

  /**
   * Get primary biometric type for UI display
   */
  getPrimaryBiometricType(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  }

  /**
   * Get appropriate emoji for biometric type
   */
  getBiometricEmoji(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return '👤';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return '👆';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return '👁️';
    }
    return '🔒';
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<LocalAuthentication.LocalAuthenticationResult> {
    try {
      const capabilities = await this.getCapabilities();
      
      if (!capabilities.isAvailable) {
        throw new Error('Biometric authentication is not available');
      }

      const primaryType = this.getPrimaryBiometricType(capabilities.supportedTypes);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || `Authenticate with ${primaryType}`,
        cancelLabel: options?.cancelLabel || 'Cancel',
        fallbackLabel: options?.fallbackLabel || 'Use Passcode',
        disableDeviceFallback: options?.disableDeviceFallback || false,
      });

      return result;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error;
    }
  }

  /**
   * Check if biometric authentication is enabled for the app
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication for the app
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        // Verify biometric authentication works before enabling
        const result = await this.authenticate({
          promptMessage: 'Verify your identity to enable biometric login',
        });
        
        if (!result.success) {
          throw new Error('Biometric verification failed');
        }
      }

      await SecureStore.setItemAsync('biometric_enabled', enabled.toString());
    } catch (error) {
      console.error('Error setting biometric enabled status:', error);
      throw error;
    }
  }

  /**
   * Get time when user last authenticated with biometrics
   */
  async getLastBiometricAuth(): Promise<number | null> {
    try {
      const timestamp = await SecureStore.getItemAsync('last_biometric_auth');
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error('Error getting last biometric auth time:', error);
      return null;
    }
  }

  /**
   * Set time when user last authenticated with biometrics
   */
  async setLastBiometricAuth(timestamp: number = Date.now()): Promise<void> {
    try {
      await SecureStore.setItemAsync('last_biometric_auth', timestamp.toString());
    } catch (error) {
      console.error('Error setting last biometric auth time:', error);
    }
  }

  /**
   * Check if biometric re-authentication is required
   * @param maxAge Maximum age in milliseconds (default: 5 minutes)
   */
  async isReauthRequired(maxAge: number = 5 * 60 * 1000): Promise<boolean> {
    try {
      const lastAuth = await this.getLastBiometricAuth();
      if (!lastAuth) return true;
      
      const age = Date.now() - lastAuth;
      return age > maxAge;
    } catch (error) {
      console.error('Error checking reauth requirement:', error);
      return true;
    }
  }

  /**
   * Show setup instructions for biometric authentication
   */
  showSetupInstructions(capabilities: BiometricCapabilities): void {
    const typeNames = this.getBiometricTypeNames(capabilities.supportedTypes);
    
    if (!capabilities.hasHardware) {
      Alert.alert(
        'Biometric Authentication Unavailable',
        'Your device does not support biometric authentication.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!capabilities.isEnrolled) {
      Alert.alert(
        'Setup Required',
        `To use biometric authentication, please set up ${typeNames.join(' or ')} in your device settings first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // This would ideally open device settings
            // For now, just show instructions
            Alert.alert(
              'Setup Instructions',
              `Please go to Settings > ${typeNames.includes('Face ID') ? 'Face ID & Passcode' : 'Touch ID & Passcode'} to set up biometric authentication.`,
              [{ text: 'OK' }]
            );
          }}
        ]
      );
    }
  }
}

export const biometricAuth = BiometricAuthService.getInstance();
export default biometricAuth;