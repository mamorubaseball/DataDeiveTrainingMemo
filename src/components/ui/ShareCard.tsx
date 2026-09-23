import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ShareSet {
  weight: number;
  reps: number;
  isPr?: boolean;
}

interface ShareExercise {
  name: string;
  sets: ShareSet[];
}

interface ShareCardProps {
  dateStr: string;
  volume: number;
  exercises: ShareExercise[];
  photoUri?: string | null;
  width?: number;
  variant?: 'focus' | 'minimal';
}

const weekdayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const ShareCard: React.FC<ShareCardProps> = ({
  dateStr,
  volume,
  exercises,
  photoUri,
  width = 1080,
  variant = 'focus',
}) => {
  const scale = width / 1080;
  const height = width * 4 / 3;
  const [year, month, day] = dateStr.split('-').map(Number);
  const weekday = weekdayNames[new Date(year, month - 1, day).getDay()] || '';
  const dateLabel = `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}  ${weekday}`;
  const shownExercises = exercises.slice(0, 4);

  return (
    <View style={[styles.card, { width, height }]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]}>
          <View style={[styles.fallbackCircle, { width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45, right: -width * 0.25, top: height * 0.2 }]} />
          <View style={[styles.fallbackLine, { width: width * 1.2, height: 12 * scale, top: height * 0.56, left: -width * 0.1 }]} />
        </View>
      )}

      <View style={[styles.leftShade, { width: width * (variant === 'focus' ? 0.64 : 0.53) }]} />
      <View style={[styles.bottomShade, { height: height * 0.25 }]} />
      <View style={[styles.topShade, { height: height * 0.16 }]} />

      <View style={[styles.content, { paddingHorizontal: 54 * scale, paddingTop: 56 * scale, paddingBottom: 46 * scale }]}>
        <View>
          <Text style={[styles.date, { fontSize: 24 * scale, letterSpacing: 7 * scale }]}>{dateLabel}</Text>
          <View style={[styles.orangeRule, { width: 105 * scale, height: 4 * scale, marginTop: 20 * scale, marginBottom: 66 * scale }]} />

          <View style={{ width: width * 0.47 }}>
            {shownExercises.map((exercise) => {
              const best = exercise.sets.reduce<ShareSet | null>((current, set) => {
                if (!current) return set;
                return set.weight > current.weight || (set.weight === current.weight && set.reps > current.reps) ? set : current;
              }, null);
              return (
                <View key={exercise.name} style={[styles.exerciseRow, { paddingBottom: 19 * scale, marginBottom: 18 * scale, borderBottomWidth: Math.max(1, scale) }]}>
                  <Text numberOfLines={1} style={[styles.exerciseName, { fontSize: 24 * scale, maxWidth: width * 0.3 }]}>{exercise.name}</Text>
                  <Text style={[styles.exerciseSet, { fontSize: 23 * scale }]}>{best ? `${best.weight > 0 ? `${best.weight}kg` : 'BW'} × ${best.reps}` : '—'}</Text>
                </View>
              );
            })}
          </View>

          <View style={{ marginTop: 32 * scale }}>
            <Text style={[styles.volumeLabel, { fontSize: 18 * scale, letterSpacing: 5 * scale }]}>TOTAL VOLUME</Text>
            <Text style={[styles.volume, { fontSize: 64 * scale, marginTop: 7 * scale }]}>
              {Math.round(volume).toLocaleString()}<Text style={[styles.volumeUnit, { fontSize: 31 * scale }]}> kg</Text>
            </Text>
          </View>
        </View>

        <View style={styles.brandWrap}>
          <View style={styles.brandRow}>
            <View style={[styles.logoBars, { width: 48 * scale, height: 50 * scale, gap: 4 * scale, marginRight: 13 * scale }]}>
              {[20, 37, 49, 29].map((barHeight, index) => (
                <View key={barHeight + index} style={{ width: 8 * scale, height: barHeight * scale, borderRadius: 2 * scale, backgroundColor: '#ff6b00' }} />
              ))}
            </View>
            <Text style={[styles.brand, { fontSize: 38 * scale }]}>DataLift</Text>
            <View style={[styles.brandDivider, { height: 42 * scale, marginLeft: 18 * scale }]} />
          </View>
          <Text style={[styles.slogan, { fontSize: 15 * scale, letterSpacing: 7 * scale, marginTop: 17 * scale }]}>LIFT YOUR LIFE.</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { overflow: 'hidden', backgroundColor: '#080a0a' },
  fallback: { backgroundColor: '#111516' },
  fallbackCircle: { position: 'absolute', backgroundColor: '#202526', borderWidth: 2, borderColor: '#303637' },
  fallbackLine: { position: 'absolute', backgroundColor: 'rgba(255,107,0,0.18)', transform: [{ rotate: '-19deg' }] },
  leftShade: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.70)' },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.64)' },
  topShade: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: 'rgba(0,0,0,0.30)' },
  content: { flex: 1, justifyContent: 'space-between' },
  date: { color: '#ffffff', fontWeight: '400' },
  orangeRule: { backgroundColor: '#ff6b00' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomColor: 'rgba(255,255,255,0.55)' },
  exerciseName: { color: '#ffffff', fontWeight: '700' },
  exerciseSet: { color: '#ffffff', fontWeight: '500' },
  volumeLabel: { color: '#d8dcdc', fontWeight: '500' },
  volume: { color: '#ffffff', fontWeight: '900', letterSpacing: -2 },
  volumeUnit: { color: '#ffffff', fontWeight: '500' },
  brandWrap: { alignSelf: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoBars: { flexDirection: 'row', alignItems: 'flex-end' },
  brand: { color: '#ffffff', fontWeight: '900', letterSpacing: -1 },
  brandDivider: { width: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  slogan: { color: '#f0f2f2', fontWeight: '400' },
});

export default ShareCard;
