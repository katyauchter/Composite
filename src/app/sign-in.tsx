import { useState } from 'react';
import { Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';

/** Email one-time code sign-in. Sign in with Apple gets added once the developer account is active. */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setBusy(false);
    if (error) return Alert.alert('Could not send code', error.message);
    setSent(true);
  }

  async function verify() {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) Alert.alert('That code did not work', error.message);
  }

  return (
    <Screen title="Composite">
      <ThemedText themeColor="textSecondary">All your nutrition, training and body data in one place.</ThemedText>
      <Card>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        {sent ? (
          <>
            <Field label="6-digit code from your email" value={code} onChangeText={setCode} keyboardType="number-pad" />
            <Button title="Sign in" onPress={verify} busy={busy} />
          </>
        ) : (
          <Button title="Email me a code" onPress={sendCode} busy={busy} />
        )}
      </Card>
    </Screen>
  );
}
