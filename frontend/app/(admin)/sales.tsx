import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listSales } from '@/api/sales';
import { listDistributors } from '@/api/auth';
import { SaleDoc, User } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import { useBrandTheme } from '@/context/BrandThemeContext';

const POLL_INTERVAL_MS = 5000;

function relativeTime(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 10) return "à l'instant";
  if (diffSec < 60) return `il y a ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

function distributorName(sale: SaleDoc): string {
  return typeof sale.distributor === 'string' ? sale.distributor : sale.distributor.name;
}

function SaleCard({ sale }: { sale: SaleDoc }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <Text className="font-semibold text-slate-900">{sale.saleNumber}</Text>
          <Text className="text-slate-500 text-xs mt-0.5">{distributorName(sale)}</Text>
        </View>
        <Text className="text-slate-400 text-xs">{relativeTime(sale.date)}</Text>
      </View>

      <Text className="text-slate-500 text-sm mt-2">Client : {sale.customer.name}</Text>

      <View className="mt-2 pt-2 border-t border-slate-100">
        {sale.items.map((item, i) => (
          <View key={i} className="flex-row justify-between">
            <Text className="text-slate-600 text-sm">
              {item.name} × {item.quantity} {item.unit}
            </Text>
            <Text className="text-slate-600 text-sm">{formatMoney(item.total)}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100">
        <Text className="text-xs text-slate-400">
          {sale.paymentStatus === 'PAID' ? 'Payé' : sale.paymentStatus === 'PARTIAL' ? 'Partiel' : 'Impayé'}
        </Text>
        <Text className="text-base font-bold text-slate-900">{formatMoney(sale.totalAmount)}</Text>
      </View>
    </View>
  );
}

export default function AdminSalesScreen() {
  const { primaryColor } = useBrandTheme();
  const [sales, setSales] = useState<SaleDoc[]>([]);
  const [distributors, setDistributors] = useState<User[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [salesList, distributorsList] = await Promise.all([listSales(), listDistributors()]);
      setSales(salesList);
      setDistributors(distributorsList);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      fetchAll().finally(() => active && setLoading(false));

      const interval = setInterval(fetchAll, POLL_INTERVAL_MS);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [fetchAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const filteredSales = useMemo(
    () => (selectedDistributor ? sales.filter((s) => distributorIdOf(s) === selectedDistributor) : sales),
    [sales, selectedDistributor]
  );

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
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-2xl font-bold text-slate-900">Ventes</Text>
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
          <Text className="text-emerald-600 text-xs font-medium">En direct</Text>
        </View>
      </View>
      {lastUpdated && (
        <Text className="text-slate-400 text-xs mb-4">
          Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}
        </Text>
      )}

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <Text className="text-sm font-medium text-slate-600 mb-2">Distributeur</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        <Pressable
          onPress={() => setSelectedDistributor(null)}
          className="px-3 py-2 rounded-full border"
          style={{ borderColor: primaryColor, backgroundColor: !selectedDistributor ? primaryColor : 'transparent' }}
        >
          <Text style={{ color: !selectedDistributor ? '#FFFFFF' : primaryColor }}>Tous</Text>
        </Pressable>
        {distributors.map((d) => {
          const selected = selectedDistributor === d._id;
          return (
            <Pressable
              key={d._id}
              onPress={() => setSelectedDistributor(d._id)}
              className="px-3 py-2 rounded-full border"
              style={{ borderColor: primaryColor, backgroundColor: selected ? primaryColor : 'transparent' }}
            >
              <Text style={{ color: selected ? '#FFFFFF' : primaryColor }}>{d.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {filteredSales.length === 0 ? (
        <Text className="text-slate-500">Aucune vente pour le moment.</Text>
      ) : (
        filteredSales.map((s) => <SaleCard key={s._id} sale={s} />)
      )}
    </ScrollView>
  );
}

function distributorIdOf(sale: SaleDoc): string {
  return typeof sale.distributor === 'string' ? sale.distributor : sale.distributor._id;
}
