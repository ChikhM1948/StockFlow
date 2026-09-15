import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CalendarPicker } from '@/components/CalendarPicker';
import { DateRange, DateRangeFilter } from '@/components/DateRangeFilter';
import { createExpense, deleteExpense, getExpensesCaisse, listExpenses } from '@/api/expenses';
import { CaisseSummary, CaisseTotals, ExpenseCategory, ExpenseDoc } from '@/api/types';
import { formatMoney } from '@/utils/money';
import { formatDateRangeLabel, formatDisplayDate, toDateString } from '@/utils/dateFilters';
import { extractErrorMessage } from '@/api/client';
import { useBrandTheme } from '@/context/BrandThemeContext';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'LOYER', label: 'Loyer' },
  { value: 'SALAIRE', label: 'Salaire' },
  { value: 'CARBURANT', label: 'Carburant' },
  { value: 'FOURNITURES', label: 'Fournitures' },
  { value: 'AUTRE', label: 'Autre' },
];

function ExpensesCard({ title, totals }: { title: string; totals: CaisseTotals }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-slate-200">
      <Text className="text-slate-500 font-medium mb-1">{title}</Text>
      <Text className="text-2xl font-bold text-slate-900">{formatMoney(totals.totalAmount)}</Text>
      <Text className="text-slate-400 text-xs mt-1">{totals.count} dépense(s)</Text>
    </View>
  );
}

export default function ExpensesScreen() {
  const { primaryColor } = useBrandTheme();
  const [category, setCategory] = useState<ExpenseCategory>('AUTRE');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toDateString(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [expenses, setExpenses] = useState<ExpenseDoc[]>([]);
  const [expensesCaisse, setExpensesCaisse] = useState<CaisseSummary | null>(null);
  const [dateFilters, setDateFilters] = useState<DateRange>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [expensesList, caisse] = await Promise.all([listExpenses(dateFilters), getExpensesCaisse(dateFilters)]);
      setExpenses(expensesList);
      setExpensesCaisse(caisse);
      setListError(null);
    } catch (err) {
      setListError(extractErrorMessage(err));
    }
  }, [dateFilters]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll().finally(() => setLoading(false));
    }, [fetchAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    setFormError(null);
    const parsedAmount = Number(amount);
    if (!label || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('label et un montant positif sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      await createExpense({ category, label, amount: parsedAmount, date });
      setLabel('');
      setAmount('');
      await fetchAll();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      await fetchAll();
    } catch (err) {
      setListError(extractErrorMessage(err));
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50 px-4 pt-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-2xl font-bold text-slate-900 mb-4">Dépenses</Text>

      <Text className="text-sm font-medium text-slate-600 mb-2">Catégorie</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {CATEGORIES.map((c) => {
          const selected = category === c.value;
          return (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              className="px-3 py-2 rounded-full border"
              style={{ borderColor: primaryColor, backgroundColor: selected ? primaryColor : 'transparent' }}
            >
              <Text style={{ color: selected ? '#FFFFFF' : primaryColor }}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Input label="Libellé" value={label} onChangeText={setLabel} placeholder="Ex: Loyer entrepôt - Mars" />
      <Input label="Montant" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />

      <Text className="text-sm font-medium text-slate-600 mb-1">Date</Text>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        className="px-3 py-3 rounded-xl border border-slate-300 bg-white mb-4"
      >
        <Text className="text-slate-900 font-medium">{formatDisplayDate(date)}</Text>
      </Pressable>
      <CalendarPicker
        visible={showDatePicker}
        selectedDate={date}
        onSelect={(dateString) => {
          setDate(dateString);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />

      {formError && <Text className="text-red-500 mb-4">{formError}</Text>}

      <Button label="Ajouter la dépense" onPress={handleCreate} loading={submitting} />

      <Text className="text-lg font-semibold text-slate-900 mt-8 mb-2">Historique</Text>

      <DateRangeFilter value={dateFilters} onChange={setDateFilters} />

      {listError && <Text className="text-red-500 mb-4">{listError}</Text>}

      {loading ? (
        <ActivityIndicator color="#2563EB" className="mt-4" />
      ) : (
        <>
          {expensesCaisse && (
            <>
              {expensesCaisse.range ? (
                <ExpensesCard
                  title={formatDateRangeLabel(dateFilters.startDate, dateFilters.endDate)}
                  totals={expensesCaisse.range}
                />
              ) : (
                <ExpensesCard title="Journalière (aujourd'hui)" totals={expensesCaisse.daily} />
              )}
              <ExpensesCard title="Globale (depuis le début)" totals={expensesCaisse.global} />
            </>
          )}

          {expenses.length === 0 ? (
            <Text className="text-slate-500">Aucune dépense pour ces filtres.</Text>
          ) : (
            expenses.map((e) => (
              <View key={e._id} className="bg-white rounded-xl p-4 mb-2 border border-slate-200">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-2">
                    <Text className="font-semibold text-slate-900">{e.label}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      {CATEGORIES.find((c) => c.value === e.category)?.label} ·{' '}
                      {new Date(e.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text className="font-bold text-slate-900">{formatMoney(e.amount)}</Text>
                </View>
                <Pressable onPress={() => handleDelete(e._id)} className="mt-2 self-start">
                  <Text className="text-red-500 text-sm font-medium">Supprimer</Text>
                </Pressable>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}
