import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Copy, Plus, Trash2 } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';

export default function InputSetScreen() {
  const router = useRouter();
  const {
    selectedDate,
    selectedExercise,
    workoutLogs,
    workoutNotes,
    previousRecords,
    addSet,
    updateSet,
    removeSet,
    copyPreviousSets,
    updateWorkoutNote,
  } = useWorkoutStore();
  const exercise = selectedExercise || 'ベンチプレス';
  const sets = workoutLogs[selectedDate]?.[exercise] || [];
  const previous = previousRecords[exercise] || [];
  const [memo, setMemo] = useState(workoutNotes[selectedDate] || '');
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    if (!sets.length) addSet(selectedDate, exercise);
  }, [selectedDate, exercise]);

  const updateValue = (index: number, field: 'weight' | 'reps', value: string) => {
    setSaved(false);
    updateSet(selectedDate, exercise, index, field, value.replace(/[^0-9.]/g, ''));
    setTimeout(() => setSaved(true), 280);
  };

  const finish = () => {
    updateWorkoutNote(selectedDate, memo);
    router.push({ pathname: '/complete', params: { date: selectedDate } } as any);
  };

  const addAnotherExercise = () => {
    updateWorkoutNote(selectedDate, memo);
    router.push('/workout/select-exercise');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={21} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>トレーニング記録</Text>
            <Text style={styles.headerExercise}>{exercise}</Text>
          </View>
          <TouchableOpacity style={styles.finishTop} onPress={finish}><Text style={styles.finishTopText}>終了</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {previous.length > 0 && (
            <View style={styles.previousCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previousLabel}>前回の記録</Text>
                <Text style={styles.previousValue} numberOfLines={1}>
                  {previous.map((set) => `${set.weight}kg × ${set.reps}`).join('　')}
                </Text>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={() => copyPreviousSets(selectedDate, exercise)}>
                <Copy size={16} color="#ff6b00" />
                <Text style={styles.copyText}>コピー</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.setCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHead, styles.setColumn]}>SET</Text>
              <Text style={styles.columnHead}>KG</Text>
              <Text style={styles.columnHead}>REPS</Text>
              <View style={styles.actionColumn} />
            </View>

            {sets.map((set, index) => {
              const completed = Boolean(set.weight && set.reps);
              return (
                <View key={index} style={styles.setRow}>
                  <View style={styles.setColumn}>
                    <View style={[styles.setNumber, completed && styles.setNumberDone]}>
                      {completed ? <Check size={14} color="#07100b" strokeWidth={3} /> : <Text style={styles.setNumberText}>{index + 1}</Text>}
                    </View>
                  </View>
                  <TextInput
                    value={set.weight}
                    onChangeText={(value) => updateValue(index, 'weight', value)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#4f5759"
                    selectTextOnFocus
                    style={styles.numberInput}
                  />
                  <TextInput
                    value={set.reps}
                    onChangeText={(value) => updateValue(index, 'reps', value)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#4f5759"
                    selectTextOnFocus
                    style={styles.numberInput}
                  />
                  <View style={styles.actionColumn}>
                    {sets.length > 1 ? (
                      <TouchableOpacity style={styles.deleteButton} onPress={() => removeSet(selectedDate, exercise, index)}>
                        <Trash2 size={16} color="#8f5555" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(selectedDate, exercise)}>
              <Plus size={18} color="#ff6b00" />
              <Text style={styles.addSetText}>セットを追加</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.memoLabel}>メモ（任意）</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            onBlur={() => updateWorkoutNote(selectedDate, memo)}
            placeholder="フォームやセット間の気づき…"
            placeholderTextColor="#535b5d"
            style={styles.memoInput}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <View style={styles.saveState}>
            <Check size={14} color={saved ? '#39d98a' : '#636b6d'} />
            <Text style={[styles.saveText, !saved && styles.savingText]}>{saved ? '入力内容は自動保存されます' : '保存中…'}</Text>
          </View>

          <TouchableOpacity style={styles.addExerciseButton} onPress={addAnotherExercise}>
            <Plus size={18} color="#ff6b00" />
            <Text style={styles.addExerciseText}>別の種目を追加</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finishButton} onPress={finish}>
            <Text style={styles.finishButtonText}>トレーニングを終了</Text>
          </TouchableOpacity>
          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050707' },
  header: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#202627' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111617', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  headerExercise: { color: '#71797b', fontSize: 10, marginTop: 2 },
  finishTop: { minWidth: 48, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,107,0,0.10)', alignItems: 'center', justifyContent: 'center' },
  finishTopText: { color: '#ff7c26', fontSize: 12, fontWeight: '900' },
  content: { padding: 18 },
  previousCard: { minHeight: 68, borderRadius: 15, borderWidth: 1, borderColor: '#242a2c', backgroundColor: '#0e1314', flexDirection: 'row', alignItems: 'center', padding: 13, marginBottom: 14 },
  previousLabel: { color: '#737b7d', fontSize: 10, fontWeight: '700', marginBottom: 6 },
  previousValue: { color: '#e2e5e5', fontSize: 12, fontWeight: '700' },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8 },
  copyText: { color: '#ff7c26', fontSize: 10, fontWeight: '800' },
  setCard: { borderRadius: 18, borderWidth: 1, borderColor: '#252b2d', backgroundColor: '#0e1314', padding: 12, marginBottom: 22 },
  tableHeader: { height: 29, flexDirection: 'row', alignItems: 'center' },
  columnHead: { flex: 1, color: '#747c7e', fontSize: 9, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  setColumn: { width: 46, flex: 0, alignItems: 'center' },
  actionColumn: { width: 38, alignItems: 'center' },
  setRow: { minHeight: 58, borderTopWidth: 1, borderTopColor: '#202627', flexDirection: 'row', alignItems: 'center', gap: 8 },
  setNumber: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#181e20', alignItems: 'center', justifyContent: 'center' },
  setNumberDone: { backgroundColor: '#39d98a' },
  setNumberText: { color: '#a3aaac', fontSize: 12, fontWeight: '800' },
  numberInput: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#293032', backgroundColor: '#151a1b', color: '#ffffff', fontSize: 17, fontWeight: '800', textAlign: 'center', paddingHorizontal: 4 },
  deleteButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  addSetButton: { height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#343b3d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 },
  addSetText: { color: '#d9dddd', fontSize: 12, fontWeight: '800' },
  memoLabel: { color: '#a0a7a9', fontSize: 12, fontWeight: '800', marginBottom: 9 },
  memoInput: { minHeight: 88, borderRadius: 15, borderWidth: 1, borderColor: '#252b2d', backgroundColor: '#0e1314', color: '#ffffff', fontSize: 13, lineHeight: 20, padding: 13, marginBottom: 12 },
  saveState: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 22 },
  saveText: { color: '#737b7d', fontSize: 10 },
  savingText: { color: '#596164' },
  addExerciseButton: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#ff6b00', backgroundColor: 'rgba(255,107,0,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  addExerciseText: { color: '#ff7c26', fontSize: 13, fontWeight: '800' },
  finishButton: { height: 54, borderRadius: 14, backgroundColor: '#ff6b00', alignItems: 'center', justifyContent: 'center' },
  finishButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
