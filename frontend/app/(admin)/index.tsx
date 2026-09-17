import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { listProducts } from '@/api/products';
import { listLowStockDistributorStocks } from '@/api/distributorStocks';
import { LowStockDistributorStockItem, Product } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { extractErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { trialDaysLeft } from '@/utils/subscription';
import { AlertTriangle, ArrowUpRight, Boxes, CirclePlus, Package, Truck, Wallet } from 'lucide-react-native';

function TrialBanner() {
  const { brand } = useAuth();
  const daysLeft = trialDaysLeft(brand);
  if (daysLeft === null) return null;

  return (
    <View className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 mb-5 flex-row">
      <Wallet size={19} color="#B45309" />
      <Text className="text-amber-800 font-semibold ml-3 flex-1">
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
    <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 mb-5 flex-row">
      <AlertTriangle size={20} color="#DC2626" strokeWidth={2.2} />
      <View className="flex-1 ml-3">
        <Text className="text-red-900 font-bold mb-1">
          {total} article{total > 1 ? 's' : ''} à réapprovisionner
        </Text>
        <Text className="text-red-700 text-sm">
          {lowStockProducts.length > 0 && `Stock central : ${lowStockProducts.map((p) => p.name).join(', ')}`}
          {lowStockProducts.length > 0 && lowStockDistributorStocks.length > 0 ? ' · ' : ''}
          {lowStockDistributorStocks.length > 0 && 'Stock distributeurs à surveiller'}
        </Text>
      </View>
    </View>
  );
}

function ProductCard({ product }: { product: Product }) {
  const isLowStock = product.quantity <= product.lowStockThreshold;

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-center flex-1 pr-2">
          <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isLowStock ? 'bg-red-50' : 'bg-blue-50'}`}>
            <Package size={19} color={isLowStock ? '#DC2626' : '#2563EB'} strokeWidth={2.2} />
          </View>
          <View className="flex-1 flex-row items-center flex-wrap">
          <Text className="text-base font-semibold text-slate-900">{product.name}</Text>
          {isLowStock && <LowStockBadge />}
          </View>
        </View>
        <Text className="text-base font-bold text-slate-900">{formatMoney(product.price)}</Text>
      </View>
      <Text className={isLowStock ? 'text-red-600 font-semibold mt-3' : 'text-slate-500 font-medium mt-3'}>
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
  const router = useRouter();
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
  const totalUnits = products.reduce((sum, product) => sum + product.quantity, 0);
  const stockValue = products.reduce((sum, product) => sum + product.quantity * product.price, 0);

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
      <View className="mb-5">
        <View className="flex-row items-center mb-2">
          <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mr-3">
            <Boxes size={19} color="#2563EB" strokeWidth={2.2} />
          </View>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Opérations</Text>
        </View>
        <Text className="text-3xl font-bold text-slate-950">Stock Central</Text>
        <Text className="text-slate-500 mt-1">Une vue claire de vos produits et de vos priorités.</Text>
      </View>

      <TrialBanner />

      <LowStockBanner lowStockProducts={lowStockProducts} lowStockDistributorStocks={lowStockDistributorStocks} />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <View className="flex-row gap-2 mb-5">
        <View className="flex-1 bg-slate-900 rounded-2xl p-4">
          <CirclePlus size={17} color="#93C5FD" />
          <Text className="text-slate-400 text-xs mt-3">Références</Text>
          <Text className="text-white text-2xl font-bold mt-1">{products.length}</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-200">
          <Boxes size={17} color="#7C3AED" />
          <Text className="text-slate-500 text-xs mt-3">Unités en stock</Text>
          <Text className="text-slate-900 text-2xl font-bold mt-1">{totalUnits}</Text>
        </View>
      </View>

      <View className="bg-blue-600 rounded-2xl p-5 mb-5 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-blue-100 text-xs font-semibold">Valeur estimée du stock</Text>
          <Text className="text-white text-2xl font-bold mt-1">{formatMoney(stockValue)}</Text>
        </View>
        <View className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center">
          <ArrowUpRight size={23} color="#FFFFFF" />
        </View>
      </View>

      <View className="flex-row gap-2 mb-5">
        <Pressable onPress={() => router.push('/(admin)/product-new')} className="flex-1 bg-white border border-slate-200 rounded-2xl p-4">
          <CirclePlus size={19} color="#2563EB" />
          <Text className="text-slate-900 font-bold mt-3">Nouvel article</Text>
          <Text className="text-slate-400 text-xs mt-1">Ajouter au stock</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(admin)/dispatch-new')} className="flex-1 bg-white border border-slate-200 rounded-2xl p-4">
          <Truck size={19} color="#7C3AED" />
          <Text className="text-slate-900 font-bold mt-3">Bon de sortie</Text>
          <Text className="text-slate-400 text-xs mt-1">Distribuer du stock</Text>
        </Pressable>
      </View>

      {products.length === 0 ? (
        <View className="items-center py-8">
          <Package size={28} color="#94A3B8" />
          <Text className="text-slate-700 font-semibold mt-3">Aucun article</Text>
          <Text className="text-slate-400 text-sm mt-1">Ajoutez votre premier produit pour commencer.</Text>
        </View>
      ) : (
        products.map((p) => <ProductCard key={p._id} product={p} />)
      )}
    </ScrollView>
  );
}
