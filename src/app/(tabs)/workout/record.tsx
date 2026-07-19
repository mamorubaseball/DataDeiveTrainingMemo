import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import GlassCard from '@/components/ui/GlassCard';

export default function RecordCategoryScreen() {
  const router = useRouter();
  const { categories, recentCategories, selectCategory, addRecentCategory } = useWorkoutStore();

  const handleCategorySelect = (category: string) => {
    selectCategory(category);
    addRecentCategory(category);
    // Navigate to exercise selection screen
    router.push('/workout/select-exercise');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>部位を選択</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 最近使用した部位 */}
        <Text style={styles.sectionHeader}>最近よく使う部位</Text>
        <View style={styles.recentContainer}>
          {recentCategories.map((category, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              style={styles.recentItemWrapper}
              onPress={() => handleCategorySelect(category)}
            >
              <GlassCard style={styles.recentItem}>
                <Text style={styles.recentText}>{category}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* 部位一覧 */}
        <Text style={styles.sectionHeader}>すべての部位</Text>
        <View style={styles.listContainer}>
          {categories.map((category, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => handleCategorySelect(category)}
              style={styles.listItemWrapper}
            >
              <GlassCard style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <ChevronRight size={18} color="#ff6b00" />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Spacer to clear bottom tab bar */}
        <View style={{ height: 110 }} />
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
    paddingTop: 20,
  },
  sectionHeader: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  recentContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  recentItemWrapper: {
    flex: 1,
  },
  recentItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.25)',
    backgroundColor: 'rgba(255, 107, 0, 0.02)',
  },
  recentText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 12,
  },
  listItemWrapper: {
    width: '100%',
  },
  listItem: {
    padding: 0,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  categoryName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
