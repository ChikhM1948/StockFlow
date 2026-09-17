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
import { Check, ClipboardPlus, Package, Send, Truck, Warehouse } from 'lucide-react-native';

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

  const selectedLines = Object.entries(quantities).filter(([, quantity]) => Number(quantity) > 0);
  const totalUnits = selectedLines.reduce((total, [, quantity]) => total + Number(quantity), 0);

  return (
    <Screen>
      <View className="pt-2 mb-6">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: primaryColor }}>
            <ClipboardPlus size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Bon de sortie</Text>
            <Text className="text-slate-500 mt-0.5">Préparez un transfert depuis le stock central.</Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <Truck size={18} color={primaryColor} strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">1. Choisir un distributeur</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">À qui souhaitez-vous remettre ces articles ?</Text>
        <View className="gap-2">
          {distributors.map((d) => {
            const selected = selectedDistributor === d._id;
            return (
              <Pressable
                key={d._id}
                onPress={() => setSelectedDistributor(d._id)}
                className="flex-row items-center px-3 py-3 rounded-xl border"
                style={{ borderColor: selected ? primaryColor : '#E2E8F0', backgroundColor: selected ? `${primaryColor}12` : '#FFFFFF' }}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: selected ? primaryColor : '#F1F5F9' }}>
                  <Truck size={17} color={selected ? '#FFFFFF' : '#64748B'} />
                </View>
                <Text className="font-semibold text-slate-900 flex-1">{d.name}</Text>
                {selected && <Check size={19} color={primaryColor} strokeWidth={2.6} />}
              </Pressable>
            );
          })}
        </View>
        {distributors.length === 0 && (
          <Text className="text-slate-500 text-sm">Aucun distributeur. Créez-en un dans l'onglet Distributeurs.</Text>
        )}
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <Warehouse size={18} color="#D97706" strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">2. Ajouter les articles</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">Indiquez uniquement les quantités à transférer.</Text>
        {products.map((p) => {
          const selected = Number(quantities[p._id]) > 0;
          return (
            <View key={p._id} className={`flex-row items-center rounded-xl p-3 mb-2 border ${selected ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${selected ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <Package size={18} color={selected ? '#2563EB' : '#64748B'} />
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
          );
        })}
        {products.length === 0 && <Text className="text-slate-500 text-sm">Aucun produit disponible dans le stock central.</Text>}
      </View>

      <View className="bg-slate-900 rounded-2xl p-4 mb-4 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <Send size={18} color="#93C5FD" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs">Résumé du transfert</Text>
          <Text className="text-white font-bold mt-0.5">{selectedLines.length} article(s) · {totalUnits} unité(s)</Text>
        </View>
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      <Button label="Générer le bon de sortie" onPress={handleSubmit} loading={loading} />
      <Text className="text-center text-slate-400 text-xs mt-3 mb-2">Un PDF sera généré après validation.</Text>
    </Screen>
  );
}
