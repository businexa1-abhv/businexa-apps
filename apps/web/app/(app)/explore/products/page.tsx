import { Suspense } from 'react';
import { BuyerProductList } from '@src/pages/buyer/ProductList';

export default function ExploreProductsPage() {
  return (
    <Suspense fallback={<p className="text-textLight">Loading…</p>}>
      <BuyerProductList />
    </Suspense>
  );
}
