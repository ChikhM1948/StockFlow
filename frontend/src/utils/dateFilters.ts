export function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseDateString(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function formatDisplayDate(value?: string) {
  if (!value) return null;
  return parseDateString(value).toLocaleDateString('fr-FR');
}

export function formatDateRangeLabel(startDate?: string, endDate?: string) {
  const start = formatDisplayDate(startDate);
  const end = formatDisplayDate(endDate);
  if (start && end) return `${start} - ${end}`;
  if (start) return `Depuis le ${start}`;
  if (end) return `Jusqu'au ${end}`;
  return 'Toutes les dates';
}
