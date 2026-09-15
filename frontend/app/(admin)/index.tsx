import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { listProducts } from '@/api/products';
import { listLowStockDistributorStocks } from '@/api/distributorStocks';
import { LowStockDistributorStockItem, Product } from '@/api/types';
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

function LowStockBadge() {
  return (
    <View className="bg-red-50 border border-red-200 rounded-full px-2 py-0.5 ml-2">
      <Text className="text-red-700 text-xs font-semibold">Stock faible</Text>
    </View>
  );
}

function LowStockBanner({
  lowStockProducts,
  lowStockDistributorStocks,
}: {
  lowStockProducts: Product[];
  lowStockDistributorStocks: LowStockDistributorStockItem[];
}) {
  const total = lowStockProducts.length + lowStockDistributorStocks.length;
  if (total === 0) return null;

  return (
    <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
      <Text className="text-red-800 font-semibold mb-1">
        {total} article{total > 1 ? 's' : ''} en stock faible
      </Text>
      {lowStockProducts.length > 0 && (
        <Text className="text-red-700 text-sm">
          Stock Central : {lowStockProducts.map((p) => p.name).join(', ')}
        </Text>
      )}
      {lowStockDistributorStocks.length > 0 && (
        <Text className="text-red-700 text-sm mt-1">
          Chez les distributeurs :{' '}
          {lowStockDistributorStocks
            .map((s) => `${s.productName} (${s.distributor.name})`)
            .join(', ')}
        </Text>
      )}
    </View>
  );
}

function ProductCard({ product }: { product: Product }) {
  const isLowStock = product.quantity <= product.lowStockThreshold;

  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2 flex-row items-center flex-wrap">
          <Text className="text-base font-semibold text-slate-900">{product.name}</Text>
          {isLowStock && <LowStockBadge />}
        </View>
        <Text className="text-base font-bold text-slate-900">{formatMoney(product.price)}</Text>
      </View>
      <Text className={isLowStock ? 'text-red-600 font-medium mt-1' : 'text-slate-500 mt-1'}>
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
  const [lowStockDistributorStocks, setLowStockDistributorStocks] = useState<LowStockDistributorStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const [productsData, lowStockStocksData] = await Promise.all([
        listProducts(),
        listLowStockDistributorStocks(),
      ]);
      setProducts(productsData);
      setLowStockDistributorStocks(lowStockStocksData);
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

  const lowStockProducts = products.filter((p) => p.quantity <= p.lowStockThreshold);

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

      <LowStockBanner lowStockProducts={lowStockProducts} lowStockDistributorStocks={lowStockDistributorStocks} />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      {products.length === 0 ? (
        <Text className="text-slate-500">Aucun article. Ajoutez votre premier produit.</Text>
      ) : (
        products.map((p) => <ProductCard key={p._id} product={p} />)
      )}
    </ScrollView>
  );
}
