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
import { AlertCircle, CheckCircle2, ClipboardPlus, Package, Send, Warehouse } from 'lucide-react-native';

export default function AddStockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedLines = Object.entries(quantities).filter(([, quantity]) => Number(quantity) > 0);
  const totalUnits = selectedLines.reduce((total, [, quantity]) => total + Number(quantity), 0);

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
      <View className="pt-2 mb-6">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-blue-600 items-center justify-center mr-3">
            <ClipboardPlus size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Ajouter du stock</Text>
            <Text className="text-slate-500 mt-0.5">Réapprovisionnez votre stock depuis le dépôt central.</Text>
          </View>
        </View>
      </View>

      <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5 flex-row items-center">
        <Warehouse size={20} color="#2563EB" strokeWidth={2.1} />
        <Text className="text-blue-800 text-sm ml-3 flex-1 leading-5">
          Les quantités sélectionnées seront prélevées du Stock Central et ajoutées à votre stock.
        </Text>
      </View>

      <View className="flex-row items-center mb-2">
        <Package size={17} color="#475569" />
        <Text className="text-base font-bold text-slate-800 ml-2">Articles disponibles</Text>
      </View>

      {products.map((p) => (
        <View key={p._id} className={`flex-row items-center justify-between rounded-2xl p-3 mb-2 border ${Number(quantities[p._id]) > 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
          <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3">
            <Package size={18} color={Number(quantities[p._id]) > 0 ? '#2563EB' : '#64748B'} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="font-semibold text-slate-900">{p.name}</Text>
            <Text className="text-xs text-slate-500 mt-1">Disponible : {p.quantity} {p.unit}</Text>
          </View>
          <TextInput
            className="w-20 border border-slate-300 rounded-xl px-2 py-2.5 text-center font-bold text-slate-900 bg-white"
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
            value={quantities[p._id] || ''}
            onChangeText={(val) => setQuantities((prev) => ({ ...prev, [p._id]: val }))}
          />
        </View>
      ))}

      {products.length === 0 && (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <Package size={24} color="#64748B" />
          <Text className="text-slate-900 font-bold mt-3">Aucun article disponible</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Le Stock Central ne contient aucun article pour le moment.</Text>
        </View>
      )}

      <View className="bg-slate-900 rounded-2xl p-4 mt-3 mb-4 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <Send size={18} color="#93C5FD" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs">Résumé du réapprovisionnement</Text>
          <Text className="text-white font-bold mt-0.5">{selectedLines.length} article(s) · {totalUnits} unité(s)</Text>
        </View>
      </View>

      {error && (
        <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">
          <AlertCircle size={17} color="#DC2626" />
          <Text className="text-red-700 ml-2 flex-1">{error}</Text>
        </View>
      )}
      {success && (
        <View className="flex-row items-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3 mb-4">
          <CheckCircle2 size={17} color="#16A34A" />
          <Text className="text-emerald-700 font-semibold ml-2 flex-1">{success}</Text>
        </View>
      )}

      <Button label="Ajouter à mon stock" onPress={handleSubmit} loading={loading} />
      <Text className="text-center text-slate-400 text-xs mt-3 mb-2">Un bon de transfert sera généré après validation.</Text>
    </Screen>
  );
}
