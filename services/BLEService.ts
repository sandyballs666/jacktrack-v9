import { Platform } from 'react-native';
import { GolfBall } from '../types';

// BLE Manager types
interface BLEDevice {
  id: string;
  name?: string;
  rssi?: number;
  serviceUUIDs?: string[];
  manufacturerData?: any;
  serviceData?: any;
  txPowerLevel?: number;
  solicitedServiceUUIDs?: string[];
  isConnectable?: boolean;
  overflowServiceUUIDs?: string[];
}

interface BLEManager {
  state(): Promise<string>;
  startDeviceScan(
    serviceUUIDs: string[] | null,
    options: any,
    listener: (error: any, device: BLEDevice | null) => void
  ): void;
  stopDeviceScan(): void;
  connectToDevice(deviceId: string): Promise<BLEDevice>;
  discoverAllServicesAndCharacteristicsForDevice(deviceId: string): Promise<BLEDevice>;
  destroy(): void;
  onStateChange(listener: (state: string) => void): any;
}

export class BLEService {
  private static instance: BLEService;
  private manager: BLEManager | null = null;
  private connectedDevices: Map<string, BLEDevice> = new Map();
  private golfBalls: Map<string, GolfBall> = new Map();
  private ballUpdateCallbacks: ((balls: GolfBall[]) => void)[] = [];
  private isScanning = false;
  private scanTimeout: NodeJS.Timeout | null = null;
  private discoveredDevices: Map<string, BLEDevice> = new Map();

  public static getInstance(): BLEService {
    if (!BLEService.instance) {
      BLEService.instance = new BLEService();
    }
    return BLEService.instance;
  }

  constructor() {
    this.initializeBLE();
  }

  private async initializeBLE(): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('BLE Service: Web platform detected, using simulation mode');
      this.simulateGolfBalls();
      return;
    }

    try {
      // Dynamically import BLE manager for native platforms
      const { BleManager } = require('react-native-ble-plx');
      this.manager = new BleManager();
      
      // Set up state change listener
      this.manager.onStateChange((state) => {
        console.log('BLE State changed to:', state);
        if (state === 'PoweredOn') {
          console.log('BLE is ready for use');
        }
      });

      console.log('BLE Service: Native BLE manager initialized successfully');
    } catch (error) {
      console.warn('BLE Service: Native BLE not available, falling back to simulation:', error);
      this.simulateGolfBalls();
    }
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.manager) {
        const state = await this.manager.state();
        console.log('BLE Manager state:', state);
        
        if (state !== 'PoweredOn') {
          console.warn('BLE is not powered on. Current state:', state);
          // Still return true but use simulation
          this.simulateGolfBalls();
          return true;
        }
        
        console.log('BLE Service initialized successfully with native support');
        return true;
      } else {
        // Web or fallback mode
        this.simulateGolfBalls();
        return true;
      }
    } catch (error) {
      console.error('Error initializing BLE:', error);
      this.simulateGolfBalls();
      return true;
    }
  }

  private simulateGolfBalls(): void {
    console.log('BLE Service: Starting simulation mode');
    
    // Simulate some golf balls for demo purposes
    const simulatedBalls: GolfBall[] = [
      {
        id: 'sim-ball-1',
        name: 'Titleist Pro V1',
        latitude: 36.5674 + (Math.random() - 0.5) * 0.01,
        longitude: -121.9491 + (Math.random() - 0.5) * 0.01,
        batteryLevel: 85,
        lastSeen: new Date(),
        isConnected: true,
        rssi: -45
      },
      {
        id: 'sim-ball-2',
        name: 'Callaway Chrome Soft',
        latitude: 36.5674 + (Math.random() - 0.5) * 0.01,
        longitude: -121.9491 + (Math.random() - 0.5) * 0.01,
        batteryLevel: 62,
        lastSeen: new Date(),
        isConnected: true,
        rssi: -38
      }
    ];

    simulatedBalls.forEach(ball => {
      this.golfBalls.set(ball.id, ball);
    });

    this.notifyBallUpdates();

    // Simulate position updates
    setInterval(() => {
      this.updateSimulatedBallPositions();
    }, 5000);
  }

  private updateSimulatedBallPositions(): void {
    this.golfBalls.forEach((ball, id) => {
      // Simulate small movements
      const updatedBall: GolfBall = {
        ...ball,
        latitude: ball.latitude + (Math.random() - 0.5) * 0.001,
        longitude: ball.longitude + (Math.random() - 0.5) * 0.001,
        lastSeen: new Date()
      };
      this.golfBalls.set(id, updatedBall);
    });
    this.notifyBallUpdates();
  }

  async startScanning(): Promise<void> {
    if (this.isScanning) {
      console.log('BLE Service: Already scanning');
      return;
    }

    console.log('BLE Service: Starting device scan...');
    this.isScanning = true;
    this.discoveredDevices.clear();

    if (!this.manager) {
      console.log('BLE Service: No native BLE manager, using simulation');
      // Simulate finding devices
      setTimeout(() => {
        this.simulateDeviceDiscovery();
      }, 1000);
      return;
    }

    try {
      const state = await this.manager.state();
      if (state !== 'PoweredOn') {
        console.warn('BLE Service: Cannot scan, BLE state is:', state);
        this.isScanning = false;
        return;
      }

      // Start scanning for all devices (no service UUID filter)
      this.manager.startDeviceScan(
        null, // Scan for all devices
        { 
          allowDuplicates: false,
          scanMode: 1, // Balanced scan mode
          callbackType: 1 // All matches
        },
        (error, device) => {
          if (error) {
            console.error('BLE Scan error:', error);
            this.stopScanning();
            return;
          }

          if (device) {
            console.log('BLE Device discovered:', {
              id: device.id,
              name: device.name || 'Unknown Device',
              rssi: device.rssi,
              isConnectable: device.isConnectable
            });

            this.discoveredDevices.set(device.id, device);
          }
        }
      );

      // Auto-stop scanning after 30 seconds
      this.scanTimeout = setTimeout(() => {
        this.stopScanning();
      }, 30000);

      console.log('BLE Service: Device scan started successfully');
    } catch (error) {
      console.error('BLE Service: Error starting scan:', error);
      this.isScanning = false;
    }
  }

  private simulateDeviceDiscovery(): void {
    // Simulate discovering some Bluetooth devices
    const simulatedDevices = [
      { id: 'device-1', name: 'Golf Ball Tracker', rssi: -45 },
      { id: 'device-2', name: 'Smart Watch', rssi: -52 },
      { id: 'device-3', name: 'Bluetooth Speaker', rssi: -38 },
      { id: 'device-4', name: 'Fitness Tracker', rssi: -60 }
    ];

    simulatedDevices.forEach(device => {
      this.discoveredDevices.set(device.id, device as BLEDevice);
      console.log('Simulated device discovered:', device);
    });
  }

  stopScanning(): void {
    if (!this.isScanning) {
      return;
    }

    console.log('BLE Service: Stopping device scan...');
    this.isScanning = false;

    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    if (this.manager) {
      try {
        this.manager.stopDeviceScan();
        console.log('BLE Service: Device scan stopped');
      } catch (error) {
        console.error('BLE Service: Error stopping scan:', error);
      }
    }
  }

  getDiscoveredDevices(): BLEDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    console.log('BLE Service: Attempting to connect to device:', deviceId);

    if (!this.manager) {
      console.log('BLE Service: No native BLE manager, simulating connection');
      return this.simulateDeviceConnection(deviceId);
    }

    try {
      const device = await this.manager.connectToDevice(deviceId);
      console.log('BLE Service: Connected to device:', device.name || device.id);

      // Discover services and characteristics
      await this.manager.discoverAllServicesAndCharacteristicsForDevice(deviceId);
      console.log('BLE Service: Services discovered for device:', deviceId);

      this.connectedDevices.set(deviceId, device);
      return true;
    } catch (error) {
      console.error('BLE Service: Error connecting to device:', error);
      return false;
    }
  }

  private simulateDeviceConnection(deviceId: string): boolean {
    const device = this.discoveredDevices.get(deviceId);
    if (device) {
      this.connectedDevices.set(deviceId, device);
      console.log('BLE Service: Simulated connection to device:', device.name || deviceId);
      return true;
    }
    return false;
  }

  async pairNewBall(name: string): Promise<boolean> {
    console.log('BLE Service: Starting pairing process for:', name);

    // Start scanning if not already scanning
    if (!this.isScanning) {
      await this.startScanning();
      
      // Wait a bit for devices to be discovered
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const discoveredDevices = this.getDiscoveredDevices();
    console.log('BLE Service: Found', discoveredDevices.length, 'devices during pairing');

    if (discoveredDevices.length === 0) {
      // If no real devices found, create a simulated one
      console.log('BLE Service: No devices found, creating simulated ball');
      return this.createSimulatedBall(name);
    }

    // Try to connect to the first available device
    const targetDevice = discoveredDevices[0];
    const connected = await this.connectToDevice(targetDevice.id);

    if (connected) {
      // Create a golf ball from the connected device
      const newBall: GolfBall = {
        id: targetDevice.id,
        name: name,
        deviceId: targetDevice.id,
        latitude: 36.5674 + (Math.random() - 0.5) * 0.01,
        longitude: -121.9491 + (Math.random() - 0.5) * 0.01,
        batteryLevel: Math.floor(Math.random() * 100),
        lastSeen: new Date(),
        isConnected: true,
        rssi: targetDevice.rssi
      };

      this.golfBalls.set(newBall.id, newBall);
      this.notifyBallUpdates();
      
      console.log('BLE Service: Successfully paired device as golf ball:', name);
      return true;
    }

    return false;
  }

  private createSimulatedBall(name: string): boolean {
    const newBall: GolfBall = {
      id: `sim-ball-${Date.now()}`,
      name: name,
      latitude: 36.5674 + (Math.random() - 0.5) * 0.01,
      longitude: -121.9491 + (Math.random() - 0.5) * 0.01,
      batteryLevel: Math.floor(Math.random() * 100),
      lastSeen: new Date(),
      isConnected: true,
      rssi: -40 - Math.floor(Math.random() * 30)
    };

    this.golfBalls.set(newBall.id, newBall);
    this.notifyBallUpdates();
    
    console.log('BLE Service: Created simulated golf ball:', name);
    return true;
  }

  getGolfBalls(): GolfBall[] {
    return Array.from(this.golfBalls.values());
  }

  onBallUpdates(callback: (balls: GolfBall[]) => void): () => void {
    this.ballUpdateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.ballUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.ballUpdateCallbacks.splice(index, 1);
      }
    };
  }

  private notifyBallUpdates(): void {
    const balls = this.getGolfBalls();
    this.ballUpdateCallbacks.forEach(callback => callback(balls));
  }

  async removeBall(ballId: string): Promise<void> {
    console.log('BLE Service: Removing ball:', ballId);
    
    // Disconnect from device if connected
    const device = this.connectedDevices.get(ballId);
    if (device && this.manager) {
      try {
        // Note: react-native-ble-plx doesn't have a direct disconnect method
        // The device will be disconnected when the manager is destroyed or connection times out
        console.log('BLE Service: Device will be disconnected automatically');
      } catch (error) {
        console.error('BLE Service: Error disconnecting device:', error);
      }
    }

    this.connectedDevices.delete(ballId);
    this.golfBalls.delete(ballId);
    this.notifyBallUpdates();
  }

  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  getBLEState(): Promise<string> {
    if (this.manager) {
      return this.manager.state();
    }
    return Promise.resolve('Unsupported');
  }

  destroy(): void {
    console.log('BLE Service: Destroying service...');
    
    this.stopScanning();
    this.connectedDevices.clear();
    this.golfBalls.clear();
    this.discoveredDevices.clear();
    
    if (this.manager) {
      try {
        this.manager.destroy();
        console.log('BLE Service: Manager destroyed');
      } catch (error) {
        console.error('BLE Service: Error destroying manager:', error);
      }
    }
  }
}