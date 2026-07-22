export const EVENT_PALETTE = [
  { stripe: '#dbeafe', circle: '#3b82f6', card: '#2563eb' }, // blue
  { stripe: '#f3e8ff', circle: '#a855f7', card: '#9333ea' }, // purple
  { stripe: '#d1fae5', circle: '#10b981', card: '#059669' }, // emerald
  { stripe: '#ffedd5', circle: '#f97316', card: '#ea580c' }, // orange
  { stripe: '#ffe4e6', circle: '#f43f5e', card: '#e11d48' }, // rose
  { stripe: '#ccfbf1', circle: '#14b8a6', card: '#0d9488' }, // teal
  { stripe: '#fef3c7', circle: '#f59e0b', card: '#d97706' }, // amber
  { stripe: '#e0e7ff', circle: '#6366f1', card: '#4f46e5' }, // indigo
] as const;

export function getColor(colorIndex?: number) {
  return EVENT_PALETTE[(colorIndex ?? 0) % EVENT_PALETTE.length];
}
