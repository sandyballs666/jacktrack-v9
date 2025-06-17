import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings, 
  User, 
  Bell, 
  MapPin, 
  Bluetooth,
  Info,
  HelpCircle,
  Shield,
  Smartphone,
  Battery,
  Wifi
} from 'lucide-react-native';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = React.useState(true);

  const handleAbout = () => {
    Alert.alert(
      'About JackTrack',
      'JackTrack v1.0.0\n\nProfessional golf ball tracking system using Bluetooth Low Energy technology.\n\nNever lose a golf ball again!',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'For support and tutorials:\n\n• Visit our website\n• Contact support team\n• Check the user manual\n\nIn a production app, this would link to comprehensive help resources.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'JackTrack respects your privacy. We only collect location data necessary for golf ball tracking and game statistics.\n\nNo personal data is shared with third parties.',
      [{ text: 'OK' }]
    );
  };

  const handleSystemInfo = () => {
    Alert.alert(
      'System Information',
      'App Version: 1.0.0\nBuild: 2025.01.01\nPlatform: React Native\nBluetooth: BLE 5.0\nGPS: High Accuracy\n\nAll systems operational ✅',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your JackTrack experience</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <User size={20} color="#059669" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>User Profile</Text>
              <Text style={styles.settingSubtitle}>Manage your account and preferences</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Bell size={20} color="#F59E0B" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Ball connection alerts and game updates</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#D1FAE5' }}
              thumbColor={notificationsEnabled ? '#059669' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MapPin size={20} color="#3B82F6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Location Services</Text>
              <Text style={styles.settingSubtitle}>GPS tracking for course mapping</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={locationEnabled ? '#3B82F6' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Bluetooth size={20} color="#8B5CF6" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Bluetooth</Text>
              <Text style={styles.settingSubtitle}>Golf ball connectivity</Text>
            </View>
            <Switch
              value={bluetoothEnabled}
              onValueChange={setBluetoothEnabled}
              trackColor={{ false: '#E5E7EB', true: '#EDE9FE' }}
              thumbColor={bluetoothEnabled ? '#8B5CF6' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <Smartphone size={24} color="#10B981" />
              <Text style={styles.statusLabel}>App</Text>
              <Text style={[styles.statusValue, { color: '#10B981' }]}>Online</Text>
            </View>
            
            <View style={styles.statusCard}>
              <MapPin size={24} color="#10B981" />
              <Text style={styles.statusLabel}>GPS</Text>
              <Text style={[styles.statusValue, { color: '#10B981' }]}>Active</Text>
            </View>
            
            <View style={styles.statusCard}>
              <Bluetooth size={24} color="#10B981" />
              <Text style={styles.statusLabel}>Bluetooth</Text>
              <Text style={[styles.statusValue, { color: '#10B981' }]}>Ready</Text>
            </View>
            
            <View style={styles.statusCard}>
              <Battery size={24} color="#F59E0B" />
              <Text style={styles.statusLabel}>Battery</Text>
              <Text style={[styles.statusValue, { color: '#F59E0B' }]}>Good</Text>
            </View>
          </View>
        </View>

        {/* Support & Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Information</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleHelp}>
            <View style={styles.settingIcon}>
              <HelpCircle size={20} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingSubtitle}>Get help and tutorials</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <View style={styles.settingIcon}>
              <Info size={20} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About JackTrack</Text>
              <Text style={styles.settingSubtitle}>App version and information</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacy}>
            <View style={styles.settingIcon}>
              <Shield size={20} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
              <Text style={styles.settingSubtitle}>How we protect your data</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSystemInfo}>
            <View style={styles.settingIcon}>
              <Smartphone size={20} color="#6B7280" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>System Information</Text>
              <Text style={styles.settingSubtitle}>Technical details and diagnostics</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>JackTrack Golf Ball Tracking System</Text>
          <Text style={styles.footerVersion}>Version 1.0.0 • Build 2025.01.01</Text>
          <Text style={styles.footerCopyright}>© 2025 JackTrack. All rights reserved.</Text>
        </View>
      </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});