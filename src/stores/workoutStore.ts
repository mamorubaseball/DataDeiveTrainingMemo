import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { initializePurchases, loginUserToPurchases, logoutUserFromPurchases, checkPremiumStatus } from '@/services/purchaseService';


export interface SetRecord {
  weight: string;
  reps: string;
  rpe: string;
}

export interface WorkoutState {
  selectedDate: string;
  selectedCategory: string | null;
  selectedExercise: string | null;
  recentCategories: string[];
  categories: string[];
  exercisesByCategory: { [key: string]: string[] };
  
  // Store sets by date: { [dateStr]: { [exerciseName]: SetRecord[] } }
  workoutLogs: { [dateStr: string]: { [exerciseName: string]: SetRecord[] } };
  
  // Default/Previous records for reference
  previousRecords: { [exerciseName: string]: SetRecord[] };
  
  workoutNotes: { [dateStr: string]: string };

  plan: 'free' | 'premium';
  chatUsage: { [dateStr: string]: number };

  profile: {
    name: string;
    status: string;
    weight: string;
    muscleMass: string;
    fatPercentage: string;
    benchPressMax: number;
    squatMax: number;
    deadliftMax: number;
    email: string;
    gender: 'male' | 'female';
  };

  // Actions
  setSelectedDate: (date: string) => void;
  selectCategory: (category: string | null) => void;
  selectExercise: (exercise: string | null) => void;
  addRecentCategory: (category: string) => void;
  
  updateSet: (dateStr: string, exerciseName: string, index: number, field: keyof SetRecord, value: string) => void;
  addSet: (dateStr: string, exerciseName: string) => void;
  removeSet: (dateStr: string, exerciseName: string, index: number) => void;
  copyPreviousSets: (dateStr: string, exerciseName: string) => void;
  addExercise: (category: string, exerciseName: string) => void;
  getPersonalRecord: (exerciseName: string, beforeDate?: string) => { weight: number, reps: number } | null;
  updateWorkoutNote: (dateStr: string, note: string) => void;
  updateProfile: (profile: Partial<WorkoutState['profile']>) => void;
  logout: () => void;
  togglePlan: () => void;
  setPlan: (plan: 'free' | 'premium') => void;
  incrementChatUsage: () => boolean;
  syncLogsWithFirestore: (email: string) => Promise<void>;
  saveLogToFirestore: (dateStr: string) => Promise<void>;
  saveProfileToFirestore: () => Promise<void>;
}

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      selectedDate: getTodayString(),
  selectedCategory: null,
  selectedExercise: null,
  recentCategories: ['胸', '背中'],
  categories: ['胸', '背中', '肩', '脚', '腕', '腹筋', '有酸素', 'その他'],
  
  exercisesByCategory: {
    '胸': ['ベンチプレス', 'インクラインベンチ', 'ダンベルプレス', 'ダンベルフライ', 'チェストプレス', 'ペックフライ'],
    '背中': ['デッドリフト', 'ラットプルダウン', 'ベントオーバーロウ', 'チンニング(懸垂)', 'シーテッドロウ'],
    '肩': ['ショルダープレス', 'サイドレイズ', 'フロントレイズ', 'リアレイズ'],
    '脚': ['スクワット', 'レッグプレス', 'レッグエクステンション', 'レッグカール', 'カーフレイズ'],
    '腕': ['アームカール', 'ハンマーカール', 'スカルクラッシャー', 'トライセプスプッシュダウン'],
    '腹筋': ['クランチ', 'レッグレイズ', 'プランク', 'アブローラー'],
    '有酸素': ['ランニングマシーン', 'エアロバイク', 'クロストレーナー'],
    'その他': ['ストレッチ', '自重トレーニング'],
  },

  // Seed default data for previous workouts to show on index/detail screens
  workoutLogs: {
    '2026-07-04': {
      'ベンチプレス': [
        { weight: '75', reps: '8', rpe: '8' },
        { weight: '75', reps: '8', rpe: '8.5' },
        { weight: '72.5', reps: '10', rpe: '9' },
      ],
      'デッドリフト': [
        { weight: '120', reps: '5', rpe: '7.5' },
        { weight: '130', reps: '5', rpe: '8.5' },
        { weight: '140', reps: '3', rpe: '9.5' },
      ],
    },
    '2026-07-02': {
      'スクワット': [
        { weight: '100', reps: '8', rpe: '8' },
        { weight: '110', reps: '6', rpe: '8.5' },
        { weight: '120', reps: '5', rpe: '9' },
      ],
    },
    '2026-07-01': {
      'ラットプルダウン': [
        { weight: '55', reps: '10', rpe: '8' },
        { weight: '60', reps: '8', rpe: '8.5' },
      ],
    }
  },

  previousRecords: {
    'ベンチプレス': [
      { weight: '75', reps: '8', rpe: '8' },
      { weight: '75', reps: '8', rpe: '8.5' },
      { weight: '72.5', reps: '10', rpe: '9' },
    ],
    'デッドリフト': [
      { weight: '120', reps: '5', rpe: '7.5' },
      { weight: '120', reps: '5', rpe: '8' },
    ],
    'スクワット': [
      { weight: '100', reps: '8', rpe: '8' },
      { weight: '100', reps: '8', rpe: '8.5' },
    ],
  },

  workoutNotes: {
    '2026-07-04': 'ベンチプレスのメインセットで最終レップまで力強く押し切れた。肩や手首の違和感もなし。インクラインダンベルは少し重量が重く感じたので次回調整要。',
  },

  plan: 'free',
  chatUsage: {},

  profile: {
    name: 'マモル (Mamoru)',
    status: '筋トレ歴: 2.5年 | 増量中',
    weight: '70.2',
    muscleMass: '56.4',
    fatPercentage: '14.2',
    benchPressMax: 85,
    squatMax: 120,
    deadliftMax: 140,
    email: '',
    gender: 'male',
  },


  setSelectedDate: (date) => set({ selectedDate: date }),
  
  selectCategory: (category) => set({ selectedCategory: category }),
  
  selectExercise: (exercise) => set({ selectedExercise: exercise }),
  
  addRecentCategory: (category) => set((state) => {
    const filtered = state.recentCategories.filter(c => c !== category);
    return { recentCategories: [category, ...filtered].slice(0, 4) };
  }),

  updateSet: (dateStr, exerciseName, index, field, value) => {
    set((state) => {
      const logs = { ...state.workoutLogs };
      if (!logs[dateStr]) {
        logs[dateStr] = {};
      }
      if (!logs[dateStr][exerciseName]) {
        logs[dateStr][exerciseName] = [];
      }
      
      const updatedSets = [...logs[dateStr][exerciseName]];
      if (updatedSets[index]) {
        updatedSets[index] = {
          ...updatedSets[index],
          [field]: value
        };
      }
      
      return {
        workoutLogs: {
          ...state.workoutLogs,
          [dateStr]: {
            ...logs[dateStr],
            [exerciseName]: updatedSets
          }
        }
      };
    });
    get().saveLogToFirestore(dateStr);
  },

  addSet: (dateStr, exerciseName) => {
    set((state) => {
      const logs = { ...state.workoutLogs };
      const dateLogs = logs[dateStr] || {};
      const currentSets = dateLogs[exerciseName] || [];
      
      // Auto-fill weight from previous set or previous record
      let nextWeight = '';
      let nextReps = '';
      let nextRpe = '';

      if (currentSets.length > 0) {
        nextWeight = currentSets[currentSets.length - 1].weight;
      } else {
        const prevRec = state.previousRecords[exerciseName];
        if (prevRec && prevRec.length > 0) {
          nextWeight = prevRec[0].weight;
        }
      }

      const newSet: SetRecord = { weight: nextWeight, reps: nextReps, rpe: nextRpe };
      
      return {
        workoutLogs: {
          ...state.workoutLogs,
          [dateStr]: {
            ...dateLogs,
            [exerciseName]: [...currentSets, newSet]
          }
        }
      };
    });
    get().saveLogToFirestore(dateStr);
  },

  removeSet: (dateStr, exerciseName, index) => {
    set((state) => {
      const logs = { ...state.workoutLogs };
      const dateLogs = logs[dateStr] || {};
      const currentSets = dateLogs[exerciseName] || [];
      const updatedSets = currentSets.filter((_, i) => i !== index);
      
      return {
        workoutLogs: {
          ...state.workoutLogs,
          [dateStr]: {
            ...dateLogs,
            [exerciseName]: updatedSets
          }
        }
      };
    });
    get().saveLogToFirestore(dateStr);
  },

  copyPreviousSets: (dateStr, exerciseName) => {
    set((state) => {
      const prevRec = state.previousRecords[exerciseName] || [];
      if (prevRec.length === 0) return {};
      
      const dateLogs = state.workoutLogs[dateStr] || {};
      return {
        workoutLogs: {
          ...state.workoutLogs,
          [dateStr]: {
            ...dateLogs,
            [exerciseName]: prevRec.map(s => ({ ...s }))
          }
        }
      };
    });
    get().saveLogToFirestore(dateStr);
  },

  addExercise: (category, exerciseName) => set((state) => {
    const categoryExercises = state.exercisesByCategory[category] || [];
    if (categoryExercises.includes(exerciseName)) {
      return {};
    }
    return {
      exercisesByCategory: {
        ...state.exercisesByCategory,
        [category]: [...categoryExercises, exerciseName]
      }
    };
  }),

  getPersonalRecord: (exerciseName, beforeDate) => {
    const { workoutLogs, previousRecords } = get();
    let maxWeight = 0;
    let maxReps = 0;

    // Check previous records (seeded defaults)
    const seeded = previousRecords[exerciseName] || [];
    seeded.forEach(s => {
      const w = parseFloat(s.weight) || 0;
      const r = parseInt(s.reps) || 0;
      if (w > maxWeight || (w === maxWeight && r > maxReps)) {
        maxWeight = w;
        maxReps = r;
      }
    });

    // Check all logs
    Object.keys(workoutLogs).forEach(date => {
      // If beforeDate is provided, only check logs before that date
      if (beforeDate && new Date(date).getTime() >= new Date(beforeDate).getTime()) {
        return;
      }

      const exercises = workoutLogs[date];
      if (exercises && exercises[exerciseName]) {
        exercises[exerciseName].forEach(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          if (w > maxWeight || (w === maxWeight && r > maxReps)) {
            maxWeight = w;
            maxReps = r;
          }
        });
      }
    });

    return maxWeight > 0 ? { weight: maxWeight, reps: maxReps } : null;
  },

  updateWorkoutNote: (dateStr, note) => {
    set((state) => ({
      workoutNotes: {
        ...state.workoutNotes,
        [dateStr]: note
      }
    }));
    get().saveLogToFirestore(dateStr);
  },

  updateProfile: (updatedProfile) => {
    set((state) => ({
      profile: {
        ...state.profile,
        ...updatedProfile
      }
    }));
    get().saveProfileToFirestore();
  },

  logout: () => {
    auth().signOut().catch(err => console.error('Sign out error:', err));
    logoutUserFromPurchases();
    set((state) => ({
      profile: {
        ...state.profile,
        email: '', // Clear email to trigger auth screen
      },
      plan: 'free',
    }));
  },

  togglePlan: () => {
    const nextPlan = get().plan === 'free' ? 'premium' : 'free';
    set({ plan: nextPlan });
    get().saveProfileToFirestore();
  },

  setPlan: (plan) => {
    set({ plan });
    get().saveProfileToFirestore();
  },

  incrementChatUsage: () => {
    const today = getTodayString();
    const { plan, chatUsage } = get();
    const current = chatUsage[today] || 0;
    const limit = plan === 'premium' ? 100 : 5;

    if (current >= limit) {
      return false;
    }

    set((state) => ({
      chatUsage: {
        ...state.chatUsage,
        [today]: current + 1
      }
    }));
    return true;
  },

  syncLogsWithFirestore: async (email) => {
    try {
      // 1. Always set the email locally first to ensure the login state is active
      set((state) => ({
        profile: { ...state.profile, email },
      }));

      // Sync user to RevenueCat and check subscription status
      await initializePurchases();
      await loginUserToPurchases(email);
      const isPremium = await checkPremiumStatus();

      // 2. Fetch or initialize the user's profile in Firestore
      const userDoc = await firestore().collection('users').doc(email).get();
      let dbPlan: 'free' | 'premium' = 'free';
      
      if ((userDoc as any).exists) {
        const userData = userDoc.data();
        if (userData) {
          dbPlan = userData.plan || 'free';
          set((state) => ({
            profile: { ...state.profile, ...userData, email },
          }));
        }
      } else {
        // If the profile document doesn't exist yet, save the current local profile state
        await get().saveProfileToFirestore();
      }
      
      // Use RevenueCat premium status if available, fallback to database plan status
      const finalPlan = isPremium ? 'premium' : dbPlan;
      set({ plan: finalPlan });
      
      // 3. Sync workout logs
      const logsSnapshot = await firestore().collection('workout_logs').doc(email).collection('logs').get();
      const logs: WorkoutState['workoutLogs'] = {};
      const notes: WorkoutState['workoutNotes'] = {};
      
      logsSnapshot.forEach(doc => {
        const data = doc.data();
        const dateStr = doc.id;
        if (data.workoutLogs) {
          logs[dateStr] = data.workoutLogs;
        }
        if (data.workoutNotes) {
          notes[dateStr] = data.workoutNotes;
        }
      });
      
      set({
        workoutLogs: { ...get().workoutLogs, ...logs },
        workoutNotes: { ...get().workoutNotes, ...notes },
      });
    } catch (error) {
      console.error('Error syncing logs with Firestore:', error);
    }
  },

  saveLogToFirestore: async (dateStr) => {
    const { profile, workoutLogs, workoutNotes } = get();
    if (!profile.email) return;
    try {
      const dayLogs = workoutLogs[dateStr] || {};
      const dayNote = workoutNotes[dateStr] || '';
      
      await firestore()
        .collection('workout_logs')
        .doc(profile.email)
        .collection('logs')
        .doc(dateStr)
        .set({
          date: dateStr,
          workoutLogs: dayLogs,
          workoutNotes: dayNote,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (error) {
      console.error('Error saving log to Firestore:', error);
    }
  },

  saveProfileToFirestore: async () => {
    const { profile } = get();
    if (!profile.email) return;
    try {
      await firestore()
        .collection('users')
        .doc(profile.email)
        .set({
          name: profile.name,
          status: profile.status,
          weight: profile.weight,
          muscleMass: profile.muscleMass,
          fatPercentage: profile.fatPercentage,
          benchPressMax: profile.benchPressMax,
          squatMax: profile.squatMax,
          deadliftMax: profile.deadliftMax,
          gender: profile.gender,
          plan: get().plan,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (error) {
      console.error('Error saving profile to Firestore:', error);
    }
  },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist logs, custom exercises, and profile settings
      partialize: (state) => ({
        workoutLogs: state.workoutLogs,
        exercisesByCategory: state.exercisesByCategory,
        workoutNotes: state.workoutNotes,
        profile: state.profile,
        plan: state.plan,
        chatUsage: state.chatUsage,
      }),
    }
  )
);
