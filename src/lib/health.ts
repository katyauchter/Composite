/**
 * Apple Health sync.
 *
 * Reads weight, body composition, workouts, steps and active energy straight
 * from HealthKit on the phone and upserts them into Supabase. Each HealthKit
 * sample's UUID is stored as external_id, so re-running a sync never creates
 * duplicates. This replaces the Health Auto Export app.
 */
import {
  isHealthDataAvailable,
  queryQuantitySamples,
  queryStatisticsForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
  WorkoutActivityType,
} from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';

import { addDays, localDay, startOfLocalDay } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

const READ_TYPES = [
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierBodyFatPercentage',
  'HKQuantityTypeIdentifierLeanBodyMass',
  'HKQuantityTypeIdentifierBodyMassIndex',
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKWorkoutTypeIdentifier',
] as const;

export function healthAvailable(): boolean {
  return Platform.OS === 'ios' && isHealthDataAvailable();
}

/** Shows Apple's permission sheet (only the first time; later calls return immediately). */
export async function connectAppleHealth(): Promise<boolean> {
  if (!healthAvailable()) return false;
  return requestAuthorization({ toRead: READ_TYPES });
}

type BodyMetric = 'weight_kg' | 'body_fat_pct' | 'lean_mass_kg' | 'bmi';

const BODY_TYPES: { id: (typeof READ_TYPES)[number]; metric: BodyMetric; unit: string; scale?: number }[] = [
  { id: 'HKQuantityTypeIdentifierBodyMass', metric: 'weight_kg', unit: 'kg' },
  // HealthKit stores body fat as a fraction (0.26); we store percent (26).
  { id: 'HKQuantityTypeIdentifierBodyFatPercentage', metric: 'body_fat_pct', unit: '%', scale: 100 },
  { id: 'HKQuantityTypeIdentifierLeanBodyMass', metric: 'lean_mass_kg', unit: 'kg' },
  { id: 'HKQuantityTypeIdentifierBodyMassIndex', metric: 'bmi', unit: 'count' },
];

export type SyncResult = { bodyMetrics: number; workouts: number; days: number };

/** Pulls the last `days` days from Apple Health into Supabase. Safe to run repeatedly. */
export async function syncAppleHealth(userId: string, days = 14): Promise<SyncResult> {
  await connectAppleHealth();
  const since = startOfLocalDay(addDays(new Date(), -days));
  const result: SyncResult = { bodyMetrics: 0, workouts: 0, days: 0 };

  // 1. Weight and body composition
  for (const t of BODY_TYPES) {
    const samples = await queryQuantitySamples(t.id as 'HKQuantityTypeIdentifierBodyMass', {
      limit: 0,
      unit: t.unit as 'kg',
      filter: { date: { startDate: since } },
    });
    const rows = samples.map((s) => {
      // Guard against either convention: 0.26 (fraction) or 26 (percent).
      const value = t.scale && s.quantity <= 1 ? s.quantity * t.scale : s.quantity;
      return {
        user_id: userId,
        metric: t.metric,
        value,
        measured_at: s.startDate.toISOString(),
        source: 'apple_health' as const,
        external_id: s.uuid,
      };
    });
    if (rows.length) {
      const { error } = await supabase
        .from('body_metrics')
        .upsert(rows, { onConflict: 'user_id,source,external_id' });
      if (error) throw error;
      result.bodyMetrics += rows.length;
    }
  }

  // 2. Workouts
  const workouts = await queryWorkoutSamples({ limit: 0, filter: { date: { startDate: since } } });
  const workoutRows = workouts.map((w) => {
    const json = w.toJSON();
    w.dispose();
    return {
      user_id: userId,
      activity_type: WorkoutActivityType[json.workoutActivityType] ?? String(json.workoutActivityType),
      started_at: json.startDate.toISOString(),
      ended_at: json.endDate.toISOString(),
      duration_min: Math.round((json.duration.quantity / 60) * 10) / 10,
      energy_kcal: json.totalEnergyBurned?.quantity ?? null,
      distance_m: json.totalDistance?.quantity ?? null,
      source: 'apple_health' as const,
      external_id: json.uuid,
    };
  });
  if (workoutRows.length) {
    const { error } = await supabase
      .from('workouts')
      .upsert(workoutRows, { onConflict: 'user_id,source,external_id' });
    if (error) throw error;
    result.workouts = workoutRows.length;
  }

  // 3. Daily steps and active energy (HealthKit de-duplicates phone + watch for us)
  const activityRows = [];
  for (let i = 0; i <= days; i++) {
    const start = startOfLocalDay(addDays(new Date(), -i));
    const end = addDays(start, 1);
    const filter = { date: { startDate: start, endDate: end } };
    const [steps, energy] = await Promise.all([
      queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], { filter, unit: 'count' }),
      queryStatisticsForQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', ['cumulativeSum'], {
        filter,
        unit: 'kcal',
      }),
    ]);
    activityRows.push({
      user_id: userId,
      day: localDay(start),
      steps: steps.sumQuantity ? Math.round(steps.sumQuantity.quantity) : null,
      active_energy_kcal: energy.sumQuantity ? Math.round(energy.sumQuantity.quantity) : null,
      source: 'apple_health' as const,
      updated_at: new Date().toISOString(),
    });
  }
  const { error } = await supabase.from('daily_activity').upsert(activityRows, { onConflict: 'user_id,day,source' });
  if (error) throw error;
  result.days = activityRows.length;

  return result;
}
