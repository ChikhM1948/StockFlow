import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDashboardSummary } from '@/api/dashboard';
import { DashboardSummary } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { formatDateRangeLabel } from '@/utils/dateFilters';
import { extractErrorMessage } from '@/api/client';
import { DateRange, DateRangeFilter } from '@/components/DateRangeFilter';

function ValuationCard({ title, value }: { title: string; value: number }) {
  return (
    <View className="flex-1 bg-white rounded-xl p-4 border border-slate-200">
      <Text className="text-slate-500 text-xs font-medium mb-1">{title}</Text>
      <Text className="text-lg font-bold text-slate-900">{formatMoney(value)}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dateFilters, setDateFilters] = useState<DateRange>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setSummary(await getDashboardSummary(dateFilters));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [dateFilters]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSummary().finally(() => setLoading(false));
    }, [fetchSummary])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
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
      <Text className="text-2xl font-bold text-slate-900 mb-4">Tableau de bord</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <DateRangeFilter value={dateFilters} onChange={setDateFilters} />

      {summary && (
        <>
          <Text className="text-slate-400 text-xs mb-4">
            Période : {formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)}
          </Text>

          <Text className="text-lg font-semibold text-slate-900 mb-2">Valorisation du stock</Text>
          <View className="flex-row gap-2 mb-2">
            <ValuationCard title="Stock Central" value={summary.stockValuation.central} />
            <ValuationCard title="Chez distributeurs" value={summary.stockValuation.distributed} />
          </View>
          <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
            <Text className="text-slate-500 text-xs font-medium mb-1">Total</Text>
            <Text className="text-2xl font-bold text-slate-900">{formatMoney(summary.stockValuation.total)}</Text>
          </View>

          {(summary.lowStock.products > 0 || summary.lowStock.distributorStockLines > 0) && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-800 font-semibold">
                {summary.lowStock.products} article(s) en stock faible au Stock Central,{' '}
                {summary.lowStock.distributorStockLines} lot(s) chez les distributeurs
              </Text>
            </View>
          )}

          <Text className="text-lg font-semibold text-slate-900 mb-2">Meilleures ventes</Text>
          {summary.bestSellers.length === 0 ? (
            <Text className="text-slate-500 mb-4">Aucune vente sur cette période.</Text>
          ) : (
            <View className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
              {summary.bestSellers.map((b, i) => (
                <View
                  key={b.productId}
                  className={`flex-row items-center justify-between p-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <View className="flex-row items-center flex-1 pr-2">
                    <Text className="text-slate-400 font-semibold w-6">{i + 1}</Text>
                    <View className="flex-1">
                      <Text className="text-slate-900 font-medium">{b.name}</Text>
                      <Text className="text-slate-400 text-xs">
                        {b.quantity} {b.unit} vendu(s)
                      </Text>
                    </View>
                  </View>
                  <Text className="font-semibold text-slate-900">{formatMoney(b.revenue)}</Text>
                </View>
              ))}
            </View>
          )}

          <Text className="text-lg font-semibold text-slate-900 mb-2">Chiffre d'affaires par jour</Text>
          {summary.revenueTrend.length === 0 ? (
            <Text className="text-slate-500">Aucune vente sur cette période.</Text>
          ) : (
            <View className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {summary.revenueTrend.map((r, i) => (
                <View
                  key={r.date}
                  className={`flex-row items-center justify-between p-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <Text className="text-slate-600">
                    {new Date(`${r.date}T00:00:00`).toLocaleDateString('fr-FR')} · {r.count} vente(s)
                  </Text>
                  <Text className="font-semibold text-slate-900">{formatMoney(r.totalAmount)}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
