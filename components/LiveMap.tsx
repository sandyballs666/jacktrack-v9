import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useGame } from '../contexts/GameContext';
import { GolfBall, GolfHole } from '../types';
import { Navigation, MapPin, Target, Flag } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Web-compatible map component
function WebMap({ children, style, initialRegion, ...props }: any) {
  return (
    <View style={[style, styles.webMapContainer]}>
      <View style={styles.webMapHeader}>
        <Text style={styles.webMapTitle}>Golf Course Map</Text>
        <Text style={styles.webMapSubtitle}>Live tracking view</Text>
      </View>
      <View style={styles.webMapContent}>
        {children}
      </View>
    </View>
  );
}

// Mock marker component for web
function WebMarker({ coordinate, children, onPress, title, description }: any) {
  const left = Math.random() * 70 + 15; // Random position for demo
  const top = Math.random() * 70 + 15;
  
  return (
    <TouchableOpacity
      style={[
        styles.webMarkerContainer,
        {
          left: `${left}%`,
          top: `${top}%`,
        }
      ]}
      onPress={onPress}
    >
      {children}
      {title && (
        <View style={styles.webMarkerTooltip}>
          <Text style={styles.webMarkerTitle}>{title}</Text>
          {description && (
            <Text style={styles.webMarkerDescription}>{description}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Native map components (only loaded on native platforms)
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
    Polyline = Maps.Polyline;
  } catch (error) {
    console.warn('react-native-maps not available, using web fallback');
  }
}

export default function LiveMap() {
  const {
    playerLocation,
    golfBalls,
    currentGame,
    courses,
    getDistanceMeasurements,
    calculateDistance
  } = useGame();
  
  const mapRef = useRef<any>(null);
  const [selectedBall, setSelectedBall] = useState<string | null>(null);
  const [currentHole, setCurrentHole] = useState<GolfHole | null>(null);

  // Get current course and hole
  useEffect(() => {
    if (currentGame && courses.length > 0) {
      const course = courses.find(c => c.id === currentGame.courseId);
      if (course) {
        const currentHoleNumber = currentGame.scores.length + 1;
        const hole = course.holes.find(h => h.number === currentHoleNumber);
        setCurrentHole(hole || null);
      }
    }
  }, [currentGame, courses]);

  const handleBallPress = (ball: GolfBall) => {
    setSelectedBall(selectedBall === ball.id ? null : ball.id);
    
    if (playerLocation) {
      const distance = calculateDistance(
        playerLocation.latitude,
        playerLocation.longitude,
        ball.latitude,
        ball.longitude
      );
      
      Alert.alert(
        ball.name,
        `Distance: ${Math.round(distance)}m\nBattery: ${ball.batteryLevel}%\nLast seen: ${ball.lastSeen.toLocaleTimeString()}`,
        [
          { text: 'Navigate', onPress: () => navigateToLocation(ball.latitude, ball.longitude) },
          { text: 'OK' }
        ]
      );
    }
  };

  const navigateToLocation = (latitude: number, longitude: number) => {
    Alert.alert('Navigation', 'Turn-by-turn navigation would open here in a production app.');
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  if (!playerLocation) {
    return (
      <View style={styles.loadingContainer}>
        <MapPin size={48} color="#059669" />
        <Text style={styles.loadingText}>Getting your location...</Text>
        <Text style={styles.loadingSubText}>Make sure location services are enabled</Text>
      </View>
    );
  }

  const distances = getDistanceMeasurements();
  
  // Choose components based on platform
  const MapComponent = Platform.OS === 'web' ? WebMap : MapView;
  const MarkerComponent = Platform.OS === 'web' ? WebMarker : Marker;

  // If native maps aren't available, fall back to web version
  if (Platform.OS !== 'web' && !MapView) {
    return (
      <WebMap style={styles.map}>
        {/* Player Location Marker */}
        <WebMarker
          coordinate={{
            latitude: playerLocation.latitude,
            longitude: playerLocation.longitude,
          }}
          title="Your Location">
          <View style={[styles.ballMarker, { backgroundColor: '#3B82F6' }]}>
            <Navigation size={20} color="white" />
          </View>
        </WebMarker>
        
        {/* Golf Balls */}
        {golfBalls.map(ball => (
          <WebMarker
            key={ball.id}
            coordinate={{
              latitude: ball.latitude,
              longitude: ball.longitude,
            }}
            onPress={() => handleBallPress(ball)}
            title={ball.name}>
            <View style={[
              styles.ballMarker,
              { backgroundColor: ball.isConnected ? '#059669' : '#EF4444' }
            ]}>
              <Target size={20} color="white" />
            </View>
          </WebMarker>
        ))}

        {/* Current Hole */}
        {currentHole && (
          <WebMarker
            coordinate={{
              latitude: currentHole.latitude,
              longitude: currentHole.longitude,
            }}
            title={`Hole ${currentHole.number}`}
            description={`Par ${currentHole.par} • ${currentHole.distance}yd`}>
            <View style={styles.holeMarker}>
              <Flag size={24} color="white" />
              <Text style={styles.holeNumber}>{currentHole.number}</Text>
            </View>
          </WebMarker>
        )}
      </WebMap>
    );
  }

  return (
    <View style={styles.container}>
      <MapComponent
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        initialRegion={{
          latitude: playerLocation.latitude,
          longitude: playerLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={Platform.OS !== 'web'}
        showsMyLocationButton={Platform.OS !== 'web'}
        showsCompass={Platform.OS !== 'web'}
        mapType={Platform.OS !== 'web' ? "satellite" : undefined}>
        
        {/* Player Location Marker for Web */}
        {Platform.OS === 'web' && (
          <MarkerComponent
            coordinate={{
              latitude: playerLocation.latitude,
              longitude: playerLocation.longitude,
            }}
            title="Your Location">
            <View style={[styles.ballMarker, { backgroundColor: '#3B82F6' }]}>
              <Navigation size={20} color="white" />
            </View>
          </MarkerComponent>
        )}
        
        {/* Golf Balls */}
        {golfBalls.map(ball => (
          <MarkerComponent
            key={ball.id}
            coordinate={{
              latitude: ball.latitude,
              longitude: ball.longitude,
            }}
            onPress={() => handleBallPress(ball)}
            title={ball.name}>
            <View style={[
              styles.ballMarker,
              { backgroundColor: ball.isConnected ? '#059669' : '#EF4444' }
            ]}>
              <Target size={20} color="white" />
            </View>
          </MarkerComponent>
        ))}

        {/* Current Hole */}
        {currentHole && (
          <MarkerComponent
            coordinate={{
              latitude: currentHole.latitude,
              longitude: currentHole.longitude,
            }}
            title={`Hole ${currentHole.number}`}
            description={`Par ${currentHole.par} • ${currentHole.distance}yd`}>
            <View style={styles.holeMarker}>
              <Flag size={24} color="white" />
              <Text style={styles.holeNumber}>{currentHole.number}</Text>
            </View>
          </MarkerComponent>
        )}

        {/* Distance circles for golf balls */}
        {Platform.OS !== 'web' && Circle && golfBalls.map(ball => (
          <Circle
            key={`circle-${ball.id}`}
            center={{
              latitude: ball.latitude,
              longitude: ball.longitude,
            }}
            radius={50}
            strokeColor="rgba(5, 150, 105, 0.5)"
            fillColor="rgba(5, 150, 105, 0.1)"
            strokeWidth={2}
          />
        ))}
      </MapComponent>

      {/* Distance Panel */}
      {distances.length > 0 && (
        <View style={styles.distancePanel}>
          <Text style={styles.distanceTitle}>Distances</Text>
          {distances.slice(0, 3).map((measurement, index) => (
            <View key={index} style={styles.distanceRow}>
              <Text style={styles.distanceLabel}>
                {measurement.from.label} → {measurement.to.label}
              </Text>
              <Text style={styles.distanceValue}>
                {formatDistance(measurement.distance)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Game Info */}
      {currentGame && currentHole && (
        <View style={styles.gameInfoPanel}>
          <Text style={styles.gameInfoTitle}>
            Hole {currentHole.number} • Par {currentHole.par}
          </Text>
          <Text style={styles.gameInfoSubtitle}>
            {currentGame.courseName}
          </Text>
          <Text style={styles.gameInfoScore}>
            Score: {currentGame.totalStrokes - currentGame.totalPar > 0 ? '+' : ''}
            {currentGame.totalStrokes - currentGame.totalPar}
          </Text>
        </View>
      )}

      {/* Ball Status */}
      <View style={styles.ballStatusPanel}>
        <Text style={styles.ballStatusTitle}>Golf Balls ({golfBalls.length})</Text>
        {golfBalls.slice(0, 2).map(ball => (
          <View key={ball.id} style={styles.ballStatusRow}>
            <View style={[
              styles.ballStatusIndicator,
              { backgroundColor: ball.isConnected ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={styles.ballStatusName}>{ball.name}</Text>
            <Text style={styles.ballStatusBattery}>{ball.batteryLevel}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  loadingSubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  // Web Map Styles
  webMapContainer: {
    flex: 1,
    backgroundColor: '#4CAF50',
    position: 'relative',
  },
  webMapHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  webMapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  webMapSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  webMapContent: {
    flex: 1,
    position: 'relative',
  },
  webMarkerContainer: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    zIndex: 5,
  },
  webMarkerTooltip: {
    position: 'absolute',
    top: -60,
    left: -50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
  },
  webMarkerTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  webMarkerDescription: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
  ballMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  holeMarker: {
    backgroundColor: '#F59E0B',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  holeNumber: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: 'white',
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  distancePanel: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  distanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  distanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  gameInfoPanel: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  gameInfoSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  gameInfoScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  ballStatusPanel: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ballStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  ballStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ballStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  ballStatusName: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  ballStatusBattery: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});