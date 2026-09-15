import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStockCaisse, listDistributorsCaisse, getDistributorDetail } from '@/api/caisse';
import { getExpensesCaisse } from '@/api/expenses';
import { listDistributors } from '@/api/auth';
import { CaisseSummary, CaisseTotals, DistributorDetail, DistributorOverview, User } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import { formatDateRangeLabel } from '@/utils/dateFilters';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { DateRange, DateRangeFilter } from '@/components/DateRangeFilter';

const POLL_INTERVAL_MS = 10000;

function CaisseCard({ title, totals, subtitle }: { title: string; totals: CaisseTotals; subtitle: string }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
      <Text className="text-slate-500 font-medium mb-1">{title}</Text>
      <Text className="text-2xl font-bold text-slate-900">{formatMoney(totals.totalAmount)}</Text>
      <Text className="text-slate-400 text-xs mt-1">
        {totals.count} {subtitle}
      </Text>
    </View>
  );
}

function DistributorRow({
  overview,
  dateFilters,
}: {
  overview: DistributorOverview;
  dateFilters: { startDate?: string; endDate?: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<DistributorDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const toggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      setLoadingDetail(true);
      try {
        setDetail(await getDistributorDetail(overview.distributor._id, dateFilters));
      } catch {
        // silencieux : le résumé reste affiché même si le détail échoue
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <View className="bg-white rounded-xl mb-3 border border-slate-200 overflow-hidden">
      <Pressable onPress={toggle} className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="font-semibold text-slate-900">{overview.distributor.name}</Text>
            <Text className="text-slate-400 text-xs">{overview.distributor.email}</Text>
          </View>
          <Text className="text-xs text-slate-400">{expanded ? '▲' : '▼'}</Text>
        </View>

        <View className="flex-row justify-between mt-3">
          <View>
            <Text className="text-slate-500 text-xs">Stock confié</Text>
            <Text className="font-semibold text-slate-900">{formatMoney(overview.stock.totalValue)}</Text>
          </View>
          <View>
            <Text className="text-slate-500 text-xs">{overview.caisse.range ? 'Caisse (période)' : 'Caisse du jour'}</Text>
            <Text className="font-semibold text-slate-900">
              {formatMoney((overview.caisse.range ?? overview.caisse.daily).totalAmount)}
            </Text>
          </View>
          <View>
            <Text className="text-slate-500 text-xs">Caisse globale</Text>
            <Text className="font-semibold text-slate-900">{formatMoney(overview.caisse.global.totalAmount)}</Text>
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View className="border-t border-slate-100 p-4 bg-slate-50">
          {loadingDetail && <ActivityIndicator color="#2563EB" />}

          {detail && (
            <>
              <Text className="font-semibold text-slate-900 mb-2">Stock du distributeur</Text>
              {detail.stock.length === 0 ? (
                <Text className="text-slate-500 text-sm mb-3">Aucun stock attribué.</Text>
              ) : (
                detail.stock.map((s) => (
                  <Text key={s._id} className="text-slate-600 text-sm mb-1">
                    {s.productName} — {s.quantity} {s.unit}
                  </Text>
                ))
              )}

              <Text className="font-semibold text-slate-900 mt-3 mb-2">
                {dateFilters.startDate ? 'Ventes sur la période' : 'Dernières ventes'}
              </Text>
              {detail.recentSales.length === 0 ? (
                <Text className="text-slate-500 text-sm">Aucune vente pour le moment.</Text>
              ) : (
                detail.recentSales.map((sale) => (
                  <View key={sale._id} className="flex-row justify-between mb-1">
                    <Text className="text-slate-600 text-sm">
                      {sale.saleNumber} · {sale.customer.name}
                    </Text>
                    <Text className="text-slate-900 text-sm font-medium">{formatMoney(sale.totalAmount)}</Text>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function AdminCaisseScreen() {
  const { primaryColor } = useBrandTheme();
  const [stockCaisse, setStockCaisse] = useState<CaisseSummary | null>(null);
  const [expensesCaisse, setExpensesCaisse] = useState<CaisseSummary | null>(null);
  const [distributors, setDistributors] = useState<DistributorOverview[]>([]);
  const [allDistributors, setAllDistributors] = useState<User[]>([]);
  const [dateFilters, setDateFilters] = useState<DateRange>({});
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ ...dateFilters, ...(selectedDistributor ? { distributorId: selectedDistributor } : {}) }),
    [dateFilters, selectedDistributor]
  );

  const fetchAll = useCallback(async () => {
    try {
      const [stock, distributorsOverview, distributorsList, expenses] = await Promise.all([
        getStockCaisse(filters),
        listDistributorsCaisse(filters),
        listDistributors(),
        getExpensesCaisse(dateFilters),
      ]);
      setStockCaisse(stock);
      setDistributors(distributorsOverview);
      setAllDistributors(distributorsList);
      setExpensesCaisse(expenses);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [filters, dateFilters]);

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
      <Text className="text-2xl font-bold text-slate-900 mb-4">Caisse</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <DateRangeFilter value={dateFilters} onChange={setDateFilters} />

      <Text className="text-sm font-medium text-slate-600 mb-2">Distributeur</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        <Pressable
          onPress={() => setSelectedDistributor(null)}
          className="px-3 py-2 rounded-full border"
          style={{ borderColor: primaryColor, backgroundColor: !selectedDistributor ? primaryColor : 'transparent' }}
        >
          <Text style={{ color: !selectedDistributor ? '#FFFFFF' : primaryColor }}>Tous</Text>
        </Pressable>
        {allDistributors.map((d) => {
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

      <Text className="text-lg font-semibold text-slate-900 mb-2">Caisse Stock</Text>
      {stockCaisse && (
        <>
          {stockCaisse.range ? (
            <CaisseCard
              title={formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)}
              totals={stockCaisse.range}
              subtitle="bon(s) de sortie"
            />
          ) : (
            <CaisseCard title="Journalière (aujourd'hui)" totals={stockCaisse.daily} subtitle="bon(s) de sortie" />
          )}
          <CaisseCard title="Globale (depuis le début)" totals={stockCaisse.global} subtitle="bon(s) de sortie" />
        </>
      )}

      <Text className="text-lg font-semibold text-slate-900 mt-4 mb-2">Dépenses</Text>
      {expensesCaisse && (
        <>
          {expensesCaisse.range ? (
            <CaisseCard
              title={formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)}
              totals={expensesCaisse.range}
              subtitle="dépense(s)"
            />
          ) : (
            <CaisseCard title="Journalière (aujourd'hui)" totals={expensesCaisse.daily} subtitle="dépense(s)" />
          )}
          <CaisseCard title="Globale (depuis le début)" totals={expensesCaisse.global} subtitle="dépense(s)" />
        </>
      )}

      {expensesCaisse && (
        <>
          <Text className="text-lg font-semibold text-slate-900 mt-4 mb-2">Net (ventes - dépenses)</Text>
          <View className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
            <Text className="text-slate-500 font-medium mb-1">
              {expensesCaisse.range ? formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate) : "Aujourd'hui"}
            </Text>
            <Text className="text-2xl font-bold text-slate-900">
              {formatMoney(
                distributors.reduce((sum, d) => sum + (d.caisse.range ?? d.caisse.daily).totalAmount, 0) -
                  (expensesCaisse.range ?? expensesCaisse.daily).totalAmount
              )}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
            <Text className="text-slate-500 font-medium mb-1">Global (depuis le début)</Text>
            <Text className="text-2xl font-bold text-slate-900">
              {formatMoney(
                distributors.reduce((sum, d) => sum + d.caisse.global.totalAmount, 0) - expensesCaisse.global.totalAmount
              )}
            </Text>
          </View>
        </>
      )}

      <Text className="text-lg font-semibold text-slate-900 mt-4 mb-2">Distributeurs — temps réel</Text>
      {distributors.length === 0 ? (
        <Text className="text-slate-500">Aucun distributeur pour ces filtres.</Text>
      ) : (
        distributors.map((d) => <DistributorRow key={d.distributor._id} overview={d} dateFilters={dateFilters} />)
      )}
    </ScrollView>
  );
}
