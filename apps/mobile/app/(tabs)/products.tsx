import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, RefreshControl } from 'react-native';
import * as api from '@/lib/api';
import { colors, spacing } from '@/styles/theme';

type Product = { _id: string; name: string; imageUrl?: string; priceNumber?: number };

export default function ProductsTab() {
  const [items, setItems] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await api.getMyProducts(1, 50);
    setItems((data.products as Product[]) || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      contentContainerStyle={{ padding: spacing.md, backgroundColor: colors.background }}
      ListHeaderComponent={<Text style={styles.h1}>Products</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.ph]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            {item.priceNumber != null ? <Text style={styles.price}>₹{item.priceNumber}</Text> : null}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: 8 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.border },
  ph: { justifyContent: 'center', alignItems: 'center' },
  name: { fontWeight: '600', color: colors.text },
  price: { color: colors.primary, marginTop: 4 },
});
