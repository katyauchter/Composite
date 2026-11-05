import { useState } from 'react';
import { Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { connectAppleHealth, healthAvailable, syncAppleHealth, type SyncResult } from '@/lib/health';
import { supabase } from '@/lib/supabase';

export default function Health() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(SyncResult & { at: Date }) | null>(null);
  const available = healthAvailable();

  async function sync(days: number) {
    setBusy(true);
    try {
      const r = await syncAppleHealth(userId, days);
      setResult({ ...r, at: new Date() });
    } catch (e: any) {
      Alert.alert('Sync failed', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Apple Health">
      <Card>
        {available ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Composite reads weight, body fat, lean mass, workouts, steps and active energy. It syncs the last few days
              every time you open the app.
            </ThemedText>
            <Button title="Connect Apple Health" kind="secondary" onPress={() => connectAppleHealth()} />
            <Button title="Sync last 14 days" onPress={() => sync(14)} busy={busy} />
            <Button title="Backfill last 90 days" kind="secondary" onPress={() => sync(90)} busy={busy} />
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Apple Health is only available in the iPhone app (development build), not on web or in Expo Go.
          </ThemedText>
        )}
        {result ? (
          <ThemedText type="small">
            Synced {result.bodyMetrics} body measurements, {result.workouts} workouts and {result.days} days of activity at{' '}
            {result.at.toLocaleTimeString()}.
          </ThemedText>
        ) : null}
      </Card>
      <Button title="Sign out" kind="secondary" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}
