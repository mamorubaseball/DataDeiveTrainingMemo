import React from 'react';
import { StyleSheet, Text, View, Image, Platform } from 'react-native';
import { Dumbbell, Award, Flame, Trophy } from 'lucide-react-native';

interface SetInfo {
  weight: number;
  reps: number;
  isPr?: boolean;
}

interface ExerciseInfo {
  name: string;
  sets: SetInfo[];
}

interface ShareCardProps {
  dateStr: string;
  volume: number;
  exercises: ExerciseInfo[];
  photoUri?: string | null;
}

interface AggregatedSet {
  weight: number;
  reps: number;
  count: number;
  isPr?: boolean;
}

// Helper to aggregate identical sets (e.g. 75kg x 8 reps x 3 sets)
const aggregateSets = (sets: SetInfo[]): AggregatedSet[] => {
  const groups: { [key: string]: AggregatedSet } = {};
  sets.forEach(set => {
    const key = `${set.weight}-${set.reps}`;
    if (groups[key]) {
      groups[key].count += 1;
      if (set.isPr) groups[key].isPr = true;
    } else {
      groups[key] = {
        weight: set.weight,
        reps: set.reps,
        count: 1,
        isPr: set.isPr
      };
    }
  });
  return Object.values(groups);
};

// Helper to get formatted date string (e.g. 2025.06.27 FRI)
const formatShareDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr.replace(/-/g, '.');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayOfWeek = days[date.getDay()];
    return `${year}.${month}.${day} ${dayOfWeek}`;
  } catch {
    return dateStr.replace(/-/g, '.');
  }
};

export const ShareCard: React.FC<ShareCardProps> = ({ dateStr, volume, exercises, photoUri }) => {
  const formattedDate = formatShareDate(dateStr);

  // Find max records for each exercise (up to 3)
  const maxRecords = exercises.slice(0, 3).map(ex => {
    let maxW = 0;
    let maxR = 0;
    ex.sets.forEach(s => {
      if (s.weight > maxW || (s.weight === maxW && s.reps > maxR)) {
        maxW = s.weight;
        maxR = s.reps;
      }
    });
    return {
      name: ex.name,
      value: maxW > 0 ? `${maxW}kg` : `${maxR}回`
    };
  });

  const hasPhoto = !!photoUri;

  return (
    <View style={[styles.mainContainer, hasPhoto ? styles.containerWithPhoto : styles.containerNoPhoto]}>
      {/* Background Decorative Slash Accents */}
      <View style={styles.slashAccent1} />
      <View style={styles.slashAccent2} />
      <View style={styles.slashAccent3} />
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      {/* LEFT COLUMN: Photo (Only if photoUri is provided) */}
      {hasPhoto && (
        <View style={styles.leftColumn}>
          <Image source={{ uri: photoUri }} style={styles.bgPhoto} resizeMode="cover" />
          {/* Bottom Dark Gradient Shadow Overlay */}
          <View style={styles.photoOverlay} />
          {/* Motivating overlay text */}
          <View style={styles.photoTextContainer}>
            <Text style={styles.photoTextWhite}>限界を</Text>
            <Text style={styles.photoTextOrange}>超えろ。</Text>
          </View>
        </View>
      )}

      {/* RIGHT COLUMN: Workout log details */}
      <View style={[styles.rightColumn, hasPhoto ? styles.rightColumnWithPhoto : styles.rightColumnNoPhoto]}>
        {/* Header Section */}
        <View style={styles.headerRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.logTitle}>WORKOUT LOG</Text>
            <Text style={styles.logSubtitle}>今日のトレーニング</Text>
          </View>
        </View>

        {/* Workout Details list */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionHeader}>トレーニング内容</Text>
          <View style={styles.exercisesList}>
            {exercises.slice(0, 4).map((ex, idx) => {
              const aggregated = aggregateSets(ex.sets);
              return (
                <View key={idx} style={styles.exerciseRow}>
                  <View style={styles.exerciseNameRow}>
                    <Dumbbell size={16} color="#ff6b00" style={styles.iconMargin} />
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {ex.name}
                    </Text>
                  </View>
                  <View style={styles.setsList}>
                    {aggregated.map((set, sIdx) => (
                      <Text key={sIdx} style={styles.setText}>
                        <Text style={styles.highlightText}>{set.weight > 0 ? `${set.weight}kg` : '自重'}</Text>
                        {` × ${set.reps}回 × ${set.count}セット`}
                        {set.isPr && ' 🔥'}
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Highlight Summary (MAX records & Total volume) */}
        <View style={styles.summarySection}>
          {/* 本日のMAX記録 */}
          {maxRecords.length > 0 && (
            <View style={styles.maxRecordsBox}>
              <Text style={styles.maxBoxTitle}>本日のMAX記録</Text>
              <View style={styles.maxGrid}>
                {maxRecords.map((rec, idx) => (
                  <View key={idx} style={styles.maxItem}>
                    <Text style={styles.maxItemLabel} numberOfLines={1}>{rec.name} MAX</Text>
                    <View style={styles.maxItemValRow}>
                      <Trophy size={11} color="#ff6b00" style={styles.iconMarginTiny} />
                      <Text style={styles.maxItemValue}>{rec.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 総重量 (Total Volume) */}
          <View style={styles.volumeBox}>
            <Text style={styles.volumeLabel}>総重量</Text>
            <View style={styles.volumeValRow}>
              <Flame size={20} color="#ff6b00" style={styles.iconMargin} />
              <Text style={styles.volumeValue}>
                {volume.toLocaleString()} <Text style={styles.volumeUnit}>KG</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Footer branding */}
        <View style={styles.footerRow}>
          <Award size={12} color="#ff6b00" style={styles.iconMargin} />
          <Text style={styles.footerText}>DATA-DRIVEN TRAINING MEMO</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    height: 800,
    backgroundColor: '#050506',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.4)',
  },
  containerWithPhoto: {
    width: 800,
    flexDirection: 'row',
  },
  containerNoPhoto: {
    width: 800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Background Slash Accents
  slashAccent1: {
    position: 'absolute',
    top: 50,
    left: -100,
    width: 600,
    height: 15,
    backgroundColor: '#ff6b00',
    opacity: 0.12,
    transform: [{ rotate: '-35deg' }],
  },
  slashAccent2: {
    position: 'absolute',
    bottom: 120,
    right: -100,
    width: 700,
    height: 25,
    backgroundColor: '#ff6b00',
    opacity: 0.08,
    transform: [{ rotate: '-35deg' }],
  },
  slashAccent3: {
    position: 'absolute',
    top: 350,
    right: 150,
    width: 300,
    height: 8,
    backgroundColor: '#ff6b00',
    opacity: 0.05,
    transform: [{ rotate: '-35deg' }],
  },
  glowCircle1: {
    position: 'absolute',
    top: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -150,
    left: 200,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(255, 107, 0, 0.04)',
  },
  // Left Column (Photo)
  leftColumn: {
    width: 360,
    height: 800,
    backgroundColor: '#111',
    position: 'relative',
  },
  bgPhoto: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  photoTextContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
  },
  photoTextWhite: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    fontStyle: 'italic',
  },
  photoTextOrange: {
    color: '#ff6b00',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: -5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    fontStyle: 'italic',
  },
  // Right Column (Details)
  rightColumn: {
    height: 800,
    backgroundColor: 'rgba(12, 12, 14, 0.95)',
    justifyContent: 'space-between',
  },
  rightColumnWithPhoto: {
    width: 440,
    padding: 32,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(255, 107, 0, 0.3)',
  },
  rightColumnNoPhoto: {
    width: 800,
    padding: 50,
  },
  headerRow: {
    gap: 12,
  },
  dateText: {
    color: '#ff6b00',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  titleRow: {
    gap: 4,
  },
  logTitle: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1,
    lineHeight: 46,
  },
  logSubtitle: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '700',
  },
  contentSection: {
    marginVertical: 10,
  },
  sectionHeader: {
    color: '#ff6b00',
    fontSize: 13,
    fontWeight: '950',
    letterSpacing: 1.5,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,0,0.2)',
    paddingBottom: 4,
  },
  exercisesList: {
    gap: 18,
  },
  exerciseRow: {
    gap: 4,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  setsList: {
    paddingLeft: 24,
    gap: 2,
  },
  setText: {
    color: '#a0a0a5',
    fontSize: 13,
    fontWeight: '500',
  },
  highlightText: {
    color: '#ffaa66',
    fontWeight: 'bold',
  },
  // Summary boxes
  summarySection: {
    gap: 20,
  },
  maxRecordsBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.4)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 0, 0.04)',
    padding: 16,
  },
  maxBoxTitle: {
    color: '#ff6b00',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  maxGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  maxItem: {
    flex: 1,
  },
  maxItemLabel: {
    color: '#888888',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  maxItemValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maxItemValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  volumeBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  volumeLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  volumeValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  volumeUnit: {
    color: '#ff6b00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  footerText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  // Helpers
  iconMargin: {
    marginRight: 8,
  },
  iconMarginTiny: {
    marginRight: 4,
  },
  iconMarginRight: {
    marginRight: 8,
  },
});

export default ShareCard;
