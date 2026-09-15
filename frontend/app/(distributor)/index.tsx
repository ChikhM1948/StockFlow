import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listMyStock } from '@/api/distributorStocks';
import { DistributorStockItem } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';

export default function MyStockScreen() {
  const [stocks, setStocks] = useState<DistributorStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      setStocks(await listMyStock());
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStock().finally(() => setLoading(false));
    }, [fetchStock])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStock();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 px-4 pt-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-2xl font-bold text-slate-900 mb-4">Mon Stock</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {stocks.length === 0 ? (
        <Text className="text-slate-500">
          Aucun stock attribué pour le moment. Contactez votre administrateur.
        </Text>
      ) : (
        stocks.map((s) => (
          <View key={s._id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
            <Text className="font-semibold text-slate-900">{s.productName}</Text>
            <Text className="text-slate-500 mt-1">
              {s.quantity} {s.unit} disponible(s)
            </Text>
            <Text className="text-slate-500">Dernier prix : {formatMoney(s.lastUnitPrice)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
