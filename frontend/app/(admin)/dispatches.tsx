import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { listDispatches } from '@/api/dispatches';
import { API_URL, extractErrorMessage } from '@/api/client';
import { DispatchDoc } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { shareDocument } from '@/utils/pdf';

export default function DispatchesHistoryScreen() {
  const [dispatches, setDispatches] = useState<DispatchDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setDispatches(await listDispatches());
        } catch (err) {
          setError(extractErrorMessage(err));
        }
      })();
    }, [])
  );

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Bons de Sortie</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {dispatches.length === 0 ? (
        <Text className="text-slate-500">Aucun Bon de Sortie émis pour le moment.</Text>
      ) : (
        dispatches.map((d) => {
          const distributorName = typeof d.distributor === 'string' ? d.distributor : d.distributor.name;
          return (
            <View key={d._id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
              <View className="flex-row justify-between">
                <Text className="font-semibold text-slate-900">{d.dispatchNumber}</Text>
                <Text className="text-slate-500">{new Date(d.date).toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text className="text-slate-500 mt-1">Distributeur : {distributorName}</Text>
              <Text className="text-slate-900 font-medium mt-1">Total : {formatMoney(d.totalAmount)}</Text>

              <View className="mt-3">
                <Button
                  label="Partager le PDF"
                  variant="outline"
                  onPress={() => shareDocument(`${API_URL}/dispatches/${d._id}/pdf`, `${d.dispatchNumber}.pdf`)}
                />
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}
