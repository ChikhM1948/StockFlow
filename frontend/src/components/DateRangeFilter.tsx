import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarPicker } from './CalendarPicker';
import { formatDisplayDate } from '@/utils/dateFilters';
import { useBrandTheme } from '@/context/BrandThemeContext';

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const { primaryColor } = useBrandTheme();
  const [openField, setOpenField] = useState<'start' | 'end' | null>(null);

  const hasFilter = Boolean(value.startDate || value.endDate);

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-slate-600 mb-2">Période</Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => setOpenField('start')}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
        >
          <Text className="text-xs text-slate-400">Du</Text>
          <Text className="text-slate-900 font-medium">{formatDisplayDate(value.startDate) ?? 'Choisir'}</Text>
        </Pressable>

        <Pressable
          onPress={() => setOpenField('end')}
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white"
        >
          <Text className="text-xs text-slate-400">Au</Text>
          <Text className="text-slate-900 font-medium">{formatDisplayDate(value.endDate) ?? 'Choisir'}</Text>
        </Pressable>

        {hasFilter && (
          <Pressable onPress={() => onChange({})} hitSlop={8} className="px-2 py-2">
            <Text style={{ color: primaryColor }} className="font-medium">
              Effacer
            </Text>
          </Pressable>
        )}
      </View>

      <CalendarPicker
        visible={openField === 'start'}
        selectedDate={value.startDate}
        maxDate={value.endDate}
        onSelect={(dateString) => {
          onChange({ ...value, startDate: dateString });
          setOpenField(null);
        }}
        onClose={() => setOpenField(null)}
      />

      <CalendarPicker
        visible={openField === 'end'}
        selectedDate={value.endDate}
        minDate={value.startDate}
        onSelect={(dateString) => {
          onChange({ ...value, endDate: dateString });
          setOpenField(null);
        }}
        onClose={() => setOpenField(null)}
      />
    </View>
  );
}
