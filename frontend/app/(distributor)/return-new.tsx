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

const REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'UNSOLD', label: 'Invendu' },
  { value: 'DAMAGED', label: 'Endommagé' },
  { value: 'OTHER', label: 'Autre' },
];

export default function NewReturnScreen() {
  const { primaryColor } = useBrandTheme();
  const [stocks, setStocks] = useState<DistributorStockItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<ReturnReason>('UNSOLD');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Bon de Retour</Text>

      <Text className="text-sm font-medium text-slate-600 mb-2">Motif</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {REASONS.map((r) => {
          const selected = reason === r.value;
          return (
            <Pressable
              key={r.value}
              onPress={() => setReason(r.value)}
              className="px-3 py-2 rounded-full border"
              style={{ borderColor: primaryColor, backgroundColor: selected ? primaryColor : 'transparent' }}
            >
              <Text style={{ color: selected ? '#FFFFFF' : primaryColor }}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Input label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Ex: carton abîmé pendant le transport" />

      <Text className="text-sm font-medium text-slate-600 mb-2 mt-2">Quantités à retourner</Text>
      {stocks.map((s) => (
        <View key={s._id} className="flex-row items-center justify-between bg-white rounded-xl p-3 mb-2 border border-slate-200">
          <View className="flex-1 pr-2">
            <Text className="font-medium text-slate-900">{s.productName}</Text>
            <Text className="text-xs text-slate-500">Détenu : {s.quantity} {s.unit}</Text>
          </View>
          <TextInput
            className="w-20 border border-slate-300 rounded-lg px-2 py-2 text-center bg-white"
            keyboardType="numeric"
            placeholder="0"
            value={quantities[s.product] || ''}
            onChangeText={(val) => setQuantities((prev) => ({ ...prev, [s.product]: val }))}
          />
        </View>
      ))}
      {stocks.length === 0 && <Text className="text-slate-500">Aucun stock détenu pour le moment.</Text>}

      {error && <Text className="text-red-500 mb-4 mt-2">{error}</Text>}

      <View className="mt-4">
        <Button label="Générer le Bon de Retour" onPress={handleSubmit} loading={loading} />
      </View>
    </Screen>
  );
}
