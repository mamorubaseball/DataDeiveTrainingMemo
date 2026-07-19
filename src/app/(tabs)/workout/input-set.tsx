import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { ArrowLeft, Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp, Copy, X } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import GlassCard from '@/components/ui/GlassCard';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import ShareCard from '@/components/ui/ShareCard';

export default function InputSetScreen() {
  const router = useRouter();
  const { selectedDate, selectedExercise, workoutLogs, previousRecords, addSet, updateSet, removeSet, getPersonalRecord, copyPreviousSets } = useWorkoutStore();
  
  const viewShotRef = useRef<any>(null);
  const [showPrModal, setShowPrModal] = useState(false);
  const [prRecord, setPrRecord] = useState<{ weight: number, reps: number } | null>(null);
  const [newPrRecord, setNewPrRecord] = useState<{ weight: number, reps: number } | null>(null);
  
  const exerciseName = selectedExercise || 'ベンチプレス';
  
  // Get active session sets for this exercise, or initialize one if empty
  const dateLogs = workoutLogs[selectedDate] || {};
  const currentSets = dateLogs[exerciseName] || [];

  // Saved Indicator opacity shared value
  const savedOpacity = useSharedValue(0);
  const [lastSavedField, setLastSavedField] = useState('');

  // Initial set insertion on mount if empty
  useEffect(() => {
    if (currentSets.length === 0) {
      addSet(selectedDate, exerciseName);
    }
  }, [selectedDate, exerciseName]);

  const triggerSaveIndicator = (fieldName: string) => {
    setLastSavedField(fieldName);
    // Sequence: fade in, wait, fade out
    savedOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(1000, withTiming(0, { duration: 300 }))
    );
  };

  const handleInputChange = (index: number, field: 'weight' | 'reps', value: string) => {
    updateSet(selectedDate, exerciseName, index, field, value);
    // Show 'Saved' indicator
    triggerSaveIndicator(`Set ${index + 1} ${field === 'weight' ? '重量' : '回数'}`);
  };

  const handleBack = () => {
    // 1. Fetch the absolute latest workout logs synchronously from the store to avoid React state closure delays
    const latestLogs = useWorkoutStore.getState().workoutLogs;
    const dateLogs = latestLogs[selectedDate] || {};
    const latestSets = dateLogs[exerciseName] || [];

    const pr = getPersonalRecord(exerciseName, selectedDate);
    
    // Helper to calculate 1RM estimate
    const getEstimatedRM = (w: number, r: number): number => {
      if (w <= 0 || r <= 0) return 0;
      return w * (1 + 0.025 * r);
    };

    const prRm = pr ? getEstimatedRM(pr.weight, pr.reps) : 0;
    
    let isPrAchieved = false;
    let bestSet: { weight: number, reps: number } | null = null;

    latestSets.forEach(setItem => {
      const weightVal = parseFloat(setItem?.weight) || 0;
      const repsVal = parseInt(setItem?.reps) || 0;

      if (weightVal > 0 && repsVal > 0) {
        let isThisSetPr = false;
        
        if (!pr) {
          isThisSetPr = true;
        } else {
          const currentRm = getEstimatedRM(weightVal, repsVal);
          
          // Celebrate PR if:
          // A) Absolute weight is higher
          if (weightVal > pr.weight) {
            isThisSetPr = true;
          } 
          // B) Weight is the same, but reps are higher
          else if (weightVal === pr.weight && repsVal > pr.reps) {
            isThisSetPr = true;
          }
          // C) Estimated 1RM (strength index) is higher than previous PR's 1RM
          else if (currentRm > prRm) {
            isThisSetPr = true;
          }
        }

        if (isThisSetPr) {
          isPrAchieved = true;
          // Track the best set achieved today to show in the PR Modal
          if (!bestSet || weightVal > bestSet.weight || (weightVal === bestSet.weight && repsVal > bestSet.reps)) {
            bestSet = { weight: weightVal, reps: repsVal };
          }
        }
      }
    });

    if (isPrAchieved && bestSet) {
      setPrRecord(pr);
      setNewPrRecord(bestSet);
      setShowPrModal(true);
    } else {
      router.back();
    }
  };

  const handleClosePrModal = () => {
    setShowPrModal(false);
    router.back();
  };

  const handleCopy = () => {
    if (prevRec.length === 0) {
      Alert.alert('お知らせ', 'コピーできる前回の記録がありません。');
      return;
    }
    Alert.alert(
      '記録のコピー',
      '前回のトレーニング記録を今日の記録にコピーしますか？（現在の入力内容は上書きされます）',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'コピーする',
          onPress: () => {
            copyPreviousSets(selectedDate, exerciseName);
            Alert.alert('コピー完了', '前回の記録を今日のログにコピーしました。');
          }
        }
      ]
    );
  };

  const calculateRM = (weightStr: string, repsStr: string): string => {
    const weight = parseFloat(weightStr) || 0;
    const reps = parseInt(repsStr) || 0;
    if (weight <= 0 || reps <= 0) return '-';
    const rm = weight * (1 + 0.025 * reps);
    return `${rm.toFixed(1)} kg`;
  };
  const handleSharePRImage = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef.current, {
          format: 'png',
          quality: 0.95,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('共有エラー', 'この端末では共有機能が利用できません。');
        }
      }
    } catch (err) {
      console.log('PR Capture error:', err);
      Alert.alert('画像生成エラー', 'シェア画像の生成に失敗しました。');
    }
  };

  // Get previous record representation
  const prevRec = previousRecords[exerciseName] || [];
  const prevRecordText = prevRec.length > 0 
    ? prevRec.map(r => `${r.weight}kg × ${r.reps}`).join('  /  ')
    : '前回の記録はありません';

  // Get personal record (PR)
  const pr = getPersonalRecord(exerciseName, selectedDate);
  const prRecordText = pr ? `${pr.weight}kg x ${pr.reps}回` : '記録はありません';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exerciseName}</Text>
          {/* Saved Indicator */}
          <Animated.View style={[styles.savedIndicator, useAnimatedStyle(() => ({ opacity: savedOpacity.value }))]}>
            <CheckCircle2 size={14} color="#22c55e" />
            <Text style={styles.savedText}>Saved</Text>
          </Animated.View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Previous Record & PR Card (Always Visible) */}
          <GlassCard style={styles.historyCard}>
            <View style={styles.historyCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyCardTitle}>前回の記録</Text>
                {prevRec.length > 0 ? (
                  <View style={styles.prevSetsContainer}>
                    {prevRec.map((r, idx) => (
                      <Text key={idx} style={styles.prevSetText}>
                        {idx + 1}   {r.weight}kg × {r.reps}回
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.historyValueEmpty}>前回の記録はありません</Text>
                )}
              </View>
              {prevRec.length > 0 && (
                <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.7}>
                  <Copy size={18} color="#ff6b00" />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.historyDivider} />
            
            <View style={styles.historyRow}>
              <Text style={styles.historyLabel}>最高記録 (PR):</Text>
              <Text style={styles.historyValue}>{prRecordText}</Text>
            </View>
          </GlassCard>

          {/* Sets Input List (Compact Table Layout) */}
          <GlassCard style={styles.setsListCard}>
            {/* Table Header */}
            <View style={styles.listTableHeader}>
              <Text style={[styles.tableHeaderLabel, { width: 45 }]}>セット</Text>
              <Text style={[styles.tableHeaderLabel, { flex: 2, paddingLeft: 4 }]}>重量 (kg)</Text>
              <Text style={[styles.tableHeaderLabel, { flex: 2, paddingLeft: 4 }]}>回数</Text>
              <Text style={[styles.tableHeaderLabel, { flex: 2, textAlign: 'right', paddingRight: 8 }]}>推定1RM</Text>
              <Text style={[styles.tableHeaderLabel, { width: 40 }]}></Text>
            </View>

            {currentSets.map((set, idx) => (
              <View key={idx} style={styles.setRow}>
                {/* Set Number */}
                <Text style={styles.setRowNumber}>{idx + 1}</Text>

                {/* Weight Input */}
                <View style={styles.rowInputGroup}>
                  <View style={styles.inputWithClearWrapper}>
                    <TextInput
                      style={[styles.rowTextInput, set.weight.length > 0 && styles.rowTextInputWithClear]}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#444444"
                      value={set.weight}
                      onChangeText={(val) => handleInputChange(idx, 'weight', val)}
                    />
                    {set.weight.length > 0 && (
                      <TouchableOpacity 
                        style={styles.clearInputBtn}
                        onPress={() => handleInputChange(idx, 'weight', '')}
                        activeOpacity={0.7}
                      >
                        <X size={10} color="#888888" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Reps Input */}
                <View style={styles.rowInputGroup}>
                  <TextInput
                    style={styles.rowTextInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#444444"
                    value={set.reps}
                    onChangeText={(val) => handleInputChange(idx, 'reps', val)}
                  />
                </View>

                {/* RM Display */}
                <View style={styles.rowRmGroup}>
                  <Text style={styles.rowRmText}>
                    {calculateRM(set.weight, set.reps)}
                  </Text>
                </View>

                {/* Delete Button */}
                <View style={styles.rowDeleteGroup}>
                  {currentSets.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeSet(selectedDate, exerciseName, idx)}
                      style={styles.rowDeleteBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </GlassCard>

          {/* Add Set Button */}
          <TouchableOpacity
            style={styles.addSetButton}
            activeOpacity={0.8}
            onPress={() => addSet(selectedDate, exerciseName)}
          >
            <Plus size={20} color="#ff6b00" />
            <Text style={styles.addSetButtonText}>セットを追加</Text>
          </TouchableOpacity>

          {/* Save status explanation (Since no save button is needed) */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ※ 入力された値は即座に自動保存されます。保存ボタンはありません。
            </Text>
          </View>

          {/* Spacer to clear bottom tab bar */}
          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* PR Celebration Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPrModal}
        onRequestClose={() => setShowPrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            <Text style={styles.congratsEmoji}>🎉🏆🎉</Text>
            <Text style={styles.congratsTitle}>自己ベスト更新！</Text>
            <Text style={styles.congratsSub}>おめでとうございます！</Text>
            
            <View style={styles.prCompareContainer}>
              <View style={styles.prBox}>
                <Text style={styles.prBoxLabel}>これまでの記録</Text>
                <Text 
                  style={styles.prBoxValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  {prRecord && prRecord.weight > 0 ? `${prRecord.weight}kg x ${prRecord.reps}回` : 'なし'}
                </Text>
              </View>
              <Text style={styles.arrowIcon}>➔</Text>
              <View style={styles.prBoxHighlight}>
                <Text style={styles.prBoxLabelHighlight}>新記録！🔥</Text>
                <Text 
                  style={styles.prBoxValueHighlight}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  {newPrRecord ? `${newPrRecord.weight}kg x ${newPrRecord.reps}回` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalShareButton}
                activeOpacity={0.8}
                onPress={handleSharePRImage}
              >
                <Text style={styles.modalShareButtonText}>SNSで画像シェアする</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                activeOpacity={0.8}
                onPress={handleClosePrModal}
              >
                <Text style={styles.modalCloseButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Off-screen Single PR Share Card */}
      <View style={{ position: 'absolute', top: -9999, left: -9999 }} pointerEvents="none">
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
          {newPrRecord && (
            <ShareCard
              dateStr={selectedDate}
              volume={newPrRecord.weight * newPrRecord.reps}
              exercises={[{
                name: exerciseName,
                sets: [{
                  weight: newPrRecord.weight,
                  reps: newPrRecord.reps,
                  isPr: true
                }]
              }]}
            />
          )}
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
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  savedText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  prevRecordCard: {
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderLeftWidth: 3,
    borderLeftColor: '#888888',
  },
  prevRecordLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  prevRecordValue: {
    color: '#dddddd',
    fontSize: 14,
    fontWeight: '600',
  },
  setsContainer: {
    gap: 15,
    marginBottom: 20,
  },
  setCard: {
    padding: 16,
  },
  setCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumberLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    height: 48,
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    backgroundColor: 'rgba(255, 107, 0, 0.02)',
    borderRadius: 16,
    height: 52,
    marginBottom: 20,
  },
  addSetButtonText: {
    color: '#ff6b00',
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoText: {
    color: '#555555',
    fontSize: 11,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  congratsEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  congratsTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  congratsSub: {
    color: '#ff6b00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  prCompareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    marginBottom: 24,
  },
  prBox: {
    alignItems: 'center',
    flex: 1,
  },
  prBoxHighlight: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  prBoxLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prBoxLabelHighlight: {
    color: '#ff6b00',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prBoxValue: {
    color: '#aaaaaa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  prBoxValueHighlight: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  arrowIcon: {
    color: '#ff6b00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtons: {
    width: '100%',
    gap: 10,
  },
  modalShareButton: {
    backgroundColor: '#ff6b00',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalShareButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  modalCloseButtonText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '600',
  },
  historyToggleHeader: {
    marginBottom: 16,
    width: '100%',
  },
  historyCard: {
    padding: 14,
    marginBottom: 20,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  historyDetails: {
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  },
  historyValue: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '600',
  },
  historyDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 10,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  prevSetsContainer: {
    marginTop: 6,
    gap: 4,
  },
  prevSetText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '500',
  },
  historyValueEmpty: {
    color: '#555555',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  rmGroup: {
    flex: 1.2,
    alignItems: 'center',
  },
  rmValueContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    width: '100%',
  },
  rmValue: {
    color: '#aaaaaa',
    fontSize: 13,
    fontWeight: '700',
  },
  setsListCard: {
    padding: 16,
    marginBottom: 20,
  },
  listTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableHeaderLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  setRowNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    width: 45,
    paddingLeft: 6,
  },
  rowInputGroup: {
    flex: 2,
    marginHorizontal: 4,
  },
  rowTextInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    height: 40,
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  rowRmGroup: {
    flex: 2,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 10,
  },
  rowRmText: {
    color: '#ff6b00',
    fontSize: 13,
    fontWeight: '750',
  },
  rowDeleteGroup: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDeleteBtn: {
    padding: 8,
  },
  inputWithClearWrapper: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  rowTextInputWithClear: {
    paddingRight: 20,
  },
  clearInputBtn: {
    position: 'absolute',
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
