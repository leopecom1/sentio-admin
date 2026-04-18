import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const EMOTIONS: Record<string, { label: string; emoji: string; color: string }> = {
  calm: { label: 'Tranquilo', emoji: '😌', color: '#7B9E87' },
  focused: { label: 'Enfocado', emoji: '🎯', color: '#3D5A80' },
  motivated: { label: 'Motivado', emoji: '🔥', color: '#C9A96E' },
  grateful: { label: 'Agradecido', emoji: '🙏', color: '#9B8EC4' },
  hopeful: { label: 'Esperanzado', emoji: '✨', color: '#6DB3C4' },
  tired: { label: 'Cansado', emoji: '😮‍💨', color: '#8E8E93' },
  overwhelmed: { label: 'Abrumado', emoji: '😰', color: '#D4A574' },
  anxious: { label: 'Ansioso', emoji: '😟', color: '#D4856A' },
  frustrated: { label: 'Frustrado', emoji: '😤', color: '#C75B5B' },
  sad: { label: 'Triste', emoji: '😔', color: '#7A8BA8' },
  insecure: { label: 'Inseguro', emoji: '🫣', color: '#B8A9C9' },
  lonely: { label: 'Solo', emoji: '🧍', color: '#8B9DC3' },
  pressured: { label: 'Presionado', emoji: '⚡', color: '#CC8B6E' },
  angry: { label: 'Enojado', emoji: '😠', color: '#BF4E4E' },
  blocked: { label: 'Bloqueado', emoji: '🧱', color: '#6B7280' },
};
