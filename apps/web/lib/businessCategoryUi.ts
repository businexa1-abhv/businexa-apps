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
