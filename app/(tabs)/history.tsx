import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService } from '@/services/DatabaseService';
import { Game } from '@/types';
import { 
  History, 
  Calendar, 
  Target, 
  TrendingUp,
  TrendingDown,
  Award,
  Clock
} from 'lucide-react-native';

export default function HistoryScreen() {
  const [gameHistory, setGameHistory] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    totalStrokes: 0,
    averageStrokes: 0
  });

  useEffect(() => {
    loadGameHistory();
  }, []);

  const loadGameHistory = async () => {
    try {
      setIsLoading(true);
      const dbService = DatabaseService.getInstance();
      const history = await dbService.getGameHistory(20);
      setGameHistory(history);
      calculateStats(history);
    } catch (error) {
      console.error('Error loading game history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (games: Game[]) => {
    if (games.length === 0) {
      setStats({
        totalGames: 0,
        averageScore: 0,
        bestScore: 0,
        totalStrokes: 0,
        averageStrokes: 0
      });
      return;
    }

    const completedGames = games.filter(game => game.scores.length === 18);
    const totalStrokes = completedGames.reduce((sum, game) => sum + game.totalStrokes, 0);
    const totalPar = completedGames.reduce((sum, game) => sum + game.totalPar, 0);
    const scores = completedGames.map(game => game.totalStrokes - game.totalPar);
    
    setStats({
      totalGames: games.length,
      averageScore: completedGames.length > 0 ? Math.round((totalStrokes - totalPar) / completedGames.length) : 0,
      bestScore: scores.length > 0 ? Math.min(...scores) : 0,
      totalStrokes: totalStrokes,
      averageStrokes: completedGames.length > 0 ? Math.round(totalStrokes / completedGames.length) : 0
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getScoreColor = (scoreToPar: number): string => {
    if (scoreToPar <= -5) return '#10B981'; // Excellent
    if (scoreToPar <= 0) return '#059669';  // Good
    if (scoreToPar <= 10) return '#F59E0B'; // Average
    return '#EF4444'; // Needs improvement
  };

  const getScoreDescription = (scoreToPar: number): string => {
    if (scoreToPar <= -10) return 'Exceptional';
    if (scoreToPar <= -5) return 'Excellent';
    if (scoreToPar <= 0) return 'Great';
    if (scoreToPar <= 5) return 'Good';
    if (scoreToPar <= 10) return 'Average';
    return 'Keep practicing';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <History size={48} color="#059669" />
          <Text style={styles.loadingText}>Loading game history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Game History</Text>
        <Text style={styles.headerSubtitle}>Track your golf performance over time</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statistics Overview */}
        {gameHistory.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Your Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Target size={24} color="#059669" />
                <Text style={styles.statValue}>{stats.totalGames}</Text>
                <Text style={styles.statLabel}>Total Games</Text>
              </View>
              
              <View style={styles.statCard}>
                <Award size={24} color="#F59E0B" />
                <Text style={[
                  styles.statValue,
                  { color: getScoreColor(stats.bestScore) }
                ]}>
                  {stats.bestScore > 0 ? '+' : ''}{stats.bestScore}
                </Text>
                <Text style={styles.statLabel}>Best Score</Text>
              </View>
              
              <View style={styles.statCard}>
                <TrendingUp size={24} color="#6B7280" />
                <Text style={styles.statValue}>{stats.averageStrokes}</Text>
                <Text style={styles.statLabel}>Avg Strokes</Text>
              </View>
              
              <View style={styles.statCard}>
                <TrendingDown size={24} color="#3B82F6" />
                <Text style={[
                  styles.statValue,
                  { color: getScoreColor(stats.averageScore) }
                ]}>
                  {stats.averageScore > 0 ? '+' : ''}{stats.averageScore}
                </Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
            </View>
          </View>
        )}

        {/* Game History */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          
          {gameHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <History size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Games Yet</Text>
              <Text style={styles.emptyStateText}>
                Your completed games will appear here. Start playing to build your golf history!
              </Text>
            </View>
          ) : (
            <View style={styles.gamesList}>
              {gameHistory.map((game) => {
                const scoreToPar = game.totalStrokes - game.totalPar;
                const isComplete = game.scores.length === 18;
                
                return (
                  <View key={game.id} style={styles.gameCard}>
                    {/* Game Header */}
                    <View style={styles.gameHeader}>
                      <View style={styles.gameInfo}>
                        <Text style={styles.courseName}>{game.courseName}</Text>
                        <View style={styles.gameDateTime}>
                          <Calendar size={14} color="#6B7280" />
                          <Text style={styles.gameDate}>{formatDate(game.startTime)}</Text>
                          <Clock size={14} color="#6B7280" />
                          <Text style={styles.gameTime}>{formatTime(game.startTime)}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.gameStatus}>
                        {isComplete ? (
                          <View style={styles.completeStatus}>
                            <Text style={styles.completeText}>Complete</Text>
                          </View>
                        ) : (
                          <View style={styles.incompleteStatus}>
                            <Text style={styles.incompleteText}>
                              {game.scores.length}/18 holes
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Game Stats */}
                    <View style={styles.gameStats}>
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatLabel}>Score</Text>
                        <Text style={[
                          styles.gameStatValue,
                          { color: getScoreColor(scoreToPar) }
                        ]}>
                          {scoreToPar > 0 ? '+' : ''}{scoreToPar}
                        </Text>
                      </View>
                      
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatLabel}>Strokes</Text>
                        <Text style={styles.gameStatValue}>{game.totalStrokes}</Text>
                      </View>
                      
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatLabel}>Par</Text>
                        <Text style={styles.gameStatValue}>{game.totalPar}</Text>
                      </View>
                      
                      {isComplete && (
                        <View style={styles.gameStatItem}>
                          <Text style={styles.gameStatLabel}>Rating</Text>
                          <Text style={[
                            styles.gameStatValue,
                            { color: getScoreColor(scoreToPar), fontSize: 12 }
                          ]}>
                            {getScoreDescription(scoreToPar)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Best/Worst Holes (for completed games) */}
                    {isComplete && game.scores.length > 0 && (
                      <View style={styles.holeHighlights}>
                        {(() => {
                          const holesWithScores = game.scores.map(score => ({
                            ...score,
                            scoreToPar: score.strokes - score.par
                          }));
                          
                          const bestHole = holesWithScores.reduce((best, current) => 
                            current.scoreToPar < best.scoreToPar ? current : best
                          );
                          
                          const worstHole = holesWithScores.reduce((worst, current) => 
                            current.scoreToPar > worst.scoreToPar ? current : worst
                          );

                          return (
                            <View style={styles.holeHighlightRow}>
                              <View style={styles.holeHighlight}>
                                <Text style={styles.holeHighlightLabel}>Best Hole</Text>
                                <Text style={[
                                  styles.holeHighlightValue,
                                  { color: getScoreColor(bestHole.scoreToPar) }
                                ]}>
                                  #{bestHole.holeNumber} ({bestHole.scoreToPar > 0 ? '+' : ''}{bestHole.scoreToPar})
                                </Text>
                              </View>
                              
                              <View style={styles.holeHighlight}>
                                <Text style={styles.holeHighlightLabel}>Toughest Hole</Text>
                                <Text style={[
                                  styles.holeHighlightValue,
                                  { color: getScoreColor(worstHole.scoreToPar) }
                                ]}>
                                  #{worstHole.holeNumber} ({worstHole.scoreToPar > 0 ? '+' : ''}{worstHole.scoreToPar})
                                </Text>
                              </View>
                            </View>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  historyContainer: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
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
    lineHeight: 24,
  },
  gamesList: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  gameDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gameDate: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  gameTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  gameStatus: {
    alignItems: 'flex-end',
  },
  completeStatus: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  incompleteStatus: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  incompleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameStatItem: {
    alignItems: 'center',
  },
  gameStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  gameStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  holeHighlights: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  holeHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  holeHighlight: {
    alignItems: 'center',
  },
  holeHighlightLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  holeHighlightValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});