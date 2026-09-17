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
import { formatMoney } from '@/utils/money';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { shareDocument } from '@/utils/pdf';
import { Check, CircleDollarSign, MapPin, Package, Phone, ReceiptText, ShoppingCart, Store, UserRound } from 'lucide-react-native';

const CUSTOMER_TYPES: { value: CustomerType; label: string }[] = [
  { value: 'EPICERIE', label: 'Épicerie' },
  { value: 'GROSSISTE', label: 'Grossiste' },
  { value: 'PARTICULIER', label: 'Particulier' },
  { value: 'AUTRE', label: 'Autre' },
];

const CUSTOMER_TYPE_ICONS = {
  EPICERIE: Store,
  GROSSISTE: Package,
  PARTICULIER: UserRound,
  AUTRE: ReceiptText,
};

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

  const selectedLines = Object.entries(lines).filter(([, line]) => Number(line.quantity) > 0);
  const saleTotal = selectedLines.reduce((total, [, line]) => total + Number(line.quantity) * Number(line.unitPrice), 0);

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
      <View className="pt-2 mb-6">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-emerald-600 items-center justify-center mr-3">
            <ShoppingCart size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Nouvelle vente</Text>
            <Text className="text-slate-500 mt-0.5">Enregistrez une vente et générez vos documents.</Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <UserRound size={18} color="#2563EB" strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">1. Informations client</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">À qui vendez-vous ces articles ?</Text>

        <Input label="Nom du client" value={customerName} onChangeText={setCustomerName} placeholder="Ex: Épicerie du Marché" />

        <Text className="text-sm font-semibold text-slate-600 mb-2">Type de client</Text>
        <View className="gap-2 mb-4">
        {CUSTOMER_TYPES.map((t) => {
          const selected = customerType === t.value;
          const Icon = CUSTOMER_TYPE_ICONS[t.value];
          return (
            <Pressable
              key={t.value}
              onPress={() => setCustomerType(t.value)}
              className="flex-row items-center px-3 py-2.5 rounded-xl border"
              style={{ borderColor: selected ? primaryColor : '#E2E8F0', backgroundColor: selected ? `${primaryColor}12` : '#FFFFFF' }}
            >
              <View className="w-8 h-8 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: selected ? primaryColor : '#F1F5F9' }}>
                <Icon size={15} color={selected ? '#FFFFFF' : '#64748B'} />
              </View>
              <Text className="text-slate-900 font-semibold flex-1">{t.label}</Text>
              {selected && <Check size={18} color={primaryColor} strokeWidth={2.6} />}
            </Pressable>
          );
        })}
        </View>

        <View className="flex-row items-center mb-2">
          <Phone size={14} color="#64748B" />
          <Text className="text-slate-600 text-xs font-semibold ml-1.5">Coordonnées</Text>
        </View>
        <Input label="Téléphone du client" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="Optionnel" />
        <View className="flex-row items-center mb-2 mt-1">
          <MapPin size={14} color="#64748B" />
          <Text className="text-slate-600 text-xs font-semibold ml-1.5">Adresse de livraison</Text>
        </View>
        <Input label="Adresse du client" value={customerAddress} onChangeText={setCustomerAddress} placeholder="Optionnel" />
      </View>

      <View className="flex-row items-center mb-2">
        <Package size={17} color="#475569" />
        <Text className="text-base font-bold text-slate-800 ml-2">2. Articles vendus</Text>
        <View className="bg-slate-200 rounded-full px-2 py-0.5 ml-2">
          <Text className="text-slate-600 text-xs font-bold">{selectedLines.length}</Text>
        </View>
      </View>
      {stocks.map((s) => (
        <View key={s._id} className={`bg-white rounded-2xl p-3 mb-2 border ${Number(lines[s.product]?.quantity) > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mr-3">
              <Package size={18} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900">{s.productName}</Text>
              <Text className="text-xs text-slate-500 mt-1">Disponible : {s.quantity} {s.unit}</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 border border-slate-300 rounded-xl px-2 py-2.5 text-center font-bold text-slate-900 bg-white"
              keyboardType="numeric"
              placeholder="Qté"
              placeholderTextColor="#94A3B8"
              value={lines[s.product]?.quantity || ''}
              onChangeText={(val) => updateLine(s.product, { quantity: val })}
            />
            <TextInput
              className="flex-1 border border-slate-300 rounded-xl px-2 py-2.5 text-center font-bold text-slate-900 bg-white"
              keyboardType="numeric"
              placeholder="Prix vente"
              placeholderTextColor="#94A3B8"
              value={lines[s.product]?.unitPrice || ''}
              onChangeText={(val) => updateLine(s.product, { unitPrice: val })}
            />
          </View>
        </View>
      ))}

      {stocks.length === 0 && (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <Package size={24} color="#64748B" />
          <Text className="text-slate-900 font-bold mt-3">Aucun article en stock</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Ajoutez du stock avant d'enregistrer une vente.</Text>
        </View>
      )}

      <View className="bg-slate-900 rounded-2xl p-4 mt-3 mb-4 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <CircleDollarSign size={18} color="#86EFAC" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs">Résumé de la vente</Text>
          <Text className="text-white text-xl font-bold mt-0.5">{formatMoney(saleTotal)}</Text>
        </View>
        <Text className="text-slate-400 text-xs">{selectedLines.length} article(s)</Text>
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      <Button label="Enregistrer et générer les documents" onPress={handleSubmit} loading={loading} />
      <Text className="text-center text-slate-400 text-xs mt-3 mb-2">La facture et le bon de livraison seront générés.</Text>
    </Screen>
  );
}
