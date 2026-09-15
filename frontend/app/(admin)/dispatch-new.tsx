import React, { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { listDistributors } from '@/api/auth';
import { listProducts } from '@/api/products';
import { createDispatch } from '@/api/dispatches';
import { API_URL, extractErrorMessage } from '@/api/client';
import { Product, User } from '@/api/types';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { shareDocument } from '@/utils/pdf';

export default function NewDispatchScreen() {
  const { primaryColor } = useBrandTheme();
  const [distributors, setDistributors] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [d, p] = await Promise.all([listDistributors(), listProducts()]);
          setDistributors(d);
          setProducts(p);
        } catch (err) {
          setError(extractErrorMessage(err));
        }
      })();
    }, [])
  );

  const handleSubmit = async () => {
    setError(null);

    if (!selectedDistributor) {
      setError('Sélectionnez un distributeur.');
      return;
    }

    const items = Object.entries(quantities)
      .map(([productId, qty]) => ({ productId, quantity: Number(qty) }))
      .filter((line) => line.quantity > 0);

    if (items.length === 0) {
      setError('Renseignez au moins une quantité à sortir.');
      return;
    }

    setLoading(true);
    try {
      const dispatch = await createDispatch({ distributorId: selectedDistributor, items });
      setQuantities({});
      await shareDocument(`${API_URL}/dispatches/${dispatch._id}/pdf`, `${dispatch.dispatchNumber}.pdf`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Bon de Sortie</Text>

      <Text className="text-sm font-medium text-slate-600 mb-2">Distributeur</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
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
        {distributors.length === 0 && (
          <Text className="text-slate-500">Aucun distributeur. Créez-en un dans l'onglet Distributeurs.</Text>
        )}
      </View>

      <Text className="text-sm font-medium text-slate-600 mb-2">Quantités à sortir</Text>
      {products.map((p) => (
        <View key={p._id} className="flex-row items-center justify-between bg-white rounded-xl p-3 mb-2 border border-slate-200">
          <View className="flex-1 pr-2">
            <Text className="font-medium text-slate-900">{p.name}</Text>
            <Text className="text-xs text-slate-500">Disponible : {p.quantity} {p.unit}</Text>
          </View>
          <TextInput
            className="w-20 border border-slate-300 rounded-lg px-2 py-2 text-center bg-white"
            keyboardType="numeric"
            placeholder="0"
            value={quantities[p._id] || ''}
            onChangeText={(val) => setQuantities((prev) => ({ ...prev, [p._id]: val }))}
          />
        </View>
      ))}

      {error && <Text className="text-red-500 mb-4 mt-2">{error}</Text>}

      <View className="mt-4">
        <Button label="Générer le Bon de Sortie" onPress={handleSubmit} loading={loading} />
      </View>
    </Screen>
  );
}
