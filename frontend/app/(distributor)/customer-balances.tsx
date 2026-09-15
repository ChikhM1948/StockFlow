import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listCustomers, getCustomerDetail } from '@/api/customers';
import { CustomerDetail, CustomerSummary } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';

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
    <View className="bg-white rounded-xl mb-3 border border-slate-200 overflow-hidden">
      <Pressable onPress={toggle} className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="font-semibold text-slate-900">{summary.customer.name}</Text>
            <Text className="text-slate-400 text-xs">
              {TYPE_LABEL[summary.customer.type]}
              {summary.customer.phone ? ` · ${summary.customer.phone}` : ''}
            </Text>
          </View>
          <Text className="text-xs text-slate-400">{expanded ? '▲' : '▼'}</Text>
        </View>

        <View className="flex-row justify-between mt-3">
          <View>
            <Text className="text-slate-500 text-xs">Ventes</Text>
            <Text className="font-semibold text-slate-900">{summary.salesCount}</Text>
          </View>
          <View>
            <Text className="text-slate-500 text-xs">Total facturé</Text>
            <Text className="font-semibold text-slate-900">{formatMoney(summary.totalAmount)}</Text>
          </View>
          <View>
            <Text className="text-slate-500 text-xs">Solde dû</Text>
            <Text className={`font-semibold ${summary.balance > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {formatMoney(summary.balance)}
            </Text>
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View className="border-t border-slate-100 p-4 bg-slate-50">
          {loadingDetail && <ActivityIndicator color="#2563EB" />}

          {detail && (
            <>
              {detail.customer.address ? (
                <Text className="text-slate-600 text-sm mb-2">Adresse : {detail.customer.address}</Text>
              ) : null}

              <Text className="font-semibold text-slate-900 mb-2">Historique d'achats</Text>
              {detail.sales.length === 0 ? (
                <Text className="text-slate-500 text-sm">Aucune vente pour le moment.</Text>
              ) : (
                detail.sales.map((sale) => (
                  <View key={sale._id} className="flex-row justify-between mb-1">
                    <Text className="text-slate-600 text-sm">
                      {sale.saleNumber} · {new Date(sale.date).toLocaleDateString('fr-FR')} ·{' '}
                      {PAYMENT_STATUS_LABEL[sale.paymentStatus]}
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
      <Text className="text-2xl font-bold text-slate-900 mb-4">Créances clients</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {customers.length === 0 ? (
        <Text className="text-slate-500">Aucun client pour le moment.</Text>
      ) : (
        customers.map((c) => <CustomerRow key={c.customer._id} summary={c} />)
      )}
    </ScrollView>
  );
}
