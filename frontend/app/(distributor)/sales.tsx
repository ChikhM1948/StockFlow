import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PaymentModal } from '@/components/PaymentModal';
import { listSales, recordPayment } from '@/api/sales';
import { API_URL, extractErrorMessage } from '@/api/client';
import { SaleDoc } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { shareDocument } from '@/utils/pdf';

const PAYMENT_STATUS_LABEL: Record<SaleDoc['paymentStatus'], string> = {
  PAID: 'Payé',
  PARTIAL: 'Partiel',
  UNPAID: 'Impayé',
};

export default function SalesHistoryScreen() {
  const [sales, setSales] = useState<SaleDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<SaleDoc | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSales(await listSales());
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleRecordPayment = async (amount: number, note: string) => {
    if (!paymentTarget) return;
    const updated = await recordPayment(paymentTarget._id, { amount, note });
    setSales((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setPaymentTarget(null);
  };

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Mes ventes</Text>

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {sales.length === 0 ? (
        <Text className="text-slate-500">Aucune vente enregistrée pour le moment.</Text>
      ) : (
        sales.map((s) => {
          const balance = s.totalAmount - s.amountPaid;
          return (
            <View key={s._id} className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
              <View className="flex-row justify-between">
                <Text className="font-semibold text-slate-900">{s.saleNumber}</Text>
                <Text className="text-slate-500">{new Date(s.date).toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text className="text-slate-500 mt-1">Client : {s.customer.name}</Text>
              <Text className="text-slate-900 font-medium mt-1">Total : {formatMoney(s.totalAmount)}</Text>

              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-slate-500 text-sm">
                  {PAYMENT_STATUS_LABEL[s.paymentStatus]}
                  {s.paymentStatus !== 'PAID' ? ` — solde dû : ${formatMoney(balance)}` : ''}
                </Text>
              </View>

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

              {s.paymentStatus !== 'PAID' && (
                <View className="mt-2">
                  <Button label="Encaisser un paiement" onPress={() => setPaymentTarget(s)} />
                </View>
              )}
            </View>
          );
        })
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
    </Screen>
  );
}
