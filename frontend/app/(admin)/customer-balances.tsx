import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listCustomers, getCustomerDetail } from '@/api/customers';
import { CustomerDetail, CustomerSummary } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  MapPin,
  Phone,
  ReceiptText,
  ShoppingBag,
  UserRound,
} from 'lucide-react-native';

const TYPE_LABEL: Record<CustomerSummary['customer']['type'], string> = {
  EPICERIE: 'Épicerie',
  GROSSISTE: 'Grossiste',
  PARTICULIER: 'Particulier',
  AUTRE: 'Autre',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PAID: 'Payé',
  PARTIAL: 'Partiel',
  UNPAID: 'Impayé',
};

function CustomerRow({ summary }: { summary: CustomerSummary }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const toggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !detail) {
      setLoadingDetail(true);
      try {
        setDetail(await getCustomerDetail(summary.customer._id));
      } catch {
        // silencieux : le résumé reste affiché même si le détail échoue
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <View className="bg-white rounded-2xl mb-3 border border-slate-200 overflow-hidden">
      <Pressable onPress={toggle} className="p-4">
        <View className="flex-row items-start">
          <View className="w-11 h-11 rounded-2xl bg-blue-50 items-center justify-center mr-3">
            <UserRound size={21} color="#2563EB" strokeWidth={2.1} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="font-bold text-slate-900 text-base">{summary.customer.name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-slate-500 text-xs">{TYPE_LABEL[summary.customer.type]}</Text>
              {summary.customer.phone ? (
                <>
                  <Text className="text-slate-300 text-xs mx-1.5">•</Text>
                  <Phone size={12} color="#94A3B8" />
                  <Text className="text-slate-400 text-xs ml-1">{summary.customer.phone}</Text>
                </>
              ) : null}
            </View>
          </View>
          <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
            {expanded ? <ChevronUp size={17} color="#475569" /> : <ChevronDown size={17} color="#475569" />}
          </View>
        </View>

        <View className="flex-row mt-4 pt-3 border-t border-slate-100">
          <View className="flex-1 flex-row items-center">
            <ShoppingBag size={15} color="#64748B" />
            <View className="ml-2">
              <Text className="text-slate-400 text-[11px]">Ventes</Text>
              <Text className="font-bold text-slate-900 mt-0.5">{summary.salesCount}</Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center">
            <ReceiptText size={15} color="#64748B" />
            <View className="ml-2">
              <Text className="text-slate-400 text-[11px]">Facturé</Text>
              <Text className="font-bold text-slate-900 mt-0.5">{formatMoney(summary.totalAmount)}</Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center">
            <CircleDollarSign size={15} color={summary.balance > 0 ? '#DC2626' : '#16A34A'} />
            <View className="ml-2">
              <Text className="text-slate-400 text-[11px]">Solde dû</Text>
              <Text className={`font-bold mt-0.5 ${summary.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatMoney(summary.balance)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View className="border-t border-slate-100 p-4 bg-slate-50">
          {loadingDetail && <ActivityIndicator color="#2563EB" className="py-2" />}

          {detail && (
            <>
              {detail.customer.address ? (
                <View className="flex-row items-center mb-3">
                  <MapPin size={15} color="#64748B" />
                  <Text className="text-slate-600 text-sm ml-2">{detail.customer.address}</Text>
                </View>
              ) : null}

              <View className="flex-row items-center mb-3">
                <CreditCard size={16} color="#2563EB" />
                <Text className="font-bold text-slate-900 ml-2">Historique d'achats</Text>
              </View>
              {detail.sales.length === 0 ? (
                <Text className="text-slate-500 text-sm">Aucune vente pour le moment.</Text>
              ) : (
                detail.sales.map((sale) => {
                  const isPaid = sale.paymentStatus === 'PAID';
                  return (
                    <View key={sale._id} className="bg-white rounded-xl border border-slate-200 p-3 mb-2 flex-row items-center">
                      {isPaid ? <CheckCircle2 size={17} color="#16A34A" /> : <AlertCircle size={17} color="#D97706" />}
                      <View className="flex-1 ml-2">
                        <Text className="text-slate-900 text-sm font-semibold">{sale.saleNumber}</Text>
                        <Text className="text-slate-500 text-xs mt-0.5">
                          {new Date(sale.date).toLocaleDateString('fr-FR')} · {PAYMENT_STATUS_LABEL[sale.paymentStatus]}
                        </Text>
                      </View>
                      <Text className="text-slate-900 text-sm font-bold">{formatMoney(sale.totalAmount)}</Text>
                    </View>
                  );
                })
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function CustomerBalancesScreen() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setCustomers(await listCustomers());
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCustomers().finally(() => setLoading(false));
    }, [fetchCustomers])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const totalDue = customers.reduce((total, customer) => total + customer.balance, 0);
  const customersWithDebt = customers.filter((customer) => customer.balance > 0).length;

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
        <View className="flex-row items-center mb-1">
          <View className="w-11 h-11 rounded-2xl bg-amber-100 items-center justify-center mr-3">
            <CircleDollarSign size={23} color="#D97706" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Créances clients</Text>
            <Text className="text-slate-500 mt-0.5">Suivez les soldes et les paiements en attente.</Text>
          </View>
        </View>
      </View>

      <View className="bg-slate-900 rounded-2xl p-4 mb-5">
        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Total à recouvrer</Text>
        <Text className="text-white text-2xl font-bold mt-1">{formatMoney(totalDue)}</Text>
        <View className="flex-row items-center mt-3">
          <View className="flex-row items-center mr-5">
            <AlertCircle size={14} color="#FBBF24" />
            <Text className="text-slate-300 text-xs ml-1.5">{customersWithDebt} client(s) débiteur(s)</Text>
          </View>
          <View className="flex-row items-center">
            <UserRound size={14} color="#93C5FD" />
            <Text className="text-slate-300 text-xs ml-1.5">{customers.length} client(s)</Text>
          </View>
        </View>
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      {customers.length === 0 ? (
        <Text className="text-slate-500">Aucun client pour le moment.</Text>
      ) : (
        customers.map((c) => <CustomerRow key={c.customer._id} summary={c} />)
      )}
    </ScrollView>
  );
}
