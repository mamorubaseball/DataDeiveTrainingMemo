import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, FileText, Image as ImageIcon } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import { formatJapaneseDate, getWorkoutSummary } from '@/lib/workout';

export default function CompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { selectedDate, workoutLogs } = useWorkoutStore();
  const date = params.date || selectedDate;
  const summary = getWorkoutSummary(workoutLogs[date] || {});

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><ArrowLeft size={21} color="#ffffff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>トレーニング完了</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.checkRing}><Check size={38} color="#ff6b00" strokeWidth={2.2} /></View>
        <Text style={styles.title}>トレーニング完了！</Text>
        <Text style={styles.date}>{formatJapaneseDate(date)}</Text>

        <View style={styles.statsCard}>
          <View style={styles.stat}><Text style={styles.statValue}>{summary.exercises}</Text><Text style={styles.statLabel}>種目</Text></View>
          <View style={styles.divider} />
          <View style={styles.stat}><Text style={styles.statValue}>{summary.sets}</Text><Text style={styles.statLabel}>セット</Text></View>
          <View style={styles.divider} />
          <View style={styles.statWide}><Text style={styles.volume}>{summary.volume.toLocaleString()}</Text><Text style={styles.statLabel}>TOTAL kg</Text></View>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/memo', params: { date } } as any)}>
          <FileText size={19} color="#ffffff" />
          <Text style={styles.secondaryText}>メモを追加</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, styles.shareOutline]} onPress={() => router.push({ pathname: '/share', params: { date } } as any)}>
          <ImageIcon size={19} color="#ff6b00" />
          <Text style={styles.shareOutlineText}>SNS画像を作る</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
          <Text style={styles.homeButtonText}>ホームに戻る</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050707' },
  header: { height: 60, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111617', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 42 },
  checkRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#ff6b00', alignItems: 'center', justifyContent: 'center', marginBottom: 23, shadowColor: '#ff6b00', shadowOpacity: 0.35, shadowRadius: 18 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  date: { color: '#858c8e', fontSize: 12, marginBottom: 34 },
  statsCard: { width: '100%', minHeight: 112, borderRadius: 18, borderWidth: 1, borderColor: '#252b2d', backgroundColor: '#0e1314', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  stat: { width: 80, alignItems: 'center' },
  statWide: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 48, backgroundColor: '#282e30' },
  statValue: { color: '#ffffff', fontSize: 25, fontWeight: '900', marginBottom: 4 },
  volume: { color: '#ffffff', fontSize: 26, fontWeight: '900', marginBottom: 4 },
  statLabel: { color: '#777f81', fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  secondaryButton: { width: '100%', height: 54, borderRadius: 14, borderWidth: 1, borderColor: '#343b3d', backgroundColor: '#111617', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 10 },
  secondaryText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  shareOutline: { borderColor: '#ff6b00', backgroundColor: 'rgba(255,107,0,0.06)' },
  shareOutlineText: { color: '#ff7c26', fontSize: 14, fontWeight: '800' },
  homeButton: { width: '100%', height: 54, borderRadius: 14, backgroundColor: '#ff6b00', alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  homeButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
