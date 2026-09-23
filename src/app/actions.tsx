import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, FileText, Image as ImageIcon, X } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getTodayString } from '@/lib/workout';

const actions = [
  {
    title: 'トレーニングを記録',
    description: '種目・重量・回数をすばやく入力',
    icon: Dumbbell,
    color: '#ff6b00',
    route: '/workout/record' as const,
  },
  {
    title: 'トレーニングメモ',
    description: '今日の気づきや感覚を残す',
    icon: FileText,
    color: '#ff6b00',
    route: '/memo' as const,
  },
  {
    title: 'SNS画像を作る',
    description: '今日の記録と写真から画像を生成',
    icon: ImageIcon,
    color: '#39d98a',
    route: '/share' as const,
  },
];

export default function ActionsScreen() {
  const router = useRouter();
  const setSelectedDate = useWorkoutStore((state) => state.setSelectedDate);

  const openAction = (route: (typeof actions)[number]['route']) => {
    setSelectedDate(getTodayString());
    router.replace(route as any);
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        accessibilityLabel="閉じる"
        onPress={() => router.back()}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>QUICK ACTION</Text>
            <Text style={styles.title}>何を記録しますか？</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={20} color="#9a9a9a" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionList}>
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={styles.action}
                activeOpacity={0.75}
                onPress={() => openAction(item.route)}
              >
                <View style={[styles.iconBox, { borderColor: `${item.color}55` }]}>
                  <Icon size={23} color={item.color} strokeWidth={2} />
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionDescription}>{item.description}</Text>
                </View>
                <Text style={[styles.arrow, { color: item.color }]}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  sheet: {
    backgroundColor: '#0b0f10',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#252b2d',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b4143',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    color: '#ff6b00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  title: { color: '#ffffff', fontSize: 21, fontWeight: '800' },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#151a1c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionList: { gap: 10 },
  action: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252b2d',
    backgroundColor: '#121719',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: '#0c1011',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: { flex: 1, marginLeft: 13 },
  actionTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  actionDescription: { color: '#82898b', fontSize: 12 },
  arrow: { fontSize: 27, fontWeight: '300' },
});
