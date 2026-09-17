import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { listDispatches } from '@/api/dispatches';
import { API_URL, extractErrorMessage } from '@/api/client';
import { DispatchDoc } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { shareDocument } from '@/utils/pdf';
import { CalendarDays, ClipboardList, Download, FileText, Send, Truck } from 'lucide-react-native';

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

  const totalValue = dispatches.reduce((total, dispatch) => total + dispatch.totalAmount, 0);

  return (
    <Screen>
      <View className="pt-2 mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-blue-600 items-center justify-center mr-3">
            <ClipboardList size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Bons de sortie</Text>
            <Text className="text-slate-500 mt-0.5">Historique des transferts vers vos distributeurs.</Text>
          </View>
        </View>
      </View>

      <View className="bg-slate-900 rounded-2xl p-4 mb-5 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <Send size={18} color="#93C5FD" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Transferts émis</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">{dispatches.length}</Text>
        </View>
        <View className="items-end">
          <Text className="text-slate-400 text-xs">Valeur totale</Text>
          <Text className="text-blue-200 font-bold mt-1">{formatMoney(totalValue)}</Text>
        </View>
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      {dispatches.length === 0 ? (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
            <FileText size={22} color="#64748B" />
          </View>
          <Text className="text-slate-900 font-bold">Aucun bon de sortie</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Les transferts émis apparaîtront ici.</Text>
        </View>
      ) : (
        dispatches.map((d) => {
          const distributorName = typeof d.distributor === 'string' ? d.distributor : d.distributor.name;
          return (
            <View key={d._id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                  <FileText size={18} color="#2563EB" strokeWidth={2.1} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 text-base">{d.dispatchNumber}</Text>
                  <View className="flex-row items-center mt-1">
                    <CalendarDays size={13} color="#94A3B8" />
                    <Text className="text-slate-500 text-xs ml-1.5">{new Date(d.date).toLocaleDateString('fr-FR')}</Text>
                  </View>
                </View>
                <View className="bg-emerald-50 rounded-full px-2.5 py-1">
                  <Text className="text-emerald-700 text-xs font-semibold">Émis</Text>
                </View>
              </View>

              <View className="border-t border-slate-100 mt-4 pt-3 flex-row items-center">
                <Truck size={15} color="#64748B" />
                <Text className="text-slate-600 text-sm ml-2 flex-1">{distributorName}</Text>
                <Text className="text-slate-900 font-bold">{formatMoney(d.totalAmount)}</Text>
              </View>

              <Pressable
                onPress={() => shareDocument(`${API_URL}/dispatches/${d._id}/pdf`, `${d.dispatchNumber}.pdf`)}
                className="flex-row items-center justify-center rounded-xl border border-blue-200 bg-blue-50 py-3 mt-4"
              >
                <Download size={17} color="#2563EB" strokeWidth={2.2} />
                <Text className="text-blue-700 font-bold ml-2">Partager le PDF</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </Screen>
  );
}
