import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, LayoutAnimation, Platform, UIManager, Share, Alert, TextInput, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Dumbbell, Heart, Flame, ChevronDown, ChevronUp, MessageSquare, Camera, Trash2, Plus } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import GlassCard from '@/components/ui/GlassCard';
import HeartRateChart from '@/components/charts/HeartRateChart';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ShareCard from '@/components/ui/ShareCard';
import * as ImagePicker from 'expo-image-picker';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SetRecordUI {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
}

interface ExerciseRecordUI {
  name: string;
  sets: SetRecordUI[];
}

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dateStr = params.date ? String(params.date) : '2026-07-04';
  
  const { workoutLogs, getPersonalRecord, workoutNotes, updateWorkoutNote, setSelectedDate, selectExercise } = useWorkoutStore();
  const viewShotRef = useRef<any>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("アクセス制限", "SNSシェア用の画像を合成するには、写真ライブラリへのアクセス権限が必要です。");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 20],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Pick image error:', err);
      Alert.alert('写真選択エラー', '写真の選択中にエラーが発生しました。');
    }
  };

  useEffect(() => {
    setNoteText(workoutNotes[dateStr] || '');
  }, [dateStr, workoutNotes]);

  // Get actual logged data from Zustand for this specific date
  const dayLogs = workoutLogs[dateStr] || {};
  const exerciseNames = Object.keys(dayLogs);

  const exercises: ExerciseRecordUI[] = exerciseNames.map(name => ({
    name,
    sets: dayLogs[name].map((set, idx) => ({
      setNumber: idx + 1,
      weight: parseFloat(set.weight) || 0,
      reps: parseInt(set.reps) || 0,
      rpe: set.rpe ? parseFloat(set.rpe) : undefined,
    }))
  }));

  // Initializing state to track accordion open/close for each exercise
  const [expandedExercises, setExpandedExercises] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Expand all exercises by default
    const initialExpanded = exerciseNames.reduce((acc: any, name) => {
      acc[name] = true;
      return acc;
    }, {});
    setExpandedExercises(initialExpanded);
  }, [dateStr]);

  const toggleExercise = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedExercises(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleShareImage = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef.current, {
          format: 'png',
          quality: 0.95,
        });
        
        console.log('Generated share image path:', uri);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('共有エラー', 'この端末では共有機能が利用できません。');
        }
      }
    } catch (err) {
      console.log('Capture error:', err);
      Alert.alert('画像生成エラー', 'シェア画像の生成に失敗しました。');
    }
  };

  // Format date display (e.g., 2026年7月4日)
  const formattedDate = () => {
    try {
      const parts = dateStr.split('-');
      return `${parts[0]}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
    } catch {
      return dateStr;
    }
  };

  // Calculate dynamic stats based on actual sets
  let totalVolume = 0;
  let totalSetsCount = 0;
  exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      totalVolume += set.weight * set.reps;
      totalSetsCount += 1;
    });
  });

  // Fallback if calculations result in 0
  const finalVolume = totalVolume > 0 ? totalVolume : 4850;

  // Dummy performance scores
  const perfScores = [
    { label: 'ボリューム', score: totalVolume > 0 ? Math.min(100, Math.round(totalVolume / 60)) : 85 },
    { label: '筋力', score: 80 },
    { label: '持久力', score: 75 },
    { label: '回復力', score: 90 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{formattedDate()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ① セット記録 (最上部に配置) */}
        <Text style={styles.sectionHeader}>トレーニング記録詳細</Text>
        {exercises.length > 0 ? (
          exercises.map((ex, idx) => {
            const isExpanded = expandedExercises[ex.name];
            return (
              <GlassCard key={idx} style={styles.accordionCard}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleExercise(ex.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <View style={styles.accordionHeaderRight}>
                    <Text style={styles.setsSummary}>{ex.sets.length}セット</Text>
                    {isExpanded ? <ChevronUp size={20} color="#ff6b00" /> : <ChevronDown size={20} color="#888888" />}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionContent}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.columnLabel, { flex: 1 }]}>Set</Text>
                      <Text style={[styles.columnLabel, { flex: 3, textAlign: 'right' }]}>重量 (kg)</Text>
                      <Text style={[styles.columnLabel, { flex: 3, textAlign: 'right' }]}>レップ数</Text>
                    </View>
                    {ex.sets.map((set, sIdx) => (
                      <View key={sIdx} style={styles.tableRow}>
                        <Text style={[styles.columnValue, { flex: 1, fontWeight: 'bold' }]}>{set.setNumber}</Text>
                        <Text style={[styles.columnValue, { flex: 3, textAlign: 'right' }]}>{set.weight} kg</Text>
                        <Text style={[styles.columnValue, { flex: 3, textAlign: 'right' }]}>{set.reps} 回</Text>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.editExerciseBtn}
                      onPress={() => {
                        setSelectedDate(dateStr);
                        selectExercise(ex.name);
                        router.push('/workout/input-set');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editExerciseBtnText}>この種目の記録を編集する ➔</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </GlassCard>
            );
          })
        ) : (
          <GlassCard style={styles.card}>
            <Text style={{ color: '#888888', textAlign: 'center' }}>記録された種目はありません</Text>
          </GlassCard>
        )}

        {/* 種目の追加ボタン */}
        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => {
            setSelectedDate(dateStr);
            router.push('/workout/record');
          }}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#ff6b00" style={{ marginRight: 8 }} />
          <Text style={styles.addExerciseBtnText}>この日に新しく種目を追加・記録する</Text>
        </TouchableOpacity>

        {/* ② 概要 (Overview) */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>トレーニング概要</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Dumbbell size={18} color="#ff6b00" style={styles.statIcon} />
              <Text style={styles.statValue}>{finalVolume.toLocaleString()}</Text>
              <Text style={styles.statLabel}>総ボリューム (kg)</Text>
            </View>
          </View>
        </GlassCard>

        {/* ③ パフォーマンスメモ (Notes) */}
        <GlassCard style={styles.card}>
          <View style={styles.notesHeader}>
            <MessageSquare size={18} color="#ff6b00" />
            <Text style={styles.notesTitle}>パフォーマンスメモ</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            multiline={true}
            numberOfLines={4}
            placeholder="今日のトレーニングに関するメモを入力..."
            placeholderTextColor="#555555"
            value={noteText}
            onChangeText={setNoteText}
            onBlur={() => updateWorkoutNote(dateStr, noteText)}
          />
        </GlassCard>

        {/* シェア用写真設定カード */}
        {exercises.length > 0 && (
          <GlassCard style={styles.photoSelectCard}>
            <View style={styles.photoSelectHeader}>
              <Camera size={16} color="#ff6b00" />
              <Text style={styles.photoSelectTitle}>SNSシェア用画像の設定</Text>
            </View>

            {selectedPhoto ? (
              <View style={styles.photoPreviewWrapper}>
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: selectedPhoto }} style={styles.photoPreview} resizeMode="cover" />
                  <TouchableOpacity 
                    style={styles.photoRemoveBtn} 
                    onPress={() => setSelectedPhoto(null)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.photoChangeBtn} onPress={handlePickImage}>
                  <Text style={styles.photoChangeBtnText}>別の写真に変更する</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPlaceholder} onPress={handlePickImage} activeOpacity={0.7}>
                <Camera size={24} color="#888888" />
                <Text style={styles.photoPlaceholderText}>写真を合成してシェア（タップして選択）</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        )}

        {/* ⑦ SNSシェアボタン */}
        {exercises.length > 0 && (
          <TouchableOpacity
            style={styles.shareButton}
            activeOpacity={0.8}
            onPress={handleShareImage}
          >
            <Text style={styles.shareButtonText}>SNSで今日の記録を画像でシェア</Text>
          </TouchableOpacity>
        )}

        {/* Space at the bottom (leaves room above tab bar) */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Off-screen Share Card for Image Export */}
      <View style={{ position: 'absolute', top: -9999, left: -9999 }} pointerEvents="none">
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
          <ShareCard
            dateStr={dateStr}
            volume={finalVolume}
            photoUri={selectedPhoto}
            exercises={exercises.map(ex => ({
              name: ex.name,
              sets: ex.sets.map(set => {
                const pr = getPersonalRecord(ex.name, dateStr);
                let isPr = false;
                if (!pr) {
                  isPr = true;
                } else {
                  if (set.weight > pr.weight) {
                    isPr = true;
                  } else if (set.weight === pr.weight && set.reps > pr.reps) {
                    isPr = true;
                  }
                }
                return {
                  weight: set.weight,
                  reps: set.reps,
                  isPr
                };
              })
            }))}
          />
        </ViewShot>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888888',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ff6b00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsList: {
    gap: 12,
  },
  metricRow: {
    width: '100%',
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    color: '#cccccc',
    fontSize: 13,
  },
  metricScore: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff6b00',
    borderRadius: 3,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionItem: {
    alignItems: 'center',
    flex: 1,
  },
  conditionLabel: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 6,
  },
  conditionValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notesInput: {
    color: '#cccccc',
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 12,
  },
  accordionCard: {
    marginBottom: 16,
    padding: 0,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  accordionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  setsSummary: {
    color: '#888888',
    fontSize: 12,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  columnLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  columnValue: {
    color: '#ffffff',
    fontSize: 13,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ff6b00',
    borderRadius: 16,
    height: 52,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  photoSelectCard: {
    marginBottom: 16,
  },
  photoSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  photoSelectTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  photoPlaceholder: {
    height: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    gap: 8,
  },
  photoPlaceholderText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  photoPreviewWrapper: {
    width: '100%',
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  photoChangeBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  photoChangeBtnText: {
    color: '#ff6b00',
    fontSize: 13,
    fontWeight: 'bold',
  },
  editExerciseBtn: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editExerciseBtnText: {
    color: '#ff6b00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 0, 0.03)',
    marginBottom: 24,
  },
  addExerciseBtnText: {
    color: '#ff6b00',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
