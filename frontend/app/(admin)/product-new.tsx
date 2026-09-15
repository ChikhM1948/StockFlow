import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
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
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (!name || !unit || Number.isNaN(parsedQuantity) || Number.isNaN(parsedPrice)) {
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
        customFields: customFields.filter((f) => f.key.trim() !== ''),
      });
      setName('');
      setQuantity('');
      setUnit('');
      setPrice('');
      setCustomFields([]);
      router.push('/(admin)');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Nouvel article</Text>

      <Input label="Nom du produit" value={name} onChangeText={setName} placeholder="Ex: Riz parfumé 25kg" />
      <Input
        label="Quantité"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="Ex: 100"
      />
      <Input label="Unité" value={unit} onChangeText={setUnit} placeholder="Ex: sac, kg, carton" />
      <Input label="Prix unitaire" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Ex: 25000" />

      <DynamicFieldsEditor fields={customFields} onChange={setCustomFields} />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <Button label="Enregistrer l'article" onPress={handleSubmit} loading={loading} />
    </Screen>
  );
}
