import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import * as api from '@/lib/api';
import { colors, spacing } from '@/styles/theme';

export default function DashboardTab() {
  const [shop, setShop] = useState<{ name?: string; slug?: string; metrics?: { totalProducts?: number } } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await api.getMyShop();
    setShop(data.shop);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <Text style={styles.h1}>Dashboard</Text>
      <Text style={styles.sub}>{shop?.name || 'Loading…'}</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Products</Text>
        <Text style={styles.cardValue}>{shop?.metrics?.totalProducts ?? 0}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  h1: { fontSize: 24, fontWeight: '700', color: colors.secondary, padding: spacing.lg },
  sub: { paddingHorizontal: spacing.lg, color: colors.textLight },
  card: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: { color: colors.textLight, fontSize: 12 },
  cardValue: { fontSize: 28, fontWeight: '700', color: colors.secondary, marginTop: 4 },
});
