import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '@/lib/api';
import { colors, spacing } from '@/styles/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  const digits = mobile.replace(/\D/g, '').slice(-10);

  const onSend = async () => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
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
      <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={onSend}>
        <Text style={styles.btnText}>{loading ? '…' : 'Send OTP'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.lg },
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
});
