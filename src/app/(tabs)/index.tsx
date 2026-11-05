import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Card, Screen, Stat } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { addDays, localDay } from '@/lib/dates';
import { healthAvailable, syncAppleHealth } from '@/lib/health';
import { supabase } from '@/lib/supabase';

type Summary = {
  day: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  steps: number | null;
  active_energy_kcal: number | null;
};
type Targets = {
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
};
type Latest = { weight_kg?: number; body_fat_pct?: number };

const fmt = (n: number | null | undefined, unit = '') => (n == null ? '–' : `${Math.round(Number(n))}${unit}`);

export default function Today() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [today, setToday] = useState<Summary | null>(null);
  const [week, setWeek] = useState<Summary[]>([]);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [latest, setLatest] = useState<Latest>({});
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const weekStart = localDay(addDays(new Date(), -6));
    const [summaries, profile, metrics, workouts] = await Promise.all([
      supabase.from('daily_summary').select('*').gte('day', weekStart).order('day'),
      supabase.from('profiles').select('target_calories,target_protein_g,target_carbs_g,target_fat_g').single(),
      supabase.from('body_metrics').select('metric,value').in('metric', ['weight_kg', 'body_fat_pct']).order('measured_at', { ascending: false }).limit(20),
      supabase.from('workouts').select('id', { count: 'exact', head: true }).gte('started_at', addDays(new Date(), -6).toISOString()),
    ]);
    const rows = (summaries.data ?? []) as Summary[];
    setWeek(rows);
    setToday(rows.find((r) => r.day === localDay()) ?? null);
    setTargets((profile.data as Targets) ?? null);
    const l: Latest = {};
    for (const m of metrics.data ?? []) {
      if (m.metric === 'weight_kg' && l.weight_kg == null) l.weight_kg = Number(m.value);
      if (m.metric === 'body_fat_pct' && l.body_fat_pct == null) l.body_fat_pct = Number(m.value);
    }
    setLatest(l);
    setWorkoutsThisWeek(workouts.count ?? 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      // Pull the last few days from Apple Health every time the app opens.
      if (healthAvailable()) {
        syncAppleHealth(userId, 3)
          .then(() => {
            setSyncNote(null);
            return load();
          })
          .catch((e) => setSyncNote(`Apple Health sync failed: ${e.message ?? e}`));
      }
    }, [load, userId]),
  );

  const loggedDays = week.filter((d) => d.calories != null);
  const avg = (k: keyof Summary) =>
    loggedDays.length ? loggedDays.reduce((s, d) => s + Number(d[k] ?? 0), 0) / loggedDays.length : null;

  return (
    <Screen title="Today">
      {syncNote ? <ThemedText type="small" themeColor="textSecondary">{syncNote}</ThemedText> : null}
      <Card>
        <ThemedText type="smallBold">Nutrition</ThemedText>
        <Stat label="Calories" value={fmt(today?.calories)} target={targets?.target_calories ? fmt(targets.target_calories) : undefined} />
        <Stat label="Protein" value={fmt(today?.protein_g, 'g')} target={targets?.target_protein_g ? fmt(targets.target_protein_g, 'g') : undefined} />
        <Stat label="Carbs" value={fmt(today?.carbs_g, 'g')} target={targets?.target_carbs_g ? fmt(targets.target_carbs_g, 'g') : undefined} />
        <Stat label="Fat" value={fmt(today?.fat_g, 'g')} target={targets?.target_fat_g ? fmt(targets.target_fat_g, 'g') : undefined} />
      </Card>
      <Card>
        <ThemedText type="smallBold">Activity</ThemedText>
        <Stat label="Steps" value={fmt(today?.steps)} />
        <Stat label="Active energy" value={fmt(today?.active_energy_kcal, ' kcal')} />
        <Stat label="Workouts (last 7 days)" value={String(workoutsThisWeek)} />
      </Card>
      <Card>
        <ThemedText type="smallBold">Body</ThemedText>
        <Stat label="Weight" value={latest.weight_kg ? `${(latest.weight_kg * 2.20462).toFixed(1)} lb` : '–'} />
        <Stat label="Body fat" value={latest.body_fat_pct ? `${latest.body_fat_pct.toFixed(1)}%` : '–'} />
      </Card>
      <Card>
        <ThemedText type="smallBold">Last 7 days ({loggedDays.length} logged)</ThemedText>
        <Stat label="Avg calories" value={fmt(avg('calories'))} />
        <Stat label="Avg protein" value={fmt(avg('protein_g'), 'g')} />
      </Card>
    </Screen>
  );
}
