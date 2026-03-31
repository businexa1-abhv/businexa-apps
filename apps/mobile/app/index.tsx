import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { colors, spacing } from '@/styles/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Businexa</Text>
      <Text style={styles.tagline}>Your shop online in minutes</Text>
      <Link href="/login" asChild>
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>Get started</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  logo: { fontSize: 28, fontWeight: '700', color: colors.primary },
  tagline: { marginTop: spacing.md, color: colors.textLight, textAlign: 'center' },
  btn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
