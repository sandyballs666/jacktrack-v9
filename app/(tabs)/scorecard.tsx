import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '@/contexts/GameContext';
import { 
  ClipboardList, 
  Plus, 
  Minus, 
  CheckCircle,
  Flag,
  Target,
  Calendar
} from 'lucide-react-native';

export default function ScorecardScreen() {
  const { currentGame, courses, saveScore, startNewGame } = useGame();
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [strokeCount, setStrokeCount] = useState<number>(1);
  const [puttCount, setPuttCount] = useState<number>(0);

  const currentCourse = currentGame ? courses.find(c => c.id === currentGame.courseId) : null;
  const currentHoleNumber = currentGame ? currentGame.scores.length + 1 : 1;
  const currentHole = currentCourse?.holes.find(h => h.number === currentHoleNumber);

  const handleStartNewGame = () => {
    if (courses.length === 0) {
      Alert.alert('No Courses', 'No golf courses available.');
      return;
    }

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

  const handleSaveScore = async () => {
    if (!currentGame || !currentHole) return;

    if (strokeCount < 1) {
      Alert.alert('Invalid Score', 'Strokes must be at least 1.');
      return;
    }

    try {
      await saveScore(currentHole.number, currentHole.par, strokeCount, puttCount || undefined);
      
      // Reset for next hole
      setStrokeCount(1);
      setPuttCount(0);
      setSelectedHole(null);

      Alert.alert(
        'Score Saved',
        `Hole ${currentHole.number}: ${strokeCount} strokes recorded.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save score. Please try again.');
    }
  };

  const getScoreColor = (strokes: number, par: number): string => {
    const diff = strokes - par;
    if (diff <= -2) return '#10B981'; // Eagle or better
    if (diff === -1) return '#059669'; // Birdie
    if (diff === 0) return '#6B7280';  // Par
    if (diff === 1) return '#F59E0B';  // Bogey
    return '#EF4444'; // Double bogey or worse
  };

  const getScoreText = (strokes: number, par: number): string => {
    const diff = strokes - par;
    if (diff <= -3) return 'Albatross';
    if (diff === -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double Bogey';
    if (diff === 3) return 'Triple Bogey';
    return `+${diff}`;
  };

  const calculateTotalScore = () => {
    if (!currentGame) return { totalStrokes: 0, totalPar: 0, scoreToPar: 0 };
    
    return {
      totalStrokes: currentGame.totalStrokes,
      totalPar: currentGame.totalPar,
      scoreToPar: currentGame.totalStrokes - currentGame.totalPar
    };
  };

  const { totalStrokes, totalPar, scoreToPar } = calculateTotalScore();

  if (!currentGame) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noGameContainer}>
          <ClipboardList size={64} color="#D1D5DB" />
          <Text style={styles.noGameTitle}>No Active Game</Text>
          <Text style={styles.noGameText}>
            Start a new game to begin tracking your scores on the digital scorecard.
          </Text>
          <TouchableOpacity style={styles.startGameButton} onPress={handleStartNewGame}>
            <Flag size={20} color="white" />
            <Text style={styles.startGameButtonText}>Start New Game</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scorecard</Text>
        <Text style={styles.headerSubtitle}>{currentGame.courseName}</Text>
        
        {/* Game Summary */}
        <View style={styles.gameSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Holes</Text>
            <Text style={styles.summaryValue}>{currentGame.scores.length}/18</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Score</Text>
            <Text style={[
              styles.summaryValue,
              { color: scoreToPar <= 0 ? '#059669' : '#DC2626' }
            ]}>
              {scoreToPar > 0 ? '+' : ''}{scoreToPar}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Strokes</Text>
            <Text style={styles.summaryValue}>{totalStrokes}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Hole */}
        {currentHole && currentGame.scores.length < 18 && (
          <View style={styles.currentHoleCard}>
            <View style={styles.currentHoleHeader}>
              <View style={styles.holeInfo}>
                <Text style={styles.currentHoleTitle}>Hole {currentHole.number}</Text>
                <Text style={styles.currentHolePar}>Par {currentHole.par} • {currentHole.distance}yd</Text>
              </View>
              <Target size={32} color="#059669" />
            </View>

            {/* Score Input */}
            <View style={styles.scoreInput}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Strokes</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity 
                    style={styles.counterButton}
                    onPress={() => setStrokeCount(Math.max(1, strokeCount - 1))}>
                    <Minus size={20} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{strokeCount}</Text>
                  <TouchableOpacity 
                    style={styles.counterButton}
                    onPress={() => setStrokeCount(strokeCount + 1)}>
                    <Plus size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Putts (Optional)</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity 
                    style={styles.counterButton}
                    onPress={() => setPuttCount(Math.max(0, puttCount - 1))}>
                    <Minus size={20} color="white" />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{puttCount}</Text>
                  <TouchableOpacity 
                    style={styles.counterButton}
                    onPress={() => setPuttCount(puttCount + 1)}>
                    <Plus size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Score Preview */}
            <View style={styles.scorePreview}>
              <Text style={styles.scorePreviewLabel}>Score:</Text>
              <Text style={[
                styles.scorePreviewValue,
                { color: getScoreColor(strokeCount, currentHole.par) }
              ]}>
                {getScoreText(strokeCount, currentHole.par)}
              </Text>
            </View>

            <TouchableOpacity style={styles.saveScoreButton} onPress={handleSaveScore}>
              <CheckCircle size={20} color="white" />
              <Text style={styles.saveScoreButtonText}>Save Score</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed Holes */}
        {currentGame.scores.length > 0 && (
          <View style={styles.completedHoles}>
            <Text style={styles.sectionTitle}>Completed Holes</Text>
            
            {currentGame.scores.map((score, index) => (
              <View key={index} style={styles.holeCard}>
                <View style={styles.holeCardHeader}>
                  <Text style={styles.holeNumber}>Hole {score.holeNumber}</Text>
                  <Text style={styles.holePar}>Par {score.par}</Text>
                </View>
                
                <View style={styles.holeCardStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Strokes</Text>
                    <Text style={[
                      styles.statValue,
                      { color: getScoreColor(score.strokes, score.par) }
                    ]}>
                      {score.strokes}
                    </Text>
                  </View>
                  
                  {score.putts && (
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Putts</Text>
                      <Text style={styles.statValue}>{score.putts}</Text>
                    </View>
                  )}
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Score</Text>
                    <Text style={[
                      styles.statValue,
                      { color: getScoreColor(score.strokes, score.par) }
                    ]}>
                      {getScoreText(score.strokes, score.par)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Game Complete */}
        {currentGame.scores.length === 18 && (
          <View style={styles.gameCompleteCard}>
            <CheckCircle size={48} color="#10B981" />
            <Text style={styles.gameCompleteTitle}>Round Complete!</Text>
            <Text style={styles.gameCompleteSubtitle}>
              Final Score: {scoreToPar > 0 ? '+' : ''}{scoreToPar}
            </Text>
            <Text style={styles.gameCompleteStrokes}>
              Total Strokes: {totalStrokes}
            </Text>
          </View>
        )}
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
    marginBottom: 16,
  },
  gameSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  noGameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noGameTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  noGameText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 24,
  },
  startGameButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  currentHoleCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentHoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  holeInfo: {
    flex: 1,
  },
  currentHoleTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  currentHolePar: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  scoreInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputSection: {
    flex: 1,
    marginHorizontal: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    backgroundColor: '#059669',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  scorePreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  scorePreviewLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
  },
  scorePreviewValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveScoreButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  saveScoreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedHoles: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  holeCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  holeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  holeNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  holePar: {
    fontSize: 14,
    color: '#6B7280',
  },
  holeCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameCompleteCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameCompleteTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
  },
  gameCompleteSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
    marginTop: 8,
  },
  gameCompleteStrokes: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
});