import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { Dumbbell, Heart, Clock, Flame, Brain, ChevronRight, PlusCircle } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import GlassCard from '@/components/ui/GlassCard';

LocaleConfig.locales['ja'] = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'ja';

const screenWidth = Dimensions.get('window').width;

const INTENSITY_COLORS = {
  high: '#ff5500',
  medium: '#ff8833',
  low: '#ffbb88',
};

export default function HomeScreen() {
  const router = useRouter();
  const { workoutLogs, getPersonalRecord } = useWorkoutStore();

  // Find the most recent date with workouts
  const sortedDates = Object.keys(workoutLogs).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  const mostRecentDate = sortedDates[0];
  const recentWorkouts = mostRecentDate ? workoutLogs[mostRecentDate] : null;

  // Dynamically calculate marked dates based on Zustand workout logs
  const markedDates = Object.keys(workoutLogs).reduce((acc: any, date) => {
    const exercises = workoutLogs[date];
    const exerciseNames = Object.keys(exercises);
    
    if (exerciseNames.length > 0) {
      // Calculate total sets to determine color intensity
      let totalSets = 0;
      let isPrDay = false;
      
      exerciseNames.forEach((exName) => {
        const sets = exercises[exName];
        totalSets += sets.length;

        // Get max stats on this day
        let dayMaxWeight = 0;
        let dayMaxReps = 0;
        sets.forEach(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          if (w > dayMaxWeight || (w === dayMaxWeight && r > dayMaxReps)) {
            dayMaxWeight = w;
            dayMaxReps = r;
          }
        });

        if (dayMaxWeight > 0 && dayMaxReps > 0) {
          // Check if it was a PR compared to historical data before this day
          const pr = getPersonalRecord(exName, date);
          if (!pr) {
            isPrDay = true;
          } else {
            if (dayMaxWeight > pr.weight) {
              isPrDay = true;
            } else if (dayMaxWeight === pr.weight && dayMaxReps > pr.reps) {
              isPrDay = true;
            }
          }
        }
      });

      let intensityColor = INTENSITY_COLORS.low;
      let textColor = '#121212';
      
      if (totalSets >= 6) {
        intensityColor = INTENSITY_COLORS.high;
        textColor = '#ffffff';
      } else if (totalSets >= 3) {
        intensityColor = INTENSITY_COLORS.medium;
        textColor = '#ffffff';
      }

      acc[date] = {
        customStyles: {
          container: {
            backgroundColor: intensityColor,
            borderRadius: 10,
            shadowColor: intensityColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
            // Draw gold border if PR achieved
            ...(isPrDay ? {
              borderWidth: 2,
              borderColor: '#ffd700',
            } : {}),
          },
          text: { color: textColor, fontWeight: 'bold' }
        }
      };
    }
    return acc;
  }, {});

  // Extract Bench Press progress data
  const getProgressData = (exerciseName: string) => {
    const data: { date: string, weight: number }[] = [];
    Object.keys(workoutLogs).forEach(date => {
      const logs = workoutLogs[date];
      if (logs && logs[exerciseName]) {
        let maxW = 0;
        logs[exerciseName].forEach(s => {
          const w = parseFloat(s.weight) || 0;
          if (w > maxW) maxW = w;
        });
        if (maxW > 0) {
          data.push({ date, weight: maxW });
        }
      }
    });
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const rawProgress = getProgressData('ベンチプレス');
  const chartPoints = rawProgress.length >= 3 ? rawProgress : [
    { date: '06/20', weight: 70 },
    { date: '06/25', weight: 72.5 },
    { date: '06/30', weight: 72.5 },
    { date: '07/04', weight: 75 },
  ];

  const chartWidth = screenWidth - 72;
  const chartHeight = 110;
  const chartPadding = 20;

  const weights = chartPoints.map(p => p.weight);
  const maxW = Math.max(...weights) + 5;
  const minW = Math.max(0, Math.min(...weights) - 10);
  const rangeY = maxW - minW || 10;

  const points = chartPoints.map((p, index) => {
    const x = chartPadding + (index * (chartWidth - chartPadding * 2)) / (chartPoints.length - 1);
    const y = chartHeight - chartPadding - ((p.weight - minW) * (chartHeight - chartPadding * 2)) / rangeY;
    return { x, y, ...p };
  });

  const lineD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${lineD} L ${points[points.length - 1].x} ${chartHeight - chartPadding} L ${points[0].x} ${chartHeight - chartPadding} Z`
    : '';

  const handleDayPress = (day: any) => {
    // Only allow navigation if there is a workout log for that date
    const dateLogs = workoutLogs[day.dateString];
    if (dateLogs && Object.keys(dateLogs).length > 0) {
      router.push({
        pathname: '/workout/detail',
        params: { date: day.dateString }
      });
    } else {
      Alert.alert(
        '記録なし',
        `${day.dateString.replace(/-/g, '/')} のトレーニング記録はありません。`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>DATA-DRIVEN</Text>
          <Text style={styles.appName}>TRAINING MEMO</Text>
        </View>

        {/* Calendar Card */}
        <GlassCard style={styles.calendarCard}>
          <Text style={styles.sectionTitle}>トレーニング履歴</Text>
          <Calendar
            markingType={'custom'}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#888888',
              selectedDayBackgroundColor: '#ff6b00',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#ff6b00',
              dayTextColor: '#ffffff',
              textDisabledColor: '#333333',
              arrowColor: '#ff6b00',
              monthTextColor: '#ffffff',
              textDayFontWeight: '600',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: 'bold',
            }}
          />
          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: INTENSITY_COLORS.high }]} />
              <Text style={styles.legendText}>高強度</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: INTENSITY_COLORS.medium }]} />
              <Text style={styles.legendText}>中強度</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: INTENSITY_COLORS.low }]} />
              <Text style={styles.legendText}>低強度</Text>
            </View>
          </View>
        </GlassCard>

        {/* 記録を開始するボタン (カレンダーの真下) */}
        <TouchableOpacity
          style={styles.recordButton}
          activeOpacity={0.8}
          onPress={() => router.push('/workout/record')}
        >
          <PlusCircle size={20} color="#ffffff" />
          <Text style={styles.recordButtonText}>トレーニングを記録する</Text>
        </TouchableOpacity>

        {/* 直近のトレーニング記録 */}
        <Text style={styles.sectionHeader}>直近のトレーニング記録</Text>
        {recentWorkouts && Object.keys(recentWorkouts).length > 0 ? (
          <GlassCard style={styles.recentWorkoutCard}>
            <View style={styles.recentWorkoutHeader}>
              <Dumbbell size={18} color="#ff6b00" />
              <Text style={styles.recentWorkoutDate}>
                {mostRecentDate.replace(/-/g, '/')} の記録
              </Text>
            </View>
            <View style={styles.recentWorkoutList}>
              {Object.keys(recentWorkouts).map((exerciseName) => {
                const sets = recentWorkouts[exerciseName];
                return (
                  <View key={exerciseName} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>{exerciseName}</Text>
                    <Text style={styles.setsSummary}>
                      {sets.map((set, idx) => `${set.weight}kg x ${set.reps}回`).join(' / ')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.emptyRecentCard}>
            <Text style={styles.emptyText}>最近のトレーニング記録はありません。</Text>
          </GlassCard>
        )}

        {/* ベンチプレス推移ウィジェット */}
        <Text style={styles.sectionHeader}>トレーニング推移</Text>
        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartCardTitle}>ベンチプレス MAX重量推移</Text>
              <Text style={styles.chartCardSub}>直近の成長トレンド</Text>
            </View>
            <Text style={styles.chartHighlight}>
              {chartPoints[chartPoints.length - 1]?.weight} kg
            </Text>
          </View>
          
          <View style={{ height: chartHeight, width: chartWidth, marginVertical: 10 }}>
            <Svg height={chartHeight} width={chartWidth}>
              <Defs>
                <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#ff6b00" stopOpacity="0.4" />
                  <Stop offset="100%" stopColor="#ff6b00" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>
              
              {/* Grid Lines */}
              <Path d={`M 0 ${chartHeight / 2} L ${chartWidth} ${chartHeight / 2}`} stroke="rgba(255,255,255,0.04)" />
              
              {/* Gradient Area */}
              {areaD ? <Path d={areaD} fill="url(#chartGrad)" /> : null}
              
              {/* Line */}
              {lineD ? <Path d={lineD} fill="none" stroke="#ff6b00" strokeWidth="3" /> : null}
              
              {/* Dots */}
              {points.map((p, idx) => (
                <G key={idx}>
                  <Circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#ff6b00" strokeWidth="2.5" />
                  {idx === points.length - 1 && (
                    <Circle cx={p.x} cy={p.y} r="8" fill="transparent" stroke="#ff6b00" strokeWidth="1.5" />
                  )}
                </G>
              ))}
            </Svg>
          </View>
          <View style={styles.chartLabels}>
            {chartPoints.map((p, idx) => (
              <Text key={idx} style={styles.labelText}>
                {p.date.includes('-') ? p.date.substring(5).replace('-', '/') : p.date}
              </Text>
            ))}
          </View>
        </GlassCard>

        {/* AI Insight Card */}
        <Text style={styles.sectionHeader}>AI分析インサイト</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/ai')}>
          <GlassCard style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <Brain size={24} color="#ff6b00" />
              <Text style={styles.aiCardTitle}>AIアドバイザー</Text>
            </View>
            <Text style={styles.aiCardContent}>
              胸のボリュームが先週より12%増加しました。ベンチプレスの伸びが順調です。次のトレーニングではセット間インターバルを少し長めに取り、強度の維持を狙いましょう。
            </Text>
            <View style={styles.aiCardFooter}>
              <Text style={styles.aiActionText}>詳しくアドバイスを聞く</Text>
              <ChevronRight size={16} color="#ff6b00" />
            </View>
          </GlassCard>
        </TouchableOpacity>
        
        {/* Margin for TabBar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  greeting: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  appName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  calendarCard: {
    marginBottom: 20,
    paddingBottom: 15,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#888888',
    fontSize: 12,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff6b00',
    borderRadius: 18,
    height: 54,
    marginBottom: 24,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  recordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recentWorkoutCard: {
    marginBottom: 24,
    padding: 16,
  },
  recentWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  recentWorkoutDate: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recentWorkoutList: {
    gap: 12,
  },
  exerciseItem: {
    flexDirection: 'column',
    gap: 4,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  setsSummary: {
    color: '#ff6b00',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyRecentCard: {
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
  },
  aiCard: {
    marginBottom: 24,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b00',
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  aiCardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiCardContent: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  aiCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  aiActionText: {
    color: '#ff6b00',
    fontSize: 13,
    fontWeight: '600',
  },
  chartCard: {
    marginBottom: 24,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  chartCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  chartCardSub: {
    color: '#555555',
    fontSize: 11,
    marginTop: 2,
  },
  chartHighlight: {
    color: '#ff6b00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 6,
  },
  labelText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
