import {
  Scissors, User2, Sparkles, Star, Crown, Gem, Rocket,
  Sun, Moon, Flame, Droplets, Brush
} from 'lucide-react';

export const SERVICE_ICONS = [
  Scissors, User2, Sparkles, Star, Crown, Gem, Rocket,
  Sun, Moon, Flame, Droplets, Brush,
];

// hash simple y determinístico por id+name
export function hashServiceKey(id?: number | null, name?: string | null) {
  const key = `${id ?? ''}|${(name ?? '').toLowerCase()}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickServiceIcon(id?: number | null, name?: string | null) {
  const h = hashServiceKey(id, name);
  return SERVICE_ICONS[h % SERVICE_ICONS.length] || Scissors;
}
