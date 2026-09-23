import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, CalendarDays, Camera, CheckCircle2, X } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import { formatJapaneseDate } from '@/lib/workout';

const suggestedTags = ['フォーム', '重量', 'コンディション', '疲労', '次回'];

export default function MemoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { selectedDate, workoutNotes, workoutNoteTags, workoutNotePhotos, updateWorkoutNote, updateWorkoutNoteTags, updateWorkoutNotePhoto } = useWorkoutStore();
  const date = params.date || selectedDate;
  const [memo, setMemo] = useState(workoutNotes[date] || '');
  const [tags, setTags] = useState<string[]>(workoutNoteTags[date] || []);
  const [photo, setPhoto] = useState<string | null>(workoutNotePhotos[date] || null);
  const [saved, setSaved] = useState(true);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    setSaved(false);
    const timer = setTimeout(() => {
      updateWorkoutNote(date, memo);
      setSaved(true);
    }, 450);
    return () => clearTimeout(timer);
  }, [memo, date, updateWorkoutNote]);

  const toggleTag = (tag: string) => {
    const next = tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag];
    setTags(next);
    updateWorkoutNoteTags(date, next);
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('写真へのアクセスが必要です', 'メモに写真を添えるため、写真ライブラリへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      updateWorkoutNotePhoto(date, uri);
    }
  };

  const close = () => {
    updateWorkoutNote(date, memo);
    updateWorkoutNoteTags(date, tags);
    updateWorkoutNotePhoto(date, photo);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={close}><ArrowLeft size={21} color="#ffffff" /></TouchableOpacity>
          <Text style={styles.headerTitle}>トレーニングメモ</Text>
          <View style={styles.savedState}>
            <CheckCircle2 size={14} color={saved ? '#39d98a' : '#687073'} />
            <Text style={[styles.savedText, !saved && styles.savingText]}>{saved ? '保存済み' : '保存中'}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.dateCard}>
            <CalendarDays size={18} color="#ff6b00" />
            <Text style={styles.dateText}>{formatJapaneseDate(date)}</Text>
          </View>

          <Text style={styles.label}>今日の気づき</Text>
          <View style={styles.memoCard}>
            <TextInput
              autoFocus
              multiline
              value={memo}
              onChangeText={setMemo}
              onBlur={() => updateWorkoutNote(date, memo)}
              placeholder={'フォーム、重量、体調など。\nあとで自分が読み返せる一言だけでも十分です。'}
              placeholderTextColor="#596164"
              style={styles.memoInput}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.counter}>{memo.length} / 500</Text>
          </View>

          <Text style={styles.label}>タグ（任意）</Text>
          <View style={styles.tags}>
            {suggestedTags.map((tag) => {
              const active = tags.includes(tag);
              return (
                <TouchableOpacity key={tag} style={[styles.tag, active && styles.tagActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>#{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>写真（任意）</Text>
          {photo ? (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity style={styles.removePhoto} onPress={() => { setPhoto(null); updateWorkoutNotePhoto(date, null); }}><X size={17} color="#ffffff" /></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
              <Camera size={20} color="#ff6b00" />
              <Text style={styles.photoButtonText}>写真を追加</Text>
            </TouchableOpacity>
          )}

          <View style={styles.autoSaveNotice}>
            <CheckCircle2 size={16} color="#39d98a" />
            <Text style={styles.autoSaveText}>入力内容は自動で保存されます</Text>
          </View>
          <View style={{ height: 36 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050707' },
  header: { height: 60, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#202627' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111617', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  savedState: { width: 75, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  savedText: { color: '#39d98a', fontSize: 10, fontWeight: '700' },
  savingText: { color: '#687073' },
  content: { padding: 18 },
  dateCard: { height: 48, borderRadius: 13, backgroundColor: '#101516', borderWidth: 1, borderColor: '#242a2c', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9, marginBottom: 23 },
  dateText: { color: '#dfe3e3', fontSize: 13, fontWeight: '700' },
  label: { color: '#a4aaac', fontSize: 12, fontWeight: '800', marginBottom: 10 },
  memoCard: { minHeight: 235, borderRadius: 17, backgroundColor: '#0d1213', borderWidth: 1, borderColor: '#242a2c', padding: 15, marginBottom: 22 },
  memoInput: { minHeight: 184, color: '#ffffff', fontSize: 15, lineHeight: 24, padding: 0 },
  counter: { color: '#596164', fontSize: 10, textAlign: 'right', marginTop: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 23 },
  tag: { borderRadius: 18, borderWidth: 1, borderColor: '#2a3032', backgroundColor: '#111617', paddingHorizontal: 12, paddingVertical: 9 },
  tagActive: { borderColor: '#ff6b00', backgroundColor: 'rgba(255,107,0,0.12)' },
  tagText: { color: '#92999b', fontSize: 11, fontWeight: '700' },
  tagTextActive: { color: '#ff883e' },
  photoButton: { height: 58, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: '#394042', backgroundColor: '#0d1213', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 20 },
  photoButtonText: { color: '#b8bdbf', fontSize: 13, fontWeight: '700' },
  photoWrap: { height: 190, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#2a3032' },
  photo: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center' },
  autoSaveNotice: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#101615', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  autoSaveText: { color: '#737b7d', fontSize: 11 },
});
