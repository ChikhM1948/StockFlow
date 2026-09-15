import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-slate-600 mb-1">{label}</Text>
      <TextInput
        className="border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 bg-white"
        placeholderTextColor="#94A3B8"
        {...props}
      />
    </View>
  );
}
