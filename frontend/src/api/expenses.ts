import { apiClient } from './client';
import { CaisseSummary, ExpenseCategory, ExpenseDoc } from './types';

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
}

function toQueryString(filters?: ExpenseFilters) {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.category) params.set('category', filters.category);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listExpenses(filters?: ExpenseFilters) {
  const { data } = await apiClient.get<{ expenses: ExpenseDoc[] }>(`/expenses${toQueryString(filters)}`);
  return data.expenses;
}

export async function createExpense(payload: { category: ExpenseCategory; label: string; amount: number; date?: string }) {
  const { data } = await apiClient.post<{ expense: ExpenseDoc }>('/expenses', payload);
  return data.expense;
}

export async function deleteExpense(id: string) {
  await apiClient.delete(`/expenses/${id}`);
}

export async function getExpensesCaisse(filters?: Pick<ExpenseFilters, 'startDate' | 'endDate'>) {
  const { data } = await apiClient.get<{ caisse: CaisseSummary }>(`/caisse/expenses${toQueryString(filters)}`);
  return data.caisse;
}
