import type { Product } from '@/types';
import { ProductGrid } from '@/components/products/ProductGrid';

export function ProductList({ products }: { products: Product[] }) {
  return <ProductGrid products={products} />;
}
