export interface GolfBall {
  id: string;
  name: string;
  deviceId?: string;
  latitude: number;
  longitude: number;
  batteryLevel?: number;
  lastSeen: Date;
  isConnected: boolean;
  rssi?: number;
}

export interface GolfHole {
  id: string;
  number: number;
  par: number;
  latitude: number;
  longitude: number;
  distance: number;
}

export interface GolfCourse {
  id: string;
  name: string;
  holes: GolfHole[];
  latitude: number;
  longitude: number;
}

export interface GameScore {
  holeNumber: number;
  par: number;
  strokes: number;
  putts?: number;
}

export interface Game {
  id: string;
  courseId: string;
  courseName: string;
  startTime: Date;
  endTime?: Date;
  scores: GameScore[];
  totalStrokes: number;
  totalPar: number;
  isActive: boolean;
}

export interface PlayerLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

export interface DistanceMeasurement {
  from: { latitude: number; longitude: number; label: string };
  to: { latitude: number; longitude: number; label: string };
  distance: number;
}