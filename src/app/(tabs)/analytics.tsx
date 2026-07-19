import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { Search, TrendingUp, BarChart2, PieChart, Sparkles } from 'lucide-react-native';
import GlassCard from '@/components/ui/GlassCard';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useWorkoutStore } from '@/stores/workoutStore';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 72;

export default function AnalyticsScreen() {
  const { workoutLogs, profile } = useWorkoutStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('ベンチプレス');

  const majorExercises = ['ベンチプレス', 'ダンベルプレス', 'スクワット', 'デッドリフト'];

  const exerciseParams: {
    [exercise: string]: {
      male: { mean: number; stdDev: number; start: number; end: number };
      female: { mean: number; stdDev: number; start: number; end: number };
    };
  } = {
    'ベンチプレス': {
      male: { mean: 75, stdDev: 15, start: 30, end: 120 },
      female: { mean: 40, stdDev: 8, start: 15, end: 65 },
    },
    'ダンベルプレス': {
      male: { mean: 25, stdDev: 5, start: 10, end: 40 },
      female: { mean: 12, stdDev: 3, start: 5, end: 20 },
    },
    'スクワット': {
      male: { mean: 100, stdDev: 20, start: 40, end: 160 },
      female: { mean: 60, stdDev: 12, start: 25, end: 100 },
    },
    'デッドリフト': {
      male: { mean: 120, stdDev: 25, start: 50, end: 200 },
      female: { mean: 70, stdDev: 15, start: 30, end: 115 },
    },
  };

  const gender = profile?.gender || 'male';
  const params = exerciseParams[selectedExercise] || exerciseParams['ベンチプレス'][gender];
  const activeParams = params[gender];

  const mean = activeParams.mean;
  const stdDev = activeParams.stdDev;
  const startX = activeParams.start;
  const endX = activeParams.end;

  // 1. Calculate Real User Max 1RM using O'Conner Formula
  const getExerciseMax1RM = (exerciseName: string) => {
    let max1RM = 0;
    let found = false;
    Object.keys(workoutLogs).forEach(date => {
      const logs = workoutLogs[date];
      if (logs && logs[exerciseName]) {
        logs[exerciseName].forEach(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          const oneRM = w * (1 + 0.025 * r);
          if (oneRM > max1RM) {
            max1RM = oneRM;
            found = true;
          }
        });
      }
    });
    return found ? Math.round(max1RM) : null;
  };

  const user1RM = getExerciseMax1RM(selectedExercise);

  // Deviation (T-Score) & Percentile calculations
  const zScore = user1RM !== null ? (user1RM - mean) / stdDev : 0;
  const tScore = Math.round((50 + 10 * zScore) * 10) / 10;

  const getPercentile = (x: number) => {
    const z = (x - mean) / stdDev;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let p = 1 - d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z < 0) p = 1 - p;
    return Math.round((1 - p) * 100);
  };
  const percentile = user1RM !== null ? getPercentile(user1RM) : 100;

  // Bell Curve SVG points
  const bellPoints = [];
  const numSteps = 40;
  const pdf = (x: number) => {
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
  };
  const maxPdf = pdf(mean);

  for (let i = 0; i <= numSteps; i++) {
    const xVal = startX + (i * (endX - startX)) / numSteps;
    const yVal = pdf(xVal);
    const xCoord = 20 + (i * (chartWidth - 40)) / numSteps;
    const yCoord = 110 - (yVal / maxPdf) * 80;
    bellPoints.push({ x: xCoord, y: yCoord });
  }

  const bellPathD = bellPoints.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const bellAreaD = bellPoints.length > 0
    ? `${bellPathD} L ${bellPoints[bellPoints.length - 1].x} 110 L ${bellPoints[0].x} 110 Z`
    : '';

  const userX = user1RM !== null ? 20 + ((user1RM - startX) * (chartWidth - 40)) / (endX - startX) : 0;
  const userY = user1RM !== null ? 110 - (pdf(user1RM) / maxPdf) * 80 : 0;

  // 2. Real Category Volumes Aggregator (胸, 背中, 脚, その他)
  const getCategoryVolumes = () => {
    const volumes = { '胸': 0, '背中': 0, '脚': 0, 'その他': 0 };
    let total = 0;

    Object.keys(workoutLogs).forEach(date => {
      const dayLogs = workoutLogs[date];
      if (!dayLogs) return;

      Object.keys(dayLogs).forEach(exName => {
        const sets = dayLogs[exName];
        if (!sets) return;

        let cat: '胸' | '背中' | '脚' | 'その他' = 'その他';
        const nameLower = exName.toLowerCase();
        if (['ベンチ', 'インクライン', 'ダンベルプレス', 'フライ', '胸', 'チェスト'].some(k => nameLower.includes(k))) {
          cat = '胸';
        } else if (['デッドリフト', 'ラットプル', 'ローイング', '背中', 'ベントオーバー', '懸垂'].some(k => nameLower.includes(k))) {
          cat = '背中';
        } else if (['スクワット', 'レッグプレス', 'レッグカール', 'レッグエクステンション', '脚'].some(k => nameLower.includes(k))) {
          cat = '脚';
        }

        sets.forEach(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          const vol = w * r;
          volumes[cat] += vol;
          total += vol;
        });
      });
    });

    return { volumes, total };
  };

  const { volumes: catVolumes, total: totalVol } = getCategoryVolumes();
  const hasLogs = totalVol > 0;
  const chestPct = hasLogs ? Math.round((catVolumes['胸'] / totalVol) * 100) : 45;
  const backPct = hasLogs ? Math.round((catVolumes['背中'] / totalVol) * 100) : 30;
  const legsPct = hasLogs ? Math.round((catVolumes['脚'] / totalVol) * 100) : 25;
  const otherPct = hasLogs ? (100 - chestPct - backPct - legsPct) : 0;

  // 3. Search Aggregations for Estimated 1RM Trend
  const getSearchedExercise = () => {
    const q = searchQuery.toLowerCase();
    if (q.includes('デッド')) return 'デッドリフト';
    if (q.includes('スクワット')) return 'スクワット';
    if (q.includes('ダンベル')) return 'ダンベルプレス';
    if (q.includes('ラットプル')) return 'ラットプルダウン';
    return 'ベンチプレス';
  };

  const searchedEx = getSearchedExercise();

  const getExerciseHistory = (exName: string) => {
    const history: { date: string; displayDate: string; oneRM: number }[] = [];
    Object.keys(workoutLogs).forEach(date => {
      const dayLogs = workoutLogs[date];
      if (dayLogs && dayLogs[exName]) {
        let max1RM = 0;
        dayLogs[exName].forEach(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          const oneRM = w * (1 + 0.025 * r);
          if (oneRM > max1RM) max1RM = oneRM;
        });
        if (max1RM > 0) {
          const dParts = date.split('-');
          history.push({ 
            date, 
            displayDate: `${parseInt(dParts[1])}/${parseInt(dParts[2])}`, 
            oneRM: Math.round(max1RM) 
          });
        }
      }
    });
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const historyPoints = getExerciseHistory(searchedEx);

  // 4. Weekly Training Volume Aggregator (Last 5 Weeks)
  const getWeeklyVolumes = () => {
    const weeklyVols = [0, 0, 0, 0, 0];
    const now = new Date();
    
    Object.keys(workoutLogs).forEach(dateStr => {
      const date = new Date(dateStr);
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let weekIdx = -1;
      if (diffDays >= 0 && diffDays < 7) weekIdx = 4;
      else if (diffDays >= 7 && diffDays < 14) weekIdx = 3;
      else if (diffDays >= 14 && diffDays < 21) weekIdx = 2;
      else if (diffDays >= 21 && diffDays < 28) weekIdx = 1;
      else if (diffDays >= 28 && diffDays < 35) weekIdx = 0;
      
      if (weekIdx !== -1) {
        const dayLogs = workoutLogs[dateStr] || {};
        Object.keys(dayLogs).forEach(exName => {
          dayLogs[exName].forEach(s => {
            const w = parseFloat(s.weight) || 0;
            const r = parseInt(s.reps) || 0;
            weeklyVols[weekIdx] += w * r;
          });
        });
      }
    });
    return weeklyVols;
  };

  const weeklyVolumes = getWeeklyVolumes();
  const maxWeeklyVol = Math.max(...weeklyVolumes, 1000);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const handleRecentPress = (query: string) => {
    setSearchQuery(query);
    setShowResults(true);
  };

  const recentSearches = [
    'ベンチプレスの推移',
    'デッドリフト ボリューム推移',
    'スクワット 1RM推移',
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>分析・レポート</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#888888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="『ベンチプレスの推移』など自然言語で検索..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (!text.trim()) setShowResults(false);
          }}
          onSubmitEditing={handleSearch}
          autoCorrect={false}
        />
        {searchQuery.trim().length > 0 && (
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Sparkles size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!showResults ? (
          <>
            {/* Recent Searches / Suggestions */}
            <Text style={styles.sectionHeader}>最近の検索 / おすすめ</Text>
            <View style={styles.suggestionsList}>
              {recentSearches.map((search, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleRecentPress(search)}
                  style={styles.suggestionItemWrapper}
                >
                  <GlassCard style={styles.suggestionItem}>
                    <TrendingUp size={16} color="#ff6b00" style={{ marginRight: 10 }} />
                    <Text style={styles.suggestionText}>{search}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Insights */}
            <Text style={styles.sectionHeader}>クイックサマリー</Text>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <PieChart size={20} color="#ff6b00" />
                <Text style={styles.summaryTitle}>部位別ボリューム比率 (全期間)</Text>
              </View>
              
              <View style={styles.pieChartContainer}>
                <Svg height="140" width="140" viewBox="0 0 36 36">
                  {/* Segment 1: Chest (Orange) */}
                  <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#ff6b00" strokeWidth="4" strokeDasharray={`${chestPct} ${100 - chestPct}`} strokeDashoffset="25" />
                  {/* Segment 2: Back (Grey) */}
                  <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#555555" strokeWidth="4" strokeDasharray={`${backPct} ${100 - backPct}`} strokeDashoffset={25 - chestPct} />
                  {/* Segment 3: Legs (Light Orange) */}
                  <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#ffbb88" strokeWidth="4" strokeDasharray={`${legsPct} ${100 - legsPct}`} strokeDashoffset={25 - chestPct - backPct} />
                  {/* Segment 4: Others (Dark Grey) */}
                  {otherPct > 0 && (
                    <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#333333" strokeWidth="4" strokeDasharray={`${otherPct} ${100 - otherPct}`} strokeDashoffset={25 - chestPct - backPct - legsPct} />
                  )}
                </Svg>
                <View style={styles.pieLegend}>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#ff6b00' }]} />
                    <Text style={styles.legendLabel}>胸 ({chestPct}%)</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#555555' }]} />
                    <Text style={styles.legendLabel}>背中 ({backPct}%)</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#ffbb88' }]} />
                    <Text style={styles.legendLabel}>脚 ({legsPct}%)</Text>
                  </View>
                  {otherPct > 0 && (
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#333333' }]} />
                      <Text style={styles.legendLabel}>その他 ({otherPct}%)</Text>
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>

            {/* 体重別主要種目1RM分布グラフ */}
            <Text style={styles.sectionHeader}>体重別の相対位置 ({selectedExercise})</Text>
            
            {/* 種目選択タブ */}
            <View style={styles.exerciseTabContainer}>
              {majorExercises.map(ex => (
                <TouchableOpacity
                  key={ex}
                  style={[styles.exTab, selectedExercise === ex && styles.activeExTab]}
                  onPress={() => setSelectedExercise(ex)}
                >
                  <Text style={[styles.exTabText, selectedExercise === ex && styles.activeExTabText]}>
                    {ex === 'ダンベルプレス' ? 'ダンベル' : ex.replace('プレス', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Sparkles size={18} color="#ff6b00" />
                <Text style={styles.summaryTitle}>
                  同体重層（{gender === 'female' ? '女性' : '男性'}70kg級）の1RM分布
                </Text>
              </View>
              
              <View style={{ height: 130, width: chartWidth, marginVertical: 10 }}>
                <Svg height="130" width={chartWidth}>
                  <Defs>
                    <LinearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#ff6b00" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#ff6b00" stopOpacity="0.0" />
                    </LinearGradient>
                  </Defs>
                  
                  {/* Grid Lines */}
                  <Path d={`M 20 110 L ${chartWidth - 20} 110`} stroke="rgba(255,255,255,0.08)" />

                  {/* Bell curve area */}
                  {bellAreaD ? <Path d={bellAreaD} fill="url(#bellGrad)" /> : null}

                  {/* Bell curve stroke */}
                  {bellPathD ? <Path d={bellPathD} fill="none" stroke="rgba(255, 107, 0, 0.6)" strokeWidth="2" /> : null}

                  {/* User Plot Line & Dot */}
                  {user1RM !== null && user1RM >= startX && user1RM <= endX && (
                    <G>
                      {/* Vertical line to X axis */}
                      <Path d={`M ${userX} ${userY} L ${userX} 110`} stroke="#ff6b00" strokeWidth="1.5" strokeDasharray="3 3" />
                      {/* Plot dot */}
                      <Circle cx={userX} cy={userY} r="5" fill="#ffffff" stroke="#ff6b00" strokeWidth="2.5" />
                      {/* Label tooltip */}
                      <SvgText
                        x={userX > chartWidth / 2 ? userX - 165 : userX + 10}
                        y={userY - 10}
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        あなた: {user1RM}kg (偏差値:{tScore} / 上位{percentile}%)
                      </SvgText>
                    </G>
                  )}
                </Svg>
              </View>
              
              <View style={styles.chartLabels}>
                <Text style={styles.labelText}>{startX}kg (初心者)</Text>
                <Text style={styles.labelText}>{mean}kg (平均)</Text>
                <Text style={styles.labelText}>{endX}kg (上級)</Text>
              </View>

              {user1RM === null && (
                <View style={styles.noDataBanner}>
                  <Text style={styles.noDataBannerText}>
                    ※ {selectedExercise}の記録がまだありません。トレーニングを記録すると相対位置がここにプロットされます。
                  </Text>
                </View>
              )}
            </GlassCard>
          </>
        ) : (
          <>
            {/* Search Results */}
            <Text style={styles.sectionHeader}>『{searchQuery}』の分析結果</Text>

            {/* Result Chart 1: 1RM Trend */}
            <GlassCard style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.chartCardTitle}>{searchedEx} 推定1RM推移</Text>
                  <Text style={styles.chartCardSub}>
                    {historyPoints.length > 0 ? `直近 ${historyPoints.length} セッションの伸び` : '履歴データなし'}
                  </Text>
                </View>
                <Text style={styles.chartHighlight}>
                  {historyPoints.length > 0 ? `${historyPoints[historyPoints.length - 1].oneRM} kg` : '- kg'}
                </Text>
              </View>
              
              {historyPoints.length > 0 ? (
                <View style={{ height: 120, width: chartWidth }}>
                  <Svg height="120" width={chartWidth}>
                    {/* Grid Lines */}
                    <Path d={`M 20 30 L ${chartWidth - 20} 30`} stroke="rgba(255,255,255,0.05)" />
                    <Path d={`M 20 70 L ${chartWidth - 20} 70`} stroke="rgba(255,255,255,0.05)" />
                    <Path d={`M 20 100 L ${chartWidth - 20} 100`} stroke="rgba(255,255,255,0.05)" />
                    
                    {historyPoints.length === 1 ? (
                      <G>
                        <Circle cx={chartWidth / 2} cy={60} r="5" fill="#ffffff" stroke="#ff6b00" strokeWidth="2.5" />
                        <SvgText x={chartWidth / 2} y={45} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                          {historyPoints[0].oneRM} kg
                        </SvgText>
                      </G>
                    ) : (
                      <G>
                        {/* Draw Line */}
                        <Path
                          d={historyPoints.reduce((acc, p, idx) => {
                            const minRM = Math.max(0, Math.min(...historyPoints.map(pt => pt.oneRM)) - 10);
                            const maxRM = Math.max(...historyPoints.map(pt => pt.oneRM)) + 10;
                            const range = maxRM - minRM || 1;
                            const x = 20 + (idx * (chartWidth - 40)) / (historyPoints.length - 1);
                            const y = 90 - ((p.oneRM - minRM) / range) * 60;
                            return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                          }, '')}
                          fill="none"
                          stroke="#ff6b00"
                          strokeWidth="3"
                        />
                        {/* Dots */}
                        {historyPoints.map((p, idx) => {
                          const minRM = Math.max(0, Math.min(...historyPoints.map(pt => pt.oneRM)) - 10);
                          const maxRM = Math.max(...historyPoints.map(pt => pt.oneRM)) + 10;
                          const range = maxRM - minRM || 1;
                          const x = 20 + (idx * (chartWidth - 40)) / (historyPoints.length - 1);
                          const y = 90 - ((p.oneRM - minRM) / range) * 60;
                          return (
                            <Circle key={idx} cx={x} cy={y} r="3" fill="#ffffff" stroke="#ff6b00" strokeWidth="1.5" />
                          );
                        })}
                      </G>
                    )}
                  </Svg>
                  <View style={styles.chartLabels}>
                    <Text style={styles.labelText}>{historyPoints[0].displayDate}</Text>
                    {historyPoints.length > 2 && (
                      <Text style={styles.labelText}>
                        {historyPoints[Math.floor(historyPoints.length / 2)].displayDate}
                      </Text>
                    )}
                    <Text style={styles.labelText}>{historyPoints[historyPoints.length - 1].displayDate}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noSearchData}>
                  <Text style={styles.noSearchDataText}>
                    ※ {searchedEx}の記録がありません。新しく記録すると、推移グラフが生成されます。
                  </Text>
                </View>
              )}
            </GlassCard>

            {/* Result Chart 2: Weekly Volume */}
            <GlassCard style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.chartCardTitle}>週次トレーニング総ボリューム</Text>
                  <Text style={styles.chartCardSub}>全種目の週次合計 (単位: kg)</Text>
                </View>
                <Text style={styles.chartHighlight}>
                  {(() => {
                    const lastWeekVol = weeklyVolumes[3];
                    const thisWeekVol = weeklyVolumes[4];
                    if (lastWeekVol > 0) {
                      const diffPct = Math.round(((thisWeekVol - lastWeekVol) / lastWeekVol) * 100);
                      return diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`;
                    }
                    return thisWeekVol > 0 ? 'NEW' : '0%';
                  })()}
                </Text>
              </View>

              {/* Dynamic Bar Chart using Svg */}
              <Svg height="120" width={chartWidth}>
                <G>
                  {weeklyVolumes.map((vol, idx) => {
                    const x = 15 + idx * ((chartWidth - 54) / 4);
                    const barHeight = (vol / maxWeeklyVol) * 90;
                    const y = 110 - barHeight;
                    const color = idx === 4 ? '#ff6b00' : idx === 3 ? '#ff8833' : idx === 2 ? '#ffbb88' : '#555555';
                    return (
                      <G key={idx}>
                        <Rect x={x} y={y} width="24" height={Math.max(4, barHeight)} rx="4" fill={color} />
                        {vol > 0 && (
                          <SvgText x={x + 12} y={y - 4} fill="#888888" fontSize="8" fontWeight="bold" textAnchor="middle">
                            {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol}
                          </SvgText>
                        )}
                      </G>
                    );
                  })}
                </G>
              </Svg>
              <View style={styles.chartLabels}>
                <Text style={styles.labelText}>4週前</Text>
                <Text style={styles.labelText}>3週前</Text>
                <Text style={styles.labelText}>2週前</Text>
                <Text style={styles.labelText}>先週</Text>
                <Text style={styles.labelText}>今週</Text>
              </View>
            </GlassCard>
          </>
        )}

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
  header: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  searchButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ff6b00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 15,
    marginTop: 15,
  },
  suggestionsList: {
    gap: 12,
    marginBottom: 20,
  },
  suggestionItemWrapper: {
    width: '100%',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  suggestionText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  pieLegend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  // Results styles
  chartCard: {
    marginBottom: 16,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  chartCardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  chartCardSub: {
    color: '#555555',
    fontSize: 10,
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
    paddingHorizontal: 10,
    marginTop: 10,
  },
  labelText: {
    color: '#444444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  exerciseTabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  exTab: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeExTab: {
    backgroundColor: '#ff6b00',
    borderColor: '#ff6b00',
  },
  exTabText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeExTabText: {
    color: '#ffffff',
  },
  noDataBanner: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.15)',
  },
  noDataBannerText: {
    color: '#ff8833',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  noSearchData: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noSearchDataText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
