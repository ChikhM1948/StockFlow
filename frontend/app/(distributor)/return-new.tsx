import React, { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { listMyStock } from '@/api/distributorStocks';
import { createReturn } from '@/api/returns';
import { API_URL, extractErrorMessage } from '@/api/client';
import { DistributorStockItem, ReturnReason } from '@/api/types';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { shareDocument } from '@/utils/pdf';
import { AlertCircle, Check, ClipboardList, FileWarning, Package, RotateCcw, Send } from 'lucide-react-native';

const REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'UNSOLD', label: 'Invendu' },
  { value: 'DAMAGED', label: 'Endommagé' },
  { value: 'OTHER', label: 'Autre' },
];

const REASON_ICONS = {
  UNSOLD: Package,
  DAMAGED: FileWarning,
  OTHER: AlertCircle,
};

export default function NewReturnScreen() {
  const { primaryColor } = useBrandTheme();
  const [stocks, setStocks] = useState<DistributorStockItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<ReturnReason>('UNSOLD');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedLines = Object.entries(quantities).filter(([, quantity]) => Number(quantity) > 0);
  const totalUnits = selectedLines.reduce((total, [, quantity]) => total + Number(quantity), 0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setStocks(await listMyStock());
        } catch (err) {
          setError(extractErrorMessage(err));
        }
      })();
    }, [])
  );

  const handleSubmit = async () => {
    setError(null);

    const items = Object.entries(quantities)
      .map(([productId, qty]) => ({ productId, quantity: Number(qty) }))
      .filter((line) => line.quantity > 0);

    if (items.length === 0) {
      setError('Renseignez au moins une quantité à retourner.');
      return;
    }

    setLoading(true);
    try {
      const retour = await createReturn({ items, reason, note: note || undefined });
      setQuantities({});
      setNote('');
      await shareDocument(`${API_URL}/returns/${retour._id}/pdf`, `${retour.returnNumber}.pdf`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="pt-2 mb-6">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: primaryColor }}>
            <RotateCcw size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Bon de retour</Text>
            <Text className="text-slate-500 mt-0.5">Déclarez les articles à retourner au stock central.</Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <ClipboardList size={18} color={primaryColor} strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">1. Motif du retour</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">Indiquez pourquoi ces articles sont retournés.</Text>
        <View className="gap-2">
        {REASONS.map((r) => {
          const selected = reason === r.value;
          const Icon = REASON_ICONS[r.value];
          return (
            <Pressable
              key={r.value}
              onPress={() => setReason(r.value)}
              className="flex-row items-center px-3 py-3 rounded-xl border"
              style={{ borderColor: selected ? primaryColor : '#E2E8F0', backgroundColor: selected ? `${primaryColor}12` : '#FFFFFF' }}
            >
              <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: selected ? primaryColor : '#F1F5F9' }}>
                <Icon size={17} color={selected ? '#FFFFFF' : '#64748B'} />
              </View>
              <Text className="text-slate-900 font-semibold flex-1">{r.label}</Text>
              {selected && <Check size={19} color={primaryColor} strokeWidth={2.6} />}
            </Pressable>
          );
        })}
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <Text className="text-base font-bold text-slate-900 mb-1">Note complémentaire</Text>
        <Text className="text-slate-500 text-sm mb-3">Ajoutez un contexte utile pour le traitement du retour.</Text>
        <Input label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Ex: carton abîmé pendant le transport" />
      </View>

      <View className="flex-row items-center mb-2">
        <Package size={17} color="#475569" />
        <Text className="text-base font-bold text-slate-800 ml-2">2. Articles à retourner</Text>
      </View>
      {stocks.map((s) => (
        <View key={s._id} className={`flex-row items-center justify-between rounded-2xl p-3 mb-2 border ${Number(quantities[s.product]) > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3">
            <Package size={18} color={Number(quantities[s.product]) > 0 ? '#D97706' : '#64748B'} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="font-semibold text-slate-900">{s.productName}</Text>
            <Text className="text-xs text-slate-500 mt-1">Détenu : {s.quantity} {s.unit}</Text>
          </View>
          <TextInput
            className="w-20 border border-slate-300 rounded-xl px-2 py-2.5 text-center font-bold text-slate-900 bg-white"
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
            value={quantities[s.product] || ''}
            onChangeText={(val) => setQuantities((prev) => ({ ...prev, [s.product]: val }))}
          />
        </View>
      ))}
      {stocks.length === 0 && (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <Package size={24} color="#64748B" />
          <Text className="text-slate-900 font-bold mt-3">Aucun stock disponible</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Vous devez avoir du stock attribué pour créer un retour.</Text>
        </View>
      )}

      <View className="bg-slate-900 rounded-2xl p-4 mt-3 mb-4 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <Send size={18} color="#FCD34D" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs">Résumé du retour</Text>
          <Text className="text-white font-bold mt-0.5">{selectedLines.length} article(s) · {totalUnits} unité(s)</Text>
        </View>
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      <Button label="Générer le bon de retour" onPress={handleSubmit} loading={loading} />
      <Text className="text-center text-slate-400 text-xs mt-3 mb-2">Un PDF sera généré après validation.</Text>
    </Screen>
  );
}
