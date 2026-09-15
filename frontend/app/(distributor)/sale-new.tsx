import React, { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { listMyStock } from '@/api/distributorStocks';
import { createSale } from '@/api/sales';
import { API_URL, extractErrorMessage } from '@/api/client';
import { CustomerType, DistributorStockItem } from '@/api/types';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { shareDocument } from '@/utils/pdf';

const CUSTOMER_TYPES: { value: CustomerType; label: string }[] = [
  { value: 'EPICERIE', label: 'Épicerie' },
  { value: 'GROSSISTE', label: 'Grossiste' },
  { value: 'PARTICULIER', label: 'Particulier' },
  { value: 'AUTRE', label: 'Autre' },
];

interface Line {
  quantity: string;
  unitPrice: string;
}

export default function NewSaleScreen() {
  const { primaryColor } = useBrandTheme();
  const [stocks, setStocks] = useState<DistributorStockItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('EPICERIE');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [lines, setLines] = useState<Record<string, Line>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const data = await listMyStock();
          setStocks(data);
          setLines((prev) => {
            const next = { ...prev };
            data.forEach((s) => {
              if (!next[s.product]) next[s.product] = { quantity: '', unitPrice: String(s.lastUnitPrice) };
            });
            return next;
          });
        } catch (err) {
          setError(extractErrorMessage(err));
        }
      })();
    }, [])
  );

  const updateLine = (productId: string, patch: Partial<Line>) => {
    setLines((prev) => ({ ...prev, [productId]: { ...prev[productId], ...patch } }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!customerName) {
      setError('Le nom du client est requis.');
      return;
    }

    const items = Object.entries(lines)
      .map(([productId, line]) => ({
        productId,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      }))
      .filter((line) => line.quantity > 0);

    if (items.length === 0) {
      setError('Renseignez au moins une quantité vendue.');
      return;
    }

    setLoading(true);
    try {
      const sale = await createSale({
        customer: { name: customerName, type: customerType, phone: customerPhone, address: customerAddress },
        items,
      });
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setLines({});

      await shareDocument(`${API_URL}/sales/${sale._id}/invoice`, `${sale.saleNumber}.pdf`);
      await shareDocument(`${API_URL}/sales/${sale._id}/delivery-note`, `${sale.saleNumber}-BL.pdf`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Nouvelle vente</Text>

      <Input label="Nom du client" value={customerName} onChangeText={setCustomerName} placeholder="Ex: Épicerie du Marché" />

      <Text className="text-sm font-medium text-slate-600 mb-2">Type de client</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {CUSTOMER_TYPES.map((t) => {
          const selected = customerType === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => setCustomerType(t.value)}
              className="px-3 py-2 rounded-full border"
              style={{ borderColor: primaryColor, backgroundColor: selected ? primaryColor : 'transparent' }}
            >
              <Text style={{ color: selected ? '#FFFFFF' : primaryColor }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Input label="Téléphone du client" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
      <Input label="Adresse du client" value={customerAddress} onChangeText={setCustomerAddress} />

      <Text className="text-sm font-medium text-slate-600 mb-2 mt-2">Articles vendus</Text>
      {stocks.map((s) => (
        <View key={s._id} className="bg-white rounded-xl p-3 mb-2 border border-slate-200">
          <Text className="font-medium text-slate-900 mb-2">
            {s.productName} <Text className="text-xs text-slate-500">(dispo: {s.quantity} {s.unit})</Text>
          </Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-center bg-white"
              keyboardType="numeric"
              placeholder="Qté"
              value={lines[s.product]?.quantity || ''}
              onChangeText={(val) => updateLine(s.product, { quantity: val })}
            />
            <TextInput
              className="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-center bg-white"
              keyboardType="numeric"
              placeholder="Prix vente"
              value={lines[s.product]?.unitPrice || ''}
              onChangeText={(val) => updateLine(s.product, { unitPrice: val })}
            />
          </View>
        </View>
      ))}

      {error && <Text className="text-red-500 mb-4 mt-2">{error}</Text>}

      <View className="mt-4">
        <Button label="Enregistrer et générer la Facture" onPress={handleSubmit} loading={loading} />
      </View>
    </Screen>
  );
}
