import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { listReturns } from '@/api/returns';
import { API_URL, extractErrorMessage } from '@/api/client';
import { ReturnDoc } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { shareDocument } from '@/utils/pdf';

const REASON_LABEL: Record<ReturnDoc['reason'], string> = {
  UNSOLD: 'Invendu',
  DAMAGED: 'Endommagé',
  OTHER: 'Autre',
};

export default function ReturnsHistoryScreen() {
  const [returns, setReturns] = useState<ReturnDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setReturns(await listReturns());
        } catch (err) {
          setError(extractErrorMessage(err));
        }
      })();
    }, [])
  );

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Bons de Retour</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {returns.length === 0 ? (
        <Text className="text-slate-500">Aucun retour enregistré pour le moment.</Text>
      ) : (
        returns.map((r) => (
          <View key={r._id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
            <View className="flex-row justify-between">
              <Text className="font-semibold text-slate-900">{r.returnNumber}</Text>
              <Text className="text-slate-500">{new Date(r.date).toLocaleDateString('fr-FR')}</Text>
            </View>
            <Text className="text-slate-500 mt-1">Motif : {REASON_LABEL[r.reason]}</Text>
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
    </Screen>
  );
}
