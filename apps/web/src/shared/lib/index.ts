export function formatPrice(value: number, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSize(w: number | null, h: number | null) {
  return w && h ? `${w} × ${h} см` : null;
}
