import * as SQLite from 'expo-sqlite';
import { Game, GameScore, GolfCourse, GolfHole } from '../types';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('jacktrack.db');
      await this.createTables();
      await this.seedInitialData();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const queries = [
      `CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS holes (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        number INTEGER NOT NULL,
        par INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        distance INTEGER NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses (id)
      )`,
      `CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        total_strokes INTEGER DEFAULT 0,
        total_par INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (id)
      )`,
      `CREATE TABLE IF NOT EXISTS game_scores (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        hole_number INTEGER NOT NULL,
        par INTEGER NOT NULL,
        strokes INTEGER NOT NULL,
        putts INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games (id)
      )`
    ];

    for (const query of queries) {
      await this.db.execAsync(query);
    }
  }

  private async seedInitialData(): Promise<void> {
    if (!this.db) return;

    // Check if courses already exist
    const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM courses');
    if (result && (result as any).count > 0) {
      return; // Data already exists
    }

    // Create sample golf course
    const courseId = 'pebble-beach-golf';
    await this.db.runAsync(
      'INSERT OR REPLACE INTO courses (id, name, latitude, longitude) VALUES (?, ?, ?, ?)',
      [courseId, 'Pebble Beach Golf Links', 36.5674, -121.9491]
    );

    // Create 18 holes for the course
    const holes = [
      { number: 1, par: 4, lat: 36.5674, lng: -121.9491, distance: 380 },
      { number: 2, par: 5, lat: 36.5680, lng: -121.9485, distance: 520 },
      { number: 3, par: 4, lat: 36.5685, lng: -121.9480, distance: 390 },
      { number: 4, par: 4, lat: 36.5690, lng: -121.9475, distance: 410 },
      { number: 5, par: 3, lat: 36.5695, lng: -121.9470, distance: 180 },
      { number: 6, par: 5, lat: 36.5700, lng: -121.9465, distance: 540 },
      { number: 7, par: 3, lat: 36.5705, lng: -121.9460, distance: 120 },
      { number: 8, par: 4, lat: 36.5710, lng: -121.9455, distance: 430 },
      { number: 9, par: 4, lat: 36.5715, lng: -121.9450, distance: 460 },
      { number: 10, par: 4, lat: 36.5720, lng: -121.9445, distance: 440 },
      { number: 11, par: 4, lat: 36.5725, lng: -121.9440, distance: 380 },
      { number: 12, par: 3, lat: 36.5730, lng: -121.9435, distance: 200 },
      { number: 13, par: 4, lat: 36.5735, lng: -121.9430, distance: 400 },
      { number: 14, par: 5, lat: 36.5740, lng: -121.9425, distance: 580 },
      { number: 15, par: 4, lat: 36.5745, lng: -121.9420, distance: 420 },
      { number: 16, par: 4, lat: 36.5750, lng: -121.9415, distance: 440 },
      { number: 17, par: 3, lat: 36.5755, lng: -121.9410, distance: 170 },
      { number: 18, par: 5, lat: 36.5760, lng: -121.9405, distance: 560 }
    ];

    for (const hole of holes) {
      const holeId = `${courseId}-hole-${hole.number}`;
      await this.db.runAsync(
        'INSERT OR REPLACE INTO holes (id, course_id, number, par, latitude, longitude, distance) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [holeId, courseId, hole.number, hole.par, hole.lat, hole.lng, hole.distance]
      );
    }
  }

  async getCourses(): Promise<GolfCourse[]> {
    if (!this.db) return [];

    try {
      const courses = await this.db.getAllAsync('SELECT * FROM courses ORDER BY name');
      const result: GolfCourse[] = [];

      for (const course of courses as any[]) {
        const holes = await this.db.getAllAsync(
          'SELECT * FROM holes WHERE course_id = ? ORDER BY number',
          [course.id]
        );

        result.push({
          id: course.id,
          name: course.name,
          latitude: course.latitude,
          longitude: course.longitude,
          holes: (holes as any[]).map(hole => ({
            id: hole.id,
            number: hole.number,
            par: hole.par,
            latitude: hole.latitude,
            longitude: hole.longitude,
            distance: hole.distance
          }))
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting courses:', error);
      return [];
    }
  }

  async startNewGame(courseId: string, courseName: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const gameId = `game-${Date.now()}`;
    const startTime = new Date().toISOString();

    try {
      await this.db.runAsync(
        'INSERT INTO games (id, course_id, course_name, start_time, is_active) VALUES (?, ?, ?, ?, 1)',
        [gameId, courseId, courseName, startTime]
      );

      return gameId;
    } catch (error) {
      console.error('Error starting new game:', error);
      throw error;
    }
  }

  async saveScore(gameId: string, holeNumber: number, par: number, strokes: number, putts?: number): Promise<void> {
    if (!this.db) return;

    const scoreId = `score-${gameId}-${holeNumber}`;

    try {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO game_scores (id, game_id, hole_number, par, strokes, putts) VALUES (?, ?, ?, ?, ?, ?)',
        [scoreId, gameId, holeNumber, par, strokes, putts || null]
      );

      // Update game totals
      await this.updateGameTotals(gameId);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }

  private async updateGameTotals(gameId: string): Promise<void> {
    if (!this.db) return;

    try {
      const totals = await this.db.getFirstAsync(
        'SELECT SUM(strokes) as total_strokes, SUM(par) as total_par FROM game_scores WHERE game_id = ?',
        [gameId]
      ) as any;

      if (totals) {
        await this.db.runAsync(
          'UPDATE games SET total_strokes = ?, total_par = ? WHERE id = ?',
          [totals.total_strokes || 0, totals.total_par || 0, gameId]
        );
      }
    } catch (error) {
      console.error('Error updating game totals:', error);
    }
  }

  async endGame(gameId: string): Promise<void> {
    if (!this.db) return;

    const endTime = new Date().toISOString();

    try {
      await this.db.runAsync(
        'UPDATE games SET end_time = ?, is_active = 0 WHERE id = ?',
        [endTime, gameId]
      );
    } catch (error) {
      console.error('Error ending game:', error);
    }
  }

  async getActiveGame(): Promise<Game | null> {
    if (!this.db) return null;

    try {
      const game = await this.db.getFirstAsync(
        'SELECT * FROM games WHERE is_active = 1 ORDER BY start_time DESC LIMIT 1'
      ) as any;

      if (!game) return null;

      const scores = await this.db.getAllAsync(
        'SELECT * FROM game_scores WHERE game_id = ? ORDER BY hole_number',
        [game.id]
      ) as any[];

      return {
        id: game.id,
        courseId: game.course_id,
        courseName: game.course_name,
        startTime: new Date(game.start_time),
        endTime: game.end_time ? new Date(game.end_time) : undefined,
        totalStrokes: game.total_strokes,
        totalPar: game.total_par,
        isActive: game.is_active === 1,
        scores: scores.map(score => ({
          holeNumber: score.hole_number,
          par: score.par,
          strokes: score.strokes,
          putts: score.putts
        }))
      };
    } catch (error) {
      console.error('Error getting active game:', error);
      return null;
    }
  }

  async getGameHistory(limit: number = 10): Promise<Game[]> {
    if (!this.db) return [];

    try {
      const games = await this.db.getAllAsync(
        'SELECT * FROM games WHERE is_active = 0 ORDER BY start_time DESC LIMIT ?',
        [limit]
      ) as any[];

      const result: Game[] = [];

      for (const game of games) {
        const scores = await this.db.getAllAsync(
          'SELECT * FROM game_scores WHERE game_id = ? ORDER BY hole_number',
          [game.id]
        ) as any[];

        result.push({
          id: game.id,
          courseId: game.course_id,
          courseName: game.course_name,
          startTime: new Date(game.start_time),
          endTime: game.end_time ? new Date(game.end_time) : undefined,
          totalStrokes: game.total_strokes,
          totalPar: game.total_par,
          isActive: false,
          scores: scores.map(score => ({
            holeNumber: score.hole_number,
            par: score.par,
            strokes: score.strokes,
            putts: score.putts
          }))
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting game history:', error);
      return [];
    }
  }
}