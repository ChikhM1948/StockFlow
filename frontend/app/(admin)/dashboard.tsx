import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDashboardSummary } from '@/api/dashboard';
import { DashboardSummary } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { formatDateRangeLabel } from '@/utils/dateFilters';
import { extractErrorMessage } from '@/api/client';
import { DateRange, DateRangeFilter } from '@/components/DateRangeFilter';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Package,
  Trophy,
  TrendingUp,
} from 'lucide-react-native';

function ValuationCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <View className="w-9 h-9 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: `${color}16` }}>
        <Icon size={18} color={color} strokeWidth={2.2} />
      </View>
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

  const maxRevenue = Math.max(...(summary?.revenueTrend.map((item) => item.totalAmount) ?? [1]), 1);

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
      <View className="mb-5">
        <View className="flex-row items-center mb-2">
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mr-3">
            <BarChart3 size={19} color="#2563EB" strokeWidth={2.2} />
          </View>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Vue d'ensemble</Text>
        </View>
        <Text className="text-3xl font-bold text-slate-950">Tableau de bord</Text>
        <Text className="text-slate-500 mt-1">Les chiffres essentiels de votre activité.</Text>
      </View>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-200">
        <View className="flex-row items-center mb-1">
          <CalendarDays size={16} color="#64748B" />
          <Text className="text-sm font-semibold text-slate-700 ml-2">Période d'analyse</Text>
        </View>
        <DateRangeFilter value={dateFilters} onChange={setDateFilters} />
      </View>

      {summary && (
        <>
          <View className="flex-row items-center mb-3">
            <Boxes size={19} color="#2563EB" />
            <Text className="text-lg font-bold text-slate-900 ml-2">Valorisation du stock</Text>
          </View>

          <View className="flex-row gap-2 mb-2">
            <ValuationCard title="Stock central" value={summary.stockValuation.central} icon={Package} color="#2563EB" />
            <ValuationCard title="Distributeurs" value={summary.stockValuation.distributed} icon={Boxes} color="#7C3AED" />
          </View>
          <View className="bg-slate-900 rounded-2xl p-5 mb-5">
            <View className="flex-row items-center mb-2">
              <CircleDollarSign size={17} color="#93C5FD" />
              <Text className="text-blue-200 text-xs font-semibold ml-2">Valeur totale immobilisée</Text>
            </View>
            <Text className="text-3xl font-bold text-white">{formatMoney(summary.stockValuation.total)}</Text>
            <Text className="text-slate-400 text-xs mt-2">
              Période : {formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)}
            </Text>
          </View>

          {(summary.lowStock.products > 0 || summary.lowStock.distributorStockLines > 0) && (
            <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 mb-5 flex-row">
              <AlertTriangle size={20} color="#DC2626" strokeWidth={2.2} />
              <View className="flex-1 ml-3">
                <Text className="text-red-900 font-bold mb-1">Attention stock</Text>
                <Text className="text-red-700 text-sm">
                {summary.lowStock.products} article(s) en stock faible au Stock Central,{' '}
                {summary.lowStock.distributorStockLines} lot(s) chez les distributeurs
                </Text>
              </View>
            </View>
          )}

          <View className="flex-row items-center mb-3">
            <Trophy size={19} color="#D97706" />
            <Text className="text-lg font-bold text-slate-900 ml-2">Meilleures ventes</Text>
          </View>
          {summary.bestSellers.length === 0 ? (
            <Text className="text-slate-500 mb-5">Aucune vente sur cette période.</Text>
          ) : (
            <View className="bg-white rounded-2xl border border-slate-200 mb-5 overflow-hidden">
              {summary.bestSellers.map((b, i) => (
                <View
                  key={b.productId}
                  className={`flex-row items-center justify-between p-4 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${i === 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
                      <Text className={`font-bold ${i === 0 ? 'text-amber-700' : 'text-slate-500'}`}>{i + 1}</Text>
                    </View>
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

          <View className="flex-row items-center mb-3">
            <TrendingUp size={19} color="#059669" />
            <Text className="text-lg font-bold text-slate-900 ml-2">Chiffre d'affaires par jour</Text>
          </View>
          {summary.revenueTrend.length === 0 ? (
            <Text className="text-slate-500">Aucune vente sur cette période.</Text>
          ) : (
            <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {summary.revenueTrend.map((r, i) => (
                <View
                  key={r.date}
                  className={`p-4 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-slate-600">
                      {new Date(`${r.date}T00:00:00`).toLocaleDateString('fr-FR')} · {r.count} vente(s)
                    </Text>
                    <Text className="font-semibold text-slate-900">{formatMoney(r.totalAmount)}</Text>
                  </View>
                  <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <View className="h-full rounded-full bg-emerald-500" style={{ width: `${(r.totalAmount / maxRevenue) * 100}%` }} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
