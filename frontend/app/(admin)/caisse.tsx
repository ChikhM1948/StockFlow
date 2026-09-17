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
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Users,
  Wallet,
} from 'lucide-react-native';

const POLL_INTERVAL_MS = 10000;

type MetricIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function CaisseCard({
  title,
  totals,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  totals: CaisseTotals;
  subtitle: string;
  icon: MetricIcon;
  color: string;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}16` }}>
          <Icon size={20} color={color} strokeWidth={2.2} />
        </View>
        <Text className="text-xs text-slate-400 mt-1">{totals.count} mouvements</Text>
      </View>
      <Text className="text-slate-500 font-medium mt-4 mb-1">{title}</Text>
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
          <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
            {expanded ? <ChevronUp size={17} color="#475569" /> : <ChevronDown size={17} color="#475569" />}
          </View>
        </View>

        <View className="flex-row justify-between mt-4 pt-3 border-t border-slate-100">
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
        <View className="border-t border-slate-100 p-4 bg-slate-50/80">
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

  const periodSales = distributors.reduce(
    (sum, distributor) => sum + (distributor.caisse.range ?? distributor.caisse.daily).totalAmount,
    0
  );
  const periodExpenses = expensesCaisse?.range ?? expensesCaisse?.daily;
  const globalSales = distributors.reduce((sum, distributor) => sum + distributor.caisse.global.totalAmount, 0);
  const globalExpenses = expensesCaisse?.global.totalAmount ?? 0;

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
            <Wallet size={19} color={primaryColor} strokeWidth={2.2} />
          </View>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Pilotage financier</Text>
        </View>
        <Text className="text-3xl font-bold text-slate-950">Caisse</Text>
        <Text className="text-slate-500 mt-1">Suivez les encaissements et la rentabilité en temps réel.</Text>
      </View>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-200">
        <View className="flex-row items-center mb-2">
          <Activity size={16} color="#64748B" />
          <Text className="text-sm font-semibold text-slate-700 ml-2">Filtres de suivi</Text>
        </View>
        <DateRangeFilter value={dateFilters} onChange={setDateFilters} />

        <View className="flex-row items-center mb-2">
          <Users size={16} color="#64748B" />
          <Text className="text-sm font-medium text-slate-600 ml-2">Distributeur</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
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
      </View>

      <View className="flex-row items-center mb-3">
        <Boxes size={19} color="#2563EB" />
        <Text className="text-lg font-bold text-slate-900 ml-2">Flux de stock</Text>
      </View>
      {stockCaisse && (
        <>
          {stockCaisse.range ? (
            <CaisseCard
              title={formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)}
              totals={stockCaisse.range}
              subtitle="bon(s) de sortie"
              icon={ArrowUpRight}
              color="#2563EB"
            />
          ) : (
            <CaisseCard title="Journalière (aujourd'hui)" totals={stockCaisse.daily} subtitle="bon(s) de sortie" icon={ArrowUpRight} color="#2563EB" />
          )}
          <CaisseCard title="Globale (depuis le début)" totals={stockCaisse.global} subtitle="bon(s) de sortie" icon={Boxes} color="#4F46E5" />
        </>
      )}

      <View className="flex-row items-center mt-4 mb-3">
        <CircleDollarSign size={19} color="#DC2626" />
        <Text className="text-lg font-bold text-slate-900 ml-2">Dépenses</Text>
      </View>
      {expensesCaisse && (
        <>
          {expensesCaisse.range ? (
            <CaisseCard
              title={formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)}
              totals={expensesCaisse.range}
              subtitle="dépense(s)"
              icon={ArrowDownRight}
              color="#DC2626"
            />
          ) : (
            <CaisseCard title="Journalière (aujourd'hui)" totals={expensesCaisse.daily} subtitle="dépense(s)" icon={ArrowDownRight} color="#DC2626" />
          )}
          <CaisseCard title="Globale (depuis le début)" totals={expensesCaisse.global} subtitle="dépense(s)" icon={CircleDollarSign} color="#BE123C" />
        </>
      )}

      {expensesCaisse && (
        <>
          <View className="flex-row items-center mt-4 mb-3">
            <Wallet size={19} color="#059669" />
            <Text className="text-lg font-bold text-slate-900 ml-2">Résultat net</Text>
          </View>
          <View className="bg-emerald-600 rounded-2xl p-5 mb-3 shadow-sm">
            <Text className="text-emerald-100 font-medium mb-1">
              {expensesCaisse.range ? formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate) : "Aujourd'hui"}
            </Text>
            <Text className="text-3xl font-bold text-white">{formatMoney(periodSales - (periodExpenses?.totalAmount ?? 0))}</Text>
            <Text className="text-emerald-100 text-xs mt-2">Ventes encaissées moins dépenses</Text>
          </View>
          <View className="bg-slate-900 rounded-2xl p-5 mb-3">
            <Text className="text-slate-400 font-medium mb-1">Global (depuis le début)</Text>
            <Text className="text-3xl font-bold text-white">{formatMoney(globalSales - globalExpenses)}</Text>
            <Text className="text-slate-400 text-xs mt-2">Performance cumulée de votre activité</Text>
          </View>
        </>
      )}

      <View className="flex-row items-center mt-4 mb-3">
        <Users size={19} color="#7C3AED" />
        <Text className="text-lg font-bold text-slate-900 ml-2">Distributeurs</Text>
        <View className="ml-2 bg-violet-100 px-2 py-1 rounded-full">
          <Text className="text-violet-700 text-xs font-bold">Temps réel</Text>
        </View>
      </View>
      {distributors.length === 0 ? (
        <Text className="text-slate-500">Aucun distributeur pour ces filtres.</Text>
      ) : (
        distributors.map((d) => <DistributorRow key={d.distributor._id} overview={d} dateFilters={dateFilters} />)
      )}
    </ScrollView>
  );
}
