/** Visuals for business / shop category chips (aligns with API + Firestore seed names). */
export const CATEGORY_CHIP_EMOJI: Record<string, string> = {
  Food: '🍽️',
  Clothing: '👕',
  Jewellery: '💎',
  Beauty: '✨',
  Electronics: '📱',
  Grocery: '🛒',
  Home: '🏠',
  Books: '📚',
  Gifts: '🎁',
  Pets: '🐾',
  Auto: '🚗',
};

export function categoryChipEmoji(name: string): string {
  return CATEGORY_CHIP_EMOJI[name] ?? '🏪';
}

/** Accent theming per business type (public shop page + chips). */
export type BusinessTypeTheme = {
  emoji: string;
  /** Tailwind classes for icon circle */
  iconBg: string;
  iconRing: string;
  /** Page band / header gradient */
  bandFrom: string;
  bandTo: string;
  borderAccent: string;
};

export const BUSINESS_TYPE_THEME: Record<string, BusinessTypeTheme> = {
  Food: {
    emoji: '🍽️',
    iconBg: 'bg-orange-100',
    iconRing: 'ring-orange-300/60',
    bandFrom: 'from-orange-50',
    bandTo: 'to-amber-50/80',
    borderAccent: 'border-orange-200/80',
  },
  Clothing: {
    emoji: '👕',
    iconBg: 'bg-sky-100',
    iconRing: 'ring-sky-300/60',
    bandFrom: 'from-sky-50',
    bandTo: 'to-cyan-50/80',
    borderAccent: 'border-sky-200/80',
  },
  Jewellery: {
    emoji: '💎',
    iconBg: 'bg-violet-100',
    iconRing: 'ring-violet-400/50',
    bandFrom: 'from-violet-50',
    bandTo: 'to-purple-50/80',
    borderAccent: 'border-violet-200/80',
  },
  Beauty: {
    emoji: '✨',
    iconBg: 'bg-pink-100',
    iconRing: 'ring-pink-300/60',
    bandFrom: 'from-pink-50',
    bandTo: 'to-rose-50/80',
    borderAccent: 'border-pink-200/80',
  },
  Electronics: {
    emoji: '📱',
    iconBg: 'bg-slate-200',
    iconRing: 'ring-slate-400/50',
    bandFrom: 'from-slate-50',
    bandTo: 'to-zinc-50/80',
    borderAccent: 'border-slate-200/80',
  },
  Grocery: {
    emoji: '🛒',
    iconBg: 'bg-lime-100',
    iconRing: 'ring-lime-400/50',
    bandFrom: 'from-lime-50',
    bandTo: 'to-green-50/80',
    borderAccent: 'border-lime-200/80',
  },
  Home: {
    emoji: '🏠',
    iconBg: 'bg-amber-100',
    iconRing: 'ring-amber-300/60',
    bandFrom: 'from-amber-50',
    bandTo: 'to-stone-50/80',
    borderAccent: 'border-amber-200/80',
  },
  Books: {
    emoji: '📚',
    iconBg: 'bg-indigo-100',
    iconRing: 'ring-indigo-300/60',
    bandFrom: 'from-indigo-50',
    bandTo: 'to-blue-50/80',
    borderAccent: 'border-indigo-200/80',
  },
  Gifts: {
    emoji: '🎁',
    iconBg: 'bg-red-100',
    iconRing: 'ring-red-300/60',
    bandFrom: 'from-red-50',
    bandTo: 'to-orange-50/80',
    borderAccent: 'border-red-200/80',
  },
  Pets: {
    emoji: '🐾',
    iconBg: 'bg-teal-100',
    iconRing: 'ring-teal-300/60',
    bandFrom: 'from-teal-50',
    bandTo: 'to-emerald-50/80',
    borderAccent: 'border-teal-200/80',
  },
  Auto: {
    emoji: '🚗',
    iconBg: 'bg-neutral-200',
    iconRing: 'ring-neutral-400/50',
    bandFrom: 'from-neutral-50',
    bandTo: 'to-stone-100/80',
    borderAccent: 'border-neutral-200/80',
  },
};

const DEFAULT_THEME: BusinessTypeTheme = {
  emoji: '🏪',
  iconBg: 'bg-primary/10',
  iconRing: 'ring-primary/30',
  bandFrom: 'from-primary/5',
  bandTo: 'to-background',
  borderAccent: 'border-primary/20',
};

export function getBusinessTypeTheme(businessType: string | undefined | null): BusinessTypeTheme {
  const key = String(businessType || '').trim();
  if (!key) return DEFAULT_THEME;
  return BUSINESS_TYPE_THEME[key] ?? DEFAULT_THEME;
}
