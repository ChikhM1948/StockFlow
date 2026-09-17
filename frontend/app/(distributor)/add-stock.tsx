import React, { useCallback, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { listProducts } from '@/api/products';
import { addOwnStock } from '@/api/dispatches';
import { API_URL, extractErrorMessage } from '@/api/client';
import { Product } from '@/api/types';
import { shareDocument } from '@/utils/pdf';

export default function AddStockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setProducts(await listProducts());
        } catch (err) {
          setError(extractErrorMessage(err));
        }
      })();
    }, [])
  );

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    const items = Object.entries(quantities)
      .map(([productId, qty]) => ({ productId, quantity: Number(qty) }))
      .filter((line) => line.quantity > 0);

    if (items.length === 0) {
      setError('Renseignez au moins une quantité à ajouter.');
      return;
    }

    setLoading(true);
    try {
      const dispatch = await addOwnStock(items);
      setQuantities({});
      setSuccess(`Stock ajouté (${dispatch.dispatchNumber}).`);
      await shareDocument(`${API_URL}/dispatches/${dispatch._id}/pdf`, `${dispatch.dispatchNumber}.pdf`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Ajouter du stock</Text>
      <Text className="text-slate-500 mb-4">
        Les quantités sont prélevées sur le Stock Central et ajoutées à votre stock.
      </Text>

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

      {products.length === 0 && (
        <Text className="text-slate-500">Aucun article disponible dans le Stock Central pour le moment.</Text>
      )}

      {error && <Text className="text-red-500 mb-4 mt-2">{error}</Text>}
      {success && <Text className="text-green-600 mb-4 mt-2">{success}</Text>}

      <View className="mt-4">
        <Button label="Ajouter à mon stock" onPress={handleSubmit} loading={loading} />
      </View>
    </Screen>
  );
}
