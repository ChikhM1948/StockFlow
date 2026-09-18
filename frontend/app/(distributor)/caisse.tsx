// @ts-nocheck
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMyCaisse } from '@/api/caisse';
import { CaisseSummary, CaisseTotals } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import { formatDateRangeLabel } from '@/utils/dateFilters';
import { DateRange, DateRangeFilter } from '@/components/DateRangeFilter';
import { CalendarDays, CircleDollarSign, Clock3, FileBarChart, ReceiptText, TrendingUp } from 'lucide-react-native';

const POLL_INTERVAL_MS = 10000;

function CaisseCard({ title, totals, featured = false, icon: Icon }: { title: string; totals: CaisseTotals; featured?: boolean; icon: typeof CircleDollarSign }) {
  const collected = totals.amountPaid ?? totals.totalAmount;
  return (
    <View className={`${featured ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-4 mb-3 border ${featured ? 'border-slate-900' : 'border-slate-200'}`}>
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${featured ? 'bg-white/10' : 'bg-blue-50'}`}>
          <Icon size={19} color={featured ? '#93C5FD' : '#2563EB'} strokeWidth={2.1} />
        </View>
        <View className="flex-1">
          <Text className={`${featured ? 'text-slate-400' : 'text-slate-500'} font-semibold text-sm`}>{title}</Text>
          <Text className={`${featured ? 'text-white' : 'text-slate-900'} text-2xl font-bold mt-1`}>{formatMoney(collected)}</Text>
        </View>
        <View className={`rounded-full px-2 py-1 ${featured ? 'bg-emerald-400/15' : 'bg-emerald-50'}`}>
          <Text className={`${featured ? 'text-emerald-300' : 'text-emerald-700'} text-xs font-bold`}>Encaissé</Text>
        </View>
      </View>
      <View className={`flex-row items-center mt-4 pt-3 border-t ${featured ? 'border-white/10' : 'border-slate-100'}`}>
        <ReceiptText size={14} color={featured ? '#94A3B8' : '#64748B'} />
        <Text className={`${featured ? 'text-slate-300' : 'text-slate-500'} text-xs ml-1.5`}>
          {totals.count} vente(s) · Facturé : {formatMoney(totals.totalAmount)}
        </Text>
      </View>
    </View>
  );
}

export default function DistributorCaisseScreen() {
  const [caisse, setCaisse] = useState<CaisseSummary | null>(null);
  const [dateFilters, setDateFilters] = useState<DateRange>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCaisse = useCallback(async () => {
    try {
      setCaisse(await getMyCaisse(dateFilters));
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [dateFilters]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      fetchCaisse().finally(() => active && setLoading(false));

      const interval = setInterval(fetchCaisse, POLL_INTERVAL_MS);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [fetchCaisse])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCaisse();
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
      <View className="pt-2 mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-emerald-600 items-center justify-center mr-3">
            <CircleDollarSign size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Ma caisse</Text>
            <Text className="text-slate-500 mt-0.5">Suivez vos encaissements et votre activité.</Text>
          </View>
          <View className="flex-row items-center bg-emerald-50 rounded-full px-2.5 py-1.5">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-emerald-700 text-xs font-bold">En direct</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center mb-2">
        <CalendarDays size={16} color="#475569" />
        <Text className="text-sm font-bold text-slate-700 ml-2">Période d'analyse</Text>
      </View>

      <DateRangeFilter value={dateFilters} onChange={setDateFilters} />

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      {caisse && (
        <>
          {caisse.range ? (
            <CaisseCard title={formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)} totals={caisse.range} featured icon={TrendingUp} />
          ) : (
            <CaisseCard title="Caisse journalière (aujourd'hui)" totals={caisse.daily} featured icon={Clock3} />
          )}
          <CaisseCard title="Caisse globale (depuis le début)" totals={caisse.global} icon={FileBarChart} />
        </>
      )}
    </ScrollView>
  );
}
