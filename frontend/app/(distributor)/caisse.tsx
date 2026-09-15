import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMyCaisse } from '@/api/caisse';
import { CaisseSummary, CaisseTotals } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import { formatDateRangeLabel } from '@/utils/dateFilters';
import { DateRange, DateRangeFilter } from '@/components/DateRangeFilter';

const POLL_INTERVAL_MS = 10000;

function CaisseCard({ title, totals }: { title: string; totals: CaisseTotals }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
      <Text className="text-slate-500 font-medium mb-1">{title}</Text>
      <Text className="text-2xl font-bold text-slate-900">{formatMoney(totals.amountPaid ?? totals.totalAmount)}</Text>
      <Text className="text-slate-400 text-xs mt-1">
        {totals.count} vente(s) · Total facturé : {formatMoney(totals.totalAmount)}
      </Text>
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
      <Text className="text-2xl font-bold text-slate-900 mb-4">Ma Caisse</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <DateRangeFilter value={dateFilters} onChange={setDateFilters} />

      {caisse && (
        <>
          {caisse.range ? (
            <CaisseCard title={formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)} totals={caisse.range} />
          ) : (
            <CaisseCard title="Caisse journalière (aujourd'hui)" totals={caisse.daily} />
          )}
          <CaisseCard title="Caisse globale (depuis le début)" totals={caisse.global} />
        </>
      )}
    </ScrollView>
  );
}
