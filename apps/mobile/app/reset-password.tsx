import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as api from '@/lib/api';
import { validatePasswordStrength, passwordRequirementsShort } from '@businexa/shared';
import { colors, spacing } from '@/styles/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const pw = validatePasswordStrength(password);

  const submit = async () => {
    if (!token) {
      Alert.alert('Invalid link', 'Open the reset link from your email.');
      return;
    }
    if (!pw.ok) {
      Alert.alert('Password', pw.message || 'Invalid password');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.resetPassword(token, password);
      const d = data as { success?: boolean; message?: string };
      if (!d.success) {
        Alert.alert('Error', d.message || 'Reset failed');
        return;
      }
      Alert.alert('Success', 'Password updated.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Reset failed';
      Alert.alert('Error', msg || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New password</Text>
        <Text style={styles.hint}>{passwordRequirementsShort()}</Text>
        {!token ? <Text style={styles.err}>Missing token — use the link from your email.</Text> : null}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Text style={styles.label}>Confirm</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
        <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={submit}>
          <Text style={styles.btnText}>{loading ? '…' : 'Update password'}</Text>
        </Pressable>
        <Link href="/login" asChild>
          <Pressable style={{ marginTop: spacing.md }}>
            <Text style={styles.link}>← Back to log in</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: 48, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.textLight, marginBottom: spacing.md },
  err: { color: '#c00', marginBottom: spacing.md },
  label: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  btn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '600' },
});
