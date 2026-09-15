import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/Button';
import { listReturns } from '@/api/returns';
import { listDistributors } from '@/api/auth';
import { API_URL, extractErrorMessage } from '@/api/client';
import { ReturnDoc, User } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { shareDocument } from '@/utils/pdf';
import { useBrandTheme } from '@/context/BrandThemeContext';

const REASON_LABEL: Record<ReturnDoc['reason'], string> = {
  UNSOLD: 'Invendu',
  DAMAGED: 'Endommagé',
  OTHER: 'Autre',
};

function distributorName(r: ReturnDoc): string {
  return typeof r.distributor === 'string' ? r.distributor : r.distributor.name;
}

function distributorIdOf(r: ReturnDoc): string {
  return typeof r.distributor === 'string' ? r.distributor : r.distributor._id;
}

export default function AdminReturnsScreen() {
  const { primaryColor } = useBrandTheme();
  const [returns, setReturns] = useState<ReturnDoc[]>([]);
  const [distributors, setDistributors] = useState<User[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [returnsList, distributorsList] = await Promise.all([listReturns(), listDistributors()]);
      setReturns(returnsList);
      setDistributors(distributorsList);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll().finally(() => setLoading(false));
    }, [fetchAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const filteredReturns = useMemo(
    () => (selectedDistributor ? returns.filter((r) => distributorIdOf(r) === selectedDistributor) : returns),
    [returns, selectedDistributor]
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
      <Text className="text-2xl font-bold text-slate-900 mb-4">Bons de Retour</Text>

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

      {filteredReturns.length === 0 ? (
        <Text className="text-slate-500">Aucun retour pour ces filtres.</Text>
      ) : (
        filteredReturns.map((r) => (
          <View key={r._id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
            <View className="flex-row justify-between">
              <Text className="font-semibold text-slate-900">{r.returnNumber}</Text>
              <Text className="text-slate-500">{new Date(r.date).toLocaleDateString('fr-FR')}</Text>
            </View>
            <Text className="text-slate-500 mt-1">Distributeur : {distributorName(r)}</Text>
            <Text className="text-slate-500">Motif : {REASON_LABEL[r.reason]}</Text>
            {r.note ? <Text className="text-slate-500 text-sm">{r.note}</Text> : null}
            <Text className="text-slate-900 font-medium mt-1">Total : {formatMoney(r.totalAmount)}</Text>

            <View className="mt-3">
              <Button
                label="Partager le PDF"
                variant="outline"
                onPress={() => shareDocument(`${API_URL}/returns/${r._id}/pdf`, `${r.returnNumber}.pdf`)}
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
