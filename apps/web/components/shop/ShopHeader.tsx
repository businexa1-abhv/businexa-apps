import type { Shop } from '@/types';

export function ShopHeader({ shop }: { shop: Shop }) {
  return (
    <div className="flex flex-col items-center gap-4 border-b border-border pb-8 text-center md:flex-row md:text-left">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-background">
        {shop.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-textLight text-xs">Logo</div>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold text-secondary">{shop.name}</h1>
        {shop.description ? <p className="mt-2 text-textLight">{shop.description}</p> : null}
        {shop.address ? <p className="mt-1 text-sm text-textLight">{shop.address}</p> : null}
      </div>
    </div>
  );
}
