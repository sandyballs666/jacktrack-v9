import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { BLEService } from '@/services/BLEService';
import { 
  Target, 
  Plus, 
  Battery, 
  Signal, 
  Navigation,
  Trash2,
  Bluetooth,
  Search,
  Wifi,
  RefreshCw
} from 'lucide-react-native';

interface BLEDevice {
  id: string;
  name?: string;
  rssi?: number;
}

export default function BallsScreen() {
  const { golfBalls, pairNewBall, removeBall, playerLocation, calculateDistance } = useGame();
  const [showPairModal, setShowPairModal] = useState(false);
  const [newBallName, setNewBallName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<BLEDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [bleState, setBleState] = useState<string>('Unknown');

  const bleService = BLEService.getInstance();

  useEffect(() => {
    checkBLEState();
  }, []);

  const checkBLEState = async () => {
    try {
      const state = await bleService.getBLEState();
      setBleState(state);
    } catch (error) {
      console.error('Error checking BLE state:', error);
      setBleState('Error');
    }
  };

  const startDeviceScan = async () => {
    try {
      setIsScanning(true);
      setDiscoveredDevices([]);
      
      await bleService.startScanning();
      
      // Poll for discovered devices
      const pollInterval = setInterval(() => {
        const devices = bleService.getDiscoveredDevices();
        setDiscoveredDevices(devices);
        
        if (!bleService.isCurrentlyScanning()) {
          clearInterval(pollInterval);
          setIsScanning(false);
        }
      }, 1000);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        bleService.stopScanning();
        setIsScanning(false);
      }, 30000);
      
    } catch (error) {
      console.error('Error starting scan:', error);
      setIsScanning(false);
      Alert.alert('Scan Error', 'Failed to start Bluetooth scan. Please check your Bluetooth settings.');
    }
  };

  const stopDeviceScan = () => {
    bleService.stopScanning();
    setIsScanning(false);
  };

  const handlePairNewBall = async () => {
    if (!newBallName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your golf ball.');
      return;
    }

    if (selectedDevice) {
      // Pair with selected device
      await pairSelectedDevice();
    } else {
      // Use the original pairing method (auto-select first device or simulate)
      await pairWithAutoSelection();
    }
  };

  const pairSelectedDevice = async () => {
    setIsPairing(true);
    try {
      const success = await bleService.connectToDevice(selectedDevice!);
      if (success) {
        // Create golf ball from connected device
        const device = discoveredDevices.find(d => d.id === selectedDevice);
        if (device) {
          // This would normally be handled by the BLE service
          // For now, we'll use the existing pairNewBall method
          const pairSuccess = await pairNewBall(newBallName.trim());
          if (pairSuccess) {
            setNewBallName('');
            setSelectedDevice(null);
            setShowPairModal(false);
            Alert.alert('Success', `Successfully paired "${device.name || 'Unknown Device'}" as "${newBallName.trim()}"!`);
          } else {
            Alert.alert('Pairing Failed', 'Could not pair the selected device.');
          }
        }
      } else {
        Alert.alert('Connection Failed', 'Could not connect to the selected device.');
      }
    } catch (error) {
      console.error('Error pairing device:', error);
      Alert.alert('Error', 'An error occurred while pairing the device.');
    } finally {
      setIsPairing(false);
    }
  };

  const pairWithAutoSelection = async () => {
    setIsPairing(true);
    try {
      const success = await pairNewBall(newBallName.trim());
      if (success) {
        setNewBallName('');
        setSelectedDevice(null);
        setShowPairModal(false);
        Alert.alert('Success', 'Golf ball paired successfully!');
      } else {
        Alert.alert('Pairing Failed', 'Could not pair the golf ball. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while pairing the ball.');
    } finally {
      setIsPairing(false);
    }
  };

  const handleRemoveBall = (ballId: string, ballName: string) => {
    Alert.alert(
      'Remove Golf Ball',
      `Are you sure you want to remove "${ballName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeBall(ballId) }
      ]
    );
  };

  const handleNavigateToBall = (ballName: string, latitude: number, longitude: number) => {
    if (!playerLocation) {
      Alert.alert('Location Required', 'Cannot navigate without your current location.');
      return;
    }

    const distance = calculateDistance(
      playerLocation.latitude,
      playerLocation.longitude,
      latitude,
      longitude
    );

    Alert.alert(
      `Navigate to ${ballName}`,
      `Distance: ${Math.round(distance)}m\n\nIn a production app, this would open turn-by-turn navigation.`,
      [{ text: 'OK' }]
    );
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const getBatteryColor = (level?: number): string => {
    if (!level) return '#6B7280';
    if (level > 50) return '#10B981';
    if (level > 20) return '#F59E0B';
    return '#EF4444';
  };

  const getSignalStrength = (rssi?: number): number => {
    if (!rssi) return 0;
    // Convert RSSI to signal strength (0-4 bars)
    if (rssi > -50) return 4;
    if (rssi > -60) return 3;
    if (rssi > -70) return 2;
    if (rssi > -80) return 1;
    return 0;
  };

  const getBLEStateColor = (state: string): string => {
    switch (state) {
      case 'PoweredOn': return '#10B981';
      case 'PoweredOff': return '#EF4444';
      case 'Unauthorized': return '#F59E0B';
      case 'Unsupported': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Golf Balls</Text>
        <Text style={styles.headerSubtitle}>Manage your tracked golf balls</Text>
        
        {/* BLE Status */}
        <View style={styles.bleStatus}>
          <Bluetooth size={16} color={getBLEStateColor(bleState)} />
          <Text style={[styles.bleStatusText, { color: getBLEStateColor(bleState) }]}>
            Bluetooth: {bleState}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.pairButton} 
          onPress={() => setShowPairModal(true)}>
          <Plus size={20} color="white" />
          <Text style={styles.pairButtonText}>Pair New Ball</Text>
        </TouchableOpacity>
      </View>

      {/* Ball List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {golfBalls.length === 0 ? (
          <View style={styles.emptyState}>
            <Target size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Golf Balls</Text>
            <Text style={styles.emptyStateText}>
              Pair your first golf ball to start tracking it on the course.
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton} 
              onPress={() => setShowPairModal(true)}>
              <Plus size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>Pair Your First Ball</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ballList}>
            {golfBalls.map((ball) => {
              const distance = playerLocation 
                ? calculateDistance(
                    playerLocation.latitude,
                    playerLocation.longitude,
                    ball.latitude,
                    ball.longitude
                  )
                : null;

              return (
                <View key={ball.id} style={styles.ballCard}>
                  {/* Ball Header */}
                  <View style={styles.ballHeader}>
                    <View style={styles.ballInfo}>
                      <View style={styles.ballNameRow}>
                        <View style={[
                          styles.ballStatusIndicator,
                          { backgroundColor: ball.isConnected ? '#10B981' : '#EF4444' }
                        ]} />
                        <Text style={styles.ballName}>{ball.name}</Text>
                        {ball.deviceId && (
                          <Text style={styles.deviceId}>({ball.deviceId.substring(0, 8)}...)</Text>
                        )}
                      </View>
                      <Text style={styles.ballLastSeen}>
                        Last seen: {ball.lastSeen.toLocaleTimeString()}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemoveBall(ball.id, ball.name)}>
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Ball Stats */}
                  <View style={styles.ballStats}>
                    {/* Battery */}
                    <View style={styles.statItem}>
                      <Battery size={16} color={getBatteryColor(ball.batteryLevel)} />
                      <Text style={[styles.statValue, { color: getBatteryColor(ball.batteryLevel) }]}>
                        {ball.batteryLevel || 0}%
                      </Text>
                    </View>

                    {/* Signal Strength */}
                    <View style={styles.statItem}>
                      <Signal size={16} color={ball.isConnected ? '#10B981' : '#6B7280'} />
                      <View style={styles.signalBars}>
                        {[1, 2, 3, 4].map((bar) => (
                          <View
                            key={bar}
                            style={[
                              styles.signalBar,
                              {
                                backgroundColor: bar <= getSignalStrength(ball.rssi) && ball.isConnected
                                  ? '#10B981'
                                  : '#E5E7EB'
                              }
                            ]}
                          />
                        ))}
                      </View>
                    </View>

                    {/* Distance */}
                    {distance !== null && (
                      <View style={styles.statItem}>
                        <Navigation size={16} color="#6B7280" />
                        <Text style={styles.statValue}>
                          {formatDistance(distance)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  {ball.isConnected && (
                    <View style={styles.ballActions}>
                      <TouchableOpacity 
                        style={styles.navigateButton}
                        onPress={() => handleNavigateToBall(ball.name, ball.latitude, ball.longitude)}>
                        <Navigation size={16} color="white" />
                        <Text style={styles.navigateButtonText}>Navigate</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Pair New Ball Modal */}
      <Modal
        visible={showPairModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPairModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pair New Golf Ball</Text>
            <TouchableOpacity onPress={() => setShowPairModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Bluetooth size={48} color="#059669" />
            </View>

            <Text style={styles.modalDescription}>
              Give your golf ball a unique name and select a Bluetooth device to pair with.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ball Name</Text>
              <TextInput
                style={styles.textInput}
                value={newBallName}
                onChangeText={setNewBallName}
                placeholder="e.g., My Titleist Pro V1"
                placeholderTextColor="#9CA3AF"
                maxLength={30}
                autoFocus
              />
            </View>

            {/* Device Scanning Section */}
            <View style={styles.scanSection}>
              <View style={styles.scanHeader}>
                <Text style={styles.scanTitle}>Available Devices</Text>
                <TouchableOpacity 
                  style={styles.scanButton}
                  onPress={isScanning ? stopDeviceScan : startDeviceScan}
                  disabled={isPairing}>
                  {isScanning ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.scanButtonText}>Scanning...</Text>
                    </>
                  ) : (
                    <>
                      <Search size={16} color="white" />
                      <Text style={styles.scanButtonText}>Scan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Discovered Devices */}
              <View style={styles.deviceList}>
                {discoveredDevices.length === 0 ? (
                  <View style={styles.noDevicesContainer}>
                    <Wifi size={32} color="#D1D5DB" />
                    <Text style={styles.noDevicesText}>
                      {isScanning ? 'Scanning for devices...' : 'No devices found. Tap scan to search for Bluetooth devices.'}
                    </Text>
                  </View>
                ) : (
                  discoveredDevices.map((device) => (
                    <TouchableOpacity
                      key={device.id}
                      style={[
                        styles.deviceItem,
                        selectedDevice === device.id && styles.deviceItemSelected
                      ]}
                      onPress={() => setSelectedDevice(device.id)}>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>
                          {device.name || 'Unknown Device'}
                        </Text>
                        <Text style={styles.deviceId}>
                          ID: {device.id.substring(0, 12)}...
                        </Text>
                      </View>
                      <View style={styles.deviceStats}>
                        <Signal size={16} color="#6B7280" />
                        <Text style={styles.deviceRssi}>
                          {device.rssi || 'N/A'} dBm
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.pairConfirmButton,
                { opacity: isPairing ? 0.7 : 1 }
              ]}
              onPress={handlePairNewBall}
              disabled={isPairing}>
              {isPairing ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.pairConfirmButtonText}>Pairing...</Text>
                </>
              ) : (
                <>
                  <Plus size={20} color="white" />
                  <Text style={styles.pairConfirmButtonText}>
                    {selectedDevice ? 'Pair Selected Device' : 'Pair Ball (Auto-select)'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.modalFooterText}>
              {selectedDevice 
                ? 'The selected device will be paired as your golf ball.'
                : 'If no device is selected, the app will automatically find and pair a suitable device.'
              }
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 8,
  },
  bleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bleStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  pairButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pairButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ballList: {
    padding: 16,
  },
  ballCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ballHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ballInfo: {
    flex: 1,
  },
  ballNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ballStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  ballName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  deviceId: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  ballLastSeen: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
  },
  ballStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  signalBars: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  signalBar: {
    width: 3,
    height: 12,
    marginRight: 1,
    borderRadius: 1,
  },
  ballActions: {
    flexDirection: 'row',
  },
  navigateButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  scanSection: {
    marginBottom: 32,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  scanButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  deviceList: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
  },
  noDevicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDevicesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  deviceItemSelected: {
    backgroundColor: '#EBF8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  deviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceRssi: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  pairConfirmButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  pairConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalFooterText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});