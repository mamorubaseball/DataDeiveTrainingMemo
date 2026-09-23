import React, { useMemo } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { CalendarDays, ChevronRight, Dumbbell, Plus, Sparkles } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import { formatJapaneseDate, getTodayString, getWorkoutSummary } from '@/lib/workout';

LocaleConfig.locales.ja = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日',
};
LocaleConfig.defaultLocale = 'ja';

const today = getTodayString();

export default function HomeScreen() {
  const router = useRouter();
  const { workoutLogs, workoutNotes, setSelectedDate } = useWorkoutStore();

  const sortedDates = useMemo(
    () => Object.keys(workoutLogs)
      .filter((date) => Object.keys(workoutLogs[date] || {}).length > 0)
      .sort((a, b) => b.localeCompare(a)),
    [workoutLogs],
  );
  const mostRecentDate = sortedDates[0];
  const recentSummary = getWorkoutSummary(mostRecentDate ? workoutLogs[mostRecentDate] : {});
  const currentMonth = today.slice(0, 7);
  const monthlyCount = sortedDates.filter((date) => date.startsWith(currentMonth)).length;

  const markedDates = useMemo(() => {
    const dates = new Set([...Object.keys(workoutLogs), ...Object.keys(workoutNotes)]);
    return Array.from(dates).reduce<Record<string, any>>((result, date) => {
      const hasWorkout = Object.keys(workoutLogs[date] || {}).length > 0;
      const hasMemo = Boolean(workoutNotes[date]?.trim());
      if (!hasWorkout && !hasMemo) return result;
      result[date] = {
        marked: hasMemo,
        dotColor: '#a855f7',
        customStyles: hasWorkout ? {
          container: {
            backgroundColor: date === today ? '#ff6b00' : 'rgba(255, 107, 0, 0.16)',
            borderWidth: date === today ? 0 : 1,
            borderColor: '#ff6b00',
            borderRadius: 16,
          },
          text: { color: '#ffffff', fontWeight: '800' },
        } : undefined,
      };
      return result;
    }, {});
  }, [workoutLogs, workoutNotes]);

  const startWorkout = () => {
    setSelectedDate(today);
    router.push('/workout/record');
  };

  const openDate = (date: string) => {
    setSelectedDate(date);
    const hasWorkout = Object.keys(workoutLogs[date] || {}).length > 0;
    const hasMemo = Boolean(workoutNotes[date]?.trim());
    if (hasWorkout) {
      router.push({ pathname: '/workout/detail', params: { date } });
    } else if (hasMemo) {
      router.push({ pathname: '/memo', params: { date } } as any);
    } else {
      Alert.alert('この日の記録', 'まだ記録がありません。メモまたはトレーニングを追加できます。', [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'メモ', onPress: () => router.push({ pathname: '/memo', params: { date } } as any) },
        { text: 'トレーニング', onPress: () => router.push('/workout/record') },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.logoBars}>
                {[10, 20, 28, 17].map((height, index) => (
                  <View key={height + index} style={[styles.logoBar, { height }]} />
                ))}
              </View>
              <Text style={styles.brand}>DataLift</Text>
            </View>
            <Text style={styles.tagline}>記録が、習慣をつくる。</Text>
          </View>
          <TouchableOpacity style={styles.aiButton} onPress={() => router.push('/ai')}>
            <Sparkles size={18} color="#ff6b00" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeading}>
            <View>
              <Text style={styles.eyebrow}>TRAINING CALENDAR</Text>
              <Text style={styles.calendarTitle}>今月の記録</Text>
            </View>
            <CalendarDays size={20} color="#ff6b00" />
          </View>
          <Calendar
            markingType="custom"
            markedDates={markedDates}
            onDayPress={(day) => openDate(day.dateString)}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#777d7f',
              selectedDayBackgroundColor: '#ff6b00',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ff6b00',
              dayTextColor: '#edf0f0',
              textDisabledColor: '#303638',
              arrowColor: '#ff6b00',
              monthTextColor: '#ffffff',
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '700',
            }}
          />
          <View style={styles.monthlyRow}>
            <View style={styles.monthlyIcon}><Dumbbell size={20} color="#ff6b00" /></View>
            <View style={styles.monthlyCopy}>
              <Text style={styles.monthlyLabel}>今月のジム回数</Text>
              <Text style={styles.monthlyValue}>{monthlyCount}<Text style={styles.monthlyUnit}> 回</Text></Text>
            </View>
            <Text style={styles.daysText}>/ {new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate()} days</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.82} onPress={startWorkout}>
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.primaryButtonText}>トレーニングを記録する</Text>
        </TouchableOpacity>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>最近の記録</Text>
          {mostRecentDate ? (
            <TouchableOpacity onPress={() => openDate(mostRecentDate)}><Text style={styles.sectionLink}>見る</Text></TouchableOpacity>
          ) : null}
        </View>

        {mostRecentDate ? (
          <TouchableOpacity style={styles.recentCard} activeOpacity={0.8} onPress={() => openDate(mostRecentDate)}>
            <View style={styles.recentDateBlock}>
              <Text style={styles.recentDay}>{Number(mostRecentDate.slice(8, 10))}</Text>
              <Text style={styles.recentMonth}>{Number(mostRecentDate.slice(5, 7))}月</Text>
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle} numberOfLines={1}>{Object.keys(workoutLogs[mostRecentDate]).join('・')}</Text>
              <Text style={styles.recentMeta}>{recentSummary.exercises}種目　{recentSummary.sets}セット</Text>
              <Text style={styles.recentVolume}>{recentSummary.volume.toLocaleString()} kg</Text>
            </View>
            <ChevronRight size={20} color="#6d7476" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>最初の記録を残しましょう</Text>
            <Text style={styles.emptyText}>{formatJapaneseDate(today)} の記録はまだありません。</Text>
          </View>
        )}

        <Text style={styles.quickHint}>下の「＋」からメモやSNS画像もすぐに作れます</Text>
        <View style={{ height: 104 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050707' },
  content: { paddingHorizontal: 18, paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoBars: { height: 30, width: 31, flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginRight: 9 },
  logoBar: { width: 5, borderRadius: 2, backgroundColor: '#ff6b00' },
  brand: { color: '#ffffff', fontSize: 23, fontWeight: '900', letterSpacing: -0.8 },
  tagline: { color: '#717779', fontSize: 11, letterSpacing: 2.2, marginTop: 3 },
  aiButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#252b2d', backgroundColor: '#101415', alignItems: 'center', justifyContent: 'center' },
  calendarCard: { borderRadius: 20, borderWidth: 1, borderColor: '#222829', backgroundColor: '#0d1112', padding: 14 },
  calendarHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, marginBottom: 4 },
  eyebrow: { color: '#ff6b00', fontSize: 9, fontWeight: '800', letterSpacing: 1.7, marginBottom: 3 },
  calendarTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  monthlyRow: { borderTopWidth: 1, borderTopColor: '#222829', flexDirection: 'row', alignItems: 'center', paddingTop: 13, marginTop: 3 },
  monthlyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,107,0,0.10)', alignItems: 'center', justifyContent: 'center' },
  monthlyCopy: { flex: 1, marginLeft: 11 },
  monthlyLabel: { color: '#7d8385', fontSize: 11, marginBottom: 1 },
  monthlyValue: { color: '#ffffff', fontSize: 23, fontWeight: '900' },
  monthlyUnit: { fontSize: 11, fontWeight: '600', color: '#9aa0a2' },
  daysText: { color: '#62686a', fontSize: 11 },
  primaryButton: { height: 54, borderRadius: 14, backgroundColor: '#ff6b00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 13, shadowColor: '#ff6b00', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 11 },
  sectionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  sectionLink: { color: '#ff6b00', fontSize: 12, fontWeight: '700' },
  recentCard: { minHeight: 100, borderRadius: 17, borderWidth: 1, borderColor: '#222829', backgroundColor: '#0d1112', flexDirection: 'row', alignItems: 'center', padding: 13 },
  recentDateBlock: { width: 56, height: 68, borderRadius: 13, backgroundColor: '#151a1b', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  recentDay: { color: '#ffffff', fontSize: 23, fontWeight: '900', lineHeight: 25 },
  recentMonth: { color: '#ff6b00', fontSize: 10, fontWeight: '800' },
  recentInfo: { flex: 1 },
  recentTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginBottom: 5 },
  recentMeta: { color: '#7d8385', fontSize: 11, marginBottom: 4 },
  recentVolume: { color: '#ff8a3d', fontSize: 14, fontWeight: '900' },
  emptyCard: { borderRadius: 17, borderWidth: 1, borderColor: '#222829', backgroundColor: '#0d1112', padding: 18 },
  emptyTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginBottom: 5 },
  emptyText: { color: '#747b7d', fontSize: 12 },
  quickHint: { color: '#5e6567', fontSize: 11, textAlign: 'center', marginTop: 18 },
});
