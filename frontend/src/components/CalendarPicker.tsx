import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { toDateString } from '@/utils/dateFilters';

const WEEKDAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthGrid(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // Grille commençant le lundi : décale l'index (dimanche = 0 -> 6).
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = Array(leadingBlanks).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

interface CalendarPickerProps {
  visible: boolean;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  onSelect: (dateString: string) => void;
  onClose: () => void;
}

export function CalendarPicker({ visible, selectedDate, minDate, maxDate, onSelect, onClose }: CalendarPickerProps) {
  const { primaryColor } = useBrandTheme();
  const initial = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [viewMonth, setViewMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const today = useMemo(() => new Date(), []);
  const selected = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
  const min = minDate ? new Date(`${minDate}T00:00:00`) : null;
  const max = maxDate ? new Date(`${maxDate}T00:00:00`) : null;

  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  const goToPrevMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goToNextMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 items-center justify-center px-6" onPress={onClose}>
        <Pressable className="bg-white rounded-2xl p-4 w-full max-w-sm" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between mb-3">
            <Pressable onPress={goToPrevMonth} hitSlop={8} className="px-3 py-1">
              <Text className="text-lg font-semibold" style={{ color: primaryColor }}>
                ‹
              </Text>
            </Pressable>
            <Text className="font-semibold text-slate-900">
              {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </Text>
            <Pressable onPress={goToNextMonth} hitSlop={8} className="px-3 py-1">
              <Text className="text-lg font-semibold" style={{ color: primaryColor }}>
                ›
              </Text>
            </Pressable>
          </View>

          <View className="flex-row mb-1">
            {WEEKDAY_LABELS.map((w) => (
              <View key={w} style={{ width: `${100 / 7}%` }} className="items-center py-1">
                <Text className="text-xs text-slate-400">{w}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {cells.map((cell, idx) => {
              if (!cell) {
                return <View key={`blank-${idx}`} style={{ width: `${100 / 7}%` }} className="py-1.5" />;
              }
              const disabled = (min && cell < min) || (max && cell > max);
              const isSelected = selected && isSameDay(cell, selected);
              const isToday = isSameDay(cell, today);

              return (
                <View key={cell.toISOString()} style={{ width: `${100 / 7}%` }} className="items-center py-0.5">
                  <Pressable
                    disabled={!!disabled}
                    onPress={() => onSelect(toDateString(cell))}
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? primaryColor : 'transparent',
                      borderWidth: isToday && !isSelected ? 1 : 0,
                      borderColor: primaryColor,
                      opacity: disabled ? 0.3 : 1,
                    }}
                  >
                    <Text style={{ color: isSelected ? '#FFFFFF' : '#0F172A' }} className="text-sm">
                      {cell.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Pressable onPress={onClose} className="mt-3 items-center py-2">
            <Text className="text-slate-500 font-medium">Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
