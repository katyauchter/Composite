import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { localDay } from '@/lib/dates';
import { supabase } from '@/lib/supabase';

const toNum = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));

export default function Log() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [day, setDay] = useState(localDay());
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastParsed, setLastParsed] = useState<string | null>(null);

  async function saveManual() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return Alert.alert('Date should look like 2026-11-05');
    setSaving(true);
    const { error } = await supabase.from('nutrition_entries').insert({
      user_id: userId,
      day,
      source: 'manual',
      label: 'Manual entry',
      calories: toNum(calories),
      protein_g: toNum(protein),
      carbs_g: toNum(carbs),
      fat_g: toNum(fat),
    });
    setSaving(false);
    if (error) return Alert.alert('Could not save', error.message);
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    Alert.alert('Saved');
  }

  async function addScreenshot() {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    setUploading(true);
    try {
      const bytes = await (await fetch(asset.uri)).arrayBuffer();
      const contentType = asset.mimeType ?? 'image/jpeg';
      const path = `${userId}/${day}/${Date.now()}.${contentType.split('/')[1] ?? 'jpg'}`;
      const up = await supabase.storage.from('screenshots').upload(path, bytes, { contentType });
      if (up.error) throw up.error;

      const ins = await supabase
        .from('screenshots')
        .insert({ user_id: userId, day, storage_path: path })
        .select('id')
        .single();
      if (ins.error) throw ins.error;

      const { data, error } = await supabase.functions.invoke('parse-screenshot', {
        body: { screenshot_id: ins.data.id },
      });
      if (error) throw error;
      const p = data.parsed;
      setLastParsed(
        `${day}: ${p.calories ?? '?'} kcal · P ${p.protein_g ?? '?'}g · C ${p.carbs_g ?? '?'}g · F ${p.fat_g ?? '?'}g (${p.confidence ?? 'unknown'} confidence)`,
      );
    } catch (e: any) {
      Alert.alert('Screenshot failed', e.message ?? String(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Screen title="Log nutrition">
      <Field label="Day (YYYY-MM-DD)" value={day} onChangeText={setDay} autoCapitalize="none" />
      <Card>
        <ThemedText type="smallBold">From a screenshot</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Pick a screenshot of the day's totals from any nutrition app. Composite reads the numbers for you.
        </ThemedText>
        <Button title="Choose screenshot" onPress={addScreenshot} busy={uploading} />
        {lastParsed ? <ThemedText type="small">{lastParsed}</ThemedText> : null}
      </Card>
      <Card>
        <ThemedText type="smallBold">Enter manually</ThemedText>
        <Field label="Calories" value={calories} onChangeText={setCalories} keyboardType="decimal-pad" />
        <Field label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
        <Field label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
        <Field label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
        <Button title="Save" onPress={saveManual} busy={saving} />
      </Card>
    </Screen>
  );
}
