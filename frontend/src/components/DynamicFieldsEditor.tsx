import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CustomField } from '@/api/types';

interface Props {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

/**
 * Permet à l'Admin d'ajouter des attributs libres à un produit
 * (ex: "Date de péremption" -> "12/2026"), stockés en clé/valeur côté API.
 */
export function DynamicFieldsEditor({ fields, onChange }: Props) {
  const updateField = (index: number, patch: Partial<CustomField>) => {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addField = () => {
    onChange([...fields, { key: '', value: '' }]);
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-slate-600 mb-2">Champs personnalisés</Text>

      {fields.map((field, index) => (
        <View key={index} className="flex-row items-center mb-2 gap-2">
          <TextInput
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900"
            placeholder="Ex: Date de péremption"
            placeholderTextColor="#94A3B8"
            value={field.key}
            onChangeText={(key) => updateField(index, { key })}
          />
          <TextInput
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900"
            placeholder="Ex: 12/2026"
            placeholderTextColor="#94A3B8"
            value={field.value}
            onChangeText={(value) => updateField(index, { value })}
          />
          <Pressable onPress={() => removeField(index)} className="px-2 py-2">
            <Text className="text-red-500 font-semibold">✕</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={addField} className="mt-1">
        <Text className="text-blue-600 font-medium">+ Ajouter un champ</Text>
      </Pressable>
    </View>
  );
}
