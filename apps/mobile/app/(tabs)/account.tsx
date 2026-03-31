import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { setStoredToken } from '@/lib/storage';
import { colors, spacing } from '@/styles/theme';

export default function AccountTab() {
  const router = useRouter();

  const logout = async () => {
    await setStoredToken(null);
    Alert.alert('Signed out');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Account</Text>
      <Pressable style={styles.btn} onPress={logout}>
        <Text style={styles.btnText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  h1: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.lg },
  btn: { backgroundColor: colors.secondary, padding: spacing.md, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
