import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PaymentModal } from '@/components/PaymentModal';
import { listSales, recordPayment } from '@/api/sales';
import { API_URL, extractErrorMessage } from '@/api/client';
import { SaleDoc } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { shareDocument } from '@/utils/pdf';
import { AlertCircle, CheckCircle2, CircleDollarSign, Download, FileText, ReceiptText, ShoppingCart, UserRound } from 'lucide-react-native';

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

  const totalSales = sales.reduce((total, sale) => total + sale.totalAmount, 0);
  const totalOutstanding = sales.reduce((total, sale) => total + (sale.totalAmount - sale.amountPaid), 0);
  const unpaidCount = sales.filter((sale) => sale.paymentStatus !== 'PAID').length;

  return (
    <Screen>
      <View className="pt-2 mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-emerald-600 items-center justify-center mr-3">
            <ShoppingCart size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Mes ventes</Text>
            <Text className="text-slate-500 mt-0.5">Retrouvez vos ventes, documents et encaissements.</Text>
          </View>
        </View>
      </View>

      <View className="bg-slate-900 rounded-2xl p-4 mb-5 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <CircleDollarSign size={19} color="#86EFAC" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Total vendu</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">{formatMoney(totalSales)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-xs">À recouvrer</Text>
          <Text className="text-amber-300 font-bold mt-1">{formatMoney(totalOutstanding)}</Text>
          <Text className="text-slate-400 text-[11px] mt-0.5">{unpaidCount} en attente</Text>
        </View>
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      {sales.length === 0 ? (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
            <ReceiptText size={22} color="#64748B" />
          </View>
          <Text className="text-slate-900 font-bold">Aucune vente enregistrée</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Vos nouvelles ventes apparaîtront ici.</Text>
        </View>
      ) : (
        sales.map((s) => {
          const balance = s.totalAmount - s.amountPaid;
          const isPaid = s.paymentStatus === 'PAID';
          return (
            <View key={s._id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mr-3">
                  <ReceiptText size={18} color="#16A34A" strokeWidth={2.1} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 text-base">{s.saleNumber}</Text>
                  <Text className="text-slate-500 text-xs mt-1">{new Date(s.date).toLocaleDateString('fr-FR')}</Text>
                </View>
                <View className={`rounded-full px-2.5 py-1 ${isPaid ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <Text className={`text-xs font-semibold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {PAYMENT_STATUS_LABEL[s.paymentStatus]}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-4 bg-slate-50 rounded-xl px-3 py-2.5">
                <UserRound size={15} color="#64748B" />
                <Text className="text-slate-700 text-sm font-medium ml-2">{s.customer.name}</Text>
              </View>

              <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-100">
                <View className="flex-row items-center">
                  {isPaid ? <CheckCircle2 size={16} color="#16A34A" /> : <AlertCircle size={16} color="#D97706" />}
                  <Text className={`text-xs font-semibold ml-2 ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isPaid ? 'Paiement complet' : `Solde dû : ${formatMoney(balance)}`}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-slate-400 text-[11px]">Total</Text>
                  <Text className="text-slate-900 font-bold">{formatMoney(s.totalAmount)}</Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-4">
                <Pressable
                  onPress={() => shareDocument(`${API_URL}/sales/${s._id}/invoice`, `${s.saleNumber}.pdf`)}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3"
                >
                  <Download size={16} color="#475569" />
                  <Text className="text-slate-700 text-xs font-bold ml-1.5">Facture</Text>
                </Pressable>
                <Pressable
                  onPress={() => shareDocument(`${API_URL}/sales/${s._id}/delivery-note`, `${s.saleNumber}-BL.pdf`)}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3"
                >
                  <FileText size={16} color="#475569" />
                  <Text className="text-slate-700 text-xs font-bold ml-1.5">Livraison</Text>
                </Pressable>
              </View>

              {!isPaid && (
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
