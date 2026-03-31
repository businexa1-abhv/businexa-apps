import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/styles/theme';

export default function SettingsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Settings</Text>
      <Text style={styles.p}>Theme, language, and notifications — extend with preferences API.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  h1: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.md },
  p: { color: colors.textLight },
});
