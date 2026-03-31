import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '@/lib/api';
import { setStoredToken } from '@/lib/storage';
import { signInWithCustomTokenFromApi } from '@/lib/auth';
import { colors, spacing } from '@/styles/theme';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('businexa_otp_mobile').then((m) => {
      if (!m) router.replace('/login');
      else setMobile(m);
    });
  }, [router]);

  const verify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { data } = await api.verifyOTP(mobile, otp, 'seller');
      if (!(data as { success?: boolean }).success || !(data as { firebaseToken?: string }).firebaseToken) {
        Alert.alert('Error', (data as { message?: string }).message || 'Failed');
        return;
      }
      const token = await signInWithCustomTokenFromApi((data as { firebaseToken: string }).firebaseToken);
      await setStoredToken(token);
      await AsyncStorage.multiRemove(['businexa_otp_mobile', 'businexa_otp_mode']);
      const isNew = (data as { user?: { isNewUser?: boolean } }).user?.isNewUser;
      router.replace(isNew ? '/business-details' : '/(tabs)');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Verification failed';
      Alert.alert('Error', msg || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.sub}>+91 {mobile}</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="000000"
        value={otp}
        onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
      />
      <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={verify}>
        <Text style={styles.btnText}>{loading ? '…' : 'Verify'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.secondary },
  sub: { marginTop: spacing.sm, color: colors.textLight, marginBottom: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 20,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: colors.surface,
  },
  btn: { marginTop: spacing.lg, backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
