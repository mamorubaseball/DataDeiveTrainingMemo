import type { SetRecord } from '@/stores/workoutStore';

export const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatJapaneseDate = (dateString: string, includeWeekday = true) => {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][new Date(year, month - 1, day).getDay()];
  return `${year}年${month}月${day}日${includeWeekday ? `（${weekday}）` : ''}`;
};

export const getWorkoutSummary = (logs: Record<string, SetRecord[]> = {}) => {
  const exercises = Object.entries(logs);
  const sets = exercises.reduce((sum, [, values]) => sum + values.length, 0);
  const volume = exercises.reduce(
    (total, [, values]) => total + values.reduce(
      (subtotal, set) => subtotal + (Number(set.weight) || 0) * (Number(set.reps) || 0),
      0,
    ),
    0,
  );
  return { exercises: exercises.length, sets, volume };
};
