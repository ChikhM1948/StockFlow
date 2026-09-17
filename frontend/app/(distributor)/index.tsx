import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listMyStock } from '@/api/distributorStocks';
import { DistributorStockItem } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import { AlertTriangle, Boxes, CircleDollarSign, Package, Warehouse } from 'lucide-react-native';

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

  const totalUnits = stocks.reduce((total, stock) => total + stock.quantity, 0);
  const totalValue = stocks.reduce((total, stock) => total + stock.quantity * stock.lastUnitPrice, 0);

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
      <View className="pt-2 mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-blue-600 items-center justify-center mr-3">
            <Warehouse size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Mon stock</Text>
            <Text className="text-slate-500 mt-0.5">Suivez vos articles disponibles sur le terrain.</Text>
          </View>
        </View>
      </View>

      <View className="bg-slate-900 rounded-2xl p-4 mb-5 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <Boxes size={19} color="#93C5FD" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Inventaire actuel</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">{totalUnits} unité(s)</Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-xs">Valeur estimée</Text>
          <Text className="text-blue-200 font-bold mt-1">{formatMoney(totalValue)}</Text>
        </View>
      </View>

      {error && (
        <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">
          <AlertTriangle size={17} color="#DC2626" />
          <Text className="text-red-700 ml-2 flex-1">{error}</Text>
        </View>
      )}

      {stocks.length === 0 ? (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
            <Package size={22} color="#64748B" />
          </View>
          <Text className="text-slate-900 font-bold">Aucun stock attribué</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Contactez votre administrateur pour recevoir vos premiers articles.</Text>
        </View>
      ) : (
        <>
          <View className="flex-row items-center mb-2">
            <Package size={17} color="#475569" />
            <Text className="text-base font-bold text-slate-800 ml-2">Articles en stock</Text>
            <View className="bg-slate-200 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-slate-600 text-xs font-bold">{stocks.length}</Text>
            </View>
          </View>
          {stocks.map((s) => (
            <View key={s._id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
              <View className="flex-row items-start">
                <View className="w-11 h-11 rounded-2xl bg-blue-50 items-center justify-center mr-3">
                  <Package size={20} color="#2563EB" strokeWidth={2.1} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 text-base">{s.productName}</Text>
                  <View className="flex-row items-center mt-1">
                    <Boxes size={13} color="#64748B" />
                    <Text className="text-slate-500 text-xs ml-1.5">{s.quantity} {s.unit} disponible(s)</Text>
                  </View>
                </View>
                <View className="bg-emerald-50 rounded-full px-2 py-1">
                  <Text className="text-emerald-700 text-xs font-semibold">Disponible</Text>
                </View>
              </View>
              <View className="flex-row items-center mt-4 pt-3 border-t border-slate-100">
                <CircleDollarSign size={15} color="#64748B" />
                <Text className="text-slate-500 text-xs ml-1.5">Dernier prix unitaire</Text>
                <Text className="text-slate-900 text-sm font-bold ml-auto">{formatMoney(s.lastUnitPrice)}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
