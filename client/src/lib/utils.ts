import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateId(prefix: string): string {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${randomNum}`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'voltooid':
    case 'betaald':
    case 'actief':
    case 'op voorraad':
      return 'bg-green-100 text-green-800';
    case 'in uitvoering':
    case 'verzonden':
    case 'bijna op':
      return 'bg-yellow-100 text-yellow-800';
    case 'ingepland':
      return 'bg-blue-100 text-blue-800';
    case 'te laat':
    case 'niet op voorraad':
      return 'bg-red-100 text-red-800';
    case 'geannuleerd':
    case 'inactief':
    case 'concept':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
