export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '';
  const pureDate = dateStr.split('T')[0];
  const [year, month, day] = pureDate.split('-');
  return `${day}/${month}/${year}`;
};

export const getISOWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
};
