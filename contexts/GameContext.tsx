import React, { createContext, useContext, useEffect, useState } from 'react';
import { Game, GolfBall, GolfCourse, PlayerLocation, DistanceMeasurement } from '../types';
import { BLEService } from '../services/BLEService';
import { DatabaseService } from '../services/DatabaseService';
import { LocationService } from '../services/LocationService';

interface GameContextType {
  // Game state
  currentGame: Game | null;
  courses: GolfCourse[];
  golfBalls: GolfBall[];
  playerLocation: PlayerLocation | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewGame: (courseId: string, courseName: string) => Promise<void>;
  endCurrentGame: () => Promise<void>;
  saveScore: (holeNumber: number, par: number, strokes: number, putts?: number) => Promise<void>;
  pairNewBall: (name: string) => Promise<boolean>;
  removeBall: (ballId: string) => Promise<void>;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  getDistanceMeasurements: () => DistanceMeasurement[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [golfBalls, setGolfBalls] = useState<GolfBall[]>([]);
  const [playerLocation, setPlayerLocation] = useState<PlayerLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bleService = BLEService.getInstance();
  const dbService = DatabaseService.getInstance();
  const locationService = LocationService.getInstance();

  useEffect(() => {
    initializeServices();
    return () => {
      cleanup();
    };
  }, []);

  const initializeServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize database
      await dbService.initialize();

      // Initialize BLE
      await bleService.initialize();

      // Initialize location tracking
      await locationService.startLocationTracking();

      // Load initial data
      const [loadedCourses, activeGame] = await Promise.all([
        dbService.getCourses(),
        dbService.getActiveGame()
      ]);

      setCourses(loadedCourses);
      setCurrentGame(activeGame);

      // Set up location updates
      const unsubscribeLocation = locationService.onLocationUpdate((location) => {
        setPlayerLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
          timestamp: new Date(location.timestamp)
        });
      });

      // Set up ball updates
      const unsubscribeBalls = bleService.onBallUpdates((balls) => {
        setGolfBalls(balls);
      });

      // Store unsubscribe functions for cleanup
      (window as any).__jacktrack_cleanup = () => {
        unsubscribeLocation();
        unsubscribeBalls();
      };

    } catch (err) {
      console.error('Error initializing services:', err);
      setError('Failed to initialize app services. Please try restarting the app.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if ((window as any).__jacktrack_cleanup) {
      (window as any).__jacktrack_cleanup();
    }
    locationService.stopLocationTracking();
    bleService.destroy();
  };

  const startNewGame = async (courseId: string, courseName: string) => {
    try {
      setError(null);
      const gameId = await dbService.startNewGame(courseId, courseName);
      const newGame = await dbService.getActiveGame();
      setCurrentGame(newGame);
    } catch (err) {
      console.error('Error starting new game:', err);
      setError('Failed to start new game. Please try again.');
    }
  };

  const endCurrentGame = async () => {
    try {
      if (!currentGame) return;
      
      setError(null);
      await dbService.endGame(currentGame.id);
      setCurrentGame(null);
    } catch (err) {
      console.error('Error ending game:', err);
      setError('Failed to end game. Please try again.');
    }
  };

  const saveScore = async (holeNumber: number, par: number, strokes: number, putts?: number) => {
    try {
      if (!currentGame) return;
      
      setError(null);
      await dbService.saveScore(currentGame.id, holeNumber, par, strokes, putts);
      
      // Refresh current game data
      const updatedGame = await dbService.getActiveGame();
      setCurrentGame(updatedGame);
    } catch (err) {
      console.error('Error saving score:', err);
      setError('Failed to save score. Please try again.');
    }
  };

  const pairNewBall = async (name: string): Promise<boolean> => {
    try {
      setError(null);
      return await bleService.pairNewBall(name);
    } catch (err) {
      console.error('Error pairing ball:', err);
      setError('Failed to pair golf ball. Please ensure Bluetooth is enabled and try again.');
      return false;
    }
  };

  const removeBall = async (ballId: string) => {
    try {
      setError(null);
      await bleService.removeBall(ballId);
    } catch (err) {
      console.error('Error removing ball:', err);
      setError('Failed to remove golf ball. Please try again.');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return locationService.calculateDistance(lat1, lon1, lat2, lon2);
  };

  const getDistanceMeasurements = (): DistanceMeasurement[] => {
    const measurements: DistanceMeasurement[] = [];
    
    if (!playerLocation) return measurements;

    // Distance from player to each ball
    golfBalls.forEach(ball => {
      measurements.push({
        from: { 
          latitude: playerLocation.latitude, 
          longitude: playerLocation.longitude, 
          label: 'You' 
        },
        to: { 
          latitude: ball.latitude, 
          longitude: ball.longitude, 
          label: ball.name 
        },
        distance: calculateDistance(
          playerLocation.latitude, 
          playerLocation.longitude, 
          ball.latitude, 
          ball.longitude
        )
      });
    });

    // Distance from player to current hole (if in active game)
    if (currentGame && courses.length > 0) {
      const course = courses.find(c => c.id === currentGame.courseId);
      if (course) {
        // Find current hole based on scores
        const currentHoleNumber = currentGame.scores.length + 1;
        const currentHole = course.holes.find(h => h.number === currentHoleNumber);
        
        if (currentHole) {
          measurements.push({
            from: { 
              latitude: playerLocation.latitude, 
              longitude: playerLocation.longitude, 
              label: 'You' 
            },
            to: { 
              latitude: currentHole.latitude, 
              longitude: currentHole.longitude, 
              label: `Hole ${currentHole.number}` 
            },
            distance: calculateDistance(
              playerLocation.latitude, 
              playerLocation.longitude, 
              currentHole.latitude, 
              currentHole.longitude
            )
          });
        }
      }
    }

    return measurements;
  };

  const value: GameContextType = {
    currentGame,
    courses,
    golfBalls,
    playerLocation,
    isLoading,
    error,
    startNewGame,
    endCurrentGame,
    saveScore,
    pairNewBall,
    removeBall,
    calculateDistance,
    getDistanceMeasurements
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}