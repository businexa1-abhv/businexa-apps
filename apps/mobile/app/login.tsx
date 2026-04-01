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
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '@/lib/api';
import { setStoredToken } from '@/lib/storage';
import { isValidLoginEmail } from '@businexa/shared';
import { colors, spacing } from '@/styles/theme';

type AuthMethod = 'otp' | 'email';

export default function LoginScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>('otp');
  const [mobile, setMobile] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const digits = mobile.replace(/\D/g, '').slice(-10);

  const onSendOtp = async () => {
    if (digits.length !== 10) {
      Alert.alert('Invalid', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.sendOTP(digits, mode === 'login');
      if (!(data as { success?: boolean }).success) {
        Alert.alert('Error', (data as { message?: string }).message || 'Failed');
        return;
      }
      await AsyncStorage.setItem('businexa_otp_mobile', digits);
      await AsyncStorage.setItem('businexa_otp_mode', mode);
      router.push('/verify-otp');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Request failed';
      Alert.alert('Error', msg || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const onEmailLogin = async () => {
    const em = email.trim().toLowerCase();
    if (!isValidLoginEmail(em)) {
      Alert.alert('Invalid', 'Enter a valid email address.');
      return;
    }
    if (!password) {
      Alert.alert('Invalid', 'Enter your password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.loginPassword(em, password);
      const d = data as { success?: boolean; token?: string; message?: string };
      if (!d.success || !d.token) {
        Alert.alert('Error', d.message || 'Login failed');
        return;
      }
      await setStoredToken(d.token);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Login failed';
      Alert.alert('Error', msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome</Text>

        <View style={styles.methodRow}>
          <Pressable
            onPress={() => setMethod('otp')}
            style={[styles.methodTab, method === 'otp' && styles.methodTabOn]}
          >
            <Text style={[styles.methodTabText, method === 'otp' && styles.methodTabTextOn]}>Mobile OTP</Text>
          </Pressable>
          <Pressable
            onPress={() => setMethod('email')}
            style={[styles.methodTab, method === 'email' && styles.methodTabOn]}
          >
            <Text style={[styles.methodTabText, method === 'email' && styles.methodTabTextOn]}>Email</Text>
          </Pressable>
        </View>

        {method === 'otp' ? (
          <>
            <View style={styles.toggle}>
              <Pressable onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.tabOn]}>
                <Text style={styles.tabText}>Log in</Text>
              </Pressable>
              <Pressable onPress={() => setMode('signup')} style={[styles.tab, mode === 'signup' && styles.tabOn]}>
                <Text style={styles.tabText}>Sign up</Text>
              </Pressable>
            </View>
            <Text style={styles.label}>Mobile (+91)</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="9876543210"
              value={mobile}
              onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
            />
            <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={onSendOtp}>
              <Text style={styles.btnText}>{loading ? '…' : 'Send OTP'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={onEmailLogin}>
              <Text style={styles.btnText}>{loading ? '…' : 'Log in'}</Text>
            </Pressable>
            <Link href="/forgot-password" asChild>
              <Pressable style={styles.linkWrap}>
                <Text style={styles.link}>Forgot password?</Text>
              </Pressable>
            </Link>
            <Link href="/register-email" asChild>
              <Pressable style={styles.linkWrap}>
                <Text style={styles.link}>Create account with email</Text>
              </Pressable>
            </Link>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: 48, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.md },
  methodRow: { flexDirection: 'row', marginBottom: spacing.md, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  methodTab: { flex: 1, padding: spacing.sm, alignItems: 'center', backgroundColor: colors.surface },
  methodTabOn: { backgroundColor: colors.primary },
  methodTabText: { color: colors.text, fontWeight: '600' },
  methodTabTextOn: { color: '#fff' },
  toggle: { flexDirection: 'row', marginBottom: spacing.md, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, padding: spacing.sm, alignItems: 'center', backgroundColor: colors.surface },
  tabOn: { backgroundColor: colors.primary },
  tabText: { color: colors.text, fontWeight: '600' },
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
  linkWrap: { marginTop: spacing.md, alignItems: 'center' },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
