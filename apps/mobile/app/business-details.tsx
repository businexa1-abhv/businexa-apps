import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as api from '@/lib/api';
import { colors, spacing } from '@/styles/theme';

export default function BusinessDetailsScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('General');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Shop name is required');
      return;
    }
    setLoading(true);
    try {
      await api.createShop({
        name: name.trim(),
        address: address.trim(),
        category,
        whatsappNumber: whatsapp.replace(/\D/g, '').slice(0, 10) || undefined,
        email: email.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed';
      Alert.alert('Error', msg || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set up your shop</Text>
      <Field label="Shop name *" value={name} onChangeText={setName} />
      <Field label="Address" value={address} onChangeText={setAddress} />
      <Field label="WhatsApp" value={whatsapp} onChangeText={(v) => setWhatsapp(v.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Pressable style={[styles.btn, loading && { opacity: 0.6 }]} disabled={loading} onPress={save}>
        <Text style={styles.btnText}>{loading ? '…' : 'Continue'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.lg },
  label: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  btn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: 8, alignItems: 'center', marginTop: spacing.md },
  btnText: { color: '#fff', fontWeight: '600' },
});
