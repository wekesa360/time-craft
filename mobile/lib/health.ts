import { Platform } from 'react-native';
import { apiClient } from './api';

let HealthConnect: any = null;
let AppleHealthKit: any = null;

try {
  // These require a dev build; will not be available in Expo Go
  HealthConnect = Platform.OS === 'android' ? require('react-native-health-connect') : null;
} catch {}

try {
  AppleHealthKit = Platform.OS === 'ios' ? require('react-native-health') : null;
} catch {}

export type HealthProvider = 'health_connect' | 'apple_health';

class HealthService {
  private connected = false;
  private provider: HealthProvider | null = null;

  private async requestAndroidPermissions(): Promise<boolean> {
    if (!HealthConnect) return false;
    try {
      // Example shape; actual lib method names may differ
      // await HealthConnect.requestPermissions({ read: ['Steps', 'Workout', 'SleepSession', 'BodyMass', 'Hydration'] });
      return true;
    } catch {
      return false;
    }
  }

  private async requestIOSPermissions(): Promise<boolean> {
    if (!AppleHealthKit) return false;
    try {
      // Example shape; actual lib method names may differ
      // await AppleHealthKit.initHealthKit({ permissions: { read: ['StepCount', 'Workout', 'SleepAnalysis', 'BodyMass', 'DietaryWater'] } });
      return true;
    } catch {
      return false;
    }
  }

  private async readAndroidSamples(): Promise<{ steps?: number; workouts?: any[]; sleep?: any[]; weight?: number | null; water_ml?: number | null; }> {
    if (!HealthConnect) return {};
    try {
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      // Placeholder; replace with real calls
      // const steps = await HealthConnect.readSteps({ startTime: dayAgo, endTime: now });
      return { steps: undefined, workouts: [], sleep: [], weight: null, water_ml: null };
    } catch {
      return {};
    }
  }

  private async readIOSSamples(): Promise<{ steps?: number; workouts?: any[]; sleep?: any[]; weight?: number | null; water_ml?: number | null; }> {
    if (!AppleHealthKit) return {};
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      // Placeholder; replace with real calls
      // const steps = await AppleHealthKit.getStepCount({ startDate: dayAgo.toISOString(), endDate: now.toISOString() });
      return { steps: undefined, workouts: [], sleep: [], weight: null, water_ml: null };
    } catch {
      return {};
    }
  }

  isAvailable(): boolean {
    if (Platform.OS === 'android') return !!HealthConnect;
    if (Platform.OS === 'ios') return !!AppleHealthKit;
    return false;
  }

  getStatus() {
    return { connected: this.connected, provider: this.provider };
  }

  async initialize(): Promise<boolean> {
    // In a real implementation, load persisted state and ensure permissions
    return this.connected;
  }

  async connect(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      if (Platform.OS === 'android' && HealthConnect) {
        const ok = await this.requestAndroidPermissions();
        if (!ok) return false;
        this.connected = true;
        this.provider = 'health_connect';
        return true;
      }

      if (Platform.OS === 'ios' && AppleHealthKit) {
        const ok = await this.requestIOSPermissions();
        if (!ok) return false;
        this.connected = true;
        this.provider = 'apple_health';
        return true;
      }
    } catch (e) {
      // Fallthrough to false
    }

    return false;
  }

  async fetchAndLogData(): Promise<boolean> {
    if (!this.connected) return false;

    try {
      let samples: any = {};
      if (Platform.OS === 'android' && HealthConnect) {
        samples = await this.readAndroidSamples();
      }

      if (Platform.OS === 'ios' && AppleHealthKit) {
        samples = await this.readIOSSamples();
      }

      // Post minimal heartbeat to backend to mark a sync attempt
      try {
        await apiClient.createHealthLog({
          type: 'hydration',
          payload: { source: this.provider, auto: true, glasses: 0, total_ml: 0 },
        } as any);
        // Example mappings (replace with real once data available)
        if (samples.steps) {
          await apiClient.createHealthLog({ type: 'exercise', payload: { activity: 'walk', steps: samples.steps, source: this.provider, auto: true } } as any);
        }
      } catch {
        // Ignore network/API errors for placeholder sync
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}

export const healthService = new HealthService();
export default healthService;
