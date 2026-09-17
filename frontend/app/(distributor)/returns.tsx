import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { listReturns } from '@/api/returns';
import { API_URL, extractErrorMessage } from '@/api/client';
import { ReturnDoc } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { shareDocument } from '@/utils/pdf';
import { CalendarDays, ClipboardList, Download, FileText, FileWarning, Package, RotateCcw, Send } from 'lucide-react-native';

const REASON_LABEL: Record<ReturnDoc['reason'], string> = {
  UNSOLD: 'Invendu',
  DAMAGED: 'Endommagé',
  OTHER: 'Autre',
};

const REASON_ICON = {
  UNSOLD: Package,
  DAMAGED: FileWarning,
  OTHER: RotateCcw,
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

  const totalValue = returns.reduce((total, item) => total + item.totalAmount, 0);

  return (
    <Screen>
      <View className="pt-2 mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-amber-500 items-center justify-center mr-3">
            <ClipboardList size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Bons de retour</Text>
            <Text className="text-slate-500 mt-0.5">Suivez les articles renvoyés au stock central.</Text>
          </View>
        </View>
      </View>

      <View className="bg-slate-900 rounded-2xl p-4 mb-5 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <Send size={18} color="#FCD34D" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Retours émis</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">{returns.length}</Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-xs">Valeur totale</Text>
          <Text className="text-amber-300 font-bold mt-1">{formatMoney(totalValue)}</Text>
        </View>
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      {returns.length === 0 ? (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
            <FileText size={22} color="#64748B" />
          </View>
          <Text className="text-slate-900 font-bold">Aucun retour enregistré</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Les bons créés apparaîtront ici.</Text>
        </View>
      ) : (
        returns.map((r) => {
          const ReasonIcon = REASON_ICON[r.reason];
          return (
          <View key={r._id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mr-3">
                <ReasonIcon size={18} color="#D97706" strokeWidth={2.1} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-base">{r.returnNumber}</Text>
                <View className="flex-row items-center mt-1">
                  <CalendarDays size={13} color="#94A3B8" />
                  <Text className="text-slate-500 text-xs ml-1.5">{new Date(r.date).toLocaleDateString('fr-FR')}</Text>
                </View>
              </View>
              <View className="bg-amber-50 rounded-full px-2.5 py-1">
                <Text className="text-amber-700 text-xs font-semibold">Enregistré</Text>
              </View>
            </View>

            <View className="flex-row items-center mt-4 pt-3 border-t border-slate-100">
              <RotateCcw size={15} color="#64748B" />
              <Text className="text-slate-600 text-sm ml-2 flex-1">{REASON_LABEL[r.reason]}</Text>
              <Text className="text-slate-900 font-bold">{formatMoney(r.totalAmount)}</Text>
            </View>
            {r.note ? (
              <View className="flex-row items-start mt-3 bg-slate-50 rounded-xl px-3 py-2.5">
                <FileWarning size={14} color="#64748B" />
                <Text className="text-slate-600 text-xs ml-2 flex-1">{r.note}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => shareDocument(`${API_URL}/returns/${r._id}/pdf`, `${r.returnNumber}.pdf`)}
              className="flex-row items-center justify-center rounded-xl border border-amber-200 bg-amber-50 py-3 mt-4"
            >
              <Download size={17} color="#D97706" strokeWidth={2.2} />
              <Text className="text-amber-700 font-bold ml-2">Partager le PDF</Text>
            </Pressable>
            </View>
          );
        })
      )}
    </Screen>
  );
}
