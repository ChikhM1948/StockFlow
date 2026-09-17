import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Boxes,
  Camera,
  CircleDollarSign,
  Gauge,
  ImagePlus,
  PackagePlus,
  Ruler,
  Tag,
  X,
} from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { DynamicFieldsEditor } from '@/components/DynamicFieldsEditor';
import { createProduct } from '@/api/products';
import { CustomField } from '@/api/types';
import { extractErrorMessage } from '@/api/client';

export default function NewProductScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickProductImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorisez l'accès aux photos pour ajouter une image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    const parsedThreshold = lowStockThreshold.trim() === '' ? undefined : Number(lowStockThreshold);

    if (
      !name ||
      !unit ||
      Number.isNaN(parsedQuantity) ||
      Number.isNaN(parsedPrice) ||
      (parsedThreshold !== undefined && Number.isNaN(parsedThreshold))
    ) {
      setError('Merci de renseigner tous les champs obligatoires avec des valeurs valides.');
      return;
    }

    setLoading(true);
    try {
      await createProduct({
        name,
        quantity: parsedQuantity,
        unit,
        price: parsedPrice,
        lowStockThreshold: parsedThreshold,
        customFields: customFields.filter((f) => f.key.trim() !== ''),
      });
      setName('');
      setQuantity('');
      setUnit('');
      setPrice('');
      setLowStockThreshold('');
      setCustomFields([]);
      setImageUri(null);
      router.push('/(admin)');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="pt-2 mb-6">
        <View className="flex-row items-center mb-2">
          <View className="w-11 h-11 rounded-2xl bg-blue-600 items-center justify-center mr-3">
            <PackagePlus size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Nouvel article</Text>
            <Text className="text-slate-500 mt-0.5">Ajoutez un produit à votre stock central.</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={pickProductImage}
        className="bg-white border border-slate-200 rounded-2xl p-3 mb-6 flex-row items-center"
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="w-24 h-24 rounded-xl" resizeMode="cover" />
        ) : (
          <View className="w-24 h-24 rounded-xl bg-blue-50 items-center justify-center">
            <ImagePlus size={28} color="#2563EB" strokeWidth={1.8} />
            <Text className="text-blue-700 text-xs font-semibold mt-1">Ajouter</Text>
          </View>
        )}
        <View className="flex-1 ml-4">
          <View className="flex-row items-center">
            <Camera size={16} color="#2563EB" strokeWidth={2.2} />
            <Text className="text-slate-900 font-bold ml-2">Photo du produit</Text>
          </View>
          <Text className="text-slate-500 text-sm mt-1 leading-5">
            {imageUri ? 'Touchez pour remplacer la photo.' : 'Une image aide à retrouver rapidement cet article.'}
          </Text>
        </View>
        {imageUri && (
          <Pressable
            onPress={() => setImageUri(null)}
            hitSlop={10}
            className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
          >
            <X size={16} color="#64748B" />
          </Pressable>
        )}
      </Pressable>

      <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <Tag size={18} color="#2563EB" strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">Informations générales</Text>
        </View>
        <Input label="Nom du produit" value={name} onChangeText={setName} placeholder="Ex: Riz parfumé 25kg" />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input label="Unité" value={unit} onChangeText={setUnit} placeholder="Sac, kg..." />
          </View>
          <View className="flex-1">
            <Input label="Quantité initiale" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="Ex: 100" />
          </View>
        </View>
      </View>

      <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-4">
          <CircleDollarSign size={18} color="#16A34A" strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">Prix et surveillance</Text>
        </View>
        <Input label="Prix unitaire" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Ex: 25000" />
        <Input
          label="Seuil de stock faible"
          value={lowStockThreshold}
          onChangeText={setLowStockThreshold}
          keyboardType="numeric"
          placeholder="10 (par défaut)"
        />
        <View className="flex-row items-center bg-emerald-50 rounded-xl px-3 py-2.5 mt-1">
          <Gauge size={16} color="#16A34A" />
          <Text className="text-emerald-800 text-xs ml-2 flex-1">Vous recevrez une alerte lorsque le stock atteindra ce seuil.</Text>
        </View>
      </View>

      <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
        <View className="flex-row items-center mb-1">
          <Boxes size={18} color="#D97706" strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">Détails additionnels</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-3">Ajoutez des informations comme la marque ou la date d'expiration.</Text>
        <DynamicFieldsEditor fields={customFields} onChange={setCustomFields} />
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

      <Button label="Enregistrer l'article" onPress={handleSubmit} loading={loading} />
      <Text className="text-center text-slate-400 text-xs mt-3 mb-2">Les champs marqués sont nécessaires pour créer l'article.</Text>
    </Screen>
  );
}
