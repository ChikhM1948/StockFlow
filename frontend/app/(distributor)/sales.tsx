import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { listSales } from '@/api/sales';
import { API_URL, extractErrorMessage } from '@/api/client';
import { SaleDoc } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { shareDocument } from '@/utils/pdf';

export default function SalesHistoryScreen() {
  const [sales, setSales] = useState<SaleDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setSales(await listSales());
        } catch (err) {
          setError(extractErrorMessage(err));
        }
      })();
    }, [])
  );

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Mes ventes</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {sales.length === 0 ? (
        <Text className="text-slate-500">Aucune vente enregistrée pour le moment.</Text>
      ) : (
        sales.map((s) => (
          <View key={s._id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
            <View className="flex-row justify-between">
              <Text className="font-semibold text-slate-900">{s.saleNumber}</Text>
              <Text className="text-slate-500">{new Date(s.date).toLocaleDateString('fr-FR')}</Text>
            </View>
            <Text className="text-slate-500 mt-1">Client : {s.customer.name}</Text>
            <Text className="text-slate-900 font-medium mt-1">Total : {formatMoney(s.totalAmount)}</Text>

            <View className="flex-row gap-2 mt-3">
              <View className="flex-1">
                <Button
                  label="Facture"
                  variant="outline"
                  onPress={() => shareDocument(`${API_URL}/sales/${s._id}/invoice`, `${s.saleNumber}.pdf`)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Bon de livraison"
                  variant="outline"
                  onPress={() =>
                    shareDocument(`${API_URL}/sales/${s._id}/delivery-note`, `${s.saleNumber}-BL.pdf`)
                  }
                />
              </View>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
