import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Dumbbell, ChevronRight } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import GlassCard from '@/components/ui/GlassCard';

export default function SelectExerciseScreen() {
  const router = useRouter();
  const { selectedCategory, exercisesByCategory, selectExercise, addExercise } = useWorkoutStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [customExercise, setCustomExercise] = useState('');

  // Default to empty array if no category selected
  const category = selectedCategory || '胸';
  const exercises = exercisesByCategory[category] || [];

  // Filter exercises based on search query
  const filteredExercises = exercises.filter(ex =>
    ex.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExerciseSelect = (exercise: string) => {
    selectExercise(exercise);
    // Navigate to input sets screen
    router.push('/workout/input-set');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category} の種目</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#888888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="種目を検索..."
          placeholderTextColor="#555555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 新しい種目の追加 */}
        <Text style={styles.sectionHeader}>カスタム種目を追加</Text>
        <GlassCard style={styles.addCard}>
          <View style={styles.addInputRow}>
            <TextInput
              style={styles.addInput}
              placeholder="新しい種目名を入力..."
              placeholderTextColor="#555555"
              value={customExercise}
              onChangeText={setCustomExercise}
              autoCorrect={false}
              maxLength={20}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: customExercise.trim() ? '#ff6b00' : 'rgba(255, 107, 0, 0.2)' }
              ]}
              activeOpacity={0.8}
              disabled={!customExercise.trim()}
              onPress={() => {
                if (customExercise.trim()) {
                  addExercise(category, customExercise.trim());
                  setCustomExercise('');
                }
              }}
            >
              <Text style={styles.addButtonText}>追加</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Exercise List */}
        <Text style={styles.sectionHeader}>種目を選択</Text>
        
        {filteredExercises.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredExercises.map((exercise, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => handleExerciseSelect(exercise)}
                style={styles.itemWrapper}
              >
                <GlassCard style={styles.item}>
                  <View style={styles.itemContent}>
                    <View style={styles.itemLeft}>
                      <View style={styles.iconCircle}>
                        <Dumbbell size={16} color="#ff6b00" />
                      </View>
                      <Text style={styles.exerciseName}>{exercise}</Text>
                    </View>
                    <ChevronRight size={18} color="#ff6b00" />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>該当する種目が見つかりません</Text>
          </View>
        )}

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
    fontSize: 15,
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
    marginTop: 10,
  },
  listContainer: {
    gap: 12,
  },
  itemWrapper: {
    width: '100%',
  },
  item: {
    padding: 0,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#555555',
    fontSize: 14,
  },
  addCard: {
    marginBottom: 20,
    padding: 12,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addButton: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
