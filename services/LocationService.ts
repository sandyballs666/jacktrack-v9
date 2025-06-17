import * as Location from 'expo-location';
import { Platform } from 'react-native';

export class LocationService {
  private static instance: LocationService;
  private locationSubscription: Location.LocationSubscription | null = null;
  private currentLocation: Location.LocationObject | null = null;
  private locationCallbacks: ((location: Location.LocationObject) => void)[] = [];
  private simulationInterval: NodeJS.Timeout | null = null;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // For web, simulate location permission
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      // Request background permissions for better tracking
      if (Platform.OS !== 'web') {
        await Location.requestBackgroundPermissionsAsync();
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return true; // Return true for demo purposes
    }
  }

  async startLocationTracking(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission && Platform.OS !== 'web') {
      throw new Error('Location permission denied');
    }

    try {
      if (Platform.OS === 'web') {
        // Simulate location for web
        this.simulateLocation();
        return;
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          this.currentLocation = location;
          this.locationCallbacks.forEach(callback => callback(location));
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      // Fallback to simulation
      this.simulateLocation();
    }
  }

  private simulateLocation(): void {
    // Simulate location near Pebble Beach Golf Links
    const baseLocation = {
      coords: {
        latitude: 36.5674,
        longitude: -121.9491,
        altitude: 10,
        accuracy: 5,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    };

    this.currentLocation = baseLocation;
    this.locationCallbacks.forEach(callback => callback(baseLocation));

    // Simulate small movements
    this.simulationInterval = setInterval(() => {
      const simulatedLocation = {
        ...baseLocation,
        coords: {
          ...baseLocation.coords,
          latitude: baseLocation.coords.latitude + (Math.random() - 0.5) * 0.0001,
          longitude: baseLocation.coords.longitude + (Math.random() - 0.5) * 0.0001,
        },
        timestamp: Date.now(),
      };
      
      this.currentLocation = simulatedLocation;
      this.locationCallbacks.forEach(callback => callback(simulatedLocation));
    }, 2000);
  }

  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  getCurrentLocation(): Location.LocationObject | null {
    return this.currentLocation;
  }

  onLocationUpdate(callback: (location: Location.LocationObject) => void): () => void {
    this.locationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.locationCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationCallbacks.splice(index, 1);
      }
    };
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }
}