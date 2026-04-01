import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import * as api from '@/lib/api';
import { isValidLoginEmail } from '@businexa/shared';
import { colors, spacing } from '@/styles/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const e = email.trim().toLowerCase();
    if (!isValidLoginEmail(e)) {
      Alert.alert('Invalid', 'Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await api.forgotPassword(e);
      setDone(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Request failed';
      Alert.alert('Error', msg || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          If an account exists for this address, you will receive reset instructions shortly.
        </Text>
        <Link href="/login" asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Back to log in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={submit}>
          <Text style={styles.btnText}>{loading ? '…' : 'Send reset link'}</Text>
        </Pressable>
        <Link href="/login" asChild>
          <Pressable style={{ marginTop: spacing.md }}>
            <Text style={styles.link}>← Back</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingTop: 48, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.lg },
  body: { color: colors.textLight, marginBottom: spacing.lg, lineHeight: 22 },
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
