import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { listProducts } from '@/api/products';
import { Product } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { trialDaysLeft } from '@/utils/subscription';

function TrialBanner() {
  const { brand } = useAuth();
  const daysLeft = trialDaysLeft(brand);
  if (daysLeft === null) return null;

  return (
    <View className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
      <Text className="text-amber-800 font-medium">
        {daysLeft > 0
          ? `Essai gratuit : ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}.`
          : "Essai gratuit terminé aujourd'hui."}
      </Text>
    </View>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
      <View className="flex-row justify-between items-start">
        <Text className="text-base font-semibold text-slate-900 flex-1 pr-2">{product.name}</Text>
        <Text className="text-base font-bold text-slate-900">{formatMoney(product.price)}</Text>
      </View>
      <Text className="text-slate-500 mt-1">
        {product.quantity} {product.unit} disponible(s)
      </Text>

      {product.customFields.length > 0 && (
        <View className="mt-2 pt-2 border-t border-slate-100">
          {product.customFields.map((field, i) => (
            <Text key={i} className="text-xs text-slate-500">
              {field.key} : {field.value}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function StockCentralScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await listProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProducts().finally(() => setLoading(false));
    }, [fetchProducts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
      </Screen>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 px-4 pt-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-2xl font-bold text-slate-900 mb-4">Stock Central</Text>

      <TrialBanner />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {products.length === 0 ? (
        <Text className="text-slate-500">Aucun article. Ajoutez votre premier produit.</Text>
      ) : (
        products.map((p) => <ProductCard key={p._id} product={p} />)
      )}
    </ScrollView>
  );
}
