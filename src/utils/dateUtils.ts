export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '';
  // Handle both YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss...
  const pureDate = dateStr.split('T')[0];
  const [year, month, day] = pureDate.split('-');
  return `${day}/${month}/${year}`;
};
