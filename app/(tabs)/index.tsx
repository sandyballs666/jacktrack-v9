import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import LiveMap from '@/components/LiveMap';
import { Play, Square, MapPin } from 'lucide-react-native';

export default function CourseScreen() {
  const { 
    currentGame, 
    courses, 
    startNewGame, 
    endCurrentGame,
    playerLocation,
    isLoading,
    error 
  } = useGame();

  const handleStartGame = () => {
    if (courses.length === 0) {
      Alert.alert('No Courses', 'No golf courses available. Please check back later.');
      return;
    }

    if (!playerLocation) {
      Alert.alert('Location Required', 'Please enable location services to start a game.');
      return;
    }

    // For now, start with the first available course
    const course = courses[0];
    Alert.alert(
      'Start New Game',
      `Start a new game at ${course.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => startNewGame(course.id, course.name) }
      ]
    );
  };

  const handleEndGame = () => {
    Alert.alert(
      'End Game',
      'Are you sure you want to end the current game? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Game', style: 'destructive', onPress: endCurrentGame }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <MapPin size={48} color="#059669" />
          <Text style={styles.loadingText}>Loading JackTrack...</Text>
          <Text style={styles.loadingSubText}>Initializing GPS and Bluetooth services</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>JackTrack</Text>
        <Text style={styles.headerSubtitle}>Golf Ball Tracking System</Text>
        
        {/* Game Control */}
        <View style={styles.gameControls}>
          {currentGame ? (
            <TouchableOpacity style={styles.endGameButton} onPress={handleEndGame}>
              <Square size={20} color="white" />
              <Text style={styles.endGameButtonText}>End Game</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startGameButton} onPress={handleStartGame}>
              <Play size={20} color="white" />
              <Text style={styles.startGameButtonText}>Start Game</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Live Map */}
      <View style={styles.mapContainer}>
        <LiveMap />
      </View>

      {/* Course Info */}
      {currentGame && (
        <View style={styles.courseInfo}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.courseInfoContent}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Course</Text>
                <Text style={styles.infoValue}>{currentGame.courseName}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Holes Played</Text>
                <Text style={styles.infoValue}>{currentGame.scores.length}/18</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Current Score</Text>
                <Text style={[
                  styles.infoValue,
                  { color: currentGame.totalStrokes <= currentGame.totalPar ? '#059669' : '#DC2626' }
                ]}>
                  {currentGame.totalStrokes - currentGame.totalPar > 0 ? '+' : ''}
                  {currentGame.totalStrokes - currentGame.totalPar}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Total Strokes</Text>
                <Text style={styles.infoValue}>{currentGame.totalStrokes}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  loadingSubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#059669',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  gameControls: {
    marginTop: 12,
  },
  startGameButton: {
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
  startGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  endGameButton: {
    backgroundColor: '#DC2626',
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
  endGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
  },
  courseInfo: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
  },
  courseInfoContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  infoCard: {
    marginRight: 20,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});