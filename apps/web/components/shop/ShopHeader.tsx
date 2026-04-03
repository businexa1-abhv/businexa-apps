import type { Shop } from '@/types';
import { RemoteImage } from '@/components/common/RemoteImage';
import { getBusinessTypeTheme, categoryChipEmoji } from '@/lib/businessCategoryUi';
import { cn } from '@/lib/utils';

export function ShopHeader({ shop }: { shop: Shop }) {
  const bt = String(shop.businessType || shop.category || '').trim();
  const theme = getBusinessTypeTheme(bt);
  const emoji = categoryChipEmoji(bt || '');

  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br p-6 md:p-8',
        theme.borderAccent,
        theme.bandFrom,
        theme.bandTo
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
        <div
          className={cn(
            'relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-sm ring-2',
            theme.iconBg,
            theme.iconRing
          )}
        >
          {shop.logoUrl ? (
            <RemoteImage src={shop.logoUrl} alt="" width={96} height={96} className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl" aria-hidden>
              {emoji}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h1 className="text-2xl font-bold text-secondary">{shop.name}</h1>
            {bt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-0.5 text-xs font-medium text-secondary shadow-sm">
                <span aria-hidden>{theme.emoji}</span>
                {bt}
              </span>
            ) : null}
          </div>
          {shop.description ? <p className="mt-2 text-textLight">{shop.description}</p> : null}
          {shop.address ? <p className="mt-1 text-sm text-textLight">{shop.address}</p> : null}
        </div>
      </div>
    </div>
  );
}
