import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { ArrowLeft, Camera, Check, Image as ImageIcon, Share2 } from 'lucide-react-native';
import ShareCard from '@/components/ui/ShareCard';
import { useWorkoutStore } from '@/stores/workoutStore';
import { formatJapaneseDate, getWorkoutSummary } from '@/lib/workout';

export default function ShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const { selectedDate, workoutLogs } = useWorkoutStore();
  const date = params.date || selectedDate;
  const dayLogs = workoutLogs[date] || {};
  const summary = getWorkoutSummary(dayLogs);
  const previewWidth = Math.min(screenWidth - 36, 360);
  const captureTarget = useRef<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [template, setTemplate] = useState<'focus' | 'minimal'>('focus');
  const [caption, setCaption] = useState('今日もトレーニング完了！💪\n小さな積み重ねを続ける。\n\n#筋トレ #トレーニング記録 #DataLift');
  const [generating, setGenerating] = useState(false);

  const exercises = useMemo(() => Object.entries(dayLogs).map(([name, sets]) => ({
    name,
    sets: sets.map((set) => ({
      weight: Number(set.weight) || 0,
      reps: Number(set.reps) || 0,
    })),
  })), [dayLogs]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('写真へのアクセスが必要です', 'SNS画像に写真を使うため、写真ライブラリへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const generateAndShare = async () => {
    if (!exercises.length) {
      Alert.alert('トレーニング記録がありません', '先に今日のトレーニングを記録してください。');
      return;
    }
    try {
      setGenerating(true);
      const uri = await captureRef(captureTarget.current, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: caption });
      } else {
        Alert.alert('画像を生成しました', 'この端末では共有シートを利用できません。');
      }
    } catch (error) {
      console.error('Share image generation failed:', error);
      Alert.alert('画像を生成できませんでした', '少し待ってからもう一度お試しください。');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}><ArrowLeft size={21} color="#ffffff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>SNS画像を作る</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <View><Text style={styles.eyebrow}>TODAY'S WORKOUT</Text><Text style={styles.dateText}>{formatJapaneseDate(date)}</Text></View>
          <View style={styles.summaryPill}><Text style={styles.summaryText}>{summary.exercises}種目・{summary.sets}セット</Text></View>
        </View>

        {!exercises.length && (
          <TouchableOpacity style={styles.emptyNotice} onPress={() => router.push('/workout/record')}>
            <Text style={styles.emptyTitle}>今日のトレーニング記録がありません</Text>
            <Text style={styles.emptyLink}>先に記録する →</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>1. 写真を選ぶ</Text>
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.8}>
          {photo ? <Image source={{ uri: photo }} style={styles.photoThumb} /> : <View style={styles.photoIcon}><Camera size={22} color="#ff6b00" /></View>}
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>{photo ? '写真を変更' : 'トレーニング写真を追加'}</Text>
            <Text style={styles.photoSub}>縦向きの写真がおすすめです</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.label}>2. デザインを選ぶ</Text>
        <View style={styles.templates}>
          {([
            { id: 'focus', title: 'フォーカス', description: '写真と記録を大きく' },
            { id: 'minimal', title: 'ミニマル', description: '写真をより主役に' },
          ] as const).map((item) => {
            const active = template === item.id;
            return (
              <TouchableOpacity key={item.id} style={[styles.template, active && styles.templateActive]} onPress={() => setTemplate(item.id)}>
                <View style={[styles.templateIcon, active && styles.templateIconActive]}><ImageIcon size={18} color={active ? '#ff6b00' : '#7b8284'} /></View>
                <Text style={[styles.templateTitle, active && styles.templateTitleActive]}>{item.title}</Text>
                <Text style={styles.templateDescription}>{item.description}</Text>
                {active && <View style={styles.check}><Check size={12} color="#ffffff" /></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>3. プレビュー</Text>
        <View style={styles.previewFrame}>
          <ShareCard dateStr={date} volume={summary.volume} exercises={exercises} photoUri={photo} width={previewWidth} variant={template} />
        </View>

        <Text style={styles.label}>キャプション</Text>
        <View style={styles.captionCard}>
          <TextInput
            style={styles.captionInput}
            multiline
            value={caption}
            onChangeText={setCaption}
            placeholderTextColor="#596164"
            maxLength={500}
          />
          <Text style={styles.captionCount}>{caption.length} / 500</Text>
        </View>

        <TouchableOpacity style={[styles.shareButton, (!exercises.length || generating) && styles.shareButtonDisabled]} disabled={!exercises.length || generating} onPress={generateAndShare}>
          {generating ? <ActivityIndicator color="#ffffff" /> : <Share2 size={19} color="#ffffff" />}
          <Text style={styles.shareButtonText}>{generating ? '画像を生成中…' : '画像を生成してシェア'}</Text>
        </TouchableOpacity>
        <Text style={styles.shareHint}>共有先は端末の共有シートから選べます</Text>
        <View style={{ height: 30 }} />
      </ScrollView>

      <View style={styles.captureArea} pointerEvents="none">
        <ViewShot ref={captureTarget} options={{ format: 'png', quality: 1 }}>
          <ShareCard dateStr={date} volume={summary.volume} exercises={exercises} photoUri={photo} width={1080} variant={template} />
        </ViewShot>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050707' },
  header: { height: 60, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#202627' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111617', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  content: { padding: 18 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { color: '#ff6b00', fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 4 },
  dateText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  summaryPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: '#111617', borderWidth: 1, borderColor: '#242a2c' },
  summaryText: { color: '#8d9496', fontSize: 10, fontWeight: '700' },
  emptyNotice: { borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,107,0,0.35)', backgroundColor: 'rgba(255,107,0,0.08)', padding: 14, marginBottom: 20 },
  emptyTitle: { color: '#f5f5f5', fontSize: 13, fontWeight: '800', marginBottom: 5 },
  emptyLink: { color: '#ff7c26', fontSize: 12, fontWeight: '700' },
  label: { color: '#a5abad', fontSize: 12, fontWeight: '800', marginBottom: 10, marginTop: 2 },
  photoPicker: { height: 70, borderRadius: 16, borderWidth: 1, borderColor: '#252b2d', backgroundColor: '#0e1314', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 23 },
  photoIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,107,0,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  photoThumb: { width: 45, height: 45, borderRadius: 12, marginRight: 12 },
  photoTitle: { color: '#ffffff', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  photoSub: { color: '#697174', fontSize: 10 },
  chevron: { color: '#7f8688', fontSize: 26 },
  templates: { flexDirection: 'row', gap: 10, marginBottom: 23 },
  template: { flex: 1, minHeight: 100, borderRadius: 15, borderWidth: 1, borderColor: '#252b2d', backgroundColor: '#0e1314', padding: 12 },
  templateActive: { borderColor: '#ff6b00', backgroundColor: 'rgba(255,107,0,0.06)' },
  templateIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: '#171c1d', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  templateIconActive: { backgroundColor: 'rgba(255,107,0,0.12)' },
  templateTitle: { color: '#c9cdce', fontSize: 12, fontWeight: '800', marginBottom: 3 },
  templateTitleActive: { color: '#ffffff' },
  templateDescription: { color: '#626a6c', fontSize: 9 },
  check: { position: 'absolute', top: 9, right: 9, width: 19, height: 19, borderRadius: 10, backgroundColor: '#ff6b00', alignItems: 'center', justifyContent: 'center' },
  previewFrame: { alignSelf: 'center', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#2b3133', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  captionCard: { borderRadius: 16, borderWidth: 1, borderColor: '#252b2d', backgroundColor: '#0e1314', padding: 13, marginBottom: 16 },
  captionInput: { minHeight: 115, color: '#eef0f0', fontSize: 13, lineHeight: 20, padding: 0, textAlignVertical: 'top' },
  captionCount: { color: '#596164', fontSize: 9, textAlign: 'right', marginTop: 6 },
  shareButton: { height: 54, borderRadius: 14, backgroundColor: '#ff6b00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareButtonDisabled: { opacity: 0.42 },
  shareButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  shareHint: { color: '#626a6c', fontSize: 10, textAlign: 'center', marginTop: 10 },
  captureArea: { position: 'absolute', left: -5000, top: 0 },
});
