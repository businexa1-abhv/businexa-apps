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
import { Link, useRouter } from 'expo-router';
import * as api from '@/lib/api';
import { setStoredToken } from '@/lib/storage';
import { PasswordField } from '@/components/PasswordField';
import { validatePasswordStrength, isValidLoginEmail, passwordRequirementsShort } from '@businexa/shared';
import { colors, spacing } from '@/styles/theme';

export default function RegisterEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const em = email.trim().toLowerCase();
  const pw = validatePasswordStrength(password);

  const submit = async () => {
    if (!isValidLoginEmail(em)) {
      Alert.alert('Invalid', 'Enter a valid email address.');
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
    if (role === 'seller' && (!shopName.trim() || !shopAddress.trim())) {
      Alert.alert('Shop', 'Shop name and address are required for sellers.');
      return;
    }

    const digits = mobile.replace(/\D/g, '');
    const payload: api.RegisterPasswordPayload = {
      username: em,
      password,
      role,
      profile: {
        fullName: fullName.trim(),
        ...(digits.length === 10 ? { mobileNumber: digits } : {}),
      },
    };
    if (role === 'seller') {
      payload.shop = {
        name: shopName.trim(),
        address: shopAddress.trim(),
        category: shopCategory.trim(),
      };
    }

    setLoading(true);
    try {
      const { data } = await api.registerPassword(payload);
      const d = data as { success?: boolean; token?: string; message?: string };
      if (!d.success || !d.token) {
        Alert.alert('Error', d.message || 'Registration failed');
        return;
      }
      await setStoredToken(d.token);
      router.replace(role === 'buyer' ? '/' : '/(tabs)');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Registration failed';
      Alert.alert('Error', msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.hint}>{passwordRequirementsShort()}</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <PasswordField value={password} onChangeText={setPassword} autoCapitalize="none" />

        <Text style={styles.label}>Confirm password</Text>
        <PasswordField value={confirm} onChangeText={setConfirm} autoCapitalize="none" />

        <Text style={styles.section}>I am a</Text>
        <View style={styles.row}>
          <Pressable style={[styles.chip, role === 'buyer' && styles.chipOn]} onPress={() => setRole('buyer')}>
            <Text style={role === 'buyer' ? styles.chipTextOn : styles.chipText}>Buyer</Text>
          </Pressable>
          <Pressable style={[styles.chip, role === 'seller' && styles.chipOn]} onPress={() => setRole('seller')}>
            <Text style={role === 'seller' ? styles.chipTextOn : styles.chipText}>Seller</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Full name (optional)</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>Mobile (optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={10}
          value={mobile}
          onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
        />

        {role === 'seller' ? (
          <>
            <Text style={styles.section}>Shop</Text>
            <Text style={styles.label}>Shop name *</Text>
            <TextInput style={styles.input} value={shopName} onChangeText={setShopName} />
            <Text style={styles.label}>Shop address *</Text>
            <TextInput style={styles.input} value={shopAddress} onChangeText={setShopAddress} />
            <Text style={styles.label}>Category (optional)</Text>
            <TextInput style={styles.input} value={shopCategory} onChangeText={setShopCategory} />
          </>
        ) : null}

        <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={submit}>
          <Text style={styles.btnText}>{loading ? '…' : 'Create account'}</Text>
        </Pressable>

        <Link href="/login" asChild>
          <Pressable style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
            <Text style={styles.link}>Already have an account? Log in</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: 48, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.textLight, marginBottom: spacing.md },
  section: { fontWeight: '600', color: colors.secondary, marginTop: spacing.md, marginBottom: spacing.sm },
  label: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '600' },
});
