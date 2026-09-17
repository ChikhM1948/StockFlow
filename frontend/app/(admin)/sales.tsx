import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listSales, recordPayment } from '@/api/sales';
import { listDistributors } from '@/api/auth';
import { SaleDoc, User } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { PaymentModal } from '@/components/PaymentModal';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Filter,
  Package,
  ReceiptText,
  Radio,
  Store,
  UserRound,
} from 'lucide-react-native';

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

function SaleCard({ sale, onCollect }: { sale: SaleDoc; onCollect: (sale: SaleDoc) => void }) {
  const balance = sale.totalAmount - sale.amountPaid;
  const isPaid = sale.paymentStatus === 'PAID';
  const isPartial = sale.paymentStatus === 'PARTIAL';

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
      <View className="flex-row items-start">
        <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
          <ReceiptText size={18} color="#2563EB" strokeWidth={2.1} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="font-bold text-slate-900 text-base">{sale.saleNumber}</Text>
          <View className="flex-row items-center mt-1">
            <Store size={12} color="#94A3B8" />
            <Text className="text-slate-500 text-xs ml-1.5">{distributorName(sale)}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Clock3 size={12} color="#94A3B8" />
          <Text className="text-slate-400 text-xs ml-1">{relativeTime(sale.date)}</Text>
        </View>
      </View>

      <View className="flex-row items-center mt-4 bg-slate-50 rounded-xl px-3 py-2.5">
        <UserRound size={15} color="#64748B" />
        <Text className="text-slate-700 text-sm font-medium ml-2">{sale.customer.name}</Text>
      </View>

      <View className="mt-3 pt-3 border-t border-slate-100">
        {sale.items.map((item, i) => (
          <View key={i} className="flex-row justify-between items-center mb-1.5">
            <View className="flex-row items-center flex-1 pr-2">
              <Package size={13} color="#94A3B8" />
              <Text className="text-slate-600 text-sm ml-1.5">
              {item.name} × {item.quantity} {item.unit}
              </Text>
            </View>
            <Text className="text-slate-600 text-sm">{formatMoney(item.total)}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100">
        <View className="flex-row items-center">
          {isPaid ? <CheckCircle2 size={16} color="#16A34A" /> : <AlertCircle size={16} color={isPartial ? '#D97706' : '#DC2626'} />}
          <View className="ml-2">
            <Text className={`text-xs font-semibold ${isPaid ? 'text-emerald-700' : isPartial ? 'text-amber-700' : 'text-red-700'}`}>
              {isPaid ? 'Payé' : isPartial ? 'Paiement partiel' : 'Impayé'}
            </Text>
            {!isPaid && <Text className="text-slate-400 text-[11px] mt-0.5">Solde : {formatMoney(balance)}</Text>}
          </View>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-[11px]">Total</Text>
          <Text className="text-base font-bold text-slate-900">{formatMoney(sale.totalAmount)}</Text>
        </View>
      </View>

      {!isPaid && (
        <Pressable
          onPress={() => onCollect(sale)}
          className="mt-3 py-3 rounded-xl border border-blue-200 bg-blue-50 flex-row items-center justify-center"
        >
          <Banknote size={16} color="#2563EB" />
          <Text className="text-blue-700 text-sm font-bold ml-2">Encaisser un paiement</Text>
        </Pressable>
      )}
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
  const [paymentTarget, setPaymentTarget] = useState<SaleDoc | null>(null);

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

  const handleRecordPayment = async (amount: number, note: string) => {
    if (!paymentTarget) return;
    const updated = await recordPayment(paymentTarget._id, { amount, note });
    setSales((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setPaymentTarget(null);
  };

  const filteredSales = useMemo(
    () => (selectedDistributor ? sales.filter((s) => distributorIdOf(s) === selectedDistributor) : sales),
    [sales, selectedDistributor]
  );

  const totalSales = filteredSales.reduce((total, sale) => total + sale.totalAmount, 0);
  const totalOutstanding = filteredSales.reduce((total, sale) => total + (sale.totalAmount - sale.amountPaid), 0);
  const unpaidCount = filteredSales.filter((sale) => sale.paymentStatus !== 'PAID').length;

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
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <View className="w-11 h-11 rounded-2xl bg-emerald-600 items-center justify-center mr-3">
              <Radio size={23} color="#FFFFFF" strokeWidth={2.1} />
            </View>
            <View>
              <Text className="text-2xl font-bold text-slate-950">Ventes</Text>
              <Text className="text-slate-500 mt-0.5">Suivez l'activité commerciale en temps réel.</Text>
            </View>
          </View>
          <View className="flex-row items-center bg-emerald-50 rounded-full px-2.5 py-1.5">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-emerald-700 text-xs font-bold">En direct</Text>
          </View>
        </View>
      </View>
      {lastUpdated && (
        <View className="flex-row items-center mb-4">
          <Clock3 size={13} color="#94A3B8" />
          <Text className="text-slate-400 text-xs ml-1.5">Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}</Text>
        </View>
      )}

      <View className="bg-slate-900 rounded-2xl p-4 mb-5 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <CircleDollarSign size={19} color="#86EFAC" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Chiffre d'affaires</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">{formatMoney(totalSales)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-xs">À recouvrer</Text>
          <Text className="text-amber-300 font-bold mt-1">{formatMoney(totalOutstanding)}</Text>
          <Text className="text-slate-400 text-[11px] mt-0.5">{unpaidCount} en attente</Text>
        </View>
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      <View className="flex-row items-center mb-2">
        <Filter size={16} color="#475569" />
        <Text className="text-sm font-bold text-slate-700 ml-2">Filtrer par distributeur</Text>
      </View>
      <View className="flex-row flex-wrap gap-2 mb-5">
        <Pressable
          onPress={() => setSelectedDistributor(null)}
          className="flex-row items-center px-3 py-2 rounded-full border"
          style={{ borderColor: primaryColor, backgroundColor: !selectedDistributor ? primaryColor : 'transparent' }}
        >
          <UserRound size={14} color={!selectedDistributor ? '#FFFFFF' : primaryColor} />
          <Text className="ml-1.5" style={{ color: !selectedDistributor ? '#FFFFFF' : primaryColor }}>Tous</Text>
        </Pressable>
        {distributors.map((d) => {
          const selected = selectedDistributor === d._id;
          return (
            <Pressable
              key={d._id}
              onPress={() => setSelectedDistributor(d._id)}
              className="flex-row items-center px-3 py-2 rounded-full border"
              style={{ borderColor: primaryColor, backgroundColor: selected ? primaryColor : 'transparent' }}
            >
              <Store size={14} color={selected ? '#FFFFFF' : primaryColor} />
              <Text className="ml-1.5" style={{ color: selected ? '#FFFFFF' : primaryColor }}>{d.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {filteredSales.length === 0 ? (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
            <ReceiptText size={22} color="#64748B" />
          </View>
          <Text className="text-slate-900 font-bold">Aucune vente trouvée</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Les nouvelles ventes apparaîtront automatiquement ici.</Text>
        </View>
      ) : (
        filteredSales.map((s) => <SaleCard key={s._id} sale={s} onCollect={setPaymentTarget} />)
      )}

      {paymentTarget && (
        <PaymentModal
          visible
          saleNumber={paymentTarget.saleNumber}
          balance={paymentTarget.totalAmount - paymentTarget.amountPaid}
          onClose={() => setPaymentTarget(null)}
          onSubmit={handleRecordPayment}
        />
      )}
    </ScrollView>
  );
}

function distributorIdOf(sale: SaleDoc): string {
  return typeof sale.distributor === 'string' ? sale.distributor : sale.distributor._id;
}
